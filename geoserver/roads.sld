<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0"
  xmlns="http://www.opengis.net/sld"
  xmlns:ogc="http://www.opengis.net/ogc"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.0.0/StyledLayerDescriptor.xsd">
  <NamedLayer>
    <Name>edges_with_accidents</Name>
    <UserStyle>
      <Name>edges_with_accidents</Name>
      <FeatureTypeStyle>
        <Rule>
          <Name>Crash Count Buckets</Name>
          <LineSymbolizer uom="http://www.opengeospatial.org/se/units/metre">
            <Stroke>
              <CssParameter name="stroke">
                <ogc:Function name="Categorize">
                  <ogc:PropertyName>crash_count</ogc:PropertyName>

                  <ogc:Literal>#e0e0e0</ogc:Literal>
                  <ogc:Literal>5</ogc:Literal>

                  <ogc:Literal>#9e9e9e</ogc:Literal>
                  <ogc:Literal>10</ogc:Literal>

                  <ogc:Literal>#ffee58</ogc:Literal>
                  <ogc:Literal>15</ogc:Literal>

                  <ogc:Literal>#fbc02d</ogc:Literal>
                  <ogc:Literal>20</ogc:Literal>

                  <ogc:Literal>#fb8c00</ogc:Literal>
                  <ogc:Literal>25</ogc:Literal>

                  <ogc:Literal>#f4511e</ogc:Literal>
                  <ogc:Literal>30</ogc:Literal>

                  <ogc:Literal>#d32f2f</ogc:Literal>
                  <ogc:Literal>35</ogc:Literal>

                  <ogc:Literal>#b71c1c</ogc:Literal>
                  <ogc:Literal>40</ogc:Literal>

                  <ogc:Literal>#500000</ogc:Literal>
                </ogc:Function>
              </CssParameter>
              <CssParameter name="stroke-opacity">
                <ogc:Function name="Interpolate">
                  <ogc:PropertyName>crash_count</ogc:PropertyName>
                  <ogc:Literal>0</ogc:Literal>
                  <ogc:Literal>0.4</ogc:Literal>

                  <ogc:Literal>40</ogc:Literal>
                  <ogc:Literal>1.0</ogc:Literal>
                </ogc:Function>
              </CssParameter>
              <CssParameter name="stroke-width">5</CssParameter>
              <CssParameter name="stroke-linejoin">bevel</CssParameter>
              <CssParameter name="stroke-linecap">square</CssParameter>
            </Stroke>
          </LineSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>