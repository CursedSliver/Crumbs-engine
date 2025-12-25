// 8 stars as child objects orbit around the cursor with offset and a rotation

let cursorFollowBehavior = new Crumbs.behavior(function() {
    this.x = this.scope.mouseX;
    this.y = this.scope.mouseY;
});
let cursorFollowTemplate = {
    scope: 'foreground',
    // Note: CANNOT BE ARROW FUNCTIONS, because you cannot rebind arrow functions. 
    // Using them here will break as the this keyword no longer refer to the correct thing.
    behaviors: new Crumbs.behaviorInstance(cursorFollowBehavior)
}

// Same here, using an arrow function here breaks the code (often silently).
let starBehavior = new Crumbs.behavior(function(p) {
    this.rotation += p.speed;
// You can try varying the speed here after its creation, but if something else need to change it
// at runtime you probably should put the speed property into the main object
// instead of in these, as these variables are effectively private to this behavior.
// example: putting p.speed += 0.1 / 4 / Game.fps; 
// will speed up the rotation over time, 
// but only possible in this behavior function.
}, { speed: Math.PI * 2 / 4 / Game.fps });

let starTemplate = {
    imgs: ['glint.png'],
    offsetX: 0,
    rotation: 0
}

const obj = Crumbs.spawn(cursorFollowTemplate);
for (let i = 0; i < 8; i++) {
    obj.spawnChild(starTemplate, {
        // Here speed is set to be the same as the default, but you can vary it at creation
        behaviors: new Crumbs.behaviorInstance(starBehavior, { speed: Math.PI * 2 / 4 / Game.fps }), 
        rotation: Math.PI * 2 / 8 * i,
        offsetX: 100 // Can vary this too to achieve different distances
    });
}