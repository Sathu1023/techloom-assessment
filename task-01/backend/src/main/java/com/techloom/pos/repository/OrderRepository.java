package com.techloom.pos.repository;

import com.techloom.pos.entity.Order;
import com.techloom.pos.entity.OrderStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByIdempotencyKey(String idempotencyKey);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from Order o where o.id = :id")
    Optional<Order> findByIdForUpdate(@Param("id") Long id);

    /** Used by the reservation-expiry sweeper. */
    List<Order> findByStatusAndReservationExpiresAtBefore(OrderStatus status, Instant cutoff);

    List<Order> findAllByOrderByCreatedAtDesc();
}
