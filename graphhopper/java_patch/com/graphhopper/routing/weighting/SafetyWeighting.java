package com.graphhopper.routing.weighting;

import com.graphhopper.routing.ev.DecimalEncodedValue;
import com.graphhopper.routing.ev.VehicleSpeed;
import com.graphhopper.routing.ev.VehiclePriority;
import com.graphhopper.routing.ev.IntEncodedValue;
import com.graphhopper.routing.weighting.TurnCostProvider;
import com.graphhopper.routing.util.EncodingManager;
import com.graphhopper.routing.weighting.AccidentData;     // Deine Datenklasse
import com.graphhopper.routing.weighting.AccidentRegistry; // Deine Registry
import com.graphhopper.storage.BaseGraph;
import com.graphhopper.util.EdgeIteratorState;
import com.graphhopper.util.PMap;

import java.util.logging.Logger;
import java.util.List;
import java.util.Map;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

public class SafetyWeighting implements Weighting {
    private static final Logger LOGGER = Logger.getLogger(SafetyWeighting.class.getName());

    
    private final DecimalEncodedValue speedEnc;
    private final DecimalEncodedValue priorityEnc;
    private final TurnCostProvider turnCostProvider;
    private final BaseGraph graph;

    private final IntEncodedValue osmIdEnc;
    private final Map<Long, List<AccidentData>> accidents;
    
    private final boolean includeCrashes;
    private final int reqYear;
    private final int reqMonth;
    private final int reqDay;  
    private final int reqHour;

    public SafetyWeighting(EncodingManager encodingManager, TurnCostProvider turnCostProvider, PMap hints, BaseGraph graph) {
        // 1. Initialisiere Standard-Komponenten
        this.turnCostProvider = turnCostProvider;
        this.graph = graph;
        String vehicle = hints.getString("vehicle", "");
        
        if (vehicle.isEmpty()) {
            // Prüfen, ob es ein verschachteltes 'hints' Objekt gibt
            Object nestedObj = hints.getObject("hints", null);
            if (nestedObj instanceof Map) {
                PMap nested = new PMap((Map) nestedObj);
                vehicle = nested.getString("vehicle", "car");
            } else {
                // Nichts gefunden, Fallback auf car
                vehicle = "car";
            }
        }
        
        LOGGER.info("SafetyWeighting initialisiert für Fahrzeug: " + vehicle);
        this.speedEnc = encodingManager.getDecimalEncodedValue(VehicleSpeed.key(vehicle));
        
        // --- NEU: Wir holen uns die Priorität für das Fahrzeug (z.B. bike_priority) ---
        this.priorityEnc = encodingManager.getDecimalEncodedValue(VehiclePriority.key(vehicle));
        
        // 2. Initialisiere Custom-Komponenten (OSM ID)
        if (encodingManager.hasEncodedValue("osm_way_id")) {
            this.osmIdEnc = encodingManager.getIntEncodedValue("osm_way_id");
        } else {
            this.osmIdEnc = null;
        }

        this.accidents = AccidentRegistry.getInstance(); 
        
        LOGGER.info("SafetyWeighting hints: " + hints.toString());
        // 3. Request Parameter laden
        this.includeCrashes = hints.getBool("include_crashes", false);
        this.reqYear = hints.getInt("req_year", -1);
        this.reqMonth = hints.getInt("req_month", -1);
        this.reqDay = hints.getInt("req_weekday", -1);
        this.reqHour = hints.getInt("req_hour", -1);

        LOGGER.info("SafetyWeighting with hints: include_crashes=" + this.includeCrashes
            + ", req_year=" + this.reqYear
            + ", req_month=" + this.reqMonth
            + ", req_weekday=" + this.reqDay
            + ", req_hour=" + this.reqHour
        );
    }

    @Override
    public double calcMinWeightPerDistance() {
        return 1.0 / speedEnc.getMaxStorableDecimal();
    }

    @Override
    public double calcEdgeWeight(EdgeIteratorState edgeState, boolean reverse) {
        if (speedEnc == null) return Double.POSITIVE_INFINITY;
        double speed = edgeState.get(speedEnc);
        if (speed == 0) return Double.POSITIVE_INFINITY;

        // 2. Priority Check (DAS LÖST DEIN PROBLEM)
        // priority ist ein Wert zwischen 0 und 1.
        // 1.0 = Perfekter Radweg
        // 0.1 = Autobahnzubringer / Schlechter Belag
        // 0.0 = Verboten / Sackgasse / Einbahnstraße falsch herum
        double priority = edgeState.get(priorityEnc);
        if (priority == 0) return Double.POSITIVE_INFINITY; // Absolut verboten!

        // Berechnung: Zeit / Priorität
        // Eine Strecke mit Prio 0.5 zählt doppelt so schwer wie normal.
        double time = edgeState.getDistance() / speed;
        double baseWeight = time / priority;

        // 3. Turn Costs
        double turnCosts = 0;
        if (turnCostProvider != null) {
             turnCosts = turnCostProvider.calcTurnWeight(edgeState.getEdge(), edgeState.getBaseNode(), edgeState.getAdjNode());
        }
        
        double weight = baseWeight + turnCosts;

        // 4. Unfall Logik
        if (!includeCrashes || accidents == null || osmIdEnc == null) {
            return weight;
        }

        long osmId = -1;
        try {
            int osmIdInt = edgeState.get(osmIdEnc);
            osmId = Integer.toUnsignedLong(osmIdInt);
        } catch (Exception e) { return weight; }

        List<AccidentData> segmentAccidents = accidents.get(osmId);
        if (segmentAccidents == null || segmentAccidents.isEmpty()) {
            return weight;
        }

        double totalScore = 0.0;

        // Wir cachen diese Checks, damit wir sie nicht in der Schleife machen müssen
        boolean reqIsWeekend = (reqDay == 6 || reqDay == 7); // Samstag oder Sonntag

        String accLog = "Edge OSM ID: " + osmId + " has " + segmentAccidents.size() + " accidents. Details:\n";
        for (AccidentData acc : segmentAccidents) {
            
            // --- A. REZENZ (Alter des Unfalls) ---
            // Unfälle aus der Zukunft oder dem gleichen Jahr -> Diff 0
            int yearDiff = reqYear - acc.year;
            
            // Wenn Unfall älter als 10 Jahre -> Ignorieren (Performance & Relevanz)
            if (yearDiff > 10) continue; 
            if (yearDiff < 0) yearDiff = 0; // Fallback für Datenfehler

            // Linearer Gradient:
            // 0 Jahre (aktuell) = 1.0
            // 5 Jahre alt       = 0.5
            // 10 Jahre alt      = 0.0
            double recencyFactor = 1.0 - (yearDiff * 0.1);


            // --- B. JAHRESZEIT (Monat - Zyklisch) ---
            int monthDiff = Math.abs(reqMonth - acc.month);
            // Korrektur für Jahreswechsel (Januar (1) vs Dezember (12) ist Abstand 1)
            monthDiff = Math.min(monthDiff, 12 - monthDiff);

            double seasonScore = 0.0;
            if (monthDiff == 0) {
                seasonScore = 0.10; // Voller Treffer
            } else if (monthDiff == 1) {
                seasonScore = 0.03; // Knapp daneben (gleiche Jahreszeit)
            }


            // --- C. WOCHENTAG & WOCHENENDE ---
            double dayScore = 0.0;
            boolean accIsWeekend = (acc.dayOfWeek == 6 || acc.dayOfWeek == 7);

            if (reqDay == acc.dayOfWeek) {
                // Exakt gleicher Wochentag (z.B. Montagsverkehr)
                dayScore = 0.10;
            } else if (reqIsWeekend == accIsWeekend) {
                // Gleiche Kategorie (beide Wochenende oder beide Werktags)
                dayScore = 0.04;
            }


            // --- D. UHRZEIT (Zyklisch) ---
            int hourDiff = Math.abs(reqHour - acc.hour);
            // Korrektur für Tageswechsel (23 Uhr vs 1 Uhr ist Abstand 2)
            hourDiff = Math.min(hourDiff, 24 - hourDiff);

            double timeScore = 0.0;
            if (hourDiff == 0) {
                timeScore = 0.20; // Exakte Stunde (sehr relevant!)
            } else if (hourDiff == 1) {
                timeScore = 0.10; // +/- 1 Stunde
            } else if (hourDiff == 2) {
                timeScore = 0.05; // +/- 2 Stunden
            }


            // --- GESAMTBERECHNUNG PRO UNFALL ---
            // Die Situations-Scores werden addiert und dann mit dem Alter gedämpft.
            // Ein Unfall, der 10 Jahre her ist, trägt fast nichts mehr bei,
            // auch wenn Zeit und Datum perfekt passen.
            double accidentImpact = (seasonScore + dayScore + timeScore) * recencyFactor;
            accLog += String.format("  Accident: yearDiff=%d, recencyFactor=%.2f, seasonScore=%.2f, dayScore=%.2f, timeScore=%.2f, totalImpact=%.2f\n",
                yearDiff, recencyFactor, seasonScore, dayScore, timeScore, accidentImpact);
            totalScore += accidentImpact;
        }
        accLog += String.format("  => Total accident score for edge OSM ID %d: %.2f\n", osmId, totalScore);

        // --- ENDBERECHNUNG ---
        
        // Capping: Wir begrenzen den Multiplikator. 
        // Selbst wenn dort 100 Unfälle waren, soll die Straße nicht "unendlich" teuer werden,
        // sonst routet GH riesige Umwege für kleine Optimierungen.
        // Ein Score von 10.0 bedeutet: Die Straße wird als 6x so lang wahrgenommen.
        double cappedScore = Math.min(totalScore, 10.0);
        accLog += String.format("  => Capped accident score for edge OSM ID %d: %.2f\n", osmId, cappedScore);
        
        // Multiplikator anwenden (1.0 = normal, 2.0 = doppelt so teuer/langsam)
        double returnWeight = weight * (1.0 + cappedScore);
        accLog += String.format("  Final weight: baseWeight=%.2f, finalWeight=%.2f\n", weight, returnWeight);
        LOGGER.info(accLog);
        return returnWeight;
    }


    @Override
    public long calcEdgeMillis(EdgeIteratorState edgeState, boolean reverse) {
        if (speedEnc == null) return 0;
        double speed = edgeState.get(speedEnc);
        if (speed == 0) return 0;
        return (long) (edgeState.getDistance() / speed * 1000);
    }

    @Override
    public double calcTurnWeight(int edgeFrom, int nodeVia, int edgeTo) {
        // Delegation an den Provider
        return turnCostProvider.calcTurnWeight(edgeFrom, nodeVia, edgeTo);
    }

    @Override
    public long calcTurnMillis(int inEdge, int viaNode, int outEdge) {
        return turnCostProvider.calcTurnMillis(inEdge, viaNode, outEdge);
    }

    @Override
    public boolean hasTurnCosts() {
        return turnCostProvider != null 
            && turnCostProvider != TurnCostProvider.NO_TURN_COST_PROVIDER;
    }

    @Override
    public String getName() {
        return "safety";
    }
}