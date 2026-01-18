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
          <LineSymbolizer>
            <Stroke>
              <CssParameter name="stroke">
                <ogc:Function name="Categorize">
                  <ogc:PropertyName>crash_count</ogc:PropertyName>

                  <ogc:Literal>#1a9641</ogc:Literal>
                  <ogc:Literal>5</ogc:Literal>

                  <ogc:Literal>#56b055</ogc:Literal>
                  <ogc:Literal>10</ogc:Literal>

                  <ogc:Literal>#92cb69</ogc:Literal>
                  <ogc:Literal>15</ogc:Literal>

                  <ogc:Literal>#cce67d</ogc:Literal>
                  <ogc:Literal>20</ogc:Literal>

                  <ogc:Literal>#ffffbf</ogc:Literal>
                  <ogc:Literal>25</ogc:Literal>

                  <ogc:Literal>#fed586</ogc:Literal>
                  <ogc:Literal>30</ogc:Literal>

                  <ogc:Literal>#fdae61</ogc:Literal>
                  <ogc:Literal>35</ogc:Literal>

                  <ogc:Literal>#f46d43</ogc:Literal>
                  <ogc:Literal>40</ogc:Literal>

                  <ogc:Literal>#d53e4f</ogc:Literal>
                  <ogc:Literal>45</ogc:Literal>

                  <ogc:Literal>#d7191c</ogc:Literal>

                </ogc:Function>
              </CssParameter>
              <CssParameter name="stroke-width">1</CssParameter>
              <CssParameter name="stroke-linejoin">bevel</CssParameter>
              <CssParameter name="stroke-linecap">square</CssParameter>
            </Stroke>
          </LineSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>