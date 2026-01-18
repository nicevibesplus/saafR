# --- Stage 1: Build & Patch (Bleibt fast gleich) ---
FROM maven:3.9.5-eclipse-temurin-21 as build
WORKDIR /build

# 1. Clone GraphHopper v11.0
RUN git clone --branch 11.0 --depth 1 https://github.com/graphhopper/graphhopper.git .

# 2. Dependency Injection (PostgreSQL)
RUN sed -i 's|</dependencies>| \
        <dependency> \
            <groupId>org.postgresql</groupId> \
            <artifactId>postgresql</artifactId> \
            <version>42.7.2</version> \
        </dependency> \
    </dependencies>|' core/pom.xml

# 3. Source Injection (Deine Java Patches)
COPY java_patch/com /build/core/src/main/java/com

# 4. Build
RUN mvn clean package -DskipTests

# --- Stage 2: Runtime (Massiv gekürzt) ---
FROM eclipse-temurin:21-jre
ENV JAVA_OPTS "-Xmx2g -Xms2g"
WORKDIR /graphhopper

# Wir erstellen den Ordner für Daten, falls benötigt
RUN mkdir -p /data

# Wir kopieren NUR noch das JAR. Die Config kommt von außen.
COPY --from=build /build/web/target/graphhopper-web-*.jar ./graphhopper.jar

# Port freigeben
EXPOSE 8989

# ENTRYPOINT:
# Ich habe die -D Parameter entfernt!
# Grund: Wenn du eine config.yml mountest, solltest du Pfade und Mappings DORT definieren.
# Das vermeidet Verwirrung, wo was eingestellt ist.
ENTRYPOINT [ "java", "-jar", "graphhopper.jar", "server", "config.yml" ]