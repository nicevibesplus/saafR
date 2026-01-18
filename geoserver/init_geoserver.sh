#!/bin/sh

# Load env vars
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi


STYLE_NAME="roads_style"
STORE_NAME="postgis_store"   # Name of the connection in GeoServer
LAYER_NAME="roads"           # Name of the layer in GeoServer
TABLE_NAME="roads"           # Actual table name in PostGIS
SLD_FILE="/roads.sld"

# Helper function to check HTTP status
check_exists() {
    url=$1
    status=$(curl -s -o /dev/null -w "%{http_code}" -u "$GEOSERVER_USER:$GEOSERVER_PASSWORD" "$url")
    if [ "$status" -eq 200 ]; then
        return 0 # Exists (True)
    else
        return 1 # Does not exist (False)
    fi
}

# ---------------------------------------------------------
# 0. Wait for GeoServer
# ---------------------------------------------------------
echo ""
echo "Waiting for GeoServer at $GEOSERVER_REST_URL..."
until curl -s -u "$GEOSERVER_USER:$GEOSERVER_PASSWORD" "$GEOSERVER_REST_URL/workspaces"; do
    echo ""
    echo "GeoServer not ready... sleeping 5s"
    sleep 5
done
echo ""
echo "GeoServer is ready."

# ---------------------------------------------------------
# 1. Create Workspace (Only if missing)
# ---------------------------------------------------------
if check_exists "$GEOSERVER_REST_URL/workspaces/$GEOSERVER_WORKSPACE"; then
    echo ""
    echo "Workspace '$GEOSERVER_WORKSPACE' already exists. Skipping."
else
    echo ""
    echo "Creating Workspace: $GEOSERVER_WORKSPACE..."
    curl -u "$GEOSERVER_USER:$GEOSERVER_PASSWORD" -XPOST -H "Content-type: text/xml" \
      -d "<workspace><name>$GEOSERVER_WORKSPACE</name></workspace>" \
      "$GEOSERVER_REST_URL/workspaces"
fi

# ---------------------------------------------------------
# 2. Create PostGIS DataStore (Connection to DB)
# ---------------------------------------------------------
if check_exists "$GEOSERVER_REST_URL/workspaces/$GEOSERVER_WORKSPACE/datastores/$STORE_NAME"; then
    echo ""
    echo "DataStore '$STORE_NAME' already exists. Skipping connection setup."
else
    echo ""
    echo "Creating PostGIS DataStore: $STORE_NAME..."

    # XML payload to connect to PostGIS
    DATASTORE_XML="<dataStore>
      <name>$GEOSERVER_STORE</name>
      <connectionParameters>
        <entry key=\"host\">$POSTGRES_SERVER</entry>
        <entry key=\"port\">$POSTGRES_PORT</entry>
        <entry key=\"database\">$POSTGRES_DB</entry>
        <entry key=\"user\">$POSTGRES_USER</entry>
        <entry key=\"passwd\">$POSTGRES_PASSWORD</entry>
        <entry key=\"dbtype\">postgis</entry>
        <entry key=\"Expose primary keys\">true</entry>
      </connectionParameters>
    </dataStore>"

    curl -u "$GEOSERVER_USER:$GEOSERVER_PASSWORD" -X POST \
      -H "Content-type: text/xml" \
      -d "$DATASTORE_XML" \
      "$GEOSERVER_REST_URL/workspaces/$GEOSERVER_WORKSPACE/datastores"
fi

# ---------------------------------------------------------
# 3. Publish Layer (FeatureType) from Table
# ---------------------------------------------------------
if check_exists "$GEOSERVER_REST_URL/workspaces/$GEOSERVER_WORKSPACE/datastores/$STORE_NAME/featuretypes/$LAYER_NAME"; then
    echo ""
    echo "Layer '$LAYER_NAME' already exists. Skipping publishing."
else
    echo ""
    echo "Publishing PostGIS Table '$TABLE_NAME' as Layer '$LAYER_NAME'..."

    FEATURETYPE_XML="<featureType>
      <name>$LAYER_NAME</name>
      <nativeName>$TABLE_NAME</nativeName>
      <title>Roads Network</title>
      <srs>EPSG:4326</srs>
    </featureType>"

    curl -u "$GEOSERVER_USER:$GEOSERVER_PASSWORD" -X POST \
      -H "Content-type: text/xml" \
      -d "$FEATURETYPE_XML" \
      "$GEOSERVER_REST_URL/workspaces/$GEOSERVER_WORKSPACE/datastores/$STORE_NAME/featuretypes"
fi

# ---------------------------------------------------------
# 4. Upload Style (Only if missing)
# ---------------------------------------------------------
if check_exists "$GEOSERVER_REST_URL/workspaces/$GEOSERVER_WORKSPACE/styles/$STYLE_NAME"; then
    echo ""
    echo "Style '$STYLE_NAME' already exists. Skipping upload."
else
    echo ""
    echo "Uploading Style: $STYLE_NAME..."
    curl -u "$GEOSERVER_USER:$GEOSERVER_PASSWORD" -X POST \
       -H "Content-type: application/vnd.ogc.sld+xml" \
       -d @$SLD_FILE \
       "$GEOSERVER_REST_URL/workspaces/$GEOSERVER_WORKSPACE/styles?name=$STYLE_NAME"
fi

# ---------------------------------------------------------
# 5. Link Style to Layer
# ---------------------------------------------------------
echo ""
echo "Ensuring Layer '$LAYER_NAME' uses style '$STYLE_NAME'..."
curl -u "$GEOSERVER_USER:$GEOSERVER_PASSWORD" -X PUT \
   -H "Content-type: text/xml" \
   -d "<layer>
         <defaultStyle>
           <name>$STYLE_NAME</name>
           <workspace>$GEOSERVER_WORKSPACE</workspace>
         </defaultStyle>
       </layer>" \
   "$GEOSERVER_REST_URL/workspaces/$GEOSERVER_WORKSPACE/layers/$LAYER_NAME"

echo ""
echo "Initialization Check Complete."