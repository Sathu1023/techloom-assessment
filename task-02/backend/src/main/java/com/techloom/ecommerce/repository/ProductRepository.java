package com.techloom.ecommerce.repository;

import com.techloom.ecommerce.entity.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findFirstByName(String name);

    /**
     * Storefront search/filter: case-insensitive name match, optional category,
     * optional price range. Availability (in-stock only) is filtered in-memory
     * in ProductService since it depends on the derived availableStock value.
     */
    @Query("""
        select p from Product p
        where (:q is null or lower(p.name) like lower(concat('%', :q, '%')))
          and (:category is null or lower(p.category) = lower(:category))
          and (:minPrice is null or p.price >= :minPrice)
          and (:maxPrice is null or p.price <= :maxPrice)
        """)
    java.util.List<Product> search(
            @Param("q") String query,
            @Param("category") String category,
            @Param("minPrice") java.math.BigDecimal minPrice,
            @Param("maxPrice") java.math.BigDecimal maxPrice
    );

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
