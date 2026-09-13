package com.techloom.pos.controller;

import com.techloom.pos.dto.OrderDtos.PaymentRequest;
import com.techloom.pos.dto.OrderDtos.PaymentResponse;
import com.techloom.pos.service.PaymentService;
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
