package com.cravedash.model;

import java.time.Instant;

/**
 * Represents a food order stored as a Redis hash under key
 * {cravedash}:order:<id>
 *
 * Fields map 1-to-1 to hash fields.
 * No ORM — serialisation is manual in OrderRepository.
 */
public class Order {

    private Long id;
    private String customer;
    private String restaurant;
    private int amount;
    private OrderStatus status;
    private Instant createdAt;

    public Order() {}

    public Order(Long id, String customer, String restaurant,
                 int amount, OrderStatus status, Instant createdAt) {
        this.id = id;
        this.customer = customer;
        this.restaurant = restaurant;
        this.amount = amount;
        this.status = status;
        this.createdAt = createdAt;
    }

    // Getters and setters

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCustomer() { return customer; }
    public void setCustomer(String customer) { this.customer = customer; }

    public String getRestaurant() { return restaurant; }
    public void setRestaurant(String restaurant) { this.restaurant = restaurant; }

    public int getAmount() { return amount; }
    public void setAmount(int amount) { this.amount = amount; }

    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
