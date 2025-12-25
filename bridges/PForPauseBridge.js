(function() { 
    function loadBridge() {
        if (window.PForPauseCrumbsEngineBridgePresent) { return; }
        window.PForPauseCrumbsEngineBridgePresent = true;

        Crumbs.objectBehaviors.shine1.replace('Game.T', 'Game.animT');
		Crumbs.objectBehaviors.shine2.replace('Game.T', 'Game.animT');
		Crumbs.objectBehaviors.spin.replace('p.spin', 'p.spin * PForPause.timeFactor');
		Crumbs.objectBehaviors.cookieFall.replace('p.yd', 'p.yd * PForPause.timeFactor').replace('0.2 + Math.random() * 0.1', '(0.2 + Math.random() * 0.1) * PForPause.timeFactor');
		Crumbs.objectBehaviors.horizontal.replace('p.speed', 'p.speed * PForPause.timeFactor');
		Crumbs.objectBehaviors.fadeout.replace('Math.max(this.alpha - p.speed, 0)', 'Math.max(this.alpha - p.speed * PForPause.timeFactor, 0)');
		Crumbs.objectBehaviors.petDisplayMove.replace('Game.T', 'Game.animT').replace('Game.T', 'Game.animT');
		Crumbs.objectBehaviors.cookieClickPopupBehavior.replace('-= 60 / Game.fps', '-= 60 / PForPause.fFps').replace('4 * Game.fps', '4 * PForPause.fFps');
        Crumbs.objectBehaviors.cookieShowerBackground.replace('(Math.floor(Game.T*2)%512)', '(Math.floor(Game.animT*2)%512)');
        Crumbs.objectBehaviors.seasonalShowerBackground.replace('(Math.floor(Game.T*2)%512)', '(Math.floor(Game.animT*2)%512)');
        eval('Crumbs.cursorDraw=' + Crumbs.cursorDraw.toString().replace(/Game\.T(?![A-Za-z0-9_])/g, 'Game.animT'));
		Crumbs.findObject('cursors').getComponent('canvasManipulator').function = Crumbs.cursorDraw;

        window.PForPauseCrumbsEngineBridgeLoaded = true;
        CrumbsEngineModObj.declareBridgeLoaded();
    }

    if (window.CrumbsEngineModObj.coreReady && window.PForPause) { 
        loadBridge(); 
    } else {
        const interval = setInterval(() => { 
            if (window.CrumbsEngineModObj.coreReady && window.PForPause) {
                loadBridge();
                clearInterval(interval);
            }
        }, 100);
    }
})()