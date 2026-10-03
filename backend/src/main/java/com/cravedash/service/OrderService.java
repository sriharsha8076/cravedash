package com.cravedash.service;

import com.cravedash.exception.InvalidStatusTransitionException;
import com.cravedash.exception.OrderNotFoundException;
import com.cravedash.model.Order;
import com.cravedash.model.OrderStatus;
import com.cravedash.repository.LeaderboardRepository;
import com.cravedash.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepo;
    private final LeaderboardRepository lbRepo;

    public OrderService(OrderRepository orderRepo, LeaderboardRepository lbRepo) {
        this.orderRepo = orderRepo;
        this.lbRepo = lbRepo;
    }

    public List<Order> listOrders() {
        return orderRepo.findAll();
    }

    public Order getOrder(long id) {
        return orderRepo.findById(id)
                .orElseThrow(() -> new OrderNotFoundException(id));
    }

    public Order createOrder(String customer, String restaurant, int amount) {
        return orderRepo.create(customer, restaurant, amount);
    }

    /**
     * Advances an order to the next valid status.
     *
     * Transition rules (enforced by OrderStatus.next()):
     *   PLACED -> ACCEPTED -> PREPARING -> OUT_FOR_DELIVERY -> DELIVERED
     *
     * The incoming {@code requestedStatus} must equal exactly the next valid
     * status for this order; anything else returns HTTP 400.
     *
     * On DELIVERED:
     *   - the order is removed from {cravedash}:orders:active (SREM)
     *   - 10 points are added to the customer on the leaderboard (ZINCRBY)
     */
    public Order updateStatus(long id, OrderStatus requestedStatus) {
        Order order = getOrder(id);

        OrderStatus current = order.getStatus();
        if (current.isTerminal()) {
            throw new InvalidStatusTransitionException(
                    "Order " + id + " is already DELIVERED and cannot be updated.");
        }

        OrderStatus expected = current.next();
        if (expected != requestedStatus) {
            throw new InvalidStatusTransitionException(
                    "Cannot transition from " + current + " to " + requestedStatus
                    + ". Expected next status: " + expected);
        }

        orderRepo.updateStatus(id, requestedStatus);
        order.setStatus(requestedStatus);

        if (requestedStatus == OrderStatus.DELIVERED) {
            lbRepo.addPoints(order.getCustomer(), 10);
            log.info("Awarded 10 points to customer={} for order id={}", order.getCustomer(), id);
        }

        return order;
    }

    public Map<String, Long> getStats() {
        return Map.of(
                "totalOrders",  orderRepo.totalOrders(),
                "activeOrders", orderRepo.activeOrders()
        );
    }
}
