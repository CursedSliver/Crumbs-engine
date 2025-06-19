//8 stars as child objects orbit around the cursor with offset and a rotation

let cursorFollowTemplate = {
    scope: 'foreground',
    behaviors: new Crumbs.behavior(function() {
        this.x = this.scope.mouseX;
        this.y = this.scope.mouseY;
    })
}

let starBehavior = new Crumbs.behavior(function(p) {
    this.rotation += p.speed;
}, { speed: Math.PI * 2 / 4 / Game.fps });

let starTemplate = {
    imgs: ['glint.png'],
    components: [new Crumbs.component.settings({ globalCompositeOperation: 'lighter' })],
    offsetX: 0,
    rotation: 0
}

const obj = Crumbs.spawn(cursorFollowTemplate);
for (let i = 0; i < 8; i++) {
    obj.spawnChild(starTemplate, {
        behaviors: new Crumbs.behaviorInstance(starBehavior, { speed: Math.PI * 2 / 4 / Game.fps }), //here speed is set to be the same as the default, but you can vary it
        rotation: Math.PI * 2 / 8 * i,
        offsetX: 100 //can vary this too to achieve different distances
    });
}