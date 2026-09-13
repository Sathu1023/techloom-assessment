package com.techloom.pos.service;

import com.techloom.pos.dto.OrderDtos.PaymentOutcome;
import com.techloom.pos.entity.Payment;
import org.springframework.stereotype.Component;

/**
 * Stands in for a real payment provider (Stripe, PayPal, etc). The assessment
 * asks us to simulate success / failure / timeout outcomes deterministically so
 * they can be tested, so the outcome is passed in explicitly by the caller
 * rather than randomized. (Swap `resolve` for real randomization or a real SDK
 * call if you want non-deterministic demo behaviour.)
 */
@Component
public class MockPaymentGateway {

    public Payment.PaymentStatus resolve(PaymentOutcome simulateOutcome) {
        return switch (simulateOutcome) {
            case SUCCESS -> Payment.PaymentStatus.SUCCESS;
            case FAILURE -> Payment.PaymentStatus.FAILED;
            case TIMEOUT -> Payment.PaymentStatus.TIMEOUT;
        };
    }
}
