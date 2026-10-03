package com.cravedash.controller;

import com.cravedash.model.*;
import com.cravedash.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /** GET /api/orders — list all orders, newest first */
    @GetMapping
    public List<Order> listOrders() {
        return orderService.listOrders();
    }

    /** POST /api/orders — create an order */
    @PostMapping
    public ResponseEntity<Order> createOrder(
            @Valid @RequestBody CreateOrderRequest req) {
        Order order = orderService.createOrder(
                req.getCustomer(), req.getRestaurant(), req.getAmount());
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }

    /** GET /api/orders/{id} — single order */
    @GetMapping("/{id}")
    public Order getOrder(@PathVariable long id) {
        return orderService.getOrder(id);
    }

    /** PUT /api/orders/{id}/status — advance to the next valid status */
    @PutMapping("/{id}/status")
    public Order updateStatus(
            @PathVariable long id,
            @Valid @RequestBody UpdateStatusRequest req) {
        return orderService.updateStatus(id, req.getStatus());
    }

    /** GET /api/stats — ZCARD / SCARD counts */
    @GetMapping("/stats")
    public Map<String, Long> stats() {
        return orderService.getStats();
    }
}
