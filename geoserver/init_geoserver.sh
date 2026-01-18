#!/bin/bash

# 1. Load variables from .env if the file exists
if [ -f .env ]; then
    # 'set -a' automatically exports all variables defined in the source
    set -a
    source .env
    set +a
    echo "Loaded configuration from .env file."
fi

echo "Creating Workspace: $GEOSERVER_WORKSPACE..."
curl -u "$GEOSERVER_USER:$GEOSERVER_PASSWORD" -XPOST -H "Content-type: text/xml" \
  -d "<workspace><name>$GEOSERVER_WORKSPACE</name></workspace>" \
  "$GEOSERVER_REST_URL/workspaces"

# ... (Continue with the rest of your curl commands using $DB_HOST, etc.) ...

# 1. Create Workspace
echo "Creating Workspace: $GEOSERVER_WORKSPACE..."
curl -u "$GEOSERVER_USER:$GEOSERVER_PASSWORD" -XPOST -H "Content-type: text/xml" \
  -d "<workspace><name>$GEOSERVER_WORKSPACE</name></workspace>" \
  "$GEOSERVER_REST_URL/workspaces"

# 2. Create Data Store (Connect to PostGIS)
echo "Creating Data Store connecting to PostGIS..."
curl -u "$GEOSERVER_USER:$GEOSERVER_PASSWORD" -XPOST -H "Content-type: text/xml" \
  -d "<dataStore>
        <name>$GEOSERVER_STORE</name>
        <connectionParameters>
          <host>$POSTGIS_SERVER</host>
          <port>$POSTGIS_PORT</port>
          <database>$POSTGIS_DB</database>
          <user>$POSTGIS_USER</user>
          <passwd>$POSTGIS_PASSWORD</passwd>
          <dbtype>postgis</dbtype>
        </connectionParameters>
      </dataStore>" \
  "$GEOSERVER_REST_URL/workspaces/$GEOSERVER_WORKSPACE/datastores"

# 3. Publish the Layer
LAYER_NAME="streets"

echo "Publishing Layer: $LAYER_NAME..."
curl -u "$GEOSERVER_USER:$GEOSERVER_PASSWORD" -XPOST -H "Content-type: text/xml" \
  -d "<featureType>
        <name>$LAYER_NAME</name>
        <nativeName>$LAYER_NAME</nativeName>
        <title>Muenster Streets</title>
        <srs>EPSG:25832</srs>
      </featureType>" \
  "$GEOSERVER_REST_URL/workspaces/$GEOSERVER_WORKSPACE/datastores/$GEOSERVER_STORE/featuretypes"

echo "GeoServer configuration complete."

STYLE_NAME="streets_style"
SLD_FILE="./streets.sld"

# 4. Upload the SLD File
echo "Uploading Style: $STYLE_NAME..."

# We use the REST API to create a new style in the workspace
# Note: We use -T (transfer file) or --data-binary @file
curl -u "$GEOSERVER_USER:$GEOSERVER_PASSWORD" -X POST \
   -H "Content-type: application/vnd.ogc.sld+xml" \
   -d @$SLD_FILE \
   "$GEOSERVER_REST_URL/workspaces/$GEOSERVER_WORKSPACE/styles?name=$STYLE_NAME"

# 5. Apply the Style to the Layer
echo "Linking Style to Layer..."

# We update the layer definition to set the 'defaultStyle'
curl -u "$GEOSERVER_USER:$GEOSERVER_PASSWORD" -X PUT \
   -H "Content-type: text/xml" \
   -d "<layer>
         <defaultStyle>
           <name>$STYLE_NAME</name>
           <workspace>$GEOSERVER_WORKSPACE</workspace>
         </defaultStyle>
       </layer>" \
   "$GEOSERVER_REST_URL/workspaces/$GEOSERVER_WORKSPACE/layers/$LAYER_NAME"

echo "Style applied successfully."