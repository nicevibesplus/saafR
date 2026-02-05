FROM postgis/postgis:17-3.5

# GDAL und Cron installieren
RUN apt-get update && apt-get install -y gdal-bin cron && rm -rf /var/lib/apt/lists/*

# Verzeichnisse
RUN mkdir -p /postgis/cron

# Dateien kopieren
COPY cron/road_anxiety.sh /postgis/cron/road_anxiety.sh
COPY cron/road_anxiety.cron /postgis/cron/road_anxiety.cron
COPY init/07_calc_road_anxiety_match.sql /docker-entrypoint-initdb.d/07_calc_road_anxiety_match.sql

# Skript ausführbar machen
RUN chmod +x /postgis/cron/road_anxiety.sh

# Cron-Logdatei
RUN touch /var/log/cron.log

# Cronjob eintragen
RUN crontab /postgis/cron/road_anxiety.cron

# Cron im Hintergrund + Postgres als PID 1 starten
CMD ["bash", "-c", "cron && exec docker-entrypoint.sh postgres"]
