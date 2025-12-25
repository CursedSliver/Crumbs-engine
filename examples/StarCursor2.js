// Click the big cookie to grow a ring of rotating stars,
// then press a key to get cookies based on ring size.

let cursorFollowBehavior = new Crumbs.behavior(function() {
    this.x = this.scope.mouseX;
    this.y = this.scope.mouseY;
});
let cursorFollowTemplate = {
    scope: 'foreground',
    behaviors: new Crumbs.behaviorInstance(cursorFollowBehavior),
    // This time, we set a public variable, allowing access by objects and functions
    // outside of the behaviors, whilst also allowing its behaviors to access it
    // easily. We know this because the property "power" is not used by the engine.
    power: 20, 
    // Now, we set an id so that other functions can find it easily via Crumbs.findObject.
    id: 'cursorStarGen',
    components: new Crumbs.component.canvasManipulator({ function: function(m, ctx) {
        // Instead of having 8 star children, we can use this component,
        // which gives us raw control of the canvas allowing us to just draw the stars,
        // which may be more resource efficient and/or easier to implement in some cases.

        // Note that in canvasManipulator, use the m argument to access the parent object.
        const distance = m.power;
        if (distance < 10) { 
            return; 
        } 
        const starCount = 8;
        // Spin the stars around by adjusting rotation.
        m.rotation += Math.min(m.power * 0.0005, Math.PI / 2); 
        m.rotation = m.rotation % (Math.PI * 2);
        for (let i = 0; i < starCount; i++) {
            // Crumbs.h.rv rotates [0, distance] around the origin by the first argument.
            const [x, y] = Crumbs.h.rv((i / 8) * Math.PI * 2, 0, distance);
            // 16 = Pic('glint.png').width / 2,
            // offsets it so that x and y represents their center.
            ctx.drawImage(Pic('glint.png'), x - 16, y - 16); 
        }
    } })
}

const obj = Crumbs.spawn(cursorFollowTemplate);

Game.registerHook('click', function() { 
    Crumbs.findObject('cursorStarGen').power += 0.25;
    // If needed, can also store the objects in a variable to not have to find it again. 
});

// Best to use the function provided by the game to add your event listeners.
AddEvent(document, 'keydown', function(e) {
    // Expend the star ring on pressing C.
    // You can check Game.keys instead, but I don't really like it that much.
    if (e.key.toLowerCase() == 'c') {
        const amount = Crumbs.findObject('cursorStarGen').power;
        Crumbs.findObject('cursorStarGen').power = 0;
        const toGain = Game.cookiesPs * 60 * amount; // +15 sec per big cookie click.
        Game.Earn(toGain);

        // Now we spawn the popup. We can just call Crumbs.spawnCookiePopup,
        // but for clarity we will paste the relevant code below.
        // A benefit is that we can adjust the parameters of the text.
        Crumbs.spawnVisible(Crumbs.cookieClickPopup, {
            scope: 'foreground',
			'x': Crumbs.scopedCanvas.foreground.mouseX,
			'y': Crumbs.scopedCanvas.foreground.mouseY, // Equivalent to Game.mouseX and
            // Game.mouseY now, but it is best practice to access the local mouse positions
            // for the scope that the object is in,
            // so that it remains working even if the object is inside a different canvas
            // that doesn't touch the top left of the screen.
			components: [new Crumbs.component.text({
                // Try changing it! More parameters are in the documentation.
				size: 20,
				color: '#fff', 
				align: 'center',
				content: loc('+%1!', Beautify(toGain))
			})]
		});

        // We can also make it explode into a bunch of cookies.
        const count = Math.floor(10 + Math.random() * 10);
        for (let i = 0; i < count; i++) {
            const cookie = Crumbs.spawnFallingCookie(
                Crumbs.scopedCanvas.foreground.mouseX,
                Crumbs.scopedCanvas.foreground.mouseY,
                -(Math.random() * 5 + 5),
                Math.random() * 12 - 6,
                2 * Game.fps,
                'starClickCookie',
                false,
                null,
                null,
                true
            );
            cookie.scope = Crumbs.scopedCanvas.foreground;
        }
    }

    // Lastly, you can factor this to return if not equal to c to reduce nesting.
});