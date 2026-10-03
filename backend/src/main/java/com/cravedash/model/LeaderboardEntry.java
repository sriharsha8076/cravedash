package com.cravedash.model;

/** Response for GET /api/leaderboard entries. */
public class LeaderboardEntry {
    private int rank;
    private String name;
    private long points;

    public LeaderboardEntry(int rank, String name, long points) {
        this.rank = rank;
        this.name = name;
        this.points = points;
    }

    public int getRank() { return rank; }
    public String getName() { return name; }
    public long getPoints() { return points; }
}
