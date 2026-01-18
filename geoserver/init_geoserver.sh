#!/bin/sh

# Load env vars
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

# Configuration
ZIP_FILE="/tmp/upload.zip"
SOURCE_DIR="/shapefile_source"
STYLE_NAME="roads_style"
STORE_NAME="roads_file"
# Note: Layer name usually matches the filename inside the zip
LAYER_NAME="roads" 
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
echo "Waiting for GeoServer at $GEOSERVER_REST_URL..."
until curl -s -u "$GEOSERVER_USER:$GEOSERVER_PASSWORD" "$GEOSERVER_REST_URL/workspaces"; do
    echo "GeoServer not ready... sleeping 5s"
    sleep 5
done
echo "GeoServer is ready."

# ---------------------------------------------------------
# 1. Create Workspace (Only if missing)
# ---------------------------------------------------------
if check_exists "$GEOSERVER_REST_URL/workspaces/$GEOSERVER_WORKSPACE"; then
    echo "Workspace '$GEOSERVER_WORKSPACE' already exists. Skipping."
else
    echo "Creating Workspace: $GEOSERVER_WORKSPACE..."
    curl -u "$GEOSERVER_USER:$GEOSERVER_PASSWORD" -XPOST -H "Content-type: text/xml" \
      -d "<workspace><name>$GEOSERVER_WORKSPACE</name></workspace>" \
      "$GEOSERVER_REST_URL/workspaces"
fi

# ---------------------------------------------------------
# 2. Upload Zip / Create Layer (Only if missing)
# ---------------------------------------------------------
# We check if the layer already exists. If yes, we assume the data is there.
if check_exists "$GEOSERVER_REST_URL/workspaces/$GEOSERVER_WORKSPACE/datastores/$STORE_NAME/featuretypes/$LAYER_NAME"; then
    echo "Layer '$LAYER_NAME' already exists. Skipping data upload."
else
    echo "Zipping shapefiles..."
    # -j: Junk paths (flat zip)
    zip -j $ZIP_FILE $SOURCE_DIR/*.shp $SOURCE_DIR/*.shx $SOURCE_DIR/*.dbf $SOURCE_DIR/*.prj

    if [ ! -f "$ZIP_FILE" ]; then
        echo "Error: Zip file creation failed."
        exit 1
    fi

    echo "Uploading Zip file (Creating Store & Layer)..."
    curl -u "$GEOSERVER_USER:$GEOSERVER_PASSWORD" -X PUT \
      -H "Content-type: application/zip" \
      --data-binary @$ZIP_FILE \
      "$GEOSERVER_REST_URL/workspaces/$GEOSERVER_WORKSPACE/datastores/$STORE_NAME/file.shp"
fi

# ---------------------------------------------------------
# 3. Upload Style (Only if missing)
# ---------------------------------------------------------
if check_exists "$GEOSERVER_REST_URL/workspaces/$GEOSERVER_WORKSPACE/styles/$STYLE_NAME"; then
    echo "Style '$STYLE_NAME' already exists. Skipping upload."
else
    echo "Uploading Style: $STYLE_NAME..."
    curl -u "$GEOSERVER_USER:$GEOSERVER_PASSWORD" -X POST \
       -H "Content-type: application/vnd.ogc.sld+xml" \
       -d @$SLD_FILE \
       "$GEOSERVER_REST_URL/workspaces/$GEOSERVER_WORKSPACE/styles?name=$STYLE_NAME"
fi

# ---------------------------------------------------------
# 4. Link Style to Layer
# ---------------------------------------------------------
# We run this every time just in case the link was broken or changed, 
# it is a fast and safe operation.
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

echo "Initialization Check Complete."