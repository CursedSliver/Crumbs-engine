if (typeof Crumbs !== 'object') { var Crumbs = {}; }

var Crumbs_Init_On_Load = function() {
	Crumbs.prefs = {
		particles: {
			left: 1,
			middle: 1,
			right: 1,
			all: 1,
			background: 1
		}
	}
	Crumbs.particleImgs = {
		glint: 'glint.png'
	};
	Crumbs.getCanvasByScope = function(s) {
		let targetL = '';
		if (s == 'left') { targetL = 'backgroundLeftCanvas'; } 
		else if (s == 'background') { targetL = 'backgroundCanvas'; }
		else if (s == 'foreground') { }
		else if (s == 'middle') { }
		else if (s == 'right') { }
		return l(targetL);
	} 
	Crumbs.validScopes = ['left', 'middle', 'right', 'foreground', 'background'];
	Crumbs.particle = function(obj, parent) {
		//idk what would happen if I used the traditional class structure in here and honestly im too lazy to find out
		if (typeof obj === 'undefined') { obj = {}; }
		if (typeof obj !== 'object') { throw 'Crumbs.particle constructor parameter must be an object or undefined.'; }
		this.parent = parent?parent:null;
		this.scope = obj.scope?obj.scope:Crumbs.particleDefaults.scope;
		if (!Crumbs.validScopes.includes(this.scope)) { throw 'Crumbs particle type not matching. Must be one of the strings denoting a scope, or undefined';  } 
		if (Crumbs.particleImgs.hasOwnProperty(obj.img)) { this.img = Crumbs.particleImgs[obj.img]; } else { this.img = obj.img?obj.img:Crumbs.particleDefaults.img; }
		this.id = obj.id?obj.id:Crumbs.particleDefaults.id;
		this.order = obj.order?obj.order:Crumbs.particleDefaults.order;
		let initRe = null;
		if (typeof init === 'function') {
			initRe = init(Crumbs.getCanvasByScope(this.scope));  
		} else if (typeof init === 'object') {
			initRe = init;
		} else if (typeof init === 'undefined') {
			initRe = Crumbs.particleDefaults.init(Crumbs.getCanvasByScope(this.scope));
		} else { throw 'Crumbs particle init type not applicable. Applicable types include: function, object, undefined'; }
		this.x = initRe.x;
		this.y = initRe.y;
		this.scaleX = initRe.scaleX;
		this.scaleY = initRe.scaleY;
		this.rotation = initRe.rotation; //euler, clockwise
		this.children = [];
		this.canvaCenter = [0, 0]; //[x, y], for if it is a child
		this.scaleFactor = [1, 1]; //[x, y], for if it is a child
		this.filters = {};
		this.behaviors = [];
		if (typeof obj.behaviorParams !== 'undefined') { this.behaviorParams = this.behaviorParams.concat(obj.behaviorParams); } else { this.behaviorParams = [{}]; }
		if (typeof obj.behaviors == 'function' || Array.isArray(obj.behaviors)) { 
			this.behaviors = this.behaviors.concat(obj.behaviors);
		} else {
			if (typeof behaviors === 'undefined') { this.behaviors = Crumbs.particleDefaults.behaviors; } else { throw 'Crumbs particle behavior not applicable. Applicable types include: function, array, undefined'; } 
		}
		this.t = 0; //amount of draw ticks since its creation
		if (this.parent === null) {
			let pushed = false;
			for (let i in Crumbs.particles) {
				if (Crumbs.particles[this.scope][i] === null) { this.index = i; Crumbs.particles[this.scope][i] = this; pushed = true; break; }
			}
			if (!pushed) { this.index = Crumbs.particles[this.scope].length; Crumbs.particles[this.scope].push(this); }
		} else {
			let pushed = false;
			for (let i in this.parent.children) {
				if (this.parent.children[i] === null) { this.index = i; this.parent.children[i] = this; pushed = true; break; }
			}
			if (!pushed) { this.index = this.parent.children.length; this.parent.children.push(this); }
		}
		//the behavior function takes in x, y, scaleX, scaleY, rotation, as well as the number of draw ticks that has elapsed
	};
	Crumbs.particles = {
		left: [],
		middle: [],
		right: [],
		all: [],
		background: []
	};
	Crumbs.particle.prototype.getInfo = function() {
		return this; 
	};
	Crumbs.particle.prototype.die = function() {
		if (this.parent) { this.parent.removeChild(this.index) }
		else { Crumbs.particles[this.scope][this.index] = null; }
	};
	Crumbs.particle.prototype.spawnChild = function(obj) {
		new Crumbs.particle(obj, this);
	};
	Crumbs.particle.prototype.hasChildren = function() {
		return (this.children.length > 0);
	};
	Crumbs.particle.prototype.removeChild = function(index) {
		this.children[index] = null; //unlike with root level particles, children arrays are not cleaned every 3600 draw ticks, so please use them wisely.
	};
	Crumbs.particle.prototype.reorder = function(at) {
		Crumbs.particles[this.scope][this.index] = null;
		Crumbs.particles[this.scope][at] = this;
		Crumbs.index = at;
	};
	Crumbs.particle.prototype.triggerBehavior = function() {
		for (let b in this.behaviors) {
			let e = this.behaviors[b](this.getInfo(), this.behaviorParams[b]);
			if (e == 't') { this.die(); break; }
			if (!e) { continue; }
			this.x = e.x?e.x:this.x; 
			this.y = e.y?e.y:this.y; 
			this.scaleX = e.scaleX?e.scaleX:this.scaleX; 
			this.scaleY = e.scaleY?e.scaleY:this.scaleY; 
			this.rotation = e.rotation?e.rotation:this.rotation;
			this.behaviorParams[b] = e.newParam?e.newParam:this.behaviorParams[b];
			if (e.filters) {
				for (let i in e.filters) {
					this.filters[i] = e.filters[i];
				}
			}
		}
	};
	Crumbs.particle.prototype.updateChildren = function() {
		if (this.parent !== null) {
			this.canvaCenter = [this.parent.x + this.parent.canvaCenter[0], this.parent.y + this.parent.canvaCenter[1]];
			this.scaleFactor = [this.parent.scaleX * this.parent.scaleFactor[0], this.parent.scaleY * this.parent.scaleFactor[1]];
		}
		for (let i in this.children) {
			this.children[i].t++;
			this.children[i].triggerBehavior();
			this.children[i].updateChildren();
		}
	};
	Crumbs.particle.prototype.findChild = function(id) {
		for (let i in this.children) { 
			if (this.children[i] !== null) {
				if (this.children[i].id === id) {
					return this.children[i];
				} else {
					let cd = this.children[i].findChild(id);
					if (cd !== null) { return cd; }
				}
			}
		}
		return null;
	};
	Crumbs.particle.prototype.getChildren = function(id) {
		let toReturn = [];
		for (let i in this.children) {
			if (this.children[i] !== null) {
				if (this.children[i].id === id) {
					toReturn.push(this.children[i]);
				} else {
					toReturn.concat(this.children[i].getChildren(id)); 
				}
			}
		}
		return toReturn;
	};
	Crumbs.reorderAllParticles = function() {
		for (let i in Crumbs.particles) {
			let counter = 0;
			for (let ii in Crumbs.particles[i]) {
				if (Crumbs.particles[i][ii] !== null) {
					Crumbs.particles[i][ii].reorder(counter);
					counter++;
				}
			}
			Crumbs.particles[i].splice(counter, Crumbs.particles[i].length); 
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
	Crumbs.updateParticles = function() { //called every draw frame
		for (let i in Crumbs.particles) { 
			if (Crumbs.particlesEnabled(i)) {
				for (let ii in Crumbs.particles[i]) {
					if (Crumbs.particles[i][ii] !== null) { Crumbs.particles[i][ii].t++; Crumbs.particles[i][ii].triggerBehavior(); Crumbs.particles[i][ii].updateChildren(); }
				} 
			}
		} 
		if (Game.drawT % 3600 == 0) { Crumbs.reorderAllParticles(); } 
	};
	
	Crumbs.findParticle = function(id, scope) {
		if (scope) {
			for (let i in Crumbs.particles[scope]) {
				if (Crumbs.particles[scope][i] !== null && Crumbs.particles[scope][i].id == id) {
					return Crumbs.particles[scope][i];
				}
			}
		} else {
			for (let i in Crumbs.particles) {
				for (let ii in Crumbs.particles[i]) {
					if (Crumbs.particles[i][ii] !== null && Crumbs.particles[i][ii].id == id) {
						return Crumbs.particles[i][ii];
					}
				}
			}
		}
		return null;
	};
	Crumbs.getParticles = function(id, scopes) {
		let toReturn = [];
		if (scopes) {
			if (!Array.isArray(scopes)) { scopes = [scopes]; }
			for (let i in scopes) {
				for (let ii in Crumbs.particles[scopes[i]]) {
					if (Crumbs.particles[scopes[i]][ii] !== null && Crumbs.particles[scopes[i]][ii].id == id) {
						toReturn.push(Crumbs.particles[scopes[i]][ii]);
					}
				}
			}
		} else {
			for (let i in Crumbs.particles) {
				for (let ii in Crumbs.particles[i]) {
					if (Crumbs.particles[i][ii] !== null && Crumbs.particles[i][ii].id == id) {
						toReturn.push(Crumbs.particles[i][ii]);
					}
				}
			}
		}
		return toReturn;
	};
	Crumbs.globalSearch = function(id) { //searches through all fields for all particles of a given id; not recommended for regular use
		let toReturn = [];
		for (let i in Crumbs.particles) {
			for (let ii in Crumbs.particles[i]) {
				if (Crumbs.particles[i][ii] !== null) {
					if (Crumbs.particles[i][ii].id == id) {
						toReturn.push(Crumbs.particles[i][ii]);
					}
					toReturn.concat(Crumbs.particles[i][ii].getChildren(id));
				}
			}
		}
		return toReturn;
	};
	
	Crumbs.particleInits = {}; //inits return array containing x, y, scaleX, scaleY, and rotation, and takes in one variable for scope
	Crumbs.particleInits.default = function(s) {
		return {x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0};
	};
	Crumbs.particleInits.bottomRandom = function(c) {
		return {x: Math.random() * c.offsetWidth, y: c.offsetHeight, scaleX: 1, scaleY: 1, rotation: 0};
	};
	Crumbs.particleBehaviors = {}; //behaviors return object to modify stuff. Return 't' to terminate the particle
	/*
 	what it can return:
  	x, y, scaleX, scaleY, rotation: self explanatory
   	filter: an object containing all the CSS filters
	newChild: an object or an array containing objects for spawning children
 	newParam: an object to replace the original params for this behavior
  	*/
	Crumbs.particleBehaviors.idle = function(o, p) {
		return {};
	};
	Crumbs.particleBehaviors.rise = function(o, p) {
		if (o.t > 64) { return 't'; }
		let l = Math.log2(Math.max(o.t, 2));
		return {y: o.y - l, scaleX: o.scaleX * (1 / l), scaleY: o.scaleY * (1 / l)}; 
	};

	Crumbs.particleDefaults = {
		img: '',
		scope: 'foreground',
		init: Crumbs.particleInits.default,
		behaviors: Crumbs.particleBehaviors.idle,
		id: '',
		order: 0,
		behaviorParams: {}
	}; //needs to be down here for some reason
	
	Game.registerHook('draw', Crumbs.updateParticles);

	//below for the actual drawing
	let div = document.createElement('canvas');
	div.id = 'foregroundCanvas'; div.style = 'background: none;';
	l('game').appendChild(div);

	Crumbs.compileParticles = function(s) {
		let arr = []; //each entry is an object, which in this case includes all childrens, sorted by the order variable
		for (let i in Crumbs.particles[s]) {
			arr = Crumbs.merge(arr, Crumbs.particles[s][i].compile());
		}
		return arr;
	};
	Crumbs.particle.prototype.compile = function() {
		let arr = [];
		arr.push(this);
		for (let i in this.children) {
			arr = Crumbs.merge(arr, this.children[i].compile());
		}
		return arr;
	};
	Crumbs.merge = function(arr1, arr2) {
		//merges two particles arrays together sorting based on order
		let mergedArray = [];
    	let i = 0;
    	let j = 0;	
	
	    while (i < arr1.length && j < arr2.length) {
	        if (arr1[i].order < arr2[j].order) {
	            mergedArray.push(arr1[i]);
	            i++;
	        } else {
	            mergedArray.push(arr2[j]);
	            j++;
	        }
	    }
	    while (i < arr1.length) {
	        mergedArray.push(arr1[i]);
	        i++;
	    }
	    while (j < arr2.length) {
	        mergedArray.push(arr2[j]);
	        j++;
	    }
	
	    return mergedArray;
	};
}

Game.registerMod('Crumbs engine', {
  init: Crumbs_Init_On_Load,
  save: function() { },
  load: function() { }
})
