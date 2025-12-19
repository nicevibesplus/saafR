/*
 * Licensed to GraphHopper GmbH ... (Header wie oben)
 */

package com.graphhopper.routing;

import com.graphhopper.config.Profile;
import com.graphhopper.routing.ev.BooleanEncodedValue;
import com.graphhopper.routing.ev.TurnRestriction;
import com.graphhopper.routing.util.EncodingManager;
import com.graphhopper.routing.weighting.DefaultTurnCostProvider;
import com.graphhopper.routing.weighting.TurnCostProvider;
import com.graphhopper.routing.weighting.Weighting;
import com.graphhopper.routing.weighting.custom.CustomWeighting;
import com.graphhopper.routing.weighting.custom.CustomWeighting2;
import com.graphhopper.routing.weighting.SafetyWeighting;
import com.graphhopper.storage.BaseGraph;
import com.graphhopper.util.CustomModel;
import com.graphhopper.util.PMap;
import com.graphhopper.util.Parameters;
import com.graphhopper.util.TurnCostsConfig;

// IMPORT FÜR DEINE KLASSE
import com.graphhopper.routing.weighting.SafetyWeighting;

import static com.graphhopper.routing.weighting.TurnCostProvider.NO_TURN_COST_PROVIDER;
import static com.graphhopper.routing.weighting.custom.CustomModelParser.createWeightingParameters;
import static com.graphhopper.util.Helper.toLowerCase;

public class DefaultWeightingFactory implements WeightingFactory {

    private final BaseGraph graph;
    private final EncodingManager encodingManager;

    public DefaultWeightingFactory(BaseGraph graph, EncodingManager encodingManager) {
        this.graph = graph;
        this.encodingManager = encodingManager;
    }

    @Override
    public Weighting createWeighting(Profile profile, PMap requestHints, boolean disableTurnCosts) {
        PMap hints = new PMap();
        hints.putAll(profile.getHints());
        hints.putAll(requestHints);

        String weightingStr = toLowerCase(profile.getWeighting());
        if (weightingStr.isEmpty())
            throw new IllegalArgumentException("You have to specify a weighting");

        Weighting weighting = null;

        // 1. ORIGINALER BLOCK FÜR CUSTOM WEIGHTING
        if (CustomWeighting.NAME.equalsIgnoreCase(weightingStr)) {
            final CustomModel queryCustomModel = requestHints.getObject(CustomModel.KEY, null);
            final CustomModel mergedCustomModel = CustomModel.merge(profile.getCustomModel(), queryCustomModel);
            if (requestHints.has(Parameters.Routing.HEADING_PENALTY))
                mergedCustomModel.setHeadingPenalty(requestHints.getDouble(Parameters.Routing.HEADING_PENALTY, Parameters.Routing.DEFAULT_HEADING_PENALTY));

            CustomWeighting.Parameters parameters = createWeightingParameters(mergedCustomModel, encodingManager);
            final TurnCostProvider turnCostProvider;
            
            if (profile.hasTurnCosts() && !disableTurnCosts) {
                BooleanEncodedValue turnRestrictionEnc = encodingManager.getTurnBooleanEncodedValue(TurnRestriction.key(profile.getName()));
                if (turnRestrictionEnc == null)
                    throw new IllegalArgumentException("Cannot find turn restriction encoded value for " + profile.getName());
                int uTurnCosts = hints.getInt(Parameters.Routing.U_TURN_COSTS, profile.getTurnCostsConfig().getUTurnCosts());
                TurnCostsConfig tcConfig = new TurnCostsConfig(profile.getTurnCostsConfig()).setUTurnCosts(uTurnCosts);
                turnCostProvider = new DefaultTurnCostProvider(turnRestrictionEnc, graph, tcConfig, parameters.getTurnPenaltyMapping());
            } else {
                turnCostProvider = NO_TURN_COST_PROVIDER;
            }

            if ("bikesafe".equals(profile.getName())) {
                // Wenn ja: Ignoriere CustomWeighting, nimm SafetyWeighting!
                return new SafetyWeighting(encodingManager, turnCostProvider, hints, graph);
            }

            if (hints.has("cm_version") && hints.getString("cm_version", "").equals("2")) {
                weighting = new CustomWeighting2(turnCostProvider, parameters);
            } else {
                weighting = new CustomWeighting(turnCostProvider, parameters);
            }

        } else if ("shortest".equalsIgnoreCase(weightingStr)) {
            throw new IllegalArgumentException("Instead of weighting=shortest use weighting=custom with a high distance_influence");
        } else if ("fastest".equalsIgnoreCase(weightingStr)) {
            throw new IllegalArgumentException("Instead of weighting=fastest use weighting=custom with a custom model that avoids road_access == DESTINATION");
        } else if ("curvature".equalsIgnoreCase(weightingStr)) {
            throw new IllegalArgumentException("The curvature weighting is no longer supported since 7.0. Use a custom " +
                    "model with the EncodedValue 'curvature' instead");
        } else if ("short_fastest".equalsIgnoreCase(weightingStr)) {
            throw new IllegalArgumentException("Instead of weighting=short_fastest use weighting=custom with a distance_influence");
        }

        if (weighting == null)
            throw new IllegalArgumentException("Weighting '" + weightingStr + "' not supported");

        return weighting;
    }
}