package com.techloom.pos.entity;

import java.util.Set;

/**
 * Order lifecycle:
 *
 *   PENDING --(reserve stock)--> RESERVED --(payment success)--> PAID
 *      |                            |  \
 *      |                            |   \--(payment timeout)--> EXPIRED
 *      |                            \----(payment failure)----> FAILED
 *      |
 *      \-------------------------(user cancels)------------> CANCELLED
 *
 *   PAID --(cancel / refund)--> CANCELLED
 *
 * Any transition not listed in ALLOWED_TRANSITIONS is rejected by OrderService.
 */
public enum OrderStatus {
    PENDING,
    RESERVED,
    PAID,
    CANCELLED,
    EXPIRED,
    FAILED;

    public static final java.util.Map<OrderStatus, Set<OrderStatus>> ALLOWED_TRANSITIONS = java.util.Map.of(
            PENDING, Set.of(RESERVED, CANCELLED),
            RESERVED, Set.of(PAID, FAILED, EXPIRED, CANCELLED),
            PAID, Set.of(CANCELLED),
            CANCELLED, Set.of(),
            EXPIRED, Set.of(),
            FAILED, Set.of(RESERVED) // allow re-attempting checkout -> new reservation cycle
    );

    public boolean canTransitionTo(OrderStatus target) {
        return ALLOWED_TRANSITIONS.getOrDefault(this, Set.of()).contains(target);
    }

    /** Terminal states where stock has already been reconciled and no further action is needed. */
    public boolean isTerminal() {
        return this == CANCELLED || this == EXPIRED;
    }
}
