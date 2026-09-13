package com.techloom.pos.service;

import com.techloom.pos.entity.Order;
import com.techloom.pos.entity.OrderStatus;
import com.techloom.pos.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Background job that finds RESERVED orders whose 5-minute hold has lapsed and
 * releases their stock, even if the user simply abandoned checkout without
 * triggering any payment call. This is what makes "expire after 5 minutes"
 * true even for a customer who just closes the tab.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ReservationExpirySweeper {

    private final OrderRepository orderRepository;
    private final OrderService orderService;

    @Scheduled(fixedDelayString = "${app.reservation.sweep-interval-ms:15000}")
    public void sweep() {
        List<Order> expired = orderRepository.findByStatusAndReservationExpiresAtBefore(
                OrderStatus.RESERVED, Instant.now());

        for (Order order : expired) {
            try {
                expireOne(order.getId());
            } catch (Exception e) {
                log.warn("Failed to expire reservation for order {}: {}", order.getId(), e.getMessage());
            }
        }
    }

    /** Each order is expired in its own transaction so one failure doesn't roll back the whole sweep. */
    @Transactional
    void expireOne(Long orderId) {
        orderRepository.findByIdForUpdate(orderId).ifPresent(order -> {
            // Re-check inside the lock: another request (e.g. a just-in-time payment) may have
            // already moved the order out of RESERVED between the query above and this lock.
            if (order.getStatus() == OrderStatus.RESERVED
                    && order.getReservationExpiresAt() != null
                    && order.getReservationExpiresAt().isBefore(Instant.now())) {
                orderService.markExpiredAndRelease(order);
            }
        });
    }
}
