(function () {
    window.saafr = window.saafr || {};
    window.saafr.state = window.saafr.state || {};

    window.saafr.state.createStore = function () {
        return {
            map: null,
            base: {
                cartoLight: null,
                cartoDark: null,
                active: null,
                darkMode: false
            },
            layers: {
                accidents: null,
                anxietyZones: null,
                roadNetwork: null
            },
            ui: {
                popupsEnabled: true
            },
            route: {
                layer: null
            }
        };
    };
})();
