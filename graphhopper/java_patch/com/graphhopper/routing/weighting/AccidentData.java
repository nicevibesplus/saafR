package com.graphhopper.routing.weighting;
import java.time.LocalDateTime;

public class AccidentData {
    public int year;
    public int month;
    public int hour; // z.B. Stunde 0-23
    public int dayOfWeek; // 1 = Montag, 7 = Sonntag (oder SQL Standard prüfen)

    public AccidentData(int year, int month, int hour, int dayOfWeek) {
        this.year = year;
        this.month = month;
        this.hour = hour;
        this.dayOfWeek = dayOfWeek;
    }
}