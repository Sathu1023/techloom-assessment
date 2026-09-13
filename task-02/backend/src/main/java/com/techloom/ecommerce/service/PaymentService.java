package com.techloom.ecommerce.service;

import com.techloom.ecommerce.dto.OrderDtos.PaymentRequest;
import com.techloom.ecommerce.dto.OrderDtos.PaymentResponse;
import com.techloom.ecommerce.entity.Order;
import com.techloom.ecommerce.entity.OrderStatus;
import com.techloom.ecommerce.entity.Payment;
import com.techloom.ecommerce.exception.ApiExceptions.*;
import com.techloom.ecommerce.repository.OrderRepository;
import com.techloom.ecommerce.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final OrderService orderService;
    private final MockPaymentGateway gateway;

    /**
     * Processes one payment attempt for an order.
     *
     * Duplicate-submission guard: the order row is locked and its
     * `paymentInProgress` flag / status checked BEFORE anything else. If a
     * payment is already in flight, or the order is already PAID, the request
     * is rejected outright rather than creating a second Payment record or
     * double-charging. This is what stops two rapid "Pay Now" clicks (or a
     * network retry) from producing two successful charges for one order.
     */
    @Transactional
    public PaymentResponse pay(Long orderId, PaymentRequest request) {
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));

        if (order.getStatus() == OrderStatus.PAID) {
            throw new DuplicateRequestException("Order " + orderId + " is already paid.");
        }
        if (Boolean.TRUE.equals(order.getPaymentInProgress())) {
            throw new DuplicateRequestException("A payment is already being processed for order " + orderId);
        }
        if (order.getStatus() != OrderStatus.RESERVED) {
            throw new InvalidStateTransitionException(
                    "Order must be in RESERVED status to accept payment (current: " + order.getStatus() + ")");
        }
        if (order.getReservationExpiresAt() != null && order.getReservationExpiresAt().isBefore(Instant.now())) {
            // Reservation lapsed between the last poll and this payment attempt.
            orderService.markExpiredAndRelease(order);
            throw new ReservationExpiredException("Stock reservation for order " + orderId + " has expired.");
        }

        order.setPaymentInProgress(true);

        String reference = "PAY-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setReference(reference);
        payment.setStatus(Payment.PaymentStatus.PROCESSING);
        paymentRepository.save(payment);
        order.setLastPaymentReference(reference);

        Payment.PaymentStatus outcome = gateway.resolve(request.simulateOutcome());
        payment.setStatus(outcome);
        payment.setSettledAt(Instant.now());

        switch (outcome) {
            case SUCCESS -> orderService.confirmPaidAndDeductStock(order);
            case FAILED -> orderService.markFailedAndRelease(order);
            case TIMEOUT -> orderService.markExpiredAndRelease(order);
            default -> throw new IllegalStateException("Unexpected payment outcome: " + outcome);
        }

        order.setPaymentInProgress(false);

        return new PaymentResponse(reference, outcome.name(), orderService.toDto(order));
    }
}
