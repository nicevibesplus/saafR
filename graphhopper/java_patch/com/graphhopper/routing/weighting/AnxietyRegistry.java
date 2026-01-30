package com.graphhopper.routing.weighting;

import java.sql.*;
import java.util.*;
import java.util.logging.Logger;
import java.time.LocalTime;

public class AnxietyRegistry {
    private static final Logger LOGGER = Logger.getLogger(AnxietyRegistry.class.getName());

    private static Map<Long, List<AnxietyData>> anxietyMap = null;

    public static synchronized Map<Long, List<AnxietyData>> getInstance() {
        if (anxietyMap == null) {
            loadData();
        }
        return anxietyMap;
    }

    private static void loadData() {
        anxietyMap = new HashMap<>();
        String url = String.format("jdbc:postgresql://%s:%s/%s", System.getenv("POSTGRES_SERVER"), System.getenv("POSTGRES_PORT"), System.getenv("POSTGRES_DB")); // z.B. jdbc:postgresql://db:5432/mydb
        String user = System.getenv("POSTGRES_USER");
        String pass = System.getenv("POSTGRES_PASSWORD");

        if (url == null) {
            LOGGER.warning("DB_URL nicht gesetzt. Keine Unfalldaten geladen.");
            return;
        }

        LOGGER.info("Starte Laden der Anxiety-Daten aus PostGIS...");
        try (Connection con = DriverManager.getConnection(url, user, pass)) {
            // Passe Tabellen- und Spaltennamen an deine DB an!
            String query = "SELECT m.osm_id, a.start_time, a.end_time, a.active_days, a.lighting, a.likes, a.severity FROM anxiety_road_match m JOIN anxiety_areas a on m.anxiety_id = a.uuid";

            try (Statement stmt = con.createStatement(); ResultSet rs = stmt.executeQuery(query)) {
                int count = 0;
                while (rs.next()) {
                    long osmId = rs.getLong("osm_id");
                    AnxietyData data = new AnxietyData(
                        LocalTime.parse(rs.getString("start_time")),
                        LocalTime.parse(rs.getString("end_time")),
                        (int[]) rs.getArray("active_days").getArray(),
                        rs.getBoolean("lighting"),
                        rs.getInt("likes"),
                        rs.getInt("severity")
                    );
                    anxietyMap.computeIfAbsent(osmId, k -> new ArrayList<>()).add(data);
                    count++;
                }
                LOGGER.info("Fertig! " + count + " Anxiety Areas auf " + anxietyMap.size() + " OSM-Ways geladen.");
            }
        } catch (SQLException e) {
            LOGGER.severe("Fehler beim Laden der Anxiety-Daten: " + e.getMessage());
            e.printStackTrace();
        }
    }
}