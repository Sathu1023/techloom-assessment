package com.techloom.ecommerce.dto;

import com.techloom.ecommerce.entity.OrderStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public class OrderDtos {

    public record CartItemRequest(
            @NotNull Long productId,
            @Min(1) Integer quantity
    ) {}

    /**
     * idempotencyKey should be generated client-side once per checkout attempt
     * (e.g. a UUID stored in component state) and reused if the request is retried.
     */
    public record CreateOrderRequest(
            @NotEmpty List<CartItemRequest> items,
            String idempotencyKey
    ) {}

    public record OrderItemResponse(
            Long productId,
            String productName,
            String productImageUrl,
            Integer quantity,
            BigDecimal unitPrice,
            BigDecimal lineTotal
    ) {}

    public record OrderResponse(
            Long id,
            String idempotencyKey,
            OrderStatus status,
            BigDecimal totalAmount,
            List<OrderItemResponse> items,
            Instant reservationExpiresAt,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public enum PaymentOutcome { SUCCESS, FAILURE, TIMEOUT }

    public record PaymentRequest(
            @NotNull PaymentOutcome simulateOutcome // candidate/tester picks the mock outcome
    ) {}

    public record PaymentResponse(
            String reference,
            String status,
            OrderResponse order
    ) {}

    public record RefundResponse(
            Long orderId,
            String reference,
            BigDecimal amount,
            String status
    ) {}
}
