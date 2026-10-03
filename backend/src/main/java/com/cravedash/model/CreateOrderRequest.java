package com.cravedash.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public class CreateOrderRequest {

    @NotBlank(message = "customer is required")
    private String customer;

    @NotBlank(message = "restaurant is required")
    private String restaurant;

    @Positive(message = "amount must be positive")
    private int amount;

    public String getCustomer() { return customer; }
    public void setCustomer(String customer) { this.customer = customer; }

    public String getRestaurant() { return restaurant; }
    public void setRestaurant(String restaurant) { this.restaurant = restaurant; }

    public int getAmount() { return amount; }
    public void setAmount(int amount) { this.amount = amount; }
}
