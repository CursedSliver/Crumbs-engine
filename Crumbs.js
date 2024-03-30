var Crumbs = {};

var Crumbs_Init_On_Load = function() {
	Crumbs.prefs = {
		particles: {
			left: 1,
			middle: 1,
			right: 1,
			all: 1
		}
	}
	Crumbs.particleImgs = {
		
	};
	Crumbs.particle = function(obj) {
		//idk what would happen if I used the traditional class structure in here and honestly im too lazy to find out
		if (typeof obj === 'undefined') { obj = {}; }
		if (typeof obj !== 'object') { throw 'Crumbs.particle constructor parameter must be an object or undefined.'; }
		this.scope = obj.scope?obj.scope:Crumbs.particleDefaults.scope;
		if (!(this.scope == 'left' || this.scope == 'middle' || this.scope == 'right' || this.scope == 'all')) { throw 'Crumbs particle type not matching or is undefined';  } 
		if (Crumbs.particleImgs.hasOwnProperty(obj.img)) { this.img = Crumbs.particleImgs[obj.img]; } else { this.img = obj.img?obj.img:Crumbs.particleDefaults.img; }
		this.id = obj.id?obj.id:Crumbs.particleDefaults.id;
		let initRe = null;
		if (typeof init === 'function') {
			initRe = init();  
		} else if (typeof init === 'object') {
			initRe = init;
		} else if (typeof init === 'undefined') {
			this.initRe = Crumbs.particleDefaults.init;
		} else { throw 'Crumbs particle init type not applicable. Applicable types include: function, object, undefined'; }
		this.x = initRe.x;
		this.y = initRe.y;
		this.scaleX = initRe.scaleX;
		this.scaleY = initRe.scaleY;
		this.rotation = initRe.rotation; //euler, clockwise
		this.subParticles = [];
		this.filters = {};
		this.behaviors = [];
		if (typeof obj.behaviorParams !== 'undefined') { this.behaviorParams = this.behaviorParams.concat(obj.behaviorParams); } else { this.behaviorParams = [{}]; }
		if (typeof obj.behaviors == 'function' || Array.isArray(obj.behaviors)) { 
			this.behaviors = this.behaviors.concat(obj.behaviors);
		} else {
			if (typeof behaviors === 'undefined') { this.behaviors = Crumbs.particleDefaults.behaviors; } else { throw 'Crumbs particle behavior not applicable. Applicable types include: function, array, undefined'; } 
		}
		this.t = 0; //amount of draw ticks since its creation
		let pushed = false;
		for (let i in Crumbs.particles) {
			if (Crumbs.particles[this.scope][i] === null) { this.index = i; Crumbs.particles[this.scope][i] = this; pushed = true; break; }
		}
		if (!pushed) { this.index = Crumbs.particles[this.scope].length; Crumbs.particles[this.scope].push(this); }
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
		Crumbs.particles[this.scope][this.index] = null;
	};
	Crumbs.particle.prototype.reorder = function(at) {
		Crumbs.particles[this.scope][this.index] = null;
		Crumbs.particles[this.scope][at] = this;
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
		for (let i in Crumbs.particles) {
			let counter = 0;
			for (let ii in Crumbs.particles[i]) {
				if (Crumbs.particles[i][ii] !== null) {
					Crumbs.particles[i][ii].reorder(counter);
					counter++;
				}
			}
			Crumbs.particles.splice(counter, Crumbs.particles[i].length); 
		}
	};
	Crumbs.killAllParticles = function() {
		for (let i in Crumbs.particles) {
			for (let ii in Crumbs.particles[i]) { Crumbs.particles[i][ii].die(); }
		}
	};
	Crumbs.particlesEnabled = function(scope) {
		return Crumbs.prefs.particles[scope];
	};
	Crumbs.findParticle = function(id, scope) {
		if (scope) {
			for (let i in Crumbs.particles[scope]) {
				if (Crumbs.particles[scope][i].id == id) {
					return Crumbs.particles[scope][i];
				}
			}
		} else {
			for (let i in Crumbs.particles) {
				for (let ii in Crumbs.particles[ii]) {
					if (Crumbs.particles[i][ii].id == id) {
						return Crumbs.particles[i][ii];
					}
				}
			}
		}
	};
	Crumbs.getParticles = function(id, scopes) {
		let toReturn = [];
		if (scopes) {
			if (!Array.isArray(scopes)) { scopes = [scopes]; }
			for (let i in scopes) {
				for (let ii in Crumbs.particles[scopes[i]]) {
					if (Crumbs.particles[scopes[i]][ii].id == id) {
						toReturn.push(Crumbs.particles[scopes[i]][ii]);
					}
				}
			}
		} else {
			for (let i in Crumbs.particles) {
				for (let ii in Crumbs.particles[ii]) {
					if (Crumbs.particles[i][ii].id == id) {
						toReturn.push(Crumbs.particles[i][ii]);
					}
				}
			}
		}
		return toReturn;
	};
	
	Crumbs.particleInits = {}; //inits return array containing x, y, scaleX, scaleY, and rotation
	Crumbs.particleInits.default = function() {
		return {x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0};
	};
	Crumbs.particleInits.bottomRandom = function() {
		return {x: Math.random() * l('backgroundLeftCanvas').offsetWidth, y: l('backgroundLeftCanvas').offsetHeight, scaleX: 1, scaleY: 1, rotation: 0};
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

	Crumbs.particleDefaults = {
		img: '',
		scope: 'all',
		init: Crumbs.particleInits.default,
		behaviors: Crumbs.particleBehaviors.idle,
		id: '',
		behaviorParams: {}
	}; //needs to be down here for some reason
	
	Game.registerHook('draw', function() { if (Crumbs.particlesEnabled()) { 
		for (let i in Crumbs.particles) { 
			for (let ii in Crumbs.particles[i]) {
				if (Crumbs.particles[i][ii] !== null) { Crumbs.particles[i][ii].t++; Crumbs.particles[i][ii].triggerBehavior(); }
			} 
		} 
		if (Game.drawT % 300 == 0) { Crumbs.reorderAllParticles(); } } 
	});
	Crumbs.particles = {
		left: [],
		middle: [],
		right: [],
		all: []
	};
}

Game.registerMod('Crumbs engine', {
  init: Crumbs_Init_On_Load,
  save: function() { },
  load: function() { }
})
