package com.techloom.pos.service;

import com.techloom.pos.dto.OrderDtos.*;
import com.techloom.pos.entity.*;
import com.techloom.pos.exception.ApiExceptions.*;
import com.techloom.pos.repository.OrderRepository;
import com.techloom.pos.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final com.techloom.pos.repository.PaymentRepository paymentRepository;

    @Value("${app.reservation.expiry-minutes:5}")
    private int reservationExpiryMinutes;

    /**
     * Creates an order AND reserves stock for it in a single transaction.
     *
     * Concurrency safety: products are locked (SELECT ... FOR UPDATE) in a
     * deterministic order (ascending product id) before any stock is checked or
     * mutated. Locking in a consistent order across all callers prevents
     * deadlocks that would otherwise occur if two concurrent orders reserved the
     * same two products in opposite order.
     *
     * Idempotency: if idempotencyKey matches an existing order, that order is
     * returned unchanged instead of creating a duplicate (handles double-clicks
     * and client retries).
     */
    @Transactional
    public OrderResponse createOrderAndReserve(CreateOrderRequest request) {
        String idempotencyKey = (request.idempotencyKey() == null || request.idempotencyKey().isBlank())
                ? UUID.randomUUID().toString()
                : request.idempotencyKey();

        var existing = orderRepository.findByIdempotencyKey(idempotencyKey);
        if (existing.isPresent()) {
            return toDto(existing.get());
        }

        // Lock target products in a stable order to avoid deadlocks under concurrent multi-item checkouts.
        List<CartItemRequest> sortedItems = request.items().stream()
                .sorted(Comparator.comparing(CartItemRequest::productId))
                .toList();

        Order order = new Order();
        order.setIdempotencyKey(idempotencyKey);
        BigDecimal total = BigDecimal.ZERO;

        for (CartItemRequest item : sortedItems) {
            Product product = productRepository.findByIdForUpdate(item.productId())
                    .orElseThrow(() -> new NotFoundException("Product not found: " + item.productId()));

            int requestedQty = item.quantity();
            if (product.getAvailableStock() < requestedQty) {
                throw new InsufficientStockException(
                        "Insufficient stock for '" + product.getName() + "'. Available: "
                                + product.getAvailableStock() + ", requested: " + requestedQty);
            }

            // Reserve immediately: bump reservedStock so no other concurrent checkout can
            // oversell this unit while this order is pending payment.
            product.setReservedStock(product.getReservedStock() + requestedQty);

            OrderItem orderItem = new OrderItem();
            orderItem.setProduct(product);
            orderItem.setQuantity(requestedQty);
            orderItem.setUnitPriceSnapshot(product.getPrice());
            order.addItem(orderItem);

            total = total.add(product.getPrice().multiply(BigDecimal.valueOf(requestedQty)));
        }

        order.setTotalAmount(total);
        order.setStatus(OrderStatus.RESERVED);
        order.setReservationExpiresAt(Instant.now().plus(reservationExpiryMinutes, ChronoUnit.MINUTES));

        Order saved = orderRepository.save(order);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public OrderResponse get(Long id) {
        return toDto(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> listAll() {
        return orderRepository.findAllByOrderByCreatedAtDesc().stream().map(this::toDto).toList();
    }

    /**
     * Cancels an order and releases any stock it was holding (RESERVED or PAID).
     * PENDING/RESERVED -> stock is un-reserved. PAID -> treated as refund + restock.
     */
    @Transactional
    public OrderResponse cancel(Long orderId) {
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found: " + orderId));

        if (!order.getStatus().canTransitionTo(OrderStatus.CANCELLED)) {
            throw new InvalidStateTransitionException(
                    "Cannot cancel order in status " + order.getStatus());
        }

        releaseReservedStock(order);
        order.setStatus(OrderStatus.CANCELLED);
        return toDto(order);
    }

    /**
     * Releases the reservedStock held by this order's items back to available inventory.
     * Locks each product row before mutating it, same as at reservation time.
     */
    private void releaseReservedStock(Order order) {
        List<OrderItem> sortedItems = order.getItems().stream()
                .sorted(Comparator.comparing(oi -> oi.getProduct().getId()))
                .toList();

        for (OrderItem item : sortedItems) {
            Product product = productRepository.findByIdForUpdate(item.getProduct().getId())
                    .orElseThrow(() -> new NotFoundException("Product not found: " + item.getProduct().getId()));
            int newReserved = Math.max(0, product.getReservedStock() - item.getQuantity());
            product.setReservedStock(newReserved);
        }
    }

    /** Called by PaymentService on successful payment: reservation converts into a permanent stock deduction. */
    @Transactional
    void confirmPaidAndDeductStock(Order order) {
        List<OrderItem> sortedItems = order.getItems().stream()
                .sorted(Comparator.comparing(oi -> oi.getProduct().getId()))
                .toList();

        for (OrderItem item : sortedItems) {
            Product product = productRepository.findByIdForUpdate(item.getProduct().getId())
                    .orElseThrow(() -> new NotFoundException("Product not found: " + item.getProduct().getId()));
            product.setTotalStock(product.getTotalStock() - item.getQuantity());
            product.setReservedStock(Math.max(0, product.getReservedStock() - item.getQuantity()));
        }
        order.setStatus(OrderStatus.PAID);
    }

    /** Called by PaymentService on failure: release reservation, mark FAILED. */
    @Transactional
    void markFailedAndRelease(Order order) {
        releaseReservedStock(order);
        order.setStatus(OrderStatus.FAILED);
    }

    /** Called by PaymentService on timeout, and by the scheduled sweeper: release reservation, mark EXPIRED. */
    @Transactional
    void markExpiredAndRelease(Order order) {
        releaseReservedStock(order);
        order.setStatus(OrderStatus.EXPIRED);
    }

    Order findOrThrow(Long id) {
        return orderRepository.findById(id).orElseThrow(() -> new NotFoundException("Order not found: " + id));
    }

    OrderResponse toDto(Order order) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(oi -> new OrderItemResponse(
                        oi.getProduct().getId(),
                        oi.getProduct().getName(),
                        oi.getQuantity(),
                        oi.getUnitPriceSnapshot(),
                        oi.getUnitPriceSnapshot().multiply(BigDecimal.valueOf(oi.getQuantity()))
                )).toList();

        PaymentInfo paymentInfo = paymentRepository.findByOrderIdOrderByCreatedAtDesc(order.getId()).stream()
                .findFirst()
                .map(p -> new PaymentInfo(p.getReference(), p.getStatus().name(), p.getCreatedAt(), p.getSettledAt()))
                .orElse(null);

        return new OrderResponse(
                order.getId(),
                order.getIdempotencyKey(),
                order.getStatus(),
                order.getTotalAmount(),
                items,
                order.getReservationExpiresAt(),
                paymentInfo,
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }
}
