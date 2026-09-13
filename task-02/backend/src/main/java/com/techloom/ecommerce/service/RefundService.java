package com.techloom.ecommerce.service;

import com.techloom.ecommerce.dto.OrderDtos.RefundResponse;
import com.techloom.ecommerce.entity.Order;
import com.techloom.ecommerce.entity.OrderStatus;
import com.techloom.ecommerce.entity.Refund;
import com.techloom.ecommerce.exception.ApiExceptions.InvalidStateTransitionException;
import com.techloom.ecommerce.exception.ApiExceptions.NotFoundException;
import com.techloom.ecommerce.repository.OrderRepository;
import com.techloom.ecommerce.repository.RefundRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefundService {

    private final OrderRepository orderRepository;
    private final RefundRepository refundRepository;
    private final OrderService orderService;

    /**
     * Cancels a PAID (or FAILED-after-payment-capture) order and simulates issuing
     * a refund for the amount charged. Also restocks the items via OrderService#cancel.
     * Cancelling a RESERVED/PENDING order (no money moved) does NOT create a refund —
     * use OrderService#cancel directly for that case; the controller routes based on
     * order status so callers don't need to know the difference.
     */
    @Transactional
    public RefundResponse refundAndCancel(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));

        if (order.getStatus() != OrderStatus.PAID) {
            throw new InvalidStateTransitionException(
                    "Refunds can only be issued for PAID orders (current status: " + order.getStatus() + ")");
        }
        if (refundRepository.findByOrderId(orderId).isPresent()) {
            throw new InvalidStateTransitionException("Order " + orderId + " has already been refunded.");
        }

        var amount = order.getTotalAmount();

        // This restocks items and flips status to CANCELLED under its own lock.
        orderService.cancel(orderId);

        Refund refund = new Refund();
        refund.setOrder(order);
        refund.setAmount(amount);
        refund.setReference("RFND-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase());
        refund.setStatus(Refund.RefundStatus.COMPLETED);
        refundRepository.save(refund);

        return new RefundResponse(orderId, refund.getReference(), refund.getAmount(), refund.getStatus().name());
    }
}
