// Makes the big cookie produce very rudimentary glitchy effects on hover

// First, we find the place to inject the code.
const bigCookieDisplay = Crumbs.findObject('bigCookie').findChild('bigCookieDisplay');

// Next, we add a component that changes the globalCompositeOperation. 
// This component will need to be set later by something else.
bigCookieDisplay.addComponent(new Crumbs.component.settings({ globalCompositeOperation: 'source-over' }));

// Here, we add a component that lets us detect whether the
// mouse is hovering over the big cookie.
bigCookieDisplay.addComponent(new Crumbs.component.pointerInteractive({
    boundingType: 'oval',
    onMouseout: function() {
        let settings = this.getComponent('settings');
        if (!settings) { return; }
        
        // Resets the settings if the mouse leaves the area
        // Note: access them with .obj, but create them without it.
        settings.obj.globalCompositeOperation = 'source-over';
    }
    // It can do more than detect hovering, but
    // we won't need it here.
}));

// Always use function() { }, no arrow functions
const glitchBehavior = new Crumbs.behavior(function() {
    // Use .getComponent to get a specific component on the object.
    let hoverComponent = this.getComponent('pointerInteractive');
    if (!hoverComponent) { return; }

    if (hoverComponent.hovered) {
        // If player is hovering over it, set glitch effects
        let settings = this.getComponent('settings');
        if (!settings) { return; }

        console.log(settings.obj.globalCompositeOperation);
        const glitchMap = [
            'source-in',
            'source-atop',
            'lighter',
            'xor',
            'multiply',
            'screen',
            'overlay',
            'darken',
            'lighten',
            'color-dodge',
            'color-burn',
            'hard-light',
            'soft-light',
            'difference',
            'exclusion',
            'hue',
            'saturation',
            'color',
            'luminosity'
        ];
        // choose() is not a native function, but rather a function provided 
        // in the game as a helper.
        settings.obj.globalCompositeOperation = choose(glitchMap);
    }
});
bigCookieDisplay.addBehavior(glitchBehavior);
// To do this to your own custom objects, simply include them in the components field of the template or customization.