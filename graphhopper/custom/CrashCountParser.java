package com.graphhopper.routing.util.parsers;

import com.graphhopper.reader.ReaderWay;
import com.graphhopper.routing.ev.EdgeIntAccess;
import com.graphhopper.routing.ev.IntEncodedValue;
import com.graphhopper.storage.IntsRef;


public class CrashCountParser implements TagParser {

    private final IntEncodedValue crashCount;

    public CrashCountParser(IntEncodedValue crashCount) {
        this.crashCount = crashCount;
    }

    @Override
    public void handleWayTags(int edgeId, EdgeIntAccess edgeIntAccess, ReaderWay readerWay, IntsRef relationFlags) {
        String countstr = readerWay.getTag("crash_count");
        int count = Integer.parseInt(countstr);
        
    
        crashCount.setInt(false, edgeId, edgeIntAccess, count);
    }
}