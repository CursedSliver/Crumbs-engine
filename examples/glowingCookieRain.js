// Perpetual performance-efficient storm of glowing cookies in the background

// First, we need to create the glowing cookie sprite.
// Crumbs engine allows you to manipulate an image in the loader
// and create a new composite image out of css filters and other canvas actions.

// Before loading this make sure that icons.png is loaded by having particles on and at least 
// a few hundred CpS.

// We increase the scale of the image so that the glow will develop a gradient.
Crumbs.manipImage('icons.png', 'basicCookie.png', 240, 240, '', function(ctx, image, c) {
    // NOTE: will NOT work on Safari and older browsers

    // Crop the image to only include the cookie sprite we want.
    // Here I'm going to use the base cookie sprite at [10, 0], 
    // but you can use something else.
    
    // Each sprite in icons.png is 48x48.
    const [sx, sy] = [10 * 48, 0 * 48];

    // Create base glow.
    ctx.filter = 'blur(25px) contrast(160%) brightness(300%)';
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 1;
    ctx.drawImage(image, sx, sy, 48, 48, 0, 0, c.width, c.height);

    // Composite base image on top of the glow
    ctx.filter = 'none';
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.drawImage(image, sx, sy, 48, 48, 0, 0, c.width, c.height);

    // Rudimentary bloom layer
    ctx.filter = 'blur(35px) contrast(160%) brightness(300%)';
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.25;
    ctx.drawImage(image, sx, sy, 48, 48, 0, 0, c.width, c.height);
});

Crumbs.manipImage('icons.png', 'basicCookie2.png', 240, 240, '', function(ctx, image, c) {
    // Let's also make a blue version.
    const [sx, sy] = [10 * 48, 0 * 48];

    // Create base glow.
    ctx.filter = 'blur(25px) contrast(160%) brightness(300%) hue-rotate(180deg)';
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 1;
    ctx.drawImage(image, sx, sy, 48, 48, 0, 0, c.width, c.height);

    // Composite base image on top of the glow
    ctx.filter = 'none';
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.drawImage(image, sx, sy, 48, 48, 0, 0, c.width, c.height);

    // Rudimentary bloom layer
    ctx.filter = 'blur(35px) contrast(160%) brightness(300%) hue-rotate(180deg)';
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.25;
    ctx.drawImage(image, sx, sy, 48, 48, 0, 0, c.width, c.height);
});

// Now we create the cookie rain.
// Below, we have a way to do it with normal objects commented out
/*
let rainCookieInit = function() {
    this.x = Math.random() * this.scope.l.width;
    this.y = -40 - 80 * Math.random();
};
let rainCookieBehavior = new Crumbs.behavior(function(p) {
    this.x += p.xd / Game.fps;
    this.y += p.yd / Game.fps;
    p.yd += p.ydd / Game.fps;
    if (Crumbs.t - this.t > 1000 || this.y > this.scope.l.height + 100) { 
        this.die(); 
        return; 
    }
}, { xd: 0, yd: 0, ydd: 0 });
let rainCookie = {
    imgs: ['basicCookie.png', 'basicCookie2.png'],
    scope: 'background',
    init: rainCookieInit,
    scaleX: 0.2,
    scaleY: 0.2,
    order: 10 // So that it would be displayed in front of the background
}
Game.registerHook('logic', function() {
    Crumbs.spawnVisible(rainCookie, { // so that the game doesnt get clogged while not visible
        behaviors: new Crumbs.behaviorInstance(rainCookieBehavior, {
            xd: 10 + (Math.random() * 1),
            yd: 250,
            ydd: 25
        }),
        imgUsing: Math.floor(Math.random() * 2),
        rotation: Math.random() * Math.PI * 2
    });
});*/

// However, there's a more performant way to do it, with Crumbs.particle.

let rainCookieInit = function() {
    // We must do this since it's a particle.
    this.xd = 10 + (Math.random() * 1);
    this.yd = 250;
    this.ydd = 25;
};
let rainCookieReusePool = Crumbs.newReusePool(); // Saves performance for high freq particles
let rainCookieBehavior = function() {
    this.x += this.xd / Game.fps;
    this.y += this.yd / Game.fps;
    this.yd += this.ydd / Game.fps;
}
let rainCookie = {
    width: 30,
    height: 30,
    img: 'basicCookie.png',
    life: 5 * Game.fps,
    init: rainCookieInit,
    behavior: rainCookieBehavior,
    reusePool: rainCookieReusePool
};
let rainCookie2 = {
    width: 30,
    height: 30,
    img: 'basicCookie2.png',
    life: 5 * Game.fps,
    init: rainCookieInit,
    behavior: rainCookieBehavior,
    reusePool: rainCookieReusePool
};
Game.registerHook('logic', function() {
    for (let i = 0; i < 2; i++) {
        Crumbs.spawnParticle(choose([rainCookie, rainCookie2]), 
            Math.random() * Crumbs.scopedCanvas.background.l.width, 
            -40 - 80 * Math.random(), 
            Math.random() * Math.PI * 2,
            1,
            'background'
        );
    }
});