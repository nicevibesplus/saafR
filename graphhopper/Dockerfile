# --- Stage 1: Build & Patch ---
FROM maven:3.9.5-eclipse-temurin-21 as build
WORKDIR /build

# CLONE VERSION 11.0
RUN git clone --branch 11.0 --depth 1 https://github.com/graphhopper/graphhopper.git .

COPY custom/CrashCountParser.java core/src/main/java/com/graphhopper/routing/util/parsers/CrashCountParser.java
COPY custom/CrashCount.java core/src/main/java/com/graphhopper/routing/ev/CrashCount.java
COPY custom/CustomImportRegistry.java core/src/main/java/com/graphhopper/routing/ev/CustomImportRegistry.java
COPY custom/crashes.json core/src/main/resources/com/graphhopper/custom_models/crashes.json

# Patch the server to use your custom class
RUN sed -i 's/new DefaultImportRegistry()/new CustomImportRegistry()/g' \
    core/src/main/java/com/graphhopper/GraphHopper.java

# Build
RUN mvn clean install -DskipTests

# --- Stage 2: Runtime ---
FROM eclipse-temurin:21-jre
ENV JAVA_OPTS "-Xmx2g -Xms2g"
WORKDIR /graphhopper
RUN mkdir -p /data

COPY --from=build /build/web/target/graphhopper*.jar ./graphhopper.jar
COPY --from=build /build/config-example.yml ./config.yml

# Allow external access
RUN sed -i 's/^ *bind_host: localhost/bind_host: 0.0.0.0/' config.yml

VOLUME [ "/data" ]
EXPOSE 8989 8990

ENTRYPOINT [ "java", "-Ddw.graphhopper.datareader.file=data.osm.pbf", "-jar", "graphhopper.jar", "server", "config.yml" ]