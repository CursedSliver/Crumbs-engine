// Makes wrinklers and their particles tiny

// To do this, we need to look into how wrinklers work. 
// Crumbs engine reworks all canvas-based elements into Crumbs objects, 
// and so the code for wrinklers are in Implementation.js, 
// which is bundled with the mod.

// From the code we see that the wrinklers' scaleX and scaleY are constantly set
// by their behavior functions, so just setting that won't work.
// We need to replace that code with our own code.

// Here we get the behavior that does it.
const sizeSettingBehavior = Crumbs.objectBehaviors.wrinklerMovement; // Type: Crumbs.behavior

// Now we use the .replace function to replace code.
sizeSettingBehavior
    .replace('this.scaleX = sw / 100;', 'this.scaleX = sw / 200;')
    .replace('this.scaleY = sh / 200;', 'this.scaleY = sh / 400;');

// Now the behavior will run the new code we have replace some 
// of the old code with, which will make them smaller.
// As well, you can do Crumbs.findObject('w') to check the new scaleX and scaleY.

const particleGeneratingBehavior = Crumbs.objectBehaviors.wrinklerParticles; 
// Now we also make the cookie particles that come out of them smaller.
particleGeneratingBehavior
    .replace('Crumbs.spawnFallingCookie', 'const cookie = Crumbs.spawnFallingCookie')
    .inject(5, 'cookie.scaleX *= 0.5; cookie.scaleY *= 0.5;'); 
// Injects into a new line before the line specified in a 0-indexed function, 
// where line 0 is usually the function declaration.

// Lastly, lets make the big cookie small too.
// This can be done by simply setting scaleX and scaleY, as 
// the big cookie root object does not constantly reset its scale.
Crumbs.findObject('bigCookie').scaleX *= 0.5;
Crumbs.findObject('bigCookie').scaleY *= 0.5;
// You find the id of the objects by looking at the code that declares the object.