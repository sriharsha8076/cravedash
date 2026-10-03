package com.cravedash.model;

import jakarta.validation.constraints.NotNull;

public class UpdateStatusRequest {

    @NotNull(message = "status is required")
    private OrderStatus status;

    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }
}
