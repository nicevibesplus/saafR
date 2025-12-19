package com.graphhopper.routing.weighting;

import com.graphhopper.routing.ev.DecimalEncodedValue;
import com.graphhopper.routing.ev.VehicleSpeed;
import com.graphhopper.routing.ev.IntEncodedValue;
import com.graphhopper.routing.weighting.TurnCostProvider;
import com.graphhopper.routing.util.EncodingManager;
import com.graphhopper.routing.weighting.AccidentData;     // Deine Datenklasse
import com.graphhopper.routing.weighting.AccidentRegistry; // Deine Registry
import com.graphhopper.storage.BaseGraph;
import com.graphhopper.util.EdgeIteratorState;
import com.graphhopper.util.PMap;

import java.util.List;
import java.util.Map;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

public class SafetyWeighting implements Weighting {

    
    private final DecimalEncodedValue speedEnc;
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
        this.speedEnc = encodingManager.getDecimalEncodedValue(VehicleSpeed.key(hints.getString("vehicle", "bike")));
        
        // 2. Initialisiere Custom-Komponenten (OSM ID)
        if (encodingManager.hasEncodedValue("osm_way_id")) {
            this.osmIdEnc = encodingManager.getIntEncodedValue("osm_way_id");
        } else {
            this.osmIdEnc = null;
        }

        this.accidents = AccidentRegistry.getInstance(); 
        
        // 3. Request Parameter laden
        this.includeCrashes = hints.getBool("include_crashes", false);
        this.reqYear = hints.getInt("req_year", -1);
        this.reqMonth = hints.getInt("req_month", -1);
        this.reqDay = hints.getInt("req_weekday", -1);
        this.reqHour = hints.getInt("req_hour", -1);
    }

    @Override
    public double calcMinWeightPerDistance() {
        return 1.0 / speedEnc.getMaxStorableDecimal();
    }

    @Override
    public double calcEdgeWeight(EdgeIteratorState edgeState, boolean reverse) {
        // 1. Basis-Gewicht berechnen (Reine Reisezeit)
        double speed = edgeState.get(speedEnc);
        if (speed == 0) return Double.POSITIVE_INFINITY;
        
        double time = edgeState.getDistance() / speed;

        // Turn Costs addieren (falls vorhanden)
        double weight = time + turnCostProvider.calcTurnWeight(edgeState.getEdge(), edgeState.getBaseNode(), edgeState.getAdjNode());

        if (!includeCrashes || accidents == null) {
            return weight;
        }

        int osmIdInt = edgeState.get(osmIdEnc);
        // OSM ID ist in GH oft unsigned int, Konvertierung zu long
        long osmId = Integer.toUnsignedLong(osmIdInt);

        List<AccidentData> segmentAccidents = accidents.get(osmId);
        if (segmentAccidents == null || segmentAccidents.isEmpty()) {
            return weight;
        }

        double totalScore = 0.0;

        // Wir cachen diese Checks, damit wir sie nicht in der Schleife machen müssen
        boolean reqIsWeekend = (reqDay == 6 || reqDay == 7); // Samstag oder Sonntag

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

            totalScore += accidentImpact;
        }

        // --- ENDBERECHNUNG ---
        
        // Capping: Wir begrenzen den Multiplikator. 
        // Selbst wenn dort 100 Unfälle waren, soll die Straße nicht "unendlich" teuer werden,
        // sonst routet GH riesige Umwege für kleine Optimierungen.
        // Ein Score von 10.0 bedeutet: Die Straße wird als 6x so lang wahrgenommen.
        double cappedScore = Math.min(totalScore, 10.0);
        
        // Multiplikator anwenden (1.0 = normal, 2.0 = doppelt so teuer/langsam)
        return weight * (1.0 + cappedScore);
    }


    @Override
    public long calcEdgeMillis(EdgeIteratorState edgeState, boolean reverse) {
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
        return turnCostProvider != null;
    }

    @Override
    public String getName() {
        return "safety";
    }
}