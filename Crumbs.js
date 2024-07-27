if (typeof Crumbs !== 'object') { var Crumbs = {}; }

if (typeof gamePause === 'undefined') { Game.LoadMod(`https://glander.club/asjs/qdNgUW9y`); }
var CrumbsEngineLoaded = false;
const Crumbs_Init_On_Load = function() {
	Crumbs.h = {};
	Crumbs.h.CSSInjects = [];
	Crumbs.h.injectCSS = function(str) {
		Crumbs.h.CSSInjects.push(str);
	} //h stands for helper
	Crumbs.h.resolveInjects = function() {
		if (!Crumbs.h.CSSInjects.length) { return; }
		let str = '';
		for (let i in Crumbs.h.CSSInjects) { str += Crumbs.h.CSSInjects[i] + '\n'; }
		let style = document.createElement('style');
		style.textContent = str;
		l('game').appendChild(style);
	}
	Crumbs.h.inRect = function(x, y, rect) {
		//w -> width, h -> height, r -> rotation, x -> x origin, y -> y origin
		const dx = x+Math.sin(-rect.r)*(-(rect.h/2-rect.x));
		const dy = y+Math.cos(-rect.r)*(-(rect.h/2-rect.y));
		const h1 = Math.sqrt(dx*dx + dy*dy);
		const currA = Math.atan2(dy,dx);
		const newA = currA - rect.r;
		const x2 = Math.cos(newA) * h1;
		const y2 = Math.sin(newA) * h1;
		if (x2 > -0.5 * rect.w && x2 < 0.5 * rect.w && y2 > -0.5 * rect.h && y2 < 0.5 * rect.h) return true;
		return false;
	}
	Crumbs.h.rv = function(r, x, y) {
		//rotates the given vector by "r"
		const c = Math.cos(-r);
		const s = Math.sin(-r);
		return [
			x * c - y * s,
			x * s + y * c
		];
	}
	Crumbs.h.rebuildBigCookieButton = function() {
		l('bigCookie').remove();
		var bigCookie = document.createElement('button');
		bigCookie.id = 'bigCookie';
		l('cookieAnchor').appendChild(bigCookie);
		if (Game.touchEvents) {
			AddEvent(bigCookie,'touchend',Game.ClickCookie);
			AddEvent(bigCookie,'touchstart',function(event){ Game.BigCookieState=1; if (event) event.preventDefault();});
			AddEvent(bigCookie,'touchend',function(event){ Game.BigCookieState=0; if (event) event.preventDefault();});
		} else {
			AddEvent(bigCookie,'click',Game.ClickCookie);
			AddEvent(bigCookie,'mousedown',function(event){ Game.BigCookieState=1; if (Game.prefs.cookiesound) {Game.playCookieClickSound();}if (event) event.preventDefault();});
			AddEvent(bigCookie,'mouseup',function(event){ Game.BigCookieState=2; if (event) event.preventDefault();});
			AddEvent(bigCookie,'mouseout',function(event){ Game.BigCookieState=0; });
			AddEvent(bigCookie,'mouseover',function(event){ Game.BigCookieState=2; });
		}
	}
	
	Crumbs.prefs = {
		objects: {
			left: 1,
			middle: 1,
			right: 1,
			foreground: 1,
			background: 1
		},
		anchorDisplay: 0
	}
	Crumbs.objectImgs = {
		none: 'img/empty.png',
		empty: 'img/empty.png',
		rect: 'https://rawcdn.githack.com/CursedSliver/Crumbs-engine/0be326d47cad9241c0d073c8468c18ae464c4563/imgs/White_Pixel_1x1.jpg',
		glint: 'img/glint.png',
		icons: 'img/icons.png',
		dollar: 'img/smallDollars.png',
		wrinklerBits: 'img/wrinklerBits.png',
		shinyWrinklerBits: 'img/shinyWrinklerBits.png'
	};
	Crumbs.validScopes = ['left', 'middle', 'right', 'foreground', 'background'];
	Crumbs.validAnchors = ['center', 'top-left', 'top', 'top-right', 'right', 'bottom-right', 'bottom', 'bottom-left', 'left'];
	Crumbs.settings = {
		globalCompositeOperation: 'source-over',
		imageSmoothingEnabled: true,
		imageSmoothingQuality: 'low'
	};
	Crumbs.object = function(obj, parent) {
		//idk what would happen if I used the traditional class structure in here and honestly im too lazy to find out
		if (typeof obj === 'undefined') { obj = {}; }
		if (typeof obj !== 'object') { throw 'Crumbs.object constructor parameter must be an object or undefined.'; }
		//stuff: enabled, parent, scope, imgs, imgUsing, id, order, x, y, behaviors, alpha, width, height, offsetX, offsetY, scaleX, scaleY, noDraw, children, noRotate
		for (let i in Crumbs.objectDefaults) {
			this[i] = Crumbs.objectDefaults[i];
		}
		for (let i in obj) {
			this[i] = obj[i];
		}
		if (parent) { this.parent = parent; }
		
		if (!Crumbs.validScopes.includes(this.scope)) { throw 'Crumbs object type not matching. Must be one of the strings denoting a scope, or undefined';  } 
		if (Crumbs.objectImgs.hasOwnProperty(this.imgs)) { this.imgs = Crumbs.objectImgs[this.imgs]; }
		if (typeof this.imgs === 'function') { this.imgs = this.imgs(); }
		this.imgs = [].concat(this.imgs);
		for (let i in this.imgs) {
			if (Crumbs.objectImgs.hasOwnProperty(this.imgs[i])) {
				this.imgs[i] = Crumbs.objectImgs[this.imgs[i]];
			}
		}
		
		//rotation is clockwise
		if (!Crumbs.validAnchors.includes(this.anchor)) { throw '"'+obj.anchor+'" is not a valid anchor!"'; }
		
		this.components = [].concat(this.components);
		this.behaviors = [].concat(this.behaviors);
		for (let i in this.behaviors) {
			if (this.behaviors[i] instanceof Crumbs.behavior) { this.behaviors[i] = new Crumbs.behaviorInstance(this.behaviors[i]); }
			else if (this.behaviors[i] instanceof Crumbs.behaviorInstance) { continue; }
			else if (typeof this.behaviors[i] === 'function') { const b = new Crumbs.behavior(this.behaviors[i]); this.behaviors[i] = new Crumbs.behaviorInstance(b); }
			else { throw 'Object behavior must be an instance of Crumbs.behavior, Crumbs.behaviorInstance, or is a function!'; }
		}
		
		this.t = 0; //amount of draw ticks since its creation
		this.canvaCenter = [0, 0]; //[x, y], for if it is a child
		this.scaleFactor = [1, 1]; //[x, y], for if it is a child
		this.rotationAdd = 0; //for if it is a child
		
		this.children = [].concat(this.children);
		for (let i in this.children) {
			this.spawnChild(this.children[i]);
		}

		if (typeof this.init === 'function') {
			this.init.call(this, Crumbs.getCanvasByScope(this.scope));  
		} else if (typeof this.init === 'object') {
			this.set(this.init);
		} else { throw 'Crumbs object init type not applicable. Applicable types include: function, object, undefined'; }
		
		if (this.parent === null) {
			let pushed = false;
			for (let i in Crumbs.objects[this.scope]) {
				if (Crumbs.objects[this.scope][i] === null) { this.index = i; Crumbs.objects[this.scope][i] = this; pushed = true; break; }
			}
			if (!pushed) { this.index = Crumbs.objects[this.scope].length; Crumbs.objects[this.scope].push(this); }
		} else {
			let pushed = false;
			for (let i in this.parent.children) {
				if (this.parent.children[i] === null) { this.index = i; this.parent.children[i] = this; pushed = true; break; }
			}
			if (!pushed) { this.index = this.parent.children.length; this.parent.children.push(this); }
		}
		this.updateChildren();
	};
	Crumbs.behavior = function(func, init) {
		this.f = func;
		this.init = init;
	};
	Crumbs.behaviorInstance = function(b, init) {
		this.f = null;
		if (typeof b === 'object') { 
			this.f = b.f;
			const bb = typeof b.init;
			if (bb === 'object') {
				for (let i in b.init) { this[i] = b.init[i]; }
			} 
			if (bb === 'function') {
				b.init.call(this);
			}
		} else { this.f = b; }
		const t = typeof init;
		if (t === 'object') {
			for (let i in init) { this[i] = init[i]; }
		}
		if (t === 'function') {
			init.call(this);
		}
	}
	Crumbs.nonQuickSettable = ['newChild', 'behaviorParams', 'settings', 'components', 'children'];
	Crumbs.nonValidProperties = ['scope', 'behaviors', 'init'];
	Crumbs.allProperties = ['x', 'y', 'scaleX', 'scaleY', 'rotation', 'alpha', 'id', 'init', 'order', 'imgs', 'imgUsing', 'behaviorParams', 'scope', 'behaviors', 'width', 'height', 'sx', 'sy', 'newChild', 'anchor', 'offsetX', 'offsetY', 'components', 'enabled', 'children', 'noDraw'];
	Crumbs.objectDefaults = {
		enabled: true,
		parent: null,
		x: 0,
		y: 0,
		scaleX: 1,
		scaleY: 1,
		rotation: 0,
		alpha: 1,
		imgs: Crumbs.objectImgs.empty,
		imgUsing: 0,
		scope: 'foreground',
		anchor: 'center',
		init: null, //Crumbs.objectInits.default, set after it is initialized
		behaviors: null, //Crumbs.objectBehaviors.idle, set after it is initialized
		id: null,
		order: 0,
		behaviorParams: {},
		width: null,
		height: null,
		offsetX: 0,
		offsetY: 0,
		sx: 0,
		sy: 0,
		noRotate: false,
		components: [],
		noDraw: false,
		children: []
	}; //needs to be down here for some reason
	Crumbs.object.prototype.set = function(o) {
		for (let i in o) {
			if (!Crumbs.nonQuickSettable.includes(i) && !Crumbs.nonValidProperties.includes(i)) { this[i] = o[i]; } 
			else if (Crumbs.nonValidProperties.includes(i)) { throw 'Cannot set particle property "'+i+'"!'; }
			else if (!Crumbs.allProperties.includes(i)) { throw 'Unrecognized particle property: "'+i+'"!'; }
		}
		if (o.newChild) {
			let childsToSpawn = [].concat(o.newChild); //light bulb moment
			for (let i in childsToSpawn) {
				this.spawnChild(childsToSpawn[i]);
			}
		}
	};
	Crumbs.objects = {
		left: [],
		middle: [],
		right: [],
		foreground: [],
		background: []
	};
	Crumbs.object.prototype.getInfo = function() {
		return this; 
	};
	Crumbs.object.prototype.die = function() {
		if (this.parent) { this.parent.removeChild(this.index) }
		else { Crumbs.objects[this.scope][this.index] = null; }
	};
	Crumbs.object.prototype.spawnChild = function(obj) {
		if (Game.visible && Crumbs.lastUpdate + Crumbs.sleepDetectionBuffer >= Date.now()) {
			return new Crumbs.object(obj, this);
		}
	};
	Crumbs.object.prototype.hasChildren = function() {
		return (this.children.length > 0);
	};
	Crumbs.object.prototype.removeChild = function(index) {
		this.children[index] = null; //unlike with root level particles, children arrays are not cleaned every 3600 draw ticks, so please use them wisely.
	};
	Crumbs.object.prototype.addComponent = function(comp) {
		for (let i in this.components) {
			if (this.components[i].type == comp.type) {
				throw 'One object cannot have two components of the type "'+comp.type+'"!';
			}
		}
		this.components.push(comp);
	};
	Crumbs.object.prototype.removeComponent = function(type) {
		for (let i in this.components) {
			if (this.components[i].type == type) {
				return this.components.splice(i, 1);
			}
		}
		return false;
	};
	Crumbs.object.prototype.getComponent = function(type) {
		for (let i in this.components) {
			if (this.components[i].type == type) {
				return this.components[i];
			}
		}
		return false;
	};
	Crumbs.object.prototype.reorder = function(at) {
		Crumbs.objects[this.scope][this.index] = null;
		Crumbs.objects[this.scope][at] = this;
		Crumbs.index = at;
	};
	Crumbs.object.prototype.triggerBehavior = function() {
		for (let i in this.components) {
			if (this.components[i].enabled) { this.components[i].logic(this); }
		}
		for (let b in this.behaviors) {
			let e = this.behaviors[b].f.call(this.getInfo(), this.behaviors[b]);
			if (e == 't') { this.die(); break; }
		}
	};
	Crumbs.object.prototype.updateChildren = function() {
		if (this.parent !== null) {
			this.rotationAdd = this.parent.rotation + this.parent.rotationAdd;
			let m = Crumbs.h.rv(this.rotationAdd, this.parent.offsetX, this.parent.offsetY);
			this.canvaCenter = [m[0] + this.parent.x + this.parent.canvaCenter[0], -m[1] + this.parent.y + this.parent.canvaCenter[1]];
			this.scaleFactor = [this.parent.scaleX * this.parent.scaleFactor[0], this.parent.scaleY * this.parent.scaleFactor[1]];
		}
		for (let i in this.children) {
			if (this.children[i] !== null) {
				this.children[i].t++;
				this.children[i].updateChildren();
				this.children[i].triggerBehavior();
			}
		}
	};
	Crumbs.object.prototype.findChild = function(id) {
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
	Crumbs.object.prototype.getChildren = function(id) {
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
	Crumbs.reorderAllObjects = function() {
		for (let i in Crumbs.objects) {
			let counter = 0;
			for (let ii in Crumbs.objects[i]) {
				if (Crumbs.objects[i][ii] !== null) {
					Crumbs.objects[i][ii].reorder(counter);
					counter++;
				}
			}
			Crumbs.objects[i].splice(counter, Crumbs.objects[i].length); 
		}
	};
	Crumbs.killAllObjects = function() {
		for (let i in Crumbs.objects) {
			for (let ii in Crumbs.objects[i]) { if (Crumbs.objects[i][ii] !== null) { Crumbs.objects[i][ii].die(); } }
		}
	};
	Crumbs.objectsEnabled = function(scope) {
		return Crumbs.prefs.objects[scope];
	};
	Crumbs.lastUpdate = Date.now();
	Crumbs.updateObjects = function() { //called every draw frame
		if (typeof gamePause !== 'undefined' && gamePause) { return; } //p for pause support
		for (let i in Crumbs.objects) { 
			if (Crumbs.objectsEnabled(i)) {
				for (let ii in Crumbs.objects[i]) {
					if (Crumbs.objects[i][ii] !== null) { Crumbs.objects[i][ii].t++; Crumbs.objects[i][ii].updateChildren(); Crumbs.objects[i][ii].triggerBehavior(); }
				} 
			}
		} 
		Crumbs.lastUpdate = Date.now();
		if (Game.drawT % 3600 == 0) { Crumbs.reorderAllObjects(); } 
	};

	Crumbs.spawn = function(obj) {
		if (Crumbs.lastUpdate + Crumbs.sleepDetectionBuffer < Date.now() || !Game.visible) { return false; } 
		return new Crumbs.object(obj);
	};
	Crumbs.sleepDetectionBuffer = 1000 * (30 / Game.fps); //equal to 30 draw frames
	
	Crumbs.findObject = function(id, scope) {
		if (scope) {
			for (let i in Crumbs.objects[scope]) {
				if (Crumbs.objects[scope][i] !== null && Crumbs.objects[scope][i].id == id) {
					return Crumbs.objects[scope][i];
				}
			}
		} else {
			for (let i in Crumbs.objects) {
				for (let ii in Crumbs.objects[i]) {
					if (Crumbs.objects[i][ii] !== null && Crumbs.objects[i][ii].id == id) {
						return Crumbs.objects[i][ii];
					}
				}
			}
		}
		return null;
	};
	Crumbs.getObjects = function(id, scopes) {
		let toReturn = [];
		if (scopes) {
			if (!Array.isArray(scopes)) { scopes = [scopes]; }
			for (let i in scopes) {
				for (let ii in Crumbs.objects[scopes[i]]) {
					if (Crumbs.objects[scopes[i]][ii] !== null && Crumbs.objects[scopes[i]][ii].id == id) {
						toReturn.push(Crumbs.objects[scopes[i]][ii]);
					}
				}
			}
		} else {
			for (let i in Crumbs.objects) {
				for (let ii in Crumbs.objects[i]) {
					if (Crumbs.objects[i][ii] !== null && Crumbs.objects[i][ii].id == id) {
						toReturn.push(Crumbs.objects[i][ii]);
					}
				}
			}
		}
		return toReturn;
	};
	Crumbs.globalSearch = function(id) { //searches through all fields for all objects of a given id; not recommended for regular use
		let toReturn = [];
		for (let i in Crumbs.objects) {
			for (let ii in Crumbs.objects[i]) {
				if (Crumbs.objects[i][ii] === null) { continue; }
				
				if (Crumbs.objects[i][ii].id == id) {
					toReturn.push(Crumbs.objects[i][ii]);
				}
				toReturn.concat(Crumbs.objects[i][ii].getChildren(id));
			}
		}
		return toReturn;
	};
	
	Crumbs.objectInits = {}; //inits return array containing x, y, scaleX, scaleY, and rotation, and takes in one variable for scope
	Crumbs.objectInits.default = function(c) { };
	Crumbs.objectDefaults.init = Crumbs.objectInits.default;
	Crumbs.objectInits.bottomRandom = function(c) {
		this.x = Math.random() * c.canvas.parentNode.offsetWidth;
		this.y = c.canvas.parentNode.offsetHeight;
	};
	Crumbs.objectInits.topRandom = function(c) {
		this.x = Math.random() * c.canvas.parentNode.offsetWidth;
	};
	Crumbs.objectInits.totalRandom = function(c) {
		this.x = Math.random() * c.canvas.parentNode.offsetWidth;
		this.y = Math.random() * c.canvas.parentNode.offsetHeight;
	};
	Crumbs.objectInits.center = function(c) {
		this.x = c.canvas.parentNode.offsetWidth / 2;
		this.y = c.canvas.parentNode.offsetHeight / 2;
	};
	Crumbs.objectInits.bigCookie = function(c) {
		this.x = c.canvas.parentNode.offsetWidth / 2;
		this.y = c.canvas.parentNode.offsetHeight * 0.4;
	};
	Crumbs.objectBehaviors = {}; //behaviors return object to modify stuff. Return 't' to terminate the particle
	/*
 	what it can return:
  	x, y, scaleX, scaleY, rotation: self explanatory
    alpha: opacity
   	filter: an object containing all the CSS filters
	text: an object containing text parameters
	imgs: a new array of the images
 	imgUsing: the img frame selected
	newChild: an object or an array containing objects for spawning children
 	behaviorParams: an object to replace the original params for this behavior
  	*/
	Crumbs.objectBehaviors.idle = function(p) { };
	Crumbs.objectDefaults.behaviors = [Crumbs.objectBehaviors.idle];
	Crumbs.objectBehaviors.fly = new Crumbs.behavior(function(p) {
		//parameters: 'direction', which is direction to fly to in radians; can be a function, in which case it tries to pass through o
		//'speed', which is the amount of pixels traveled per draw tick; can be a function, in which case it tries to pass through o
		this.x += Math.sin(p.direction) * p.speed;
		this.y += Math.cos(p.direction) * p.speed;
	}, { direction: 0, speed: 1 });
	Crumbs.objectBehaviors.cycleFrames = new Crumbs.behavior(function(p) {
		//parameters: 'cooldown', which is the amount of draw ticks to wait for between each frame switch; can be a function, in which case it tries to pass through o
		//'back' (default false), which is boolean telling it to cycle forwards or backwards
		let frame = this.imgUsing;
		if (this.t % p.cooldown == 0) { if (p.back) { frame--; if (frame < 0) { frame = this.imgs.length; } } else { frame++; if (frame >= this.imgs.length) { frame = 0; } } }
		this.imgUsing = frame;
	}, { cooldown: 1 });
	Crumbs.objectBehaviors.fade = new Crumbs.behavior(function(p) {
		//parameters: 'speed', which is the amount of alpha decreased (multiplicative) each draw frame
		this.alpha *= 1 - p.speed;
	}, { speed: 0.05 });
	Crumbs.objectBehaviors.fadeout = new Crumbs.behavior(function(p) {
		//fade but not multiplicative
		//parameters: 'speed', which is the amount of alpha decreased each draw frame
		this.alpha = Math.max(this.alpha - p.speed, 0);
	}, { speed: 0.05 });
	Crumbs.objectBehaviors.spin = new Crumbs.behavior(function(p) {
		//parameters: 'spin', which is the amount of radians rotated each draw frame, negative for counterclockwise; can be a function, in which case it tries to pass through o
		this.rotation += p.spin;
	}, { spin: 0.312 });
	Crumbs.objectBehaviors.cookieFall = new Crumbs.behavior(function(p) {
		//the exact same code that orteil uses to simulate cookie falling
		//parameters: 'yd', which you can give a starting value but you better not modify
		this.y += p.yd;
		p.yd += 0.2 + Math.random() * 0.1;
	}, { yd: 0 });
	Crumbs.objectBehaviors.horizontal = new Crumbs.behavior(function(p) {
		//a simplified version of particleBehaviors.fly that only supports having one value in params ('speed') that makes it go horizontal or vertical
		//mainly used to support orteil old code
		this.x += p.speed;
	}, { speed: 0 });
	Crumbs.objectBehaviors.expireAfter = new Crumbs.behavior(function(p) {
		//parameters: 't', which is the amount of draw frames to do before it dies
		//if p.time is undefined, it essentially never expires
		if (this.t >= p.t) { return 't'; } else { return {}; }
	}, { t: 1e21 });
	Crumbs.objectBehaviors.centerOnBigCookie = new Crumbs.behavior(function() { this.x = Crumbs.getCanvasByScope(this.scope).canvas.parentNode.offsetWidth / 2; this.y = Crumbs.getCanvasByScope(this.scope).canvas.parentNode.offsetHeight * 0.4; });

	Crumbs.component = {};
	Crumbs.defaultComp = {};

	Crumbs.component.rect = function(obj) {
		for (let i in Crumbs.defaultComp.rect) {
			this[i] = Crumbs.defaultComp.rect[i];
		}
		for (let i in obj) {
			this[i] = obj[i];
		}

		this.type = 'rect';
	};
	Crumbs.defaultComp.rect = {
		enabled: true,
		color: '#fff',
		outline: 0,
		outlineColor: '#000'
	};
	Crumbs.component.rect.prototype.enable = function() {
		this.enabled = true;
	};
	Crumbs.component.rect.prototype.disable = function() {
		this.enabled = false;
	};
	Crumbs.component.rect.prototype.logic = function(m) {
	};
	Crumbs.component.rect.prototype.preDraw = function(m, ctx) {
		ctx.fillStyle = this.color;
		ctx.lineWidth = this.outline;
		ctx.strokeStyle = this.outlineColor;
	};
	Crumbs.component.rect.prototype.postDraw = function(m, ctx, pWidth, pHeight) {
		pWidth *= m.width / Pic(m.imgs[m.imgUsing]).width;
		pHeight *= m.height / Pic(m.imgs[m.imgUsing]).height;
		ctx.fillRect(-Crumbs.getOffsetX(m.anchor, pWidth) + m.offsetX, -Crumbs.getOffsetY(m.anchor, pHeight) + m.offsetY, pWidth, pHeight);
		if (this.outline) {
			ctx.strokeRect(-Crumbs.getOffsetX(m.anchor, pWidth) + m.offsetX, -Crumbs.getOffsetY(m.anchor, pHeight) + m.offsetY, pWidth, pHeight);
		}
	};

	Crumbs.component.path = function(obj) { //the main purpose of this is because me lazy
		for (let i in Crumbs.defaultComp.path) {
			this[i] = Crumbs.defaultComp.path[i];
		}
		for (let i in obj) {
			this[i] = obj[i];
		}
		
		this.paths = [].concat(this.paths); 

		this.type = 'path';
	};
	Crumbs.defaultComp.path = {
		enabled: true,
		paths: [],
		cx: 0,
		cy: 0
	};
	Crumbs.component.path.prototype.enable = function() {
		this.enabled = true;
	};
	Crumbs.component.path.prototype.disable = function() {
		this.enabled = false;
	};
	Crumbs.component.path.prototype.logic = function() {
		return {};
	};
	Crumbs.component.path.prototype.preDraw = function(m, ctx) {
		ctx.lineWidth = Crumbs.defaultPathConfigs.lineWidth;
		ctx.strokeStyle = Crumbs.defaultPathConfigs.strokeStyle;
		ctx.lineCap = Crumbs.defaultPathConfigs.lineCap;
		ctx.lineJoin = Crumbs.defaultPathConfigs.lineJoin;
		ctx.miterLimit = Crumbs.defaultPathConfigs.miterLimit;
		ctx.lineDashOffset = Crumbs.defaultPathConfigs.lineDashOffset;
		ctx.setLineDash(Crumbs.defaultPathConfigs.lineDash);
		return {};
	};
	Crumbs.component.path.prototype.postDraw = function(m, ctx) {
		ctx.beginPath();
		ctx.moveTo(0, 0);
		
		for (let i in this.paths) {
			const p = this.paths[i];
			Crumbs.subPathsLogic[p.type](ctx, p, this);
		}

		return {};
	};
	Crumbs.component.pathConfig = function(obj) {
		this.type = 'config';
		this.obj = obj;
	};
	Crumbs.defaultPathConfigs = {
		lineWidth: 1,
		strokeStyle: '#000000',
		lineCap: 'butt',
		lineJoin: 'miter',
		miterLimit: 10,
		lineDashOffset: 0,
		lineDash: []
	};
	Crumbs.validPathConfigs = ['lineWidth', 'strokeStyle', 'lineCap', 'lineJoin', 'miterLimit', 'lineDashOffset'];
	Crumbs.validPathFuncs = ['setLineDash'];
	Crumbs.component.subpaths = {
		move: function(x, y) {
			this.type = 'move';
			this.x = x;
			this.y = y;
		},
		translate: function(x, y) {
			this.type = 'translate';
			this.x = x;
			this.y = y;
		},
		close: function() {
			this.type = 'close';
		},
		line: function(x, y) {
			this.type = 'line';
			this.x = x;
			this.y = y;
		},
		arc: function(x, y, r, angleStart, angleEnd, counterClockwise) {
			this.type = 'arc';
			this.x = x;
			this.y = y;
			this.r = r;
			this.as = angleStart;
			this.ae = angleEnd;
			this.cc = counterClockwise;
		},
		arcTo: function(x1, y1, x2, y2, r) {
			this.type = 'arcTo';
			this.x1 = x1;
			this.y1 = y1;
			this.x2 = x2;
			this.y2 = y2;
			this.r = r;
		},
		quadratic: function(cpx, cpy, x, y) {
			this.type = 'quadratic';
			this.cpx = cpx;
			this.cpy = cpy;
			this.x = x;
			this.y = y;
		},
		cubic: function(cp1x, cp1y, cp2x, cp2y, x, y) {
			this.type = 'cubic';
			this.cp1x = cp1x;
			this.cp1y = cp1y;
			this.cp2x = cp2x;
			this.cp2y = cp2y;
			this.x = x;
			this.y = y;
		},
		stroke: function() {
			this.type = 'stroke';
		},
		fill: function(evenodd) {
			this.type = 'fill';
			this.evenodd = evenodd;
		}
	};
	Crumbs.subPathsLogic = {
		//ctx, then the subpath object, then the path object (optional
		config: function(ctx, p) {
			for (let ii in p.obj) {
				let str1 = '';
				let str2 = '';
				if (typeof p.obj[ii] === 'string') {
					str1 = '"';
					str2 = '"';
				} else if (Array.isArray(p.obj[ii])) {
					str1 = '[';
					str2 = ']';
				}
				if (Crumbs.validPathConfigs.includes(ii)) {
					eval('ctx.'+ii+'='+str1+p.obj[ii]+str2);
				} else if (Crumbs.validPathFuncs.includes(ii)) {
					eval('ctx.'+ii+'('+str1+p.obj[ii]+str2+');');
				} else { throw 'Unrecognized config '+ii+'!'; }
			}
		},
		move: function(ctx, p, pm) {
			ctx.moveTo(p.x, p.y);
			pm.cx = p.x;
			pm.cy = p.y;
		},
		translate: function(ctx, p, pm) {
			ctx.moveTo(this.cx+p.x, this.cy+p.y);
			pm.cx += p.x;
			pm.cy += p.y;
		},
		close: function(ctx) {
			ctx.closePath();
		},
		line: function(ctx, p) {
			ctx.lineTo(p.x, p.y);
		},
		arc: function(ctx, p) {
			ctx.arc(p.x, p.y, p.r, p.as, p.ae, p.cc);
		},
		arcTo: function(ctx, p) {
			ctx.arcTo(p.x1, p.y1, p.x2, p.y2, p.r);
		},
		quadratic: function(ctx, p) {
			ctx.quadraticCurveTo(p.cpx, p.cpy, p.x, p.y);
		},
		cubic: function(ctx, p) {
			ctx.bezierCurveTo(p.cp1x, p.cp1y, p.cp2x, p.cp2y, p.x, p.y);
		},
		stroke: function(ctx) {
			ctx.stroke();
		},
		fill: function(ctx, p) {
			if (p.evenodd) {
				ctx.fill('evenodd');
			} else {
				ctx.fill();
			}
		}
	};

	Crumbs.component.settings = function(obj) {
		obj = obj||{};
		const def = Crumbs.defaultComp.settings;
		this.enabled = obj.enabled||def.enabled;
		const globals = ['globalCompositeOperation', 'imageSmoothingEnabled', 'imageSmoothingQuality'];
		for (let i in obj) {
			if (!globals.includes(i)) { throw '"'+i+'" is not a valid setting for a settings component!'; }
		} 
		this.obj = obj||def.obj;

		this.type = 'settings';
	};
	Crumbs.defaultComp.settings = {
		enabled: true,
		obj: {}
	};
	Crumbs.component.settings.prototype.enable = function() {
		this.enabled = true;
	};
	Crumbs.component.settings.prototype.disable = function() {
		this.enabled = false;
	};
	Crumbs.component.settings.prototype.logic = function(m) { };
	Crumbs.component.settings.prototype.preDraw = function(m, ctx) {
		for (let i in this.obj) {
			ctx[i] = this.obj[i];
		}
	};
	Crumbs.component.settings.prototype.postDraw = function(m, ctx) { };

	Crumbs.component.canvasManipulator = function(obj) {
		//USE WITH CAUTION
		for (let i in Crumbs.defaultComp.canvasManipulator) {
			this[i] = Crumbs.defaultComp.canvasManipulator[i];
		}
		for (let i in obj) { this[i] = obj[i]; }

		this.type = 'canvasManipulator';
	};
	Crumbs.defaultComp.canvasManipulator = {
		enabled: true,
		funcion: function(m, ctx) { }
	};
	Crumbs.component.canvasManipulator.prototype.enable = function() {
		this.enabled = true;
	};
	Crumbs.component.canvasManipulator.prototype.disable = function() {
		this.enabled = false;
	};
	Crumbs.component.canvasManipulator.prototype.logic = function(m) { };
	Crumbs.component.canvasManipulator.prototype.preDraw = function(m, ctx) { };
	Crumbs.component.canvasManipulator.prototype.postDraw = function(m, ctx) {
		this.function(m, ctx);
	};
	
	Crumbs.component.text = function(obj) {
		//obj has: content, size, font, textAlign, direction, color, stroke, outline
		obj = obj||{};
		for (let i in Crumbs.defaultComp.text) {
			this[i] = Crumbs.defaultComp.text[i];
		}
		for (let i in obj) {
			this[i] = obj[i];
		}

		this.type = 'text';
	};
	Crumbs.defaultComp.text = {
		enabled: true,
		content: '',
		size: 10,
		font: 'Merriweather',
		align: 'left',
		direction: 'inherit',
		color: '#fff',
		outlineColor: '#000',
		outline: 0,
		maxWidth: null
	};
	Crumbs.component.text.prototype.enable = function() {
		this.enabled = true;
	};
	Crumbs.component.text.prototype.disable = function() {
		this.enabled = false;
	};
	Crumbs.component.text.prototype.logic = function(m) {
	};
	Crumbs.component.text.prototype.preDraw = function(m, ctx) {
		ctx.font = this.size+'px '+this.font;
		ctx.textAlign = this.align;
		ctx.direction = this.direction;
		ctx.fillStyle = this.color;
		ctx.lineWidth = this.outline;
		ctx.strokeStyle = this.outlineColor;
	};
	Crumbs.component.text.prototype.postDraw = function(m, ctx, pWidth, pHeight) {
		const dims = ctx.measureText(this.content);
		pWidth *= dims.width / Pic(m.imgs[m.imgUsing]).width;
		pHeight *= (dims.actualBoundingBoxAscent+dims.actualBoundingBoxDescent) / Pic(m.imgs[m.imgUsing]).height;
		
		if (this.maxWidth) {
			ctx.fillText(this.content, -Crumbs.getOffsetX(m.anchor, pWidth) + m.offsetX, -Crumbs.getOffsetY(m.anchor, pHeight) + m.offsetY, this.maxWidth);
		} else {
			ctx.fillText(this.content, -Crumbs.getOffsetX(m.anchor, pWidth) + m.offsetX, -Crumbs.getOffsetY(m.anchor, pHeight) + m.offsetY);
		}
		if (this.outline) {
			if (this.maxWidth) {
				ctx.strokeText(this.content, -Crumbs.getOffsetX(m.anchor, pWidth) + m.offsetX, -Crumbs.getOffsetY(m.anchor, pHeight) + m.offsetY, this.maxWidth);
			} else {
				ctx.strokeText(this.content, -Crumbs.getOffsetX(m.anchor, pWidth) + m.offsetX, -Crumbs.getOffsetY(m.anchor, pHeight) + m.offsetY);
			}
		}
	};

	Crumbs.component.patternFill = function(obj) {
		obj = obj||{};
		for (let i in Crumbs.defaultComp.patternFill) {
			this[i] = Crumbs.defaultComp.patternFill[i];
		}
		for (let i in obj) {
			this[i] = obj[i];
		}
		this.noDrawStatus = false;

		this.type = 'patternFill';
	};
	Crumbs.defaultComp.patternFill = {
		enabled: true,
		width: 2,
		height: 2,
		offX: 0,
		offY: 0
	};
	Crumbs.component.patternFill.prototype.enable = function() {
		this.enabled = true;
	};
	Crumbs.component.patternFill.prototype.disable = function() {
		this.enabled = false;
	};
	Crumbs.component.patternFill.prototype.logic = function(m) {
	};
	Crumbs.component.patternFill.prototype.preDraw = function(m, ctx) {
		this.noDrawStatus = m.noDraw;
		m.noDraw = true;
	};
	Crumbs.component.patternFill.prototype.postDraw = function(m, ctx, pWidth, pHeight) {
		if (!this.noDrawStatus) { ctx.fillPattern(Pic(m.imgs[m.imgUsing]), -Crumbs.getOffsetX(m.anchor, pWidth) + m.offsetX, -Crumbs.getOffsetY(m.anchor, pHeight) + m.offsetY, this.width, this.height, pWidth, pHeight, this.offX, this.offY); }

		m.noDraw = this.noDrawStatus;
	};

	Crumbs.component.pointerInteractive = function(obj) {
		obj = obj||{};
		for (let i in Crumbs.defaultComp.pointerInteractive) {
			this[i] = Crumbs.defaultComp.pointerInteractive[i];
		}
		for (let i in obj) {
			this[i] = obj[i];
		}

		this.hovered = false;
		this.click = false;
		this.type = 'pointerInteractive';
	}
	Crumbs.defaultComp.pointerInteractive = {
		onClick: function() { },
		onRelease: function() { },
		onMouseover: function() { },
		onMouseout: function() { }
	}
	Crumbs.component.pointerInteractive.prototype.enable = function() {
		this.enabled = true;
	};
	Crumbs.component.pointerInteractive.prototype.disable = function() {
		this.enabled = false;
	};
	Crumbs.component.pointerInteractive.prototype.logic = function(m) { };
	Crumbs.component.pointerInteractive.prototype.preDraw = function(m, ctx) { };
	Crumbs.component.pointerInteractive.prototype.postDraw = function(m, ctx, pWidth, pHeight) {
		const b = Crumbs.h.inRect(Game.mouseX - m.x, Game.mouseY - m.y, {
			w: pWidth,
			h: pHeight,
			r: m.rotation + (m.noRotate?0:m.rotationAdd),
			x: -pWidth / 2 + Crumbs.getOffsetX(m.anchor, pWidth),
			y: -pHeight / 2 + Crumbs.getOffsetY(m.anchor, pHeight)
		});
		console.log(b);
		if (b && !this.hovered) { this.hovered = true; this.onMouseover.call(m); }
		else if (!b && this.hovered) { this.hovered = false; this.onMouseout.call(m); }
		if (!this.click && Game.Click) { this.click = true; if (this.hovered) { this.onClick.call(m); } }
		if (this.click && !Game.Click) { this.click = false; if (this.hovered) { this.onRelease.call(m); } }
	};
	
	Game.registerHook('draw', Crumbs.updateObjects);

	//below for the actual drawing
	Crumbs.h.injectCSS(`.CrumbsCanvaContainer { width: 100%; height: 100%; position: absolute; pointer-events: none; z-index: `+(Math.pow(2, 31) - 1)+` }`);
	
	Crumbs.createCanvas = function(id, parentElement, css) {
		let div = document.createElement('canvas');
		div.id = id; div.style = 'background: none;';
		let cont = document.createElement('div');
		cont.classList.add('CrumbsCanvaContainer');
		if (css) { cont.style = css; }
		cont.appendChild(div);
		parentElement.appendChild(cont);
		return l(id).getContext('2d');
	}
	Crumbs.foregroundCanvas = Crumbs.createCanvas('foregroundCanvas', l('game'));
	Crumbs.middleCanvas = Crumbs.createCanvas('middleCanvas', l('rows'), 'position: absolute; top: 0; left: 0;');
	Crumbs.rightCanvas = Crumbs.createCanvas('rightCanvas', l('store'), 'position: absolute; top: 0; left: 0;');

	Crumbs.updateCanvas = function() {
		for (let i in Crumbs.scopedCanvas) {
			Crumbs.scopedCanvas[i].canvas.width = Crumbs.scopedCanvas[i].canvas.parentNode.offsetWidth;
			Crumbs.scopedCanvas[i].canvas.height = Crumbs.scopedCanvas[i].canvas.parentNode.offsetHeight;
		}
	};
	Crumbs.updateCanvas();
	window.addEventListener('resize',function(event) {
		Crumbs.updateCanvas();
	});

	Crumbs.scopedCanvas = {
		left: Game.LeftBackground,
		foreground: Crumbs.foregroundCanvas,
		background: Game.Background,
		middle: Crumbs.middleCanvas,
		right: Crumbs.rightCanvas
	};
	Crumbs.getCanvasByScope = function(s) {
		return Crumbs.scopedCanvas[s];
	};

	Crumbs.compileObjects = function(s) {
		let arr = []; //each entry is an object, which in this case includes all childrens, sorted by the order variable
		for (let i in Crumbs.objects[s]) {
			if (Crumbs.objects[s][i] !== null) { arr = Crumbs.merge(arr, Crumbs.objects[s][i].compile()); }
		}
		return arr;
	};
	Crumbs.object.prototype.compile = function() {
		let arr = [];
		arr.push(this);
		for (let i in this.children) {
			if (this.children[i] !== null) { arr = Crumbs.merge(arr, this.children[i].compile()); }
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

	
	Crumbs.OXFA = {
		'top-left': 0,
		'top': 0.5,
		'top-right': 1,
		'left': 0,
		'center': 0.5,
		'right': 1,
		'bottom-left': 0,
		'bottom': 0.5,
		'bottom-right': 1
	};
	Crumbs.getOffsetX = function(anchor, width) {
		return Crumbs.OXFA[anchor] * width;
	};
	Crumbs.OYFA = {
		'top-left': 0,
		'top': 0,
		'top-right': 0,
		'left': 0.5,
		'center': 0.5,
		'right': 0.5,
		'bottom-left': 1,
		'bottom': 1,
		'bottom-right': 1
	};
	Crumbs.getOffsetY = function(anchor, height) {
		return Crumbs.OYFA[anchor] * height;
	};
	Crumbs.getPWidth = function(o) {
		if (o.width) { return o.width; } else { return Pic(o.imgs[o.imgUsing]).width * o.scaleX * o.scaleFactor[0]; }
	};
	Crumbs.getPHeight = function(o) {
		if (o.height) { return o.height; } else { return Pic(o.imgs[o.imgUsing]).height * o.scaleY * o.scaleFactor[1]; }
	};

	Crumbs.drawObjects = function() {
		for (let c in Crumbs.scopedCanvas) {
			let list = Crumbs.compileObjects(c);
			let ctx = Crumbs.scopedCanvas[c];
			ctx.globalAlpha = 1;
			if (c != 'left' && c != 'background') { ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); }
			const settingObj = {globalCompositeOperation: ctx.globalCompositeOperation, imageSmoothingEnabled: ctx.imageSmoothingEnabled, imageSmoothingQuality: ctx.imageSmoothingQuality};
			for (let i in Crumbs.settings) {
				ctx[i] = Crumbs.settings[i];
			}
			for (let i in list) {
				let o = list[i];
				if (!o.enabled) { continue; }
				if (o.alpha) { ctx.globalAlpha = o.alpha; } else { ctx.globalAlpha = 1; }
				const p = Pic(o.imgs[o.imgUsing]);
				const pWidth = Crumbs.getPWidth(o);
				const pHeight = Crumbs.getPHeight(o);
				ctx.save();
				for (let ii = 0; ii < o.components.length; ii++) {
					if (o.components[ii].enabled) { o.components[ii].preDraw(o, ctx); }
				}
				const ox = Crumbs.getOffsetX(o.anchor, pWidth);
				const oy = Crumbs.getOffsetY(o.anchor, pHeight);
				const r = o.rotation + (o.noRotate?0:o.rotationAdd);
				ctx.translate(o.x + o.canvaCenter[0], o.y + o.canvaCenter[1]);
				if (o.rotation + o.rotationAdd) {
					ctx.rotate(r);
				} 
				
				if (!o.noDraw) { ctx.drawImage(p, o.sx, o.sy, o.width?o.width:p.width, o.height?o.height:p.height, -ox + o.offsetX, -oy + o.offsetY, pWidth, pHeight); }

				for (let ii = o.components.length - 1; ii >= 0; ii--) {
					if (o.components[ii].enabled) { o.components[ii].postDraw(o, ctx, pWidth, pHeight); }
				}

				if (Crumbs.prefs.anchorDisplay) {
					ctx.save();
					if (o.parent) { ctx.fillStyle = '#57d2f2'; } else { ctx.fillstyle = '#ccfffb'; }
					ctx.globalAlpha = 1;
					ctx.fillRect(o.offsetX - 3, o.offsetY - 3, 6, 6);
					ctx.restore();
				}
				
				ctx.restore(); 
			}
			for (let i in settingObj) {
				ctx[i] = settingObj[i];
			}
		}
	};

	Crumbs.leftBackgroundElements = [{
		id: 'cFall',
		imgs: 'icons',
		
	}, {}, {}];

	Crumbs.cookieIcons = [[10, 0]];

	Crumbs.compileCookieIcons = function() {
		Crumbs.cookieIcons=[[10,0]];
		for (let i in Game.Upgrades) {
			let cookie=Game.Upgrades[i];
			if (cookie.bought>0 && cookie.pool=='cookie') { Crumbs.cookieIcons.push(cookie.icon); }
		}
	};
	Game.registerHook('check', Crumbs.compileCookieIcons);
	if (Game.ready) { Crumbs.compileCookieIcons(); } else { Game.registerHook('create', Crumbs.compileCookieIcons); }

	Crumbs.randomCookie = function() {
		let i = [];
		if (Game.bakeryName.toLowerCase()=='ortiel' || Math.random()<1/10000) { i=[17,5]; } else { i = choose(Crumbs.cookieIcons); }
		return {
			imgs: i[2]?i[2]:'icons',
			width: 48,
			height: 48,
			sx: i[0] * 48,
			sy: i[1] * 48,
			scope: 'left',
			order: -2,
		};
	};

	Crumbs.dollar = function() {
		return {
			imgs: 'dollar',
			width: 64,
			height: 64,
			sx: Math.floor(Math.random() * 8) * 64,
			sy: 0,
			scope: 'left',
		};
	};

	Crumbs.wrinklerBit = function(id) {
		return {
			imgs: 'wrinklerBits',
			width: 100,
			height: 200,
			sx: ((id * 3) % 8) * 100,
			sy: -10,
			anchor: 'top-left',
			scope: 'left'
		};
	};

	Crumbs.spawnCookieShower = function() {
		if (Game.prefs.particles && Game.cookies && Game.T%Math.ceil(Game.fps/Math.min(10,Game.cookiesPs))==0) {
			Crumbs.spawn(Crumbs.spawnFallingCookie(0, -64, 0, 0, 2, 'fallingCookie'));
		}
	};
	Crumbs.spawnFallingCookie = function(x, y, yd, speed, t, id, onMouse, sc, order, noInit) {
		let c = 0;
		if (Game.season=='fools') { c = Crumbs.dollar(); } else { c = Crumbs.randomCookie(); }
		c.behaviors = [new Crumbs.behaviorInstance(Crumbs.objectBehaviors.cookieFall, {yd: yd}), new Crumbs.behaviorInstance(Crumbs.objectBehaviors.horizontal, {speed: speed}), new Crumbs.behaviorInstance(Crumbs.objectBehaviors.expireAfter, {t: t * Game.fps}), new Crumbs.behaviorInstance(Crumbs.objectBehaviors.fadeout, {speed: 1 / (t * Game.fps)})];
		if (!onMouse) {
			c.x = x;
			c.y = y;
			if (!noInit) { c.init = Crumbs.objectInits.topRandom; }
		} else {
			c.x = Game.mouseX;
			c.y = Game.mouseY;
		}
		if (sc) {
			c.scaleX = sc;
			c.scaleY = sc;
		}
		if (typeof order === 'number') { c.order = order; }
		c.id = id;
		c.rotation = Math.random() * 2 * Math.PI;
		return c;
	};
	Game.registerHook('logic', Crumbs.spawnCookieShower);
	eval('Game.Logic='+Game.Logic.toString().replace(`if (Game.prefs.particles && Game.cookies && Game.T%Math.ceil(Game.fps/Math.min(10,Game.cookiesPs))==0) Game.particleAdd();//cookie shower`, ''));
	eval('Game.ClickCookie='+Game.ClickCookie.toString().replace('Game.particleAdd();', '').replace('Game.particleAdd(Game.mouseX,Game.mouseY,Math.random()*4-2,Math.random()*-2-2,Math.random()*0.5+0.75,1,2);', ''));

	Crumbs.spawnWrinklerBits = function(type, originId, id) {
		let w = Crumbs.wrinklerBit(id + Crumbs.objects.left.length); //id in order to mostly prevent it from shedding the same particle 2 or 3 times in a row
		if (type == 1) { w.imgs = 'shinyWrinklerBits'; }
		w.behaviors = [new Crumbs.behaviorInstance(Crumbs.objectBehaviors.cookieFall, {yd: Math.random()*-2-2}), new Crumbs.behaviorInstance(Crumbs.objectBehaviors.horizontal, {speed: Math.random()*4-2}), new Crumbs.behaviorInstance(Crumbs.objectBehaviors.expireAfter, {t: 1 * Game.fps}), new Crumbs.behaviorInstance(Crumbs.objectBehaviors.fadeout, {speed: 1 / (1 * Game.fps)})];
		const o = Crumbs.findObject('wrinkler'+originId);
		w.x = o.x;
		w.y = o.y;
		w.offsetX = o.offsetX;
		w.offsetY = o.offsetY;
		w.rotation = o.rotation;
		w.order = 2;
		w.id = 'wrinklerBits';
		Crumbs.spawn(w);
	};

	Game.registerHook('click', function() {
		if (Game.prefs.particles) {
			Crumbs.spawn(Crumbs.spawnFallingCookie(0, -64, 0, 0, 2, 'fallingCookie', false, 1, 0));
			Crumbs.spawn(Crumbs.spawnFallingCookie(0, 0, Math.random()*-2-2, Math.random()*4-2, 1, 'clickedCookie', true, Math.random()*0.5+0.75, 0));
		}
	});

	eval('Game.UpdateWrinklers='+replaceAll('part.r=-me.r;', '', replaceAll(`Game.particleAdd(Game.mouseX,Game.mouseY,Math.random()*4-2,Math.random()*-2-2,Math.random()*0.5+0.75,1.5,2);`, `Crumbs.spawn(Crumbs.spawnFallingCookie(0, 0, Math.random()*-2-2, Math.random()*4-2, 1, 'wrinklerPoppedCookie', true, Math.random()*0.5+0.75));`, Game.UpdateWrinklers.toString()).replace('inRect(', 'Crumbs.h.inRect(').replace(`var part=Game.particleAdd(x,y,Math.random()*4-2,Math.random()*-2-2,1,1,2,me.type==1?'shinyWrinklerBits.png':'wrinklerBits.png');`, `Crumbs.spawnWrinklerBits(me.type, me.id, Math.floor(ii + Math.floor(3 * (me.id + 1) * Math.random()) + 2));`).replace(`var part=Game.particleAdd(x,y,Math.random()*4-2,Math.random()*-2-2,1,1,2,me.type==1?'shinyWrinklerBits.png':'wrinklerBits.png');`, `Crumbs.spawnWrinklerBits(me.type, me.id, 0);`)));

	Crumbs.objectInits.wrinklerWidgets = function() {
		const shadows = {
			anchor: 'top-left',
			y: 30,
			scaleX: 5,
			scaleY: 5,
			order: 1,
			wId: i,
			imgs: ['img/wrinklerShadow.png'],
			behaviors: new Crumbs.behaviorInstance(function(p) {
				if (Game.prefs.fancy && Game.wrinklers[this.wId].close > 0) {
					this.noDraw = false;
					this.alpha = Game.wrinklers[this.wId].close;
					return;
				} 
				this.noDraw = true;
			})
		};
		const eyes = {
			imgs: [Crumbs.objectImgs.empty, 'img/wrinklerBlink.png', 'img/wrinklerGooglies.png'],
			anchor: 'top-left',
			offsetY: -10+Math.sin(Game.T*0.2+i*3+1.2),
			order: 3,
			wId: i,
			scope: 'left',
			behaviors: new Crumbs.behaviorInstance(function(p) {
				if (Game.prefs.notScary && Game.wrinklers[this.wId].close > 0) {
					this.offsetY = -10+Math.sin(Game.T*0.2+this.wId*3+1.2);
					this.imgUsing = Math.sin(Game.T*0.003+i*11+137+Math.sin(Game.T*0.017+i*13))>0.9997?1:2;
					this.alpha = Game.wrinklers[this.wId].close;
					return;
				}
				this.imgUsing = 0;
			})
		};
		this.spawnChild(shadows);
		this.spawnChild(eyes);
	};
	Crumbs.objectBehaviors.wrinklerSkins = function(p) {
		if (Game.wrinklers[this.wId].phase > 0) {
			if (Game.wrinklers[this.wId].type > 0) { this.imgUsing = Game.WINKLERS?5:2; return; }
			if (Game.season == 'christmas') { this.imgUsing = Game.WINKLERS?6:3; return; }
			this.imgUsing = Game.WINKLERS?4:1; return;
		}
		this.imgUsing = 0;
	}
	Crumbs.objectBehaviors.wrinklerMovement = function(p) {
		const sw=100+2*Math.sin(Game.T*0.2+this.wId*3);
		const sh=200+5*Math.sin(Game.T*0.2-2+this.wId*3);
		const me = Game.wrinklers[this.wId];
		this.scaleX = sw / 100;
		this.scaleY = sh / 200;
		this.x = me.x;
		this.y = me.y;
		this.offsetX = -sw/2;
		this.rotation = -(me.r)*Math.PI/180;
		this.alpha = me.close;
	}
	Crumbs.objectBehaviors.wrinklerParticles = function(p) {
		const me = Game.wrinklers[this.wId];
		if (Game.prefs.particles) {
			if (me.phase == 2 && Math.random() < 0.03) {
				Crumbs.spawn(Crumbs.spawnFallingCookie(me.x, me.y, Math.random()*-2-2, Math.random()*4-2, 1, 'wrinklerPassive', false, Math.random()*0.5+0.5, 4, true));
			}
			if (me.type == 1 && Math.random()<0.3) {
				const s = Math.random()*30+5;
				this.spawnChild({
					imgs: 'glint',
					anchor: 'top-left',
					alpha: Math.random()*0.65+0.1,
					components: new Crumbs.component.settings({globalCompositeOperation: 'lighter'}),
					offsetX: Math.random()*50,
					offsetY: Math.random()*200,
					order: 5,
					scaleX: s / 32, 
					scaleY: s / 32,
					behaviors: function(p) {
						if (this.t > 0) { return 't'; }
						return {};
					}
				}); return;
			}
		}
	}
	Crumbs.initWrinklers = function() {
		for (let i = 0; i < Game.wrinklerLimit; i++) {
			let w = Crumbs.findObject('wrinkler'+i, 'left');
			if (w !== null) { w.die(); }
		}
		for (let i = 0; i < Game.wrinklerLimit; i++) {
			let w = {
				imgs: [Crumbs.objectImgs.empty, 'img/wrinkler.png', 'img/shinyWrinkler.png', 'img/winterWrinkler.png', 'winkler.png', 'shinyWinkler.png', 'winterWinkler.png'],
				id: 'wrinkler'+i,
				order: 1.5,
				scope: 'left',
				anchor: 'top-left',
				offsetY: -10,
				wId: i,
				init: Crumbs.objectInits.wrinklerWidgets,
				behaviors: [new Crumbs.behaviorInstance(Crumbs.objectBehaviors.wrinklerSkins), 
							new Crumbs.behaviorInstance(Crumbs.objectBehaviors.wrinklerMovement), 
							new Crumbs.behaviorInstance(Crumbs.objectBehaviors.wrinklerParticles)],
			}
			Crumbs.spawn(w);
		}
	};
	Crumbs.objectBehaviors.milkBehavior = function() {
		if (!Game.prefs.milk) { this.imgs = Crumbs.objectImgs.empty; return; }
		let toReturn = {imgs: [Game.Milk.pic]};
		if (Game.milkType!=0 && Game.ascensionMode!=1) { toReturn.imgs = [Game.AllMilks[Game.milkType].pic]; }
		let a=1;
		let y = Crumbs.scopedCanvas.left.canvas.height * Game.milkHd;
		if (Game.AscendTimer>0)
		{
			y*=1-Math.pow((Game.AscendTimer/Game.AscendBreakpoint),2)*2;
			a*=1-Math.pow((Game.AscendTimer/Game.AscendBreakpoint),2)*2;
		}
		else if (Game.ReincarnateTimer>0)
		{
			y*=1-Math.pow(1-(Game.ReincarnateTimer/Game.ReincarnateDuration),2)*2;
			a*=1-Math.pow(1-(Game.ReincarnateTimer/Game.ReincarnateDuration),2)*2;
		}
		toReturn.alpha = a;
		toReturn.y = Crumbs.scopedCanvas.left.canvas.height - y;
		this.getComponent('patternFill').width = Crumbs.scopedCanvas.left.canvas.width + 480;
		this.getComponent('patternFill').offX = Math.floor((Game.T*2-(Game.milkH-Game.milkHd)*2000+480*2)%480);
		this.set(toReturn);
	}
	Crumbs.initMilk = function() {
		Crumbs.spawn({
			anchor: 'top-left',
			scope: 'left',
			id: 'milk',
			scaleX: 2,
			scaleY: 2,
			order: 0.5,
			components: new Crumbs.component.patternFill({ height: 1 }),
			behaviors: new Crumbs.behaviorInstance(Crumbs.objectBehaviors.milkBehavior)
		});
	};
	Crumbs.cursorDraw = function(m, ctx) {
		if (!Game.prefs.cursors) { return; }
		ctx.save();
		var pic=Pic('cursor.png');
		var fancy=Game.prefs.fancy;
		
		if (Game.hasBuff('Dragonflight') || Game.hasBuff('Dragon Harvest')) ctx.globalAlpha=0.25;
		var amount=Game.Objects['Cursor'].amount;
		for (var i=0;i<amount;i++)
		{
			var n=Math.floor(i/50);
			var w=0;
			if (fancy) w=(Math.sin(Game.T*0.025+(((i+n*12)%25)/25)*Math.PI*2));
			if (w>0.997) w=1.5;
			else if (w>0.994) w=0.5;
			else w=0;
			w*=-4;
			if (fancy) w+=Math.sin((n+Game.T*0.01)*Math.PI/2)*4;
			var x=0;
			var y=(140+n*16+w)-16;
			
			var rot=7.2;//(1/50)*360
			if (i==0 && fancy) rot-=Game.T*0.1;
			if (i%50==0) rot+=7.2/2;
			ctx.rotate((rot/360)*Math.PI*2);
			ctx.drawImage(pic,0,0,32,32,x,y,32,32);
		}
		ctx.restore();
	}
	Crumbs.initCursors = function() {
		Crumbs.spawn({
			init: Crumbs.objectInits.bigCookie,
			anchor: 'top-left',
			scope: 'left',
			components: new Crumbs.component.canvasManipulator({
				function: Crumbs.cursorDraw
			}),
			behaviors: new Crumbs.behaviorInstance(Crumbs.objectBehaviors.centerOnBigCookie),
			id: 'cursors'
		})
	}
	Crumbs.objectInits.cookieWidgets = function() {
		this.spawnChild({
			imgs: 'img/cookieShadow.png',
			order: -1.5,
			scaleX: 8,
			scaleY: 8,
			y: 20
		});
	}
	Crumbs.objectBehaviors.cookieWobble = new Crumbs.behavior(function() {
		this.scaleX = 0.5*Game.BigCookieSize;
		this.scaleY = 0.5*Game.BigCookieSize;
	});
	Crumbs.objectBehaviors.shine1 = new Crumbs.behavior(function() {
		if (Game.prefs.particles) {
			var r=Math.floor((Game.T*0.5)%360);
			this.rotation = ((r/360)*Math.PI*2);
		} else { this.rotation = 0; }
		var goodBuff=0;
		var badBuff=0;
		for (var i in Game.buffs)
		{
			if (Game.buffs[i].aura==1) goodBuff=1;
			if (Game.buffs[i].aura==2) badBuff=1;
		}
		let alphaMult = 1;
		if (Game.bgType == 2 || Game.bgType == 4) { alphaMult = 0.5; }
		if (goodBuff) { this.imgUsing = 1; alphaMult = 1; } else if (badBuff) { this.imgUsing = 2; alphaMult = 1; } else { this.imgUsing = 0; }
		if (goodBuff && Game.prefs.fancy) { this.getComponent('settings').obj.globalCompositeOperation = 'lighter'; } else { this.getComponent('settings').obj.globalCompositeOperation = 'source-over'; }
		this.alpha = 0.5 * alphaMult;
	});
	Crumbs.objectBehaviors.shine2 = new Crumbs.behavior(function() {
		if (!Game.prefs.particles) { this.noDraw = true; return; } else { this.noDraw = false; }
		var r=Math.floor((Game.T*0.5)%360);
		this.rotation = (-(r/360)*Math.PI*2);
		var goodBuff=0;
		var badBuff=0;
		for (var i in Game.buffs)
		{
			if (Game.buffs[i].aura==1) goodBuff=1;
			if (Game.buffs[i].aura==2) badBuff=1;
		}
		let alphaMult = 1;
		if (Game.bgType == 2 || Game.bgType == 4) { alphaMult = 0.5; }
		if (goodBuff) { this.imgUsing = 1; alphaMult = 1; } else if (badBuff) { this.imgUsing = 2; alphaMult = 1; } else { this.imgUsing = 0; }
		if (goodBuff && Game.prefs.fancy) { this.getComponent('settings').obj.globalCompositeOperation = 'lighter'; } else { this.getComponent('settings').obj.globalCompositeOperation = 'source-over'; }
		this.alpha = 0.25 * alphaMult;
	});
	Crumbs.objectBehaviors.veilMain = new Crumbs.behavior(function() {
		if (!Game.Has('Shimmering veil [off]')) { this.noDraw = true; return; } else { this.noDraw = false; }
		this.rotation = -Game.T*0.01;
		const scale = (300+Math.sin(Game.T*0.037)*20)/128;
		this.scaleX = scale;
		this.scaleY = scale;
	});
	Crumbs.veilGlintGenerator = function(m, ctx) {
		if (!Game.prefs.particles || !Game.Has('Shimmering veil [off]')) { return; }
		for (i=0;i<6;i++)
		{
			var t=Game.T+i*15;
			var r=(t%30)/30;
			var a=(Math.floor(t/30)*30*6-i*30)*0.01;
			var size=32*(1-Math.pow(r*2-1,2));
			var xx=Math.sin(a)*(110+r*16);
			var yy=Math.cos(a)*(110+r*16);
			ctx.drawImage(Pic('glint.png'),xx-size/2,yy-size/2,size,size);
		}	
	}
	Crumbs.objectInits.cookieInit = function() {
		const shine1 = {
			imgs: ['img/shine.png', 'img/shineGold.png', 'img/shineRed.png'],
			order: -2,
			scaleX: 4,
			scaleY: 4,
			components: new Crumbs.component.settings({ globalCompositeOperation: 'source-over' }),
			behaviors: new Crumbs.behaviorInstance(Crumbs.objectBehaviors.shine1)
		}
		const shine2 = {
			imgs: ['img/shine.png', 'img/shineGold.png', 'img/shineRed.png'],
			order: -2.1,
			scaleX: 4,
			scaleY: 4,
			components: new Crumbs.component.settings({ globalCompositeOperation: 'source-over' }),
			behaviors: new Crumbs.behaviorInstance(Crumbs.objectBehaviors.shine2)
		}
		const veilMain = {
			imgs: 'img/shimmeringVeil.png',
			order: 0,
			scaleX: 2.5,
			scaleY: 2.5,
			components: new Crumbs.component.settings({ globalCompositeOperation: 'lighter' }),
			behaviors: new Crumbs.behaviorInstance(Crumbs.objectBehaviors.veilMain)
		}
		const glintGen = {
			components: [new Crumbs.component.settings({ globalCompositeOperation: 'lighter' }), new Crumbs.component.canvasManipulator({ function: Crumbs.veilGlintGenerator })]
		}
		this.spawnChild(shine1);
		this.spawnChild(shine2);
		this.spawnChild(veilMain);
		this.spawnChild(glintGen);
	}
	Crumbs.initCookie = function() {
		if (Crumbs.findObject('bigCookie')) { Crumbs.findObject('bigCookie').die(); }
		let bigCookieAnchor = Crumbs.spawn({
			anchor: 'center',
			scope: 'left',
			id: 'bigCookie',
			init: Crumbs.objectInits.cookieInit,
			behaviors: [
				new Crumbs.behaviorInstance(Crumbs.objectBehaviors.centerOnBigCookie)
			]
		})
		let bigCookie = bigCookieAnchor.spawnChild({
			imgs: 'img/perfectCookie.png',
			id: 'bigCookieDisplay',
			order: -1,
			init: Crumbs.objectInits.cookieWidgets,
			behaviors: [
				new Crumbs.behaviorInstance(Crumbs.objectBehaviors.cookieWobble)
			]
		})
	};
	Crumbs.objectBehaviors.cookieShowerBackground = function() {
		if (!Game.prefs.particles) { this.noDraw = true; return; } else { this.noDraw = false; }
		if (Game.elderWrathD>=1 && !Game.prefs.notScary) { this.alpha=1-((Math.min(Game.elderWrathD,1.5)-1)/0.5); } else { this.alpha = 1; }
		
		if (Game.cookiesPs>1000) { this.imgUsing = 3; }
		else if (Game.cookiesPs>500) { this.imgUsing = 2; }
		else if (Game.cookiesPs>50) { this.imgUsing = 1; }
		else { this.alpha = 0; }
		
		this.getComponent('patternFill').width = Crumbs.scopedCanvas.left.canvas.width;
		this.getComponent('patternFill').height = Crumbs.scopedCanvas.left.canvas.height;
		this.getComponent('patternFill').offY = (Math.floor(Game.T*2)%512);
	}
	Crumbs.initCookieWall = function() {
		Crumbs.spawn({
			anchor: 'top-left',
			scope: 'left',
			id: 'cookieWall',
			order: -4,
			imgs: ['empty', 'img/cookieShower1.png', 'img/cookieShower2.png', 'img/cookieShower3.png'],
			components: new Crumbs.component.patternFill(),
			behaviors: new Crumbs.behaviorInstance(Crumbs.objectBehaviors.cookieShowerBackground)
		});
	};
	Crumbs.initAll = function() { Crumbs.initWrinklers(); Crumbs.initMilk(); Crumbs.initCursors(); Crumbs.initCookie(); Crumbs.initCookieWall(); }
	if (Game.ready) { Crumbs.initAll(); } else { Game.registerHook('create', Crumbs.initAll); }
	
	//extreme unfunniness intensifies
	
	Game.DrawWrinklers = function() {
		var ctx=Game.LeftBackground;
		for (var i in Game.wrinklers)
		{
			if (Game.wrinklers[i].selected && Game.Has('Eye of the wrinkler'))
			{
				//lazy lazy lazy lazy lazy
				var selected = Game.wrinklers[i];
				var x=Game.cookieOriginX;
				var y=Game.cookieOriginY;
				ctx.font='14px Merriweather';
				ctx.textAlign='center';
				var text=loc("Swallowed:");
				var width=Math.ceil(Math.max(ctx.measureText(text).width,ctx.measureText(Beautify(selected.sucked)).width));
				ctx.fillStyle='#000';
				ctx.globalAlpha=0.65;
				var xO=x-width/2-16;
				var yO=y-4;
				var dist=Math.floor(Math.sqrt((selected.x-xO)*(selected.x-xO)+(selected.y-yO)*(selected.y-yO)));
				var angle=-Math.atan2(yO-selected.y,xO-selected.x)+Math.PI/2;
				ctx.strokeStyle='#fff';
				ctx.lineWidth=1;
				for (var i=0;i<Math.floor(dist/12);i++)
				{
					var xC=selected.x+Math.sin(angle)*i*12;
					var yC=selected.y+Math.cos(angle)*i*12;
					ctx.beginPath();
					ctx.arc(xC,yC,4+(Game.prefs.fancy?2*Math.pow(Math.sin(-Game.T*0.2+i*0.3),4):0),0,2*Math.PI,false);
					ctx.fill();
					ctx.stroke();
				}
				ctx.fillRect(x-width/2-8-10,y-23,width+16+20,38);
				ctx.strokeStyle='#fff';
				ctx.lineWidth=1;
				ctx.strokeRect(x-width/2-8-10+1.5,y-23+1.5,width+16+20-3,38-3);
				ctx.globalAlpha=1;
				ctx.fillStyle='#fff';
				ctx.fillText(text,x+14,y-8);
				ctx.fillText(Beautify(selected.sucked),x+10,y+8);
				var s=54+2*Math.sin(Game.T*0.4);
				ctx.drawImage(Pic('icons.png'),27*48,26*48,48,48,x-width/2-16-s/2,y-4-s/2,s,s);
				break;
			}
		}
	}

	Crumbs.h.rebuildBigCookieButton();
	
	Game.DrawBackground = function() {
		Timer.clean();
			//background
			if (!Game.Background)//init some stuff
			{
				Crumbs.updateCanvas();
					//preload ascend animation bits so they show up instantly
					Game.LeftBackground.globalAlpha=0;
					Game.LeftBackground.drawImage(Pic('brokenCookie.png'),0,0);
					Game.LeftBackground.drawImage(Pic('brokenCookieHalo.png'),0,0);
					Game.LeftBackground.drawImage(Pic('starbg.jpg'),0,0);
			}
			
			var ctx=Game.LeftBackground;
			
			if (Game.OnAscend)
			{
				Timer.clean();
				//starry background on ascend screen
				var w=Game.Background.canvas.width;
				var h=Game.Background.canvas.height;
				var b=Game.ascendl.getBounds();
				var x=(b.left+b.right)/2;
				var y=(b.top+b.bottom)/2;
				Game.Background.globalAlpha=0.5;
				var s=1*Game.AscendZoom*(1+Math.cos(Game.T*0.0027)*0.05);
				Game.Background.fillPattern(Pic('starbg.jpg'),0,0,w,h,1024*s,1024*s,x+Game.AscendOffX*0.25*s,y+Game.AscendOffY*0.25*s);
				Timer.track('star layer 1');
				if (Game.prefs.fancy)
				{
					//additional star layer
					Game.Background.globalAlpha=0.5*(0.5+Math.sin(Game.T*0.02)*0.3);
					var s=2*Game.AscendZoom*(1+Math.sin(Game.T*0.002)*0.07);
					//Game.Background.globalCompositeOperation='lighter';
					Game.Background.fillPattern(Pic('starbg.jpg'),0,0,w,h,1024*s,1024*s,x+Game.AscendOffX*0.25*s,y+Game.AscendOffY*0.25*s);
					//Game.Background.globalCompositeOperation='source-over';
					Timer.track('star layer 2');
					
					x=x+Game.AscendOffX*Game.AscendZoom;
					y=y+Game.AscendOffY*Game.AscendZoom;
					//wispy nebula around the center
					Game.Background.save();
					Game.Background.globalAlpha=0.5;
					Game.Background.translate(x,y);
					Game.Background.globalCompositeOperation='lighter';
					Game.Background.rotate(Game.T*0.001);
					s=(600+150*Math.sin(Game.T*0.007))*Game.AscendZoom;
					Game.Background.drawImage(Pic('heavenRing1.jpg'),-s/2,-s/2,s,s);
					Game.Background.rotate(-Game.T*0.0017);
					s=(600+150*Math.sin(Game.T*0.0037))*Game.AscendZoom;
					Game.Background.drawImage(Pic('heavenRing2.jpg'),-s/2,-s/2,s,s);
					Game.Background.restore();
					Timer.track('nebula');
					
					//Game.Background.drawImage(Pic('shadedBorders.png'),0,0,w,h);
					//Timer.track('border');
				}
			}
			else
			{
				//let list = Crumbs.compileObjects('left');
				
				var goodBuff=0;
				var badBuff=0;
				for (var i in Game.buffs)
				{
					if (Game.buffs[i].aura==1) goodBuff=1;
					if (Game.buffs[i].aura==2) badBuff=1;
				}
				
				if (Game.drawT%5==0)
				{
					if (false && Game.bgType!=0 && Game.ascensionMode!=1)
					{
						//l('backgroundCanvas').style.background='url('+Game.resPath+'img/shadedBordersSoft.png) 0px 0px,url('+Game.resPath+'img/bgWheat.jpg) 50% 50%';
						//l('backgroundCanvas').style.backgroundSize='100% 100%,cover';
					}
					else
					{
						l('backgroundCanvas').style.background='transparent';
						Game.defaultBg='bgBlue';
						Game.bgR=0;
						
						if (Game.season=='fools') Game.defaultBg='bgMoney';
						if (Game.elderWrathD<1 || Game.prefs.notScary)
						{
							Game.bgR=0;
							Game.bg=Game.defaultBg;
							Game.bgFade=Game.defaultBg;
						}
						else if (Game.elderWrathD>=1 && Game.elderWrathD<2)
						{
							Game.bgR=(Game.elderWrathD-1)/1;
							Game.bg=Game.defaultBg;
							Game.bgFade='grandmas1';
						}
						else if (Game.elderWrathD>=2 && Game.elderWrathD<3)
						{
							Game.bgR=(Game.elderWrathD-2)/1;
							Game.bg='grandmas1';
							Game.bgFade='grandmas2';
						}
						else if (Game.elderWrathD>=3)// && Game.elderWrathD<4)
						{
							Game.bgR=(Game.elderWrathD-3)/1;
							Game.bg='grandmas2';
							Game.bgFade='grandmas3';
						}
						
						if (Game.bgType!=0 && Game.ascensionMode!=1)
						{
							Game.bgR=0;
							Game.bg=Game.BGsByChoice[Game.bgType].pic;
							Game.bgFade=Game.bg;
						}
						
						Game.Background.fillPattern(Pic(Game.bg+'.jpg'),0,0,Game.Background.canvas.width,Game.Background.canvas.height,512,512,0,0);
						if (Game.bgR>0)
						{
							Game.Background.globalAlpha=Game.bgR;
							Game.Background.fillPattern(Pic(Game.bgFade+'.jpg'),0,0,Game.Background.canvas.width,Game.Background.canvas.height,512,512,0,0);
						}
						Game.Background.globalAlpha=1;
						Game.Background.drawImage(Pic('shadedBordersSoft.png'),0,0,Game.Background.canvas.width,Game.Background.canvas.height);
					}
					
				}
				Timer.track('window background');
				
				//clear
				ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
				Timer.clean();
				
				var showDragon=0;
				if (Game.hasBuff('Dragonflight') || Game.hasBuff('Dragon Harvest')) showDragon=1;
				
				Game.cookieOriginX=Math.floor(ctx.canvas.width/2);
				Game.cookieOriginY=Math.floor(ctx.canvas.height*0.4);
				
				if (Game.AscendTimer==0)
				{	
					if (Game.prefs.particles)
					{
						//falling cookies
						var pic='';
						var opacity=1;
						//snow
						if (Game.season=='christmas')
						{
							var y=(Math.floor(Game.T*2.5)%512);
							ctx.globalAlpha=0.75;
							ctx.globalCompositeOperation='lighter';
							ctx.fillPattern(Pic('snow2.jpg'),0,0,ctx.canvas.width,ctx.canvas.height+512,512,512,0,y);
							ctx.globalCompositeOperation='source-over';
							ctx.globalAlpha=1;
						}
						//hearts
						if (Game.season=='valentines')
						{
							var y=(Math.floor(Game.T*2.5)%512);
							ctx.globalAlpha=1;
							ctx.fillPattern(Pic('heartStorm.png'),0,0,ctx.canvas.width,ctx.canvas.height+512,512,512,0,y);
							ctx.globalAlpha=1;
						}
						Timer.track('left background');
						
						Game.particlesDraw(0);
						ctx.globalAlpha=1;
						Timer.track('particles');
				
						if (Game.ReincarnateTimer>0)
						{
							ctx.globalAlpha=1-Game.ReincarnateTimer/Game.ReincarnateDuration;
							ctx.fillStyle='#000';
							ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
							ctx.globalAlpha=1;
						}
						
						if (showDragon)
						{
							//big dragon
							var s=300*2*(1+Math.sin(Game.T*0.013)*0.1);
							var x=Game.cookieOriginX-s/2;
							var y=Game.cookieOriginY-s/(1.4+0.2*Math.sin(Game.T*0.01));
							ctx.drawImage(Pic('dragonBG.png'),x,y,s,s);
						}
						
						//big cookie
						if (false)
						{
							ctx.globalAlpha=1;
							var s=256*Game.BigCookieSize;
							var x=Game.cookieOriginX;
							var y=Game.cookieOriginY;
							ctx.save();
							if (Game.prefs.fancy) ctx.drawImage(Pic('cookieShadow.png'),x-s/2,y-s/2+20,s,s);
							ctx.translate(x,y);
							if (Game.season=='easter')
							{
								var nestW=304*0.98*Game.BigCookieSize;
								var nestH=161*0.98*Game.BigCookieSize;
								ctx.drawImage(Pic('nest.png'),-nestW/2,-nestH/2+130,nestW,nestH);
							}
							//ctx.rotate(((Game.startDate%360)/360)*Math.PI*2);
							ctx.drawImage(Pic('perfectCookie.png'),-s/2,-s/2,s,s);
							
							if (goodBuff && Game.prefs.particles)//sparkle
							{
								ctx.globalCompositeOperation='lighter';
								for (var i=0;i<1;i++)
								{
									ctx.globalAlpha=Math.random()*0.65+0.1;
									var size=Math.random()*30+5;
									var a=Math.random()*Math.PI*2;
									var d=s*0.9*Math.random()/2;
									ctx.drawImage(Pic('glint.png'),-size/2+Math.sin(a)*d,-size/2+Math.cos(a)*d,size,size);
								}
							}
							
							ctx.restore();
							Timer.track('big cookie');
						}
					}
					else//no particles
					{
						
						if (showDragon)
						{
							//big dragon
							var s=300*2*(1+Math.sin(Game.T*0.013)*0.1);
							var x=Game.cookieOriginX-s/2;
							var y=Game.cookieOriginY-s/(1.4+0.2*Math.sin(Game.T*0.01));
							ctx.drawImage(Pic('dragonBG.png'),x,y,s,s);
						}
					
						//big cookie
						ctx.globalAlpha=1;
						var s=256*Game.BigCookieSize;
						var x=Game.cookieOriginX-s/2;
						var y=Game.cookieOriginY-s/2;
						if (Game.prefs.fancy) ctx.drawImage(Pic('cookieShadow.png'),x,y+20,s,s);
						ctx.drawImage(Pic('perfectCookie.png'),x,y,s,s);
					
					}

					Crumbs.drawObjects();
				}
				else
				{
					var tBase=Math.max(0,(Game.AscendTimer-Game.AscendBreakpoint)/(Game.AscendDuration-Game.AscendBreakpoint));
					//big crumbling cookie
					//var t=(3*Math.pow(tBase,2)-2*Math.pow(tBase,3));//S curve
					var t=Math.pow(tBase,0.5);
					
					var shake=0;
					if (Game.AscendTimer<Game.AscendBreakpoint) {shake=Game.AscendTimer/Game.AscendBreakpoint;}
					//else {shake=1-t;}

					ctx.globalAlpha=1;
					
					var x=Game.cookieOriginX;
					var y=Game.cookieOriginY;
					
					x+=(Math.random()*2-1)*10*shake;
					y+=(Math.random()*2-1)*10*shake;
					
					var s=1;
					if (tBase>0)
					{
						ctx.save();
						ctx.globalAlpha=1-Math.pow(t,0.5);
						ctx.translate(x,y);
						ctx.globalCompositeOperation='lighter';
						ctx.rotate(Game.T*0.007);
						s=0.5+Math.pow(tBase,0.6)*1;
						var s2=(600)*s;
						ctx.drawImage(Pic('heavenRing1.jpg'),-s2/2,-s2/2,s2,s2);
						ctx.rotate(-Game.T*0.002);
						s=0.5+Math.pow(1-tBase,0.4)*1;
						s2=(600)*s;
						ctx.drawImage(Pic('heavenRing2.jpg'),-s2/2,-s2/2,s2,s2);
						ctx.restore();
					}
					
					s=256;//*Game.BigCookieSize;
					
					ctx.save();
					ctx.translate(x,y);
					ctx.rotate((t*(-0.1))*Math.PI*2);
					
					var chunks={0:7,1:6,2:3,3:2,4:8,5:1,6:9,7:5,8:0,9:4};
					s*=t/2+1;
					/*ctx.globalAlpha=(1-t)*0.33;
					for (var i=0;i<10;i++)
					{
						var d=(t-0.2)*(80+((i+2)%3)*40);
						ctx.drawImage(Pic('brokenCookie.png'),256*(chunks[i]),0,256,256,-s/2+Math.sin(-(((chunks[i]+4)%10)/10)*Math.PI*2)*d,-s/2+Math.cos(-(((chunks[i]+4)%10)/10)*Math.PI*2)*d,s,s);
					}
					ctx.globalAlpha=(1-t)*0.66;
					for (var i=0;i<10;i++)
					{
						var d=(t-0.1)*(80+((i+2)%3)*40);
						ctx.drawImage(Pic('brokenCookie.png'),256*(chunks[i]),0,256,256,-s/2+Math.sin(-(((chunks[i]+4)%10)/10)*Math.PI*2)*d,-s/2+Math.cos(-(((chunks[i]+4)%10)/10)*Math.PI*2)*d,s,s);
					}*/
					ctx.globalAlpha=1-t;
					for (var i=0;i<10;i++)
					{
						var d=(t)*(80+((i+2)%3)*40);
						var x2=(Math.random()*2-1)*5*shake;
						var y2=(Math.random()*2-1)*5*shake;
						ctx.drawImage(Pic('brokenCookie.png'),256*(chunks[i]),0,256,256,-s/2+Math.sin(-(((chunks[i]+4)%10)/10)*Math.PI*2)*d+x2,-s/2+Math.cos(-(((chunks[i]+4)%10)/10)*Math.PI*2)*d+y2,s,s);
					}
					var brokenHalo=1-Math.min(t/(1/3),1/3)*3;
					if (Game.AscendTimer<Game.AscendBreakpoint) brokenHalo=Game.AscendTimer/Game.AscendBreakpoint;
					ctx.globalAlpha=brokenHalo;
					ctx.drawImage(Pic('brokenCookieHalo.png'),-s/1.3333,-s/1.3333,s*1.5,s*1.5);
					
					ctx.restore();
					
					//flares
					var n=9;
					var t=Game.AscendTimer/Game.AscendBreakpoint;
					if (Game.AscendTimer<Game.AscendBreakpoint)
					{
						ctx.save();
						ctx.translate(x,y);
						for (var i=0;i<n;i++)
						{
							if (Math.floor(t/3*n*3+i*2.7)%2)
							{
								var t2=Math.pow((t/3*n*3+i*2.7)%1,1.5);
								ctx.globalAlpha=(1-t)*(Game.drawT%2==0?0.5:1);
								var sw=(1-t2*0.5)*96;
								var sh=(0.5+t2*1.5)*96;
								ctx.drawImage(Pic('shineSpoke.png'),-sw/2,-sh-32-(1-t2)*256,sw,sh);
							}
							ctx.rotate(Math.PI*2/n);
						}
						ctx.restore();
					}
					
					
					//flash at breakpoint
					if (tBase<0.1 && tBase>0)
					{
						ctx.globalAlpha=1-tBase/0.1;
						ctx.fillStyle='#fff';
						ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
						ctx.globalAlpha=1;
					}
					if (tBase>0.8)
					{
						ctx.globalAlpha=(tBase-0.8)/0.2;
						ctx.fillStyle='#000';
						ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
						ctx.globalAlpha=1;
					}
				}
				
				//milk and milk accessories
				if (Game.prefs.milk)
				{
					var width=ctx.canvas.width;
					var height=ctx.canvas.height;
					var x=Math.floor((Game.T*2-(Game.milkH-Game.milkHd)*2000+480*2)%480);//Math.floor((Game.T*2+Math.sin(Game.T*0.1)*2+Math.sin(Game.T*0.03)*2-(Game.milkH-Game.milkHd)*2000+480*2)%480);
					var y=(Game.milkHd)*height;//(((Game.milkHd)*ctx.canvas.height)*(1+0.05*(Math.sin(Game.T*0.017)/2+0.5)));
					var a=1;
					if (Game.AscendTimer>0)
					{
						y*=1-Math.pow((Game.AscendTimer/Game.AscendBreakpoint),2)*2;
						a*=1-Math.pow((Game.AscendTimer/Game.AscendBreakpoint),2)*2;
					}
					else if (Game.ReincarnateTimer>0)
					{
						y*=1-Math.pow(1-(Game.ReincarnateTimer/Game.ReincarnateDuration),2)*2;
						a*=1-Math.pow(1-(Game.ReincarnateTimer/Game.ReincarnateDuration),2)*2;
					}
					
					if (Game.TOYS)
					{
						//golly
						if (!Game.Toy)
						{
							Game.toys=[];
							Game.toysType=choose([1,2]);
							Game.Toy=function(x,y)
							{
								this.id=Game.toys.length;
								this.x=x;
								this.y=y;
								this.xd=Math.random()*10-5;
								this.yd=Math.random()*10-5;
								this.r=Math.random()*Math.PI*2;
									this.rd=Math.random()*0.1-0.05;
									var v=Math.random();var a=0.5;var b=0.5;
									if (v<=a) v=b-b*Math.pow(1-v/a,3); else v=b+(1-b)*Math.pow((v-a)/(1-a),3);
								this.s=(Game.toysType==1?64:48)*(0.1+v*1.9);
								if (Game.toysType==2) this.s=(this.id%10==1)?96:48;
								this.st=this.s;this.s=0;
									var cookies=[[10,0]];
									for (var i in Game.Upgrades)
									{
										var cookie=Game.Upgrades[i];
										if (cookie.bought>0 && cookie.pool=='cookie') cookies.push(cookie.icon);
									}
								this.icon=choose(cookies);
								this.dragged=false;
								this.l=document.createElement('div');
								this.l.innerHTML=this.id;
								this.l.style.cssText='cursor:pointer;border-radius:'+(this.s/2)+'px;opacity:0;width:'+this.s+'px;height:'+this.s+'px;background:#999;position:absolute;left:0px;top:0px;z-index:10000000;transform:translate(-1000px,-1000px);';
								l('sectionLeft').appendChild(this.l);
								AddEvent(this.l,'mousedown',function(what){return function(){what.dragged=true;};}(this));
								AddEvent(this.l,'mouseup',function(what){return function(){what.dragged=false;};}(this));
								Game.toys.push(this);
								return this;
							}
							for (var i=0;i<Math.floor(Math.random()*15+(Game.toysType==1?5:30));i++)
							{
								new Game.Toy(Math.random()*width,Math.random()*height*0.3);
							}
						}
						ctx.globalAlpha=0.5;
						for (var i in Game.toys)
						{
							var me=Game.toys[i];
							ctx.save();
							ctx.translate(me.x,me.y);
							ctx.rotate(me.r);
							if (Game.toysType==1) ctx.drawImage(Pic('smallCookies.png'),(me.id%8)*64,0,64,64,-me.s/2,-me.s/2,me.s,me.s);
							else ctx.drawImage(Pic('icons.png'),me.icon[0]*48,me.icon[1]*48,48,48,-me.s/2,-me.s/2,me.s,me.s);
							ctx.restore();
						}
						ctx.globalAlpha=1;
						for (var i in Game.toys)
						{
							var me=Game.toys[i];
							//psst... not real physics
							for (var ii in Game.toys)
							{
								var it=Game.toys[ii];
								if (it.id!=me.id)
								{
									var x1=me.x+me.xd;
									var y1=me.y+me.yd;
									var x2=it.x+it.xd;
									var y2=it.y+it.yd;
									var dist=Math.sqrt(Math.pow((x1-x2),2)+Math.pow((y1-y2),2))/(me.s/2+it.s/2);
									if (dist<(Game.toysType==1?0.95:0.75))
									{
										var angle=Math.atan2(y1-y2,x1-x2);
										var v1=Math.sqrt(Math.pow((me.xd),2)+Math.pow((me.yd),2));
										var v2=Math.sqrt(Math.pow((it.xd),2)+Math.pow((it.yd),2));
										var v=((v1+v2)/2+dist)*0.75;
										var ratio=it.s/me.s;
										me.xd+=Math.sin(-angle+Math.PI/2)*v*(ratio);
										me.yd+=Math.cos(-angle+Math.PI/2)*v*(ratio);
										it.xd+=Math.sin(-angle-Math.PI/2)*v*(1/ratio);
										it.yd+=Math.cos(-angle-Math.PI/2)*v*(1/ratio);
										me.rd+=(Math.random()*1-0.5)*0.1*(ratio);
										it.rd+=(Math.random()*1-0.5)*0.1*(1/ratio);
										me.rd*=Math.min(1,v);
										it.rd*=Math.min(1,v);
									}
								}
							}
							if (me.y>=height-(Game.milkHd)*height+8)
							{
								me.xd*=0.85;
								me.yd*=0.85;
								me.rd*=0.85;
								me.yd-=1;
								me.xd+=(Math.random()*1-0.5)*0.3;
								me.yd+=(Math.random()*1-0.5)*0.05;
								me.rd+=(Math.random()*1-0.5)*0.02;
							}
							else
							{
								me.xd*=0.99;
								me.rd*=0.99;
								me.yd+=1;
							}
							me.yd*=(Math.min(1,Math.abs(me.y-(height-(Game.milkHd)*height)/16)));
							me.rd+=me.xd*0.01/(me.s/(Game.toysType==1?64:48));
							if (me.x<me.s/2 && me.xd<0) me.xd=Math.max(0.1,-me.xd*0.6); else if (me.x<me.s/2) {me.xd=0;me.x=me.s/2;}
							if (me.x>width-me.s/2 && me.xd>0) me.xd=Math.min(-0.1,-me.xd*0.6); else if (me.x>width-me.s/2) {me.xd=0;me.x=width-me.s/2;}
							me.xd=Math.min(Math.max(me.xd,-30),30);
							me.yd=Math.min(Math.max(me.yd,-30),30);
							me.rd=Math.min(Math.max(me.rd,-0.5),0.5);
							me.x+=me.xd;
							me.y+=me.yd;
							me.r+=me.rd;
							me.r=me.r%(Math.PI*2);
							me.s+=(me.st-me.s)*0.5;
							if (Game.toysType==2 && !me.dragged && Math.random()<0.003) me.st=choose([48,48,48,48,96]);
							if (me.dragged)
							{
								me.x=Game.mouseX;
								me.y=Game.mouseY;
								me.xd+=((Game.mouseX-Game.mouseX2)*3-me.xd)*0.5;
								me.yd+=((Game.mouseY-Game.mouseY2)*3-me.yd)*0.5
								me.l.style.transform='translate('+(me.x-me.s/2)+'px,'+(me.y-me.s/2)+'px) scale(50)';
							}
							else me.l.style.transform='translate('+(me.x-me.s/2)+'px,'+(me.y-me.s/2)+'px)';
							me.l.style.width=me.s+'px';
							me.l.style.height=me.s+'px';
							ctx.save();
							ctx.translate(me.x,me.y);
							ctx.rotate(me.r);
							if (Game.toysType==1) ctx.drawImage(Pic('smallCookies.png'),(me.id%8)*64,0,64,64,-me.s/2,-me.s/2,me.s,me.s);
							else ctx.drawImage(Pic('icons.png'),me.icon[0]*48,me.icon[1]*48,48,48,-me.s/2,-me.s/2,me.s,me.s);
							ctx.restore();
						}
					}
					
					/*var pic=Game.Milk.pic;
					if (Game.milkType!=0 && Game.ascensionMode!=1) pic=Game.AllMilks[Game.milkType].pic;
					ctx.globalAlpha=0.95*a;
					ctx.fillPattern(Pic(pic),0,height-y,width+480,1,480,480,x,0);*/
					
					ctx.fillStyle='#000';
					ctx.fillRect(0,height-y+480,width,Math.max(0,(y-480)));
					ctx.globalAlpha=1;
					
					Timer.track('milk');
				}
				
				if (Game.AscendTimer>0)
				{
					ctx.drawImage(Pic('shadedBordersSoft.png'),0,0,ctx.canvas.width,ctx.canvas.height);
				}
				
				if (Game.AscendTimer==0)
				{
					Game.DrawWrinklers();Timer.track('wrinklers');
					
					//shimmering veil
					if (Game.Has('Shimmering veil [off]'))
					{
						/*
						ctx.globalAlpha=1;
						ctx.globalCompositeOperation='lighter';
						var s=300+Math.sin(Game.T*0.037)*20;
						var x=Game.cookieOriginX;
						var y=Game.cookieOriginY;
						ctx.save();
						ctx.translate(x,y);
						ctx.rotate(-Game.T*0.01);
						ctx.drawImage(Pic('shimmeringVeil.png'),-s/2,-s/2,s,s);
						ctx.restore();
						if (Game.prefs.particles)//sparkles
						{
							for (i=0;i<6;i++)
							{
								var t=Game.T+i*15;
								var r=(t%30)/30;
								var a=(Math.floor(t/30)*30*6-i*30)*0.01;
								var size=32*(1-Math.pow(r*2-1,2));
								var xx=x+Math.sin(a)*(110+r*16);
								var yy=y+Math.cos(a)*(110+r*16);
								ctx.drawImage(Pic('glint.png'),xx-size/2,yy-size/2,size,size);
							}
						}*/
						ctx.globalCompositeOperation='source-over';
					}
					
					Game.DrawSpecial();Timer.track('evolvables');
					
					Game.particlesDraw(2);Timer.track('text particles');
					
					//shiny border during frenzies etc
					ctx.globalAlpha=1;
					var borders='shadedBordersSoft.png';
					if (goodBuff) borders='shadedBordersGold.png';
					else if (badBuff) borders='shadedBordersRed.png';
					if (goodBuff && Game.prefs.fancy) ctx.globalCompositeOperation='lighter';
					ctx.drawImage(Pic(borders),0,0,ctx.canvas.width,ctx.canvas.height);
					if (goodBuff && Game.prefs.fancy) ctx.globalCompositeOperation='source-over';
				}
			}
	};
	Crumbs.h.resolveInjects();
	Game.registerHook('check', Crumbs.h.resolveInjects);

	CrumbsEngineLoaded = true;
};

Game.registerMod('Crumbs engine', {
	init: Crumbs_Init_On_Load,
	save: function() { },
	load: function() { }
});
