package com.graphhopper.routing.ev;

import com.graphhopper.routing.util.parsers.CrashCountParser;
import com.graphhopper.routing.ev.CrashCount;
import com.graphhopper.routing.ev.DefaultImportRegistry;

public class CustomImportRegistry extends DefaultImportRegistry {
    @Override
    public ImportUnit createImportUnit(String name) {
        if (CrashCount.KEY.equals(name))
            return ImportUnit.create(name, props -> CrashCount.create(),
                    (lookup, props) -> new CrashCountParser(
                            lookup.getIntEncodedValue(CrashCount.KEY))
            );
        else {
            return super.createImportUnit(name);
        }
    }
}