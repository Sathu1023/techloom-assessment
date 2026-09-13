package com.techloom.pos.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Client-supplied idempotency key (one per checkout attempt / cart submission).
     * Unique constraint stops duplicate order creation if a request is retried
     * (double-click, network retry, etc).
     */
    @Column(nullable = false, unique = true, updatable = false)
    private String idempotencyKey = UUID.randomUUID().toString();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.PENDING;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<OrderItem> items = new ArrayList<>();

    /** Set when the order enters RESERVED; used by the expiry sweeper. */
    private Instant reservationExpiresAt;

    /**
     * Guards against duplicate payment submissions for the same order:
     * once a payment attempt is in flight or settled, a second attempt is rejected
     * unless the first one failed/expired.
     */
    @Column(nullable = false)
    private Boolean paymentInProgress = false;

    private String lastPaymentReference;

    @Version
    private Long version;

    @Column(updatable = false)
    private Instant createdAt;

    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }
}
