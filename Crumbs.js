var Crumbs = {};

var Crumbs_Init_On_Load = function() {
  decay.particleImgs = {
			light: App?this.dir+"/img.png":"https://raw.githack.com/omaruvu/Kaizo-Cookie/main/decay_light_glint.png"
		};
		decay.particle = function(type, init, behaviors, behaviorParams) {
			//idk what would happen if I used the traditional class structure in here and honestly im too lazy to find out
			this.type = type;
			if (this.type == 'light') { this.img = decay.particleImgs.light; } 
			else { throw 'Decay particle type not matching or is undefined'; }
			var initRe = init();
			this.x = initRe[0];
			this.y = initRe[1];
			this.scaleX = initRe[2];
			this.scaleY = initRe[3];
			this.rotation = initRe[4]; //euler, clockwise
			this.subParticles = [];
			this.filters = {};
			this.behaviors = [];
			if (typeof behaviorParams !== 'undefined') { this.behaviorParams = this.behaviorParams.concat(behaviorParams); } else { this.behaviorParams = [{}]; }
			if (typeof behaviors == 'function' || Array.isArray(behaviors)) { 
				this.behaviors = this.behaviors.concat(behaviors);
			} else {
				if (typeof behaviors === 'undefined') { throw 'Decay particle behavior cannot be undefined'; } else { throw 'Decay particle behavior type '+(typeof type)+' not applicable'; } 
			}
			this.t = 0; //amount of draw ticks since its creation
			var pushed = false;
			for (let i in decay.particles) {
				if (decay.particles[i] === null) { this.index = i; decay.particles[i] = this; pushed = true; break; }
			}
			if (!pushed) { this.index = decay.particles.length; decay.particles.push(this); }
			//the behavior function takes in x, y, scaleX, scaleY, rotation, as well as the number of draw ticks that has elapsed
		};
		decay.particle.prototype.return = function() {
			//every draw frame, it returns instructions on how to draw the particle
			return [this.x, this.y, this.scaleX, this.scaleY, this.rotation, this.filters];
		};
		decay.particle.prototype.hasSubs = function() {
			return (this.subParticles.length > 0);
		};
		decay.particle.prototype.die = function() {
			decay.particles[this.index] = null;
		};
		decay.particle.prototype.reorder = function(at) {
			decay.particles[this.index] = null;
			decay.particles[at] = this;
			decay.index = at;
		};
		decay.particle.prototype.triggerBehavior = function() {
			for (let b in this.behaviors) {
				var e = this.behaviors[b](this.x, this.y, this.scaleX, this.scaleY, this.rotation, this.t, this.behaviorParams[b]);
				if (e == 't') { this.die(); break; }
				if (!e) { continue; }
				this.x = e[0]; this.y = e[1]; this.scaleX = e[2]; this.scaleY = e[3]; this.rotation = e[4];
				if (e[5]) {
					var o = e[5];
					if (o.filters) {
						for (let i in o.filters) {
							this.filters[i] = o.filters[i];
						}
					}
				}
			}
		}
		decay.reorderAllParticles = function() {
			var counter = 0;
			for (let i in decay.particles) {
				if (decay.particles[i] !== null) {
					decay.particles[i].reorder(counter);
					counter++;
				}
			}
			decay.particles.splice(counter, decay.particles.length); //ensures a complete removal
		};
		decay.killAllParticles = function() {
			for (let i in decay.particles) {
				decay.particles[i].die();
			}
		}
		decay.particlesEnabled = function() {
			return Game.prefs.particles && decay.prefs.particles;
		};
		decay.particleInits = {}; //inits return array containing x, y, scaleX, scaleY, and rotation
		decay.particleInits.default = function() {
			return [0, 0, 1, 1, 0];
		}
		decay.particleInits.bottomRandom = function() {
			return [Math.random() * l('backgroundLeftCanvas').offsetWidth, l('backgroundLeftCanvas').offsetHeight, 1, 1, 0];
		};
		decay.particleBehaviors = {}; //behaviors return array containing x, y, scaleX, scaleY, rotation, then an object for any optional attributes. Return 't' to terminate the particle
		decay.particleBehaviors.idle = function(x, y, sx, sy, r, t, p) {
			return [x, y, sx, sy, r];
		};
		decay.particleBehaviors.rise = function(x, y, sx, sy, r, t, p) {
			if (t > 64) { return 't'; }
			var l = Math.log2(Math.max(t, 2));
			return [x, y - l, sx * (1 / l), sy * (1 / l), r]; 
		};
		
		Game.registerHook('draw', function() { if (decay.particlesEnabled()) { for (let i in decay.particles) { if (decay.particles[i] !== null) { decay.particles[i].t++; decay.particles[i].triggerBehavior(); } } if (Game.drawT % 300 == 0) { decay.reorderAllParticles(); } } });
		decay.particles = [];
}

Game.registerMod('Crumbs engine', {
  init: Crumbs_Init_On_Load,
  save: function() { },
  load: function() { }
})
