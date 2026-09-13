package com.techloom.pos.repository;

import com.techloom.pos.entity.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    /**
     * SELECT ... FOR UPDATE.
     *
     * This is the core anti-oversell mechanism: when two concurrent requests try to
     * reserve/deduct stock for the same product, the second transaction to reach this
     * query BLOCKS until the first transaction commits or rolls back. By the time it
     * proceeds, it sees the up-to-date reservedStock/totalStock and can correctly reject
     * the purchase if stock is insufficient, instead of both reading stale values and
     * both succeeding (the classic lost-update oversell bug).
     *
     * Must only be called from within a @Transactional method.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);
}
