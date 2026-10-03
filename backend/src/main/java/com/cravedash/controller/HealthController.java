package com.cravedash.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private static final Logger log = LoggerFactory.getLogger(HealthController.class);

    private final RedisTemplate<String, String> redis;

    public HealthController(RedisTemplate<String, String> redis) {
        this.redis = redis;
    }

    /**
     * GET /api/health — pings MemoryDB and returns { "status": "UP" | "DOWN" }.
     * The frontend polls this every 30 seconds to show the connection indicator.
     */
    @GetMapping
    public Map<String, String> health() {
        try {
            String pong = redis.getConnectionFactory()
                    .getConnection()
                    .ping();
            if ("PONG".equalsIgnoreCase(pong)) {
                return Map.of("status", "UP");
            }
            return Map.of("status", "DOWN");
        } catch (Exception ex) {
            log.warn("MemoryDB health check failed: {}", ex.getMessage());
            return Map.of("status", "DOWN");
        }
    }
}
