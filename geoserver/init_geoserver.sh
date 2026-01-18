#!/bin/sh
# (Note: Using /bin/sh for Alpine compatibility)

# Load env vars
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

# Configuration
ZIP_FILE="/tmp/upload.zip"
SOURCE_DIR="/shapefile_source"

# ---------------------------------------------------------
# 0. Wait for GeoServer
# ---------------------------------------------------------
echo "Waiting for GeoServer at $GEOSERVER_REST_URL..."
until curl -s -u "$GEOSERVER_USER:$GEOSERVER_PASSWORD" "$GEOSERVER_REST_URL/workspaces"; do
    echo "GeoServer not ready... sleeping 5s"
    sleep 5
done
echo "GeoServer is ready."

# ---------------------------------------------------------
# 1. Prepare the Zip File
# ---------------------------------------------------------
echo "Zipping shapefiles..."
# -j: Junk paths (stores files at the root of the zip, no subfolders)
zip -j $ZIP_FILE $SOURCE_DIR/*.shp $SOURCE_DIR/*.shx $SOURCE_DIR/*.dbf $SOURCE_DIR/*.prj

if [ ! -f "$ZIP_FILE" ]; then
    echo "Error: Failed to create zip file. Check if files exist in $SOURCE_DIR"
    exit 1
fi

# ---------------------------------------------------------
# 2. Create Workspace
# ---------------------------------------------------------
echo "Creating Workspace: $GEOSERVER_WORKSPACE..."
curl -u "$GEOSERVER_USER:$GEOSERVER_PASSWORD" -XPOST -H "Content-type: text/xml" \
  -d "<workspace><name>$GEOSERVER_WORKSPACE</name></workspace>" \
  "$GEOSERVER_REST_URL/workspaces"

# ---------------------------------------------------------
# 3. Upload Zip (Creates Store + Publishes Layer)
# ---------------------------------------------------------
STORE_NAME="roads_file"
echo "Uploading Zip file..."

# The PUT method to 'file.shp' automatically creates the store and layer
curl -u "$GEOSERVER_USER:$GEOSERVER_PASSWORD" -X PUT \
  -H "Content-type: application/zip" \
  --data-binary @$ZIP_FILE \
  "$GEOSERVER_REST_URL/workspaces/$GEOSERVER_WORKSPACE/datastores/$STORE_NAME/file.shp"

echo "Layer published."

# ---------------------------------------------------------
# 4. Apply Style
# ---------------------------------------------------------
STYLE_NAME="roads_style"
SLD_FILE="/roads.sld"
# Note: The layer name defaults to the filename inside the zip (e.g., 'roads')
LAYER_NAME="roads" 

echo "Uploading Style: $STYLE_NAME..."
curl -u "$GEOSERVER_USER:$GEOSERVER_PASSWORD" -X POST \
   -H "Content-type: application/vnd.ogc.sld+xml" \
   -d @$SLD_FILE \
   "$GEOSERVER_REST_URL/workspaces/$GEOSERVER_WORKSPACE/styles?name=$STYLE_NAME"

echo "Linking Style to Layer: $LAYER_NAME..."
curl -u "$GEOSERVER_USER:$GEOSERVER_PASSWORD" -X PUT \
   -H "Content-type: text/xml" \
   -d "<layer>
         <defaultStyle>
           <name>$STYLE_NAME</name>
           <workspace>$GEOSERVER_WORKSPACE</workspace>
         </defaultStyle>
       </layer>" \
   "$GEOSERVER_REST_URL/workspaces/$GEOSERVER_WORKSPACE/layers/$LAYER_NAME"

echo "Configuration Complete!"