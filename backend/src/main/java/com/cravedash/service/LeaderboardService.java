package com.cravedash.service;

import com.cravedash.model.LeaderboardEntry;
import com.cravedash.repository.LeaderboardRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LeaderboardService {

    private final LeaderboardRepository lbRepo;

    public LeaderboardService(LeaderboardRepository lbRepo) {
        this.lbRepo = lbRepo;
    }

    public List<LeaderboardEntry> getTop(int limit) {
        return lbRepo.getTopN(limit);
    }
}
