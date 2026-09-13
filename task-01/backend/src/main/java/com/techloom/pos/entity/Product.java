package com.techloom.pos.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Product with two stock counters:
 *  - totalStock: the physical/available count NOT counting active reservations
 *  - reservedStock: stock currently held by unexpired checkout reservations
 *
 * "Available to sell" = totalStock - reservedStock (see ProductService#toDto).
 *
 * @Version enables JPA optimistic locking as a second line of defense: even if
 * two threads read the same row, only one write will succeed per transaction,
 * the other gets an OptimisticLockException and retries. The primary defense
 * against overselling, however, is the pessimistic row lock taken explicitly
 * in ProductRepository#findByIdForUpdate, used whenever we mutate stock.
 */
@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer totalStock;

    @Column(nullable = false)
    private Integer reservedStock = 0;

    @Version
    private Long version;

    @Column(updatable = false)
    private Instant createdAt;

    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
        if (reservedStock == null) reservedStock = 0;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public int getAvailableStock() {
        return totalStock - reservedStock;
    }
}
