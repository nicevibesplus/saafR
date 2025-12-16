package com.graphhopper.routing.ev;

public class CrashCount {
    public static final String KEY = "crash_count";
    
    public static IntEncodedValue create() {
        return new IntEncodedValueImpl(KEY, 8, false);
    }
}