var Crumbs = {};

var Crumbs_Init_On_Load = function() {
	Crumbs.particleImgs = {
		light: App?this.dir+"/img.png":"https://raw.githack.com/omaruvu/Kaizo-Cookie/main/decay_light_glint.png"
	};
	Crumbs.particle = function(type, init, behaviors, behaviorParams) {
		//idk what would happen if I used the traditional class structure in here and honestly im too lazy to find out
		this.type = type;
		if (this.type == 'light') { this.img = Crumbs.particleImgs.light; } 
		else { throw 'Crumbs particle type not matching or is undefined'; }
		let initRe = init();
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
			if (typeof behaviors === 'undefined') { throw 'Crumbs particle behavior cannot be undefined'; } else { throw 'Crumbs particle behavior type '+(typeof type)+' not applicable'; } 
		}
		this.t = 0; //amount of draw ticks since its creation
		let pushed = false;
		for (let i in Crumbs.particles) {
			if (Crumbs.particles[i] === null) { this.index = i; Crumbs.particles[i] = this; pushed = true; break; }
		}
		if (!pushed) { this.index = Crumbs.particles.length; Crumbs.particles.push(this); }
		//the behavior function takes in x, y, scaleX, scaleY, rotation, as well as the number of draw ticks that has elapsed
	};
	Crumbs.particle.prototype.return = function() {
		//every draw frame, it returns instructions on how to draw the particle
		if (this.filters.hasOwnProperty('alpha')) { delete this.filters.alpha; return [this.x, this.y, this.scaleX, this.scaleY, this.rotation, this.filters.alpha, this.filters]; }
		else { return [this.x, this.y, this.scaleX, this.scaleY, this.rotation, 1, this.filters]; }
	};
	Crumbs.particle.prototype.hasSubs = function() {
		return (this.subParticles.length > 0);
	};
	Crumbs.particle.prototype.die = function() {
		Crumbs.particles[this.index] = null;
	};
	Crumbs.particle.prototype.reorder = function(at) {
		Crumbs.particles[this.index] = null;
		Crumbs.particles[at] = this;
		Crumbs.index = at;
	};
	Crumbs.particle.prototype.triggerBehavior = function() {
		for (let b in this.behaviors) {
			let e = this.behaviors[b](this.x, this.y, this.scaleX, this.scaleY, this.rotation, this.t, this.behaviorParams[b]);
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
	Crumbs.reorderAllParticles = function() {
		let counter = 0;
		for (let i in Crumbs.particles) {
			if (Crumbs.particles[i] !== null) {
				Crumbs.particles[i].reorder(counter);
				counter++;
			}
		}
		Crumbs.particles.splice(counter, Crumbs.particles.length); //ensures a complete removal
	};
	Crumbs.killAllParticles = function() {
		for (let i in Crumbs.particles) {
			Crumbs.particles[i].die();
		}
	}
	Crumbs.particlesEnabled = function() {
		return Game.prefs.particles && Crumbs.prefs.particles;
	};
	Crumbs.particleInits = {}; //inits return array containing x, y, scaleX, scaleY, and rotation
	Crumbs.particleInits.default = function() {
		return [0, 0, 1, 1, 0];
	}
	Crumbs.particleInits.bottomRandom = function() {
		return [Math.random() * l('backgroundLeftCanvas').offsetWidth, l('backgroundLeftCanvas').offsetHeight, 1, 1, 0];
	};
	Crumbs.particleBehaviors = {}; //behaviors return array containing x, y, scaleX, scaleY, rotation, then an object for any optional attributes. Return 't' to terminate the particle
	Crumbs.particleBehaviors.idle = function(x, y, sx, sy, r, t, p) {
		return [x, y, sx, sy, r];
	};
	Crumbs.particleBehaviors.rise = function(x, y, sx, sy, r, t, p) {
		if (t > 64) { return 't'; }
		let l = Math.log2(Math.max(t, 2));
		return [x, y - l, sx * (1 / l), sy * (1 / l), r]; 
	};
	
	Game.registerHook('draw', function() { if (Crumbs.particlesEnabled()) { for (let i in Crumbs.particles) { if (Crumbs.particles[i] !== null) { Crumbs.particles[i].t++; Crumbs.particles[i].triggerBehavior(); } } if (Game.drawT % 300 == 0) { Crumbs.reorderAllParticles(); } } });
	Crumbs.particles = [];
}

Game.registerMod('Crumbs engine', {
  init: Crumbs_Init_On_Load,
  save: function() { },
  load: function() { }
})
