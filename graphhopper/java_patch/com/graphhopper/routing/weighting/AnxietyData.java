package com.graphhopper.routing.weighting;
import java.time.LocalDateTime;

public class AnxietyData {
    public LocalDateTime start_time;
    public LocalDateTime end_time;
    public int active_days;
    public boolean lighting;
    public int likes;
    public int severity;

    public AnxietyData(LocalDateTime start_time, LocalDateTime end_time, int active_days, boolean lighting, int likes, int severity) {
        this.start_time = start_time;
        this.end_time = end_time;
        this.active_days = active_days;
        this.lighting = lighting;
        this.likes = likes;
        this.severity = severity;
    }
}