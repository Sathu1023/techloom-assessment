package com.techloom.ecommerce.controller;

import com.techloom.ecommerce.dto.OrderDtos.PaymentRequest;
import com.techloom.ecommerce.dto.OrderDtos.PaymentResponse;
import com.techloom.ecommerce.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders/{orderId}/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    public PaymentResponse pay(@PathVariable Long orderId, @Valid @RequestBody PaymentRequest request) {
        return paymentService.pay(orderId, request);
    }
}
