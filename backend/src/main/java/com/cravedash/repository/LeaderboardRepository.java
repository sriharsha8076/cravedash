package com.cravedash.repository;

import com.cravedash.model.LeaderboardEntry;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Repository;

import java.util.*;

/**
 * Leaderboard stored as a Redis sorted set.
 * Key: {cravedash}:leaderboard
 * Score: total points (10 per delivered order).
 * Member: customer name.
 *
 * The {cravedash} hash tag ensures the leaderboard key lands in the same
 * cluster slot as the order keys, enabling atomic MULTI/EXEC if needed.
 */
@Repository
public class LeaderboardRepository {

    static final String KEY_LEADERBOARD = "{cravedash}:leaderboard";

    private final RedisTemplate<String, String> redis;

    public LeaderboardRepository(RedisTemplate<String, String> redis) {
        this.redis = redis;
    }

    /**
     * ZINCRBY — adds points for a customer.
     * Creates the entry if it doesn't exist yet.
     */
    public void addPoints(String customer, long points) {
        redis.opsForZSet().incrementScore(KEY_LEADERBOARD, customer, points);
    }

    /**
     * ZREVRANGE leaderboard 0 (limit-1) WITHSCORES — top N by points descending.
     */
    public List<LeaderboardEntry> getTopN(int limit) {
        Set<ZSetOperations.TypedTuple<String>> tuples =
                redis.opsForZSet().reverseRangeWithScores(KEY_LEADERBOARD, 0, limit - 1L);

        if (tuples == null || tuples.isEmpty()) return List.of();

        List<LeaderboardEntry> result = new ArrayList<>();
        int rank = 1;
        for (ZSetOperations.TypedTuple<String> t : tuples) {
            long points = t.getScore() == null ? 0 : t.getScore().longValue();
            result.add(new LeaderboardEntry(rank++, t.getValue(), points));
        }
        return result;
    }
}
