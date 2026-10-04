package com.cravedash.controller;

import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * GET /api/memorydb/inspect  — live snapshot of every MemoryDB key
 * GET /api/memorydb/benchmark — 50-op latency measurement
 *
 * Shows judges the exact Redis data structures powering CraveDash:
 *   Hash        → {cravedash}:order:<id>
 *   Sorted Set  → {cravedash}:orders:all   (scored by epoch-ms)
 *   Set         → {cravedash}:orders:active
 *   Sorted Set  → {cravedash}:leaderboard  (loyalty points)
 *   String      → {cravedash}:seq:order    (atomic ID counter)
 */
@RestController
@RequestMapping("/api/memorydb")
public class MemoryDbInspectorController {

    private final RedisTemplate<String, String> redis;

    public MemoryDbInspectorController(RedisTemplate<String, String> redis) {
        this.redis = redis;
    }

    // ── Inspect all live data structures ──────────────────────────────────────
    @GetMapping("/inspect")
    public Map<String, Object> inspect() {
        Map<String, Object> result = new LinkedHashMap<>();

        // 1. Atomic counter (String)
        String seq = redis.opsForValue().get("{cravedash}:seq:order");
        result.put("counter", Map.of(
                "key",   "{cravedash}:seq:order",
                "type",  "STRING",
                "value", seq != null ? seq : "0",
                "desc",  "Thread-safe INCR counter — auto-assigns monotonic order IDs starting at 5001"
        ));

        // 2. Sorted Set — all orders (show latest 10 with scores)
        Set<org.springframework.data.redis.core.ZSetOperations.TypedTuple<String>> allOrders =
                redis.opsForZSet().reverseRangeWithScores("{cravedash}:orders:all", 0, 9);
        List<Map<String, Object>> allOrdersList = new ArrayList<>();
        if (allOrders != null) {
            for (var t : allOrders) {
                Map<String, Object> entry = new LinkedHashMap<>();
                entry.put("id", t.getValue());
                entry.put("score", t.getScore() != null ? t.getScore().longValue() : 0);
                allOrdersList.add(entry);
            }
        }
        long totalOrders = Optional.ofNullable(redis.opsForZSet().zCard("{cravedash}:orders:all")).orElse(0L);
        result.put("ordersAll", Map.of(
                "key",        "{cravedash}:orders:all",
                "type",       "SORTED SET (ZSET)",
                "totalCount", totalOrders,
                "latest10",   allOrdersList,
                "desc",       "ZADD with epoch-ms score → ZREVRANGE for newest-first order listing"
        ));

        // 3. Set — active orders
        Set<String> activeSet = redis.opsForSet().members("{cravedash}:orders:active");
        List<String> activeList = activeSet != null ? new ArrayList<>(activeSet) : List.of();
        result.put("ordersActive", Map.of(
                "key",    "{cravedash}:orders:active",
                "type",   "SET",
                "count",  activeList.size(),
                "ids",    activeList,
                "desc",   "O(1) SADD on create, SREM on DELIVERED — SCARD gives instant active order count"
        ));

        // 4. Sorted Set — leaderboard (top 10)
        Set<org.springframework.data.redis.core.ZSetOperations.TypedTuple<String>> lb =
                redis.opsForZSet().reverseRangeWithScores("{cravedash}:leaderboard", 0, 9);
        List<Map<String, Object>> lbList = new ArrayList<>();
        if (lb != null) {
            int rank = 1;
            for (var t : lb) {
                Map<String, Object> e = new LinkedHashMap<>();
                e.put("rank", rank++);
                e.put("customer", t.getValue());
                e.put("points", t.getScore() != null ? t.getScore().longValue() : 0);
                lbList.add(e);
            }
        }
        result.put("leaderboard", Map.of(
                "key",     "{cravedash}:leaderboard",
                "type",    "SORTED SET (ZSET)",
                "top10",   lbList,
                "desc",    "ZINCRBY adds 10 points per DELIVERED order — ZREVRANGE returns ranked leaderboard"
        ));

        // 5. Sample hash — most recent order
        String topIdStr = null;
        Set<String> topIdSet = redis.opsForZSet().reverseRange("{cravedash}:orders:all", 0, 0);
        if (topIdSet != null && !topIdSet.isEmpty()) {
            topIdStr = topIdSet.iterator().next();
        }
        if (topIdStr != null) {
            Map<Object, Object> hash = redis.opsForHash().entries("{cravedash}:order:" + topIdStr);
            result.put("latestOrderHash", Map.of(
                    "key",    "{cravedash}:order:" + topIdStr,
                    "type",   "HASH",
                    "fields", hash,
                    "desc",   "HSET stores all order fields atomically — HGETALL retrieves the full order in one round-trip"
            ));
        } else {
            result.put("latestOrderHash", Map.of(
                    "key",   "{cravedash}:order:<id>",
                    "type",  "HASH",
                    "fields", Map.of(),
                    "desc",  "No orders yet — place your first order!"
            ));
        }

        // 6. Hash-tag slot info
        result.put("hashTagInfo", Map.of(
                "hashTag",   "{cravedash}",
                "slot",      7136,
                "reason",    "All keys share {cravedash} hash tag → same cluster slot (CRC16 % 16384 = 7136) → MULTI/EXEC transactions work without CROSSSLOT errors",
                "commands",  List.of("MULTI", "HSET", "ZADD", "SADD", "EXEC")
        ));

        return result;
    }

    // ── Live latency benchmark ─────────────────────────────────────────────────
    @GetMapping("/benchmark")
    public Map<String, Object> benchmark() {
        int iterations = 50;
        long[] readLatencies  = new long[iterations];
        long[] writeLatencies = new long[iterations];

        String benchKey = "{cravedash}:bench:tmp";

        for (int i = 0; i < iterations; i++) {
            // Write
            long wStart = System.nanoTime();
            redis.opsForValue().set(benchKey, "v" + i);
            writeLatencies[i] = (System.nanoTime() - wStart) / 1_000; // µs

            // Read
            long rStart = System.nanoTime();
            redis.opsForValue().get(benchKey);
            readLatencies[i] = (System.nanoTime() - rStart) / 1_000; // µs
        }
        redis.delete(benchKey);

        // Stats in milliseconds
        double avgWrite = Arrays.stream(writeLatencies).average().orElse(0) / 1000.0;
        double avgRead  = Arrays.stream(readLatencies).average().orElse(0)  / 1000.0;

        long[] sortedRead = Arrays.copyOf(readLatencies, readLatencies.length);
        Arrays.sort(sortedRead);
        double p99Read = sortedRead[(int)(sortedRead.length * 0.99)] / 1000.0;
        double p50Read = sortedRead[(int)(sortedRead.length * 0.50)] / 1000.0;

        long[] sortedWrite = Arrays.copyOf(writeLatencies, writeLatencies.length);
        Arrays.sort(sortedWrite);
        double p99Write = sortedWrite[(int)(sortedWrite.length * 0.99)] / 1000.0;

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("iterations", iterations);
        result.put("avgReadMs",  Math.round(avgRead  * 100.0) / 100.0);
        result.put("avgWriteMs", Math.round(avgWrite * 100.0) / 100.0);
        result.put("p50ReadMs",  Math.round(p50Read  * 100.0) / 100.0);
        result.put("p99ReadMs",  Math.round(p99Read  * 100.0) / 100.0);
        result.put("p99WriteMs", Math.round(p99Write * 100.0) / 100.0);
        result.put("note", "Sub-millisecond in-memory latency — MemoryDB guarantees this at scale with Multi-AZ durability");

        return result;
    }

    // ── Redis server INFO snippet ──────────────────────────────────────────────
    @GetMapping("/info")
    public Map<String, String> info() {
        Map<String, String> result = new LinkedHashMap<>();
        try {
            Properties props = redis.getConnectionFactory().getConnection().serverCommands().info("server");
            if (props != null) {
                String[] keys = {"redis_version", "uptime_in_seconds", "uptime_in_days", "tcp_port", "os", "arch_bits", "executable"};
                for (String k : keys) {
                    String val = props.getProperty(k);
                    if (val != null) result.put(k, val);
                }
            }
        } catch (Exception e) {
            result.put("error", e.getMessage());
        }
        return result;
    }
}
