package com.techloom.ecommerce.controller;

import com.techloom.ecommerce.dto.OrderDtos.CreateOrderRequest;
import com.techloom.ecommerce.dto.OrderDtos.OrderResponse;
import com.techloom.ecommerce.dto.OrderDtos.RefundResponse;
import com.techloom.ecommerce.entity.OrderStatus;
import com.techloom.ecommerce.service.OrderService;
import com.techloom.ecommerce.service.RefundService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final RefundService refundService;

    /** Creates the order AND places the stock reservation in one call (checkout entry point). */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse checkout(@Valid @RequestBody CreateOrderRequest request) {
        return orderService.createOrderAndReserve(request);
    }

    /** Order history — no auth layer in this assessment scope, returns all orders newest-first. */
    @GetMapping
    public List<OrderResponse> listAll() {
        return orderService.listAll();
    }

    @GetMapping("/{id}")
    public OrderResponse get(@PathVariable Long id) {
        return orderService.get(id);
    }

    /**
     * Cancels an order. If the order was already PAID, this route automatically
     * issues a simulated refund instead of a plain stock-release cancel — the
     * caller doesn't need to know which case applies.
     */
    @PostMapping("/{id}/cancel")
    public OrderResponse cancel(@PathVariable Long id) {
        OrderResponse current = orderService.get(id);
        if (current.status() == OrderStatus.PAID) {
            refundService.refundAndCancel(id);
            return orderService.get(id);
        }
        return orderService.cancel(id);
    }

    /** Explicit refund endpoint for the "Refund / Cancellation" UI panel. */
    @PostMapping("/{id}/refund")
    public RefundResponse refund(@PathVariable Long id) {
        return refundService.refundAndCancel(id);
    }
}
