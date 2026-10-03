package com.cravedash.model;

/**
 * All valid order statuses.
 *
 * The transition chain is strictly linear:
 *   PLACED -> ACCEPTED -> PREPARING -> OUT_FOR_DELIVERY -> DELIVERED
 *
 * next() returns the only valid next status, or null if this is a terminal state.
 * The service layer calls next() to validate an incoming status update request.
 */
public enum OrderStatus {
    PLACED,
    ACCEPTED,
    PREPARING,
    OUT_FOR_DELIVERY,
    DELIVERED;

    /** Returns the next valid status, or null when already terminal. */
    public OrderStatus next() {
        return switch (this) {
            case PLACED           -> ACCEPTED;
            case ACCEPTED         -> PREPARING;
            case PREPARING        -> OUT_FOR_DELIVERY;
            case OUT_FOR_DELIVERY -> DELIVERED;
            case DELIVERED        -> null;
        };
    }

    public boolean isTerminal() {
        return this == DELIVERED;
    }
}
