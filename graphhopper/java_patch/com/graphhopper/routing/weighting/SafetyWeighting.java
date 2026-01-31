package com.graphhopper.routing.weighting;

import com.graphhopper.routing.ev.DecimalEncodedValue;
import com.graphhopper.routing.ev.VehicleSpeed;
import com.graphhopper.routing.ev.VehiclePriority;
import com.graphhopper.routing.ev.IntEncodedValue;
import com.graphhopper.routing.ev.BooleanEncodedValue;
import com.graphhopper.routing.ev.VehicleAccess;
import com.graphhopper.routing.weighting.TurnCostProvider;
import com.graphhopper.routing.util.EncodingManager;
import com.graphhopper.routing.weighting.AccidentData;     // Deine Datenklasse
import com.graphhopper.routing.weighting.AccidentRegistry; // Deine Registry
import com.graphhopper.routing.weighting.AnxietyData;
import com.graphhopper.routing.weighting.AnxietyRegistry;
import com.graphhopper.storage.BaseGraph;
import com.graphhopper.util.EdgeIteratorState;
import com.graphhopper.util.PMap;
import com.graphhopper.routing.weighting.custom.CustomWeighting;

import java.util.logging.Logger;
import java.util.List;
import java.util.Map;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;

public class SafetyWeighting implements Weighting {
    private static final Logger LOGGER = Logger.getLogger(SafetyWeighting.class.getName());

    private final CustomWeighting delegate;
    
    private final IntEncodedValue osmIdEnc;
    private final Map<Long, List<AccidentData>> accidents;
    private final Map<Long, List<AnxietyData>> anxieties;
    
    
    private final boolean includeCrashes;
    private final boolean includeAnxiety;
    private final LocalDateTime reqTime;

    public SafetyWeighting(TurnCostProvider turnCostProvider, CustomWeighting.Parameters parameters, PMap hints, EncodingManager encodingManager) {
        this.delegate = new CustomWeighting(turnCostProvider, parameters);

        // 2. OSM ID holen
        if (encodingManager.hasEncodedValue("osm_way_id")) {
            this.osmIdEnc = encodingManager.getIntEncodedValue("osm_way_id");
        } else {
            this.osmIdEnc = null;
        }
        
        this.accidents = AccidentRegistry.getInstance(); 
        this.anxieties = AnxietyRegistry.getInstance();
        LOGGER.info("SafetyWeighting hints: " + hints.toString());
        this.includeCrashes = hints.getBool("include_crashes", false);
        this.includeAnxiety = hints.getBool("include_anxiety", false);
        String reqTimeStr = hints.getString("req_time", null);
        if (reqTimeStr == null) {
            this.reqTime = null;
        } else {
            this.reqTime = LocalDateTime.parse(reqTimeStr);
        }

        LOGGER.info("SafetyWeighting with hints: include_crashes=" + this.includeCrashes
            + ", include_anxiety=" + this.includeAnxiety
            + ", req_time=" + this.reqTime
        );
    }

    private double getAccidentWeightMultiplier(EdgeIteratorState edgeState, long osmId) {
    

        List<AccidentData> segmentAccidents = accidents.get(osmId);
        if (segmentAccidents == null || segmentAccidents.isEmpty()) {
            return 1.0;
        }

        double totalScore = 0.0;

        boolean reqIsWeekend = this.reqTime.getDayOfWeek().getValue() == 6 || this.reqTime.getDayOfWeek().getValue() == 7;

        for (AccidentData acc : segmentAccidents) {
            
            // year recency
            int yearDiff = this.reqTime.getYear() - acc.year;
            double recencyFactor = 1.0 - (yearDiff * 0.1);

            // years season
            int monthDiff = Math.abs(this.reqTime.getMonthValue() - acc.month);
            monthDiff = Math.min(monthDiff, 12 - monthDiff);
            double seasonScore = 0.0;
            if (monthDiff == 0) {
                seasonScore = 0.10;
            } else if (monthDiff == 1) {
                seasonScore = 0.03;
            }

            // day of week
            double dayScore = 0.0;
            boolean accIsWeekend = (acc.dayOfWeek == 6 || acc.dayOfWeek == 7);
            if (this.reqTime.getDayOfWeek().getValue() == acc.dayOfWeek) {
                dayScore = 0.10;
            } else if (reqIsWeekend == accIsWeekend) {
                dayScore = 0.04;
            }


            // time
            int hourDiff = Math.abs(this.reqTime.getHour() - acc.hour);
            hourDiff = Math.min(hourDiff, 24 - hourDiff);
            double timeScore = 0.0;
            if (hourDiff == 0) {
                timeScore = 0.20;
            } else if (hourDiff == 1) {
                timeScore = 0.10;
            } else if (hourDiff == 2) {
                timeScore = 0.05;
            }

            double accidentImpact = (seasonScore + dayScore + timeScore) * recencyFactor;
            totalScore += accidentImpact;
        }
        return 1.0 + Math.min(totalScore, 10.0);
    }

    private double getAnxietyWeightMultiplier(EdgeIteratorState edgeState, long osmId) {
        List<AnxietyData> segmentAnxieties = anxieties.get(osmId);
        if (segmentAnxieties == null || segmentAnxieties.isEmpty()) {
            return 1.0;
        }

        double totalScore = 0.0;
        for(AnxietyData anx : segmentAnxieties) {
            double score = 0.0;
            if (this.reqTime.toLocalTime().isAfter(anx.start_time) && this.reqTime.toLocalTime().isBefore(anx.end_time) && Arrays.asList(anx.active_days).contains(this.reqTime.getDayOfWeek().getValue())) {
                if (anx.lighting == 1) {
                    score += 0.2;
                } else if (anx.lighting == 2) {
                    score += 0.1;
                }
                score += anx.severity * 0.5;
            }
            totalScore += score;
        }
        return 1.0 + Math.min(totalScore, 10.0);
    }

    @Override
    public double calcEdgeWeight(EdgeIteratorState edgeState, boolean reverse) {
        double weight = delegate.calcEdgeWeight(edgeState, reverse);
        if ( Double.isInfinite(weight) ) {
            return Double.POSITIVE_INFINITY;
        }

        long osmId = -1;
        try {
            int osmIdInt = edgeState.get(osmIdEnc);
            osmId = Integer.toUnsignedLong(osmIdInt);
        } catch (Exception e) {
            return weight;
        }

        String accLog = String.format("Edge OSM ID: %d, base weight(%.2f) * ", osmId, weight);
        double newWeight = weight;
        double accidentMultiplier = 1.0;
        double anxietyMultiplier = 1.0;
        if (includeCrashes && accidents != null && reqTime != null) {
            accidentMultiplier = getAccidentWeightMultiplier(edgeState, osmId);
        }

        if (includeAnxiety && anxieties != null && reqTime != null) {
            anxietyMultiplier = getAnxietyWeightMultiplier(edgeState, osmId);
        }

        newWeight *= accidentMultiplier * anxietyMultiplier;

        accLog += String.format("accident multiplier (%.2f) * anxiety multiplier (%.2f) = final weight (%.2f)", accidentMultiplier, anxietyMultiplier, newWeight);
        if ((includeCrashes || includeAnxiety) && weight != newWeight) {
            LOGGER.info(accLog);
        }
        return newWeight;
    }

    @Override
    public double calcMinWeightPerDistance() {
        return delegate.calcMinWeightPerDistance();
    }

    @Override
    public long calcEdgeMillis(EdgeIteratorState edgeState, boolean reverse) {
        return delegate.calcEdgeMillis(edgeState, reverse);
    }

    @Override
    public double calcTurnWeight(int edgeFrom, int nodeVia, int edgeTo) {
        return delegate.calcTurnWeight(edgeFrom, nodeVia, edgeTo);
    }

    @Override
    public long calcTurnMillis(int inEdge, int viaNode, int outEdge) {
        return delegate.calcTurnMillis(inEdge, viaNode, outEdge);
    }

    @Override
    public boolean hasTurnCosts() {
        return delegate.hasTurnCosts();
    }

    @Override
    public String getName() {
        return "bikesafe"; // Eigener Name
    }
}