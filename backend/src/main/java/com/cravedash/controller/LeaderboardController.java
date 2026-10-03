package com.cravedash.controller;

import com.cravedash.model.LeaderboardEntry;
import com.cravedash.service.LeaderboardService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    private final LeaderboardService leaderboardService;

    public LeaderboardController(LeaderboardService leaderboardService) {
        this.leaderboardService = leaderboardService;
    }

    /** GET /api/leaderboard?limit=5 */
    @GetMapping
    public List<LeaderboardEntry> getLeaderboard(
            @RequestParam(defaultValue = "5") int limit) {
        return leaderboardService.getTop(limit);
    }
}
