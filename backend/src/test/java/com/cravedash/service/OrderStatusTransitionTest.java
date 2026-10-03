package com.cravedash.service;

import com.cravedash.model.OrderStatus;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for the OrderStatus transition chain.
 * No Spring context needed — pure logic.
 */
class OrderStatusTransitionTest {

    @Test
    void placedNextIsAccepted() {
        assertEquals(OrderStatus.ACCEPTED, OrderStatus.PLACED.next());
    }

    @Test
    void acceptedNextIsPreparing() {
        assertEquals(OrderStatus.PREPARING, OrderStatus.ACCEPTED.next());
    }

    @Test
    void preparingNextIsOutForDelivery() {
        assertEquals(OrderStatus.OUT_FOR_DELIVERY, OrderStatus.PREPARING.next());
    }

    @Test
    void outForDeliveryNextIsDelivered() {
        assertEquals(OrderStatus.DELIVERED, OrderStatus.OUT_FOR_DELIVERY.next());
    }

    @Test
    void deliveredIsTerminalAndNextIsNull() {
        assertNull(OrderStatus.DELIVERED.next());
        assertTrue(OrderStatus.DELIVERED.isTerminal());
    }

    @Test
    void onlyDeliveredIsTerminal() {
        for (OrderStatus s : OrderStatus.values()) {
            if (s != OrderStatus.DELIVERED) {
                assertFalse(s.isTerminal(), s + " should not be terminal");
            }
        }
    }

    @Test
    void transitionChainIsLinear() {
        // Walk the full chain and verify each step
        OrderStatus current = OrderStatus.PLACED;
        OrderStatus[] expected = {
            OrderStatus.ACCEPTED,
            OrderStatus.PREPARING,
            OrderStatus.OUT_FOR_DELIVERY,
            OrderStatus.DELIVERED
        };
        for (OrderStatus exp : expected) {
            assertEquals(exp, current.next(), "next of " + current + " should be " + exp);
            current = exp;
        }
        // Terminal
        assertNull(current.next());
    }
}
