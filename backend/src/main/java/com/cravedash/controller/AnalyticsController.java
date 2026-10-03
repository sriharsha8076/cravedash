package com.cravedash.controller;

import com.cravedash.model.Order;
import com.cravedash.model.OrderStatus;
import com.cravedash.repository.OrderRepository;
import org.springframework.web.bind.annotation.*;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * GET /api/analytics/summary — aggregated metrics computed from Redis order data.
 *
 * Returns:
 *   - revenueByDay:      list of { date, revenue } for last 7 days
 *   - ordersByStatus:    map of status → count
 *   - topRestaurants:    list of { name, orders, revenue } top 5
 *   - totalRevenue:      sum of all order amounts
 *   - avgOrderValue:     average order amount
 */
@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final OrderRepository orderRepo;

    public AnalyticsController(OrderRepository orderRepo) {
        this.orderRepo = orderRepo;
    }

    @GetMapping("/summary")
    public Map<String, Object> summary() {
        List<Order> orders = orderRepo.findAll();

        Map<String, Object> result = new LinkedHashMap<>();

        // ── Revenue by day (last 7 days) ──────────────────────────────────────
        ZoneId ist = ZoneId.of("Asia/Kolkata");
        LocalDate today = LocalDate.now(ist);
        DateTimeFormatter dayFmt = DateTimeFormatter.ofPattern("dd MMM");

        Map<LocalDate, Long> revenueMap = new LinkedHashMap<>();
        for (int i = 6; i >= 0; i--) {
            revenueMap.put(today.minusDays(i), 0L);
        }

        for (Order o : orders) {
            LocalDate day = o.getCreatedAt().atZone(ist).toLocalDate();
            if (revenueMap.containsKey(day)) {
                revenueMap.merge(day, (long) o.getAmount(), Long::sum);
            }
        }

        List<Map<String, Object>> revenueByDay = new ArrayList<>();
        revenueMap.forEach((date, rev) -> {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("date", date.format(dayFmt));
            entry.put("revenue", rev);
            entry.put("orders", orders.stream()
                    .filter(o -> o.getCreatedAt().atZone(ist).toLocalDate().equals(date))
                    .count());
            revenueByDay.add(entry);
        });
        result.put("revenueByDay", revenueByDay);

        // ── Orders by status ──────────────────────────────────────────────────
        Map<String, Long> byStatus = Arrays.stream(OrderStatus.values())
                .collect(Collectors.toMap(
                        Enum::name,
                        s -> orders.stream().filter(o -> o.getStatus() == s).count(),
                        (a, b) -> a,
                        LinkedHashMap::new
                ));
        result.put("ordersByStatus", byStatus);

        // ── Top restaurants ───────────────────────────────────────────────────
        Map<String, long[]> restaurantStats = new LinkedHashMap<>();
        for (Order o : orders) {
            restaurantStats.computeIfAbsent(o.getRestaurant(), k -> new long[]{0L, 0L});
            restaurantStats.get(o.getRestaurant())[0]++;
            restaurantStats.get(o.getRestaurant())[1] += o.getAmount();
        }

        List<Map<String, Object>> topRestaurants = restaurantStats.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue()[0], a.getValue()[0]))
                .limit(5)
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("name", e.getKey());
                    m.put("orders", e.getValue()[0]);
                    m.put("revenue", e.getValue()[1]);
                    return m;
                })
                .collect(Collectors.toList());
        result.put("topRestaurants", topRestaurants);

        // ── Totals ────────────────────────────────────────────────────────────
        long totalRevenue = orders.stream().mapToLong(Order::getAmount).sum();
        result.put("totalRevenue", totalRevenue);
        result.put("totalOrders", (long) orders.size());
        result.put("avgOrderValue", orders.isEmpty() ? 0 : totalRevenue / orders.size());

        return result;
    }
}
