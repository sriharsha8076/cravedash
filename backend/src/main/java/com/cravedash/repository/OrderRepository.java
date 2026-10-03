package com.cravedash.repository;

import com.cravedash.model.Order;
import com.cravedash.model.OrderStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.SessionCallback;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.*;

/**
 * All MemoryDB (Redis) access for orders is isolated here.
 *
 * Key schema (all keys share the {cravedash} hash tag so they land in the
 * same cluster slot — required for MULTI/EXEC across multiple keys):
 *
 *   {cravedash}:seq:order         – String, INCR counter starting at 5000
 *   {cravedash}:order:<id>        – Hash, one field per Order property
 *   {cravedash}:orders:all        – Sorted set, score = createdAt epoch ms
 *   {cravedash}:orders:active     – Set, contains IDs of non-delivered orders
 */
@Repository
public class OrderRepository {

    private static final Logger log = LoggerFactory.getLogger(OrderRepository.class);

    // Key constants — keep them here so no other layer ever hard-codes Redis keys.
    static final String KEY_SEQ          = "{cravedash}:seq:order";
    static final String KEY_ORDERS_ALL   = "{cravedash}:orders:all";
    static final String KEY_ORDERS_ACTIVE = "{cravedash}:orders:active";

    static String orderKey(long id) {
        return "{cravedash}:order:" + id;
    }

    private final RedisTemplate<String, String> redis;

    public OrderRepository(RedisTemplate<String, String> redis) {
        this.redis = redis;
    }

    /**
     * Creates an order atomically:
     *   1. INCR {cravedash}:seq:order          — get next ID
     *   2. HSET {cravedash}:order:<id> …       — store hash
     *   3. ZADD {cravedash}:orders:all <ts> <id> — sorted index
     *   4. SADD {cravedash}:orders:active <id>  — active set
     *
     * Steps 2–4 run inside MULTI/EXEC.  The ID counter uses a separate
     * command because INCR returns a value that the transaction needs.
     * All four keys share the {cravedash} hash tag so they land in slot N.
     */
    public Order create(String customer, String restaurant, int amount) {
        Long id = redis.opsForValue().increment(KEY_SEQ);
        if (id == null) throw new IllegalStateException("Failed to generate order ID");

        // Initialise the counter at 5000 on first use.
        // (INCR starts at 0; we want IDs from 5001 onward, so set the key to 5000
        //  only when it has just been created.)
        if (id == 1L) {
            // Race-safe: GETSET or SET NX would be cleaner, but for a counter
            // that starts once this is sufficient for a single-shard scenario.
            redis.opsForValue().set(KEY_SEQ, "5000");
            id = redis.opsForValue().increment(KEY_SEQ);
        }

        Instant now = Instant.now();
        long finalId = id;

        redis.execute(new SessionCallback<Void>() {
            @Override
            public <K, V> Void execute(org.springframework.data.redis.core.RedisOperations<K, V> ops) {
                @SuppressWarnings("unchecked")
                org.springframework.data.redis.core.RedisOperations<String, String> typed =
                        (org.springframework.data.redis.core.RedisOperations<String, String>) ops;
                typed.multi();
                typed.opsForHash().putAll(orderKey(finalId), toHash(finalId, customer, restaurant, amount, OrderStatus.PLACED, now));
                typed.opsForZSet().add(KEY_ORDERS_ALL, String.valueOf(finalId), now.toEpochMilli());
                typed.opsForSet().add(KEY_ORDERS_ACTIVE, String.valueOf(finalId));
                typed.exec();
                return null;
            }
        });

        log.info("Created order id={} customer={} restaurant={} amount={}", finalId, customer, restaurant, amount);
        return new Order(finalId, customer, restaurant, amount, OrderStatus.PLACED, now);
    }

    /** Updates the status field of an existing order hash. */
    public void updateStatus(long id, OrderStatus status) {
        redis.opsForHash().put(orderKey(id), "status", status.name());
        if (status == OrderStatus.DELIVERED) {
            redis.opsForSet().remove(KEY_ORDERS_ACTIVE, String.valueOf(id));
        }
        log.info("Updated order id={} status={}", id, status);
    }

    /**
     * Fetches a single order by ID.
     * Returns Optional.empty() if the hash does not exist in MemoryDB.
     */
    public Optional<Order> findById(long id) {
        Map<Object, Object> hash = redis.opsForHash().entries(orderKey(id));
        if (hash.isEmpty()) return Optional.empty();
        return Optional.of(fromHash(hash));
    }

    /**
     * Fetches orders newest-first using ZREVRANGE on the sorted set.
     * The sorted set stores IDs; we then fetch each hash individually.
     * In production with many orders, consider paging (ZREVRANGE with offset/count).
     */
    public List<Order> findAll() {
        Set<String> ids = redis.opsForZSet().reverseRange(KEY_ORDERS_ALL, 0, -1);
        if (ids == null || ids.isEmpty()) return List.of();

        List<Order> orders = new ArrayList<>();
        for (String idStr : ids) {
            long id = Long.parseLong(idStr);
            findById(id).ifPresent(orders::add);
        }
        return orders;
    }

    /** ZCARD — total number of orders ever created. */
    public long totalOrders() {
        Long count = redis.opsForZSet().zCard(KEY_ORDERS_ALL);
        return count == null ? 0 : count;
    }

    /** SCARD — number of non-delivered (active) orders. */
    public long activeOrders() {
        Long count = redis.opsForSet().size(KEY_ORDERS_ACTIVE);
        return count == null ? 0 : count;
    }

    // ── Serialisation helpers ───────────────────────────────────────────────

    private Map<String, String> toHash(long id, String customer, String restaurant,
                                       int amount, OrderStatus status, Instant createdAt) {
        Map<String, String> map = new LinkedHashMap<>();
        map.put("id",         String.valueOf(id));
        map.put("customer",   customer);
        map.put("restaurant", restaurant);
        map.put("amount",     String.valueOf(amount));
        map.put("status",     status.name());
        map.put("createdAt",  createdAt.toString());
        return map;
    }

    private Order fromHash(Map<Object, Object> hash) {
        return new Order(
                Long.parseLong((String) hash.get("id")),
                (String) hash.get("customer"),
                (String) hash.get("restaurant"),
                Integer.parseInt((String) hash.get("amount")),
                OrderStatus.valueOf((String) hash.get("status")),
                Instant.parse((String) hash.get("createdAt"))
        );
    }
}
