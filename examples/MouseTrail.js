// Generates a disappearing trail following the mouse

// Note: CANNOT BE ARROW FUNCTIONS, because you cannot rebind arrow functions. 
// Using them here will break as the this keyword no longer refer to the correct thing.
let mouseFollowerBehavior = new Crumbs.behavior(function() {
    // Called each frame.
    // The this keyword here refers to the object the behavior is on.
    this.scaleX *= 0.95; 
    this.scaleY *= 0.95;
    this.y -= 2;
    // Uncomment above to have it rise up.
    if (this.scaleX < 0.01) { this.die(); } // If too small to see, destroy object
});
let mouseFollowerTemplate = {
    imgs: ['goldCookie.png'], // can be whatever you want
    behaviors: new Crumbs.behaviorInstance(mouseFollowerBehavior),
    scaleX: 0.25,
    scaleY: 0.25 
}

Game.registerHook('logic', function() {
    // Logic hooks will be called once per frame.
    Crumbs.spawn(mouseFollowerTemplate, {
        // Additional properties setting or overriding default
        // properties specified in the template.
        x: Game.mouseX,
        y: Game.mouseY,
        rotation: Math.random() * Math.PI * 2
        // You can also put scaleX and scaleY here, 
        // which will override the defaults of 0.25
        // specified in the template.
    });
});