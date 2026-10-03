package com.cravedash.config;

import io.lettuce.core.ReadFrom;
import io.lettuce.core.cluster.ClusterTopologyRefreshOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.connection.*;
import org.springframework.data.redis.connection.lettuce.*;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.*;

import java.util.List;

/**
 * Configures a Lettuce cluster connection to Amazon MemoryDB.
 *
 * Key design decisions
 * --------------------
 * 1. ClusterConfiguration: MemoryDB always runs in cluster mode, even
 *    a single-shard cluster.  We must use RedisClusterConfiguration.
 *
 * 2. TLS: MemoryDB enforces TLS by default.  Controlled by the
 *    spring.data.redis.ssl.enabled property so the local profile can
 *    turn it off when connecting to a plain Docker container.
 *
 * 3. Hash tags: All key names contain {cravedash} so that related keys
 *    hash to the same cluster slot.  This is mandatory for MULTI/EXEC
 *    (transactions) and multi-key operations across keys — Redis cluster
 *    routes each key to a slot based on the content between the first
 *    pair of braces.  Without a shared hash tag, a transaction that
 *    touches order:<id> and orders:all would get a CROSSSLOT error.
 *
 * 4. ReadFrom.REPLICA_PREFERRED: reads go to a replica when available,
 *    falling back to primary.  Tradeoff: replicas may be slightly behind
 *    the primary (eventual consistency within a shard), which is acceptable
 *    for the dashboard and leaderboard reads.  Status updates and order
 *    creation always go to the primary.
 *
 * 5. Topology refresh: enables automatic detection of failover events so
 *    Lettuce re-routes writes to the newly promoted primary within seconds.
 */
@Configuration
public class RedisConfig {

    @Value("${spring.data.redis.host}")
    private String host;

    @Value("${spring.data.redis.port:6379}")
    private int port;

    @Value("${spring.data.redis.username:}")
    private String username;

    @Value("${spring.data.redis.password:}")
    private String password;

    @Value("${spring.data.redis.ssl.enabled:true}")
    private boolean sslEnabled;

    @Bean
    public LettuceConnectionFactory redisConnectionFactory() {
        if (!sslEnabled) {
            RedisStandaloneConfiguration standaloneConfig =
                    new RedisStandaloneConfiguration(host, port);
            if (!username.isBlank()) {
                standaloneConfig.setUsername(username);
            }
            if (!password.isBlank()) {
                standaloneConfig.setPassword(RedisPassword.of(password));
            }
            return new LettuceConnectionFactory(standaloneConfig);
        }

        // MemoryDB cluster endpoint acts as the seed node.
        RedisClusterConfiguration clusterConfig =
                new RedisClusterConfiguration(List.of(host + ":" + port));

        if (!username.isBlank()) {
            clusterConfig.setUsername(username);
        }
        if (!password.isBlank()) {
            clusterConfig.setPassword(RedisPassword.of(password));
        }

        // Topology refresh lets Lettuce react to shard failovers automatically.
        ClusterTopologyRefreshOptions topologyRefresh =
                ClusterTopologyRefreshOptions.builder()
                        .enableAllAdaptiveRefreshTriggers()
                        .build();

        LettuceClientConfiguration clientConfig;
        if (sslEnabled) {
            clientConfig = LettuceClientConfiguration.builder()
                    .readFrom(ReadFrom.REPLICA_PREFERRED)
                    .clientOptions(
                            io.lettuce.core.cluster.ClusterClientOptions.builder()
                                    .topologyRefreshOptions(topologyRefresh)
                                    .build())
                    .useSsl()
                    .build();
        } else {
            clientConfig = LettuceClientConfiguration.builder()
                    .readFrom(ReadFrom.REPLICA_PREFERRED)
                    .clientOptions(
                            io.lettuce.core.cluster.ClusterClientOptions.builder()
                                    .topologyRefreshOptions(topologyRefresh)
                                    .build())
                    .build();
        }

        return new LettuceConnectionFactory(clusterConfig, clientConfig);
    }

    /**
     * RedisTemplate configured with String keys and String values.
     * All serialisation/deserialisation is done manually in the repository
     * layer so we keep full control of the Redis data structures.
     */
    @Primary
    @Bean
    public RedisTemplate<String, String> redisTemplate(
            LettuceConnectionFactory connectionFactory) {
        RedisTemplate<String, String> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        StringRedisSerializer str = new StringRedisSerializer();
        template.setKeySerializer(str);
        template.setValueSerializer(str);
        template.setHashKeySerializer(str);
        template.setHashValueSerializer(str);
        template.afterPropertiesSet();
        return template;
    }
}
