(function () {
    window.saafr = window.saafr || {};
    window.saafr.ui = window.saafr.ui || {};

    window.saafr.ui.initMobileGuards = function () {
        if (window.saafrTouchInit) return;

        document.body.style.overscrollBehavior = "none";
        window.saafrLastTouchEnd = 0;

        document.addEventListener("touchend", function (e) {
            const now = Date.now();
            if (now - window.saafrLastTouchEnd <= 300) {
                e.preventDefault();
            }
            window.saafrLastTouchEnd = now;
        }, false);

        window.saafrTouchInit = true;
    };
})();
