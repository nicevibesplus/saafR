package com.graphhopper.routing.weighting;

import java.sql.*;
import java.util.*;
import java.util.logging.Logger;

public class AccidentRegistry {
    private static final Logger LOGGER = Logger.getLogger(AccidentRegistry.class.getName());
    
    // Map: OSM_WAY_ID -> Liste von Unfällen
    // 'static' damit alle Weighting-Instanzen darauf zugreifen können
    private static Map<Long, List<AccidentData>> accidentMap = null;

    public static synchronized Map<Long, List<AccidentData>> getInstance() {
        if (accidentMap == null) {
            loadData();
        }
        return accidentMap;
    }

    private static void loadData() {
        accidentMap = new HashMap<>();
        String url = String.format("jdbc:postgresql://%s:%s/%s", System.getenv("POSTGRES_SERVER"), System.getenv("POSTGRES_PORT"), System.getenv("POSTGRES_DB")); // z.B. jdbc:postgresql://db:5432/mydb
        String user = System.getenv("POSTGRES_USER");
        String pass = System.getenv("POSTGRES_PASSWORD");

        if (url == null) {
            LOGGER.warning("DB_URL nicht gesetzt. Keine Unfalldaten geladen.");
            return;
        }

        LOGGER.info("Starte Laden der Unfalldaten aus PostGIS...");
        try (Connection con = DriverManager.getConnection(url, user, pass)) {
            // Passe Tabellen- und Spaltennamen an deine DB an!
            String query = "SELECT osm_id, crash_year, crash_month, crash_hour, crash_weekday FROM crash_streets_match";

            try (Statement stmt = con.createStatement(); ResultSet rs = stmt.executeQuery(query)) {
                int count = 0;
                while (rs.next()) {
                    long osmId = rs.getLong("osm_id");
                    AccidentData data = new AccidentData(
                        rs.getInt("crash_year"),
                        rs.getInt("crash_month"),
                        rs.getInt("crash_hour"),
                        rs.getInt("crash_weekday")
                    );
                    accidentMap.computeIfAbsent(osmId, k -> new ArrayList<>()).add(data);
                    count++;
                }
                LOGGER.info("Fertig! " + count + " Unfälle auf " + accidentMap.size() + " OSM-Ways geladen.");
            }
        } catch (SQLException e) {
            LOGGER.severe("Fehler beim Laden der Unfalldaten: " + e.getMessage());
            e.printStackTrace();
        }
    }
}