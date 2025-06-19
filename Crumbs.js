if (typeof Crumbs !== 'object') { var Crumbs = {}; }

let CrumbsEngineLoaded = false;
var crumbs_load_local = false;
const Crumbs_Init_On_Load = function() {
	if (l('topbarFrenzy')) { return; }

	Crumbs.version = 'v1.0';
	
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
		Crumbs.h.CSSInjects = [];
		style.textContent = str;
		l('game').appendChild(style);
	}
	//t is object representing rect, where w -> width, h -> height, r -> rotation, x -> x origin, y -> y origin (by default rect has (0, 0) as its top left corner)
	Crumbs.h.inRect = function(x,y,t) {let c=Math.cos(-t.r);let s=Math.sin(-t.r);let a=x*c-y*s;let b=x*s+y*c;return (a>-t.x&&a<t.w-t.x&&b>-t.y&&b<t.h-t.y);}
	Crumbs.h.inRectOld = function(x,y,rect) {
		var dx = x+Math.sin(-rect.r)*(-(rect.h/2-rect.o)),dy=y+Math.cos(-rect.r)*(-(rect.h/2-rect.o));
		var h1 = Math.sqrt(dx*dx + dy*dy);
		var currA = Math.atan2(dy,dx);
		var newA = currA - rect.r;
		var x2 = Math.cos(newA) * h1;
		var y2 = Math.sin(newA) * h1;
		if (x2 > -0.5 * rect.w && x2 < 0.5 * rect.w && y2 > -0.5 * rect.h && y2 < 0.5 * rect.h) return true;
		return false;
	}
	//checks for if (x,y) is in 0,0 centered ellipse with horizontal radii rx, vertical radii ry, x origin ox, y origin oy, and rotation r
	Crumbs.h.inOval = function(x,y,rx,ry,ox,oy,r) {let c=Math.cos(-r);let s=Math.sin(-r);let a=x*c-y*s+ox;let b=x*s+y*c+oy;return ((a*a)/(rx*rx)+(b*b)/(ry*ry))<=1;}
	Crumbs.h.rv = function(r, x, y) {
		//rotates the given vector by "r"
		const c = Math.cos(-r);
		const s = Math.sin(-r);
		return [
			x * c - y * s,
			x * s + y * c
		];
	}
	Crumbs.h.isTouchDevice = function () {
		const userAgent = navigator.userAgent.toLowerCase();

		const touchDevices = [
			'iphone', 'ipod', 'android', 'blackberry', 'windows phone', 'tablet', 'mobile', 'touch'
		];
		const isTouchScreenDevice = touchDevices.some(agent => userAgent.includes(agent));

		const isTouchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

		return isTouchScreenDevice && isTouchSupported;
	}
	if (Crumbs.h.isTouchDevice()) { Crumbs.mobile = true; }
	else { Crumbs.mobile = false; }
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
	Crumbs.h.blend = function(type, data1, data2) {
		if (data1.width != data2.width || data1.height != data2.height) { throw 'Width and height not matching!'; }
		let newData = new ImageData(new Uint8ClampedArray(data1.data.length), data1.width, data1.height);
		let d1 = data1.data;
		let d2 = data2.data;
		if (type == 'additive') {
			for (let i = 0; i < d1.length; i++) {
				newData.data[i] = d1[i] + d2[i];
			}
			return newData;
		}
		throw 'Type '+type+'does not match any valid type!';
	}
	Crumbs.h.gaussian = function(arr, factor, abyss) {
		if (!Array.isArray(arr)) { throw 'Argument "arr" is not an array!'; }
		if (typeof factor !== 'number') { throw 'Argument "factor" should be a number, when it is in fact '+(typeof factor)+'!'; }
		return Crumbs.h.matrixApply(arr, Crumbs.h.gaussianMatrix(factor), Math.floor(factor * 3) - 1, abyss);
	}
	Crumbs.h.gaussianMatrix = function(factor) {
		//precompute matrix
		let m = [];
		for (let i = 0; i < factor * 3; i++) {
			m.push(Math.exp(-(i ** 2) / (2 * factor)) / Math.sqrt(2 * Math.PI * factor));
		}
		for (let i = 1; i < m.length; i += 2) { 
			m.unshift(m[i]);
		}
		return m;
	}
	Crumbs.h.matrixApply = function(arr, m, center, abyss) {
		let arr2 = [];
		for (let i = 0; i < arr.length; i++) {
			let val = 0;
			for (let ii = center + 1; ii < m.length; ii++) {
				const a = i + ii - center;
				if (a < arr.length) { val += arr[a] * m[ii]; } else { val += abyss * m[ii]; }
			}
			for (let ii = center; ii >= 0; ii--) {
				const a = i + ii - center;
				if (a >= 0) { val += arr[a] * m[ii]; } else { val += abyss * m[ii]; }
			}
			arr2.push(val);
		}
		return arr2;
	}
	Crumbs.h.matrixApplyUint8 = function(arr, m, center, abyss) {
		let arr2 = new Uint8ClampedArray(arr.length);
		for (let i = 0; i < arr.length; i++) {
			let val = 0;
			for (let ii = center + 1; ii < m.length; ii++) {
				const a = i + ii - center;
				if (a < arr.length) { val += arr[a] * m[ii]; } else { val += abyss * m[ii]; }
			}
			for (let ii = center; ii >= 0; ii--) {
				const a = i + ii - center;
				if (a >= 0) { val += arr[a] * m[ii]; } else { val += abyss * m[ii]; }
			}
			arr2[i] = val;
		}
		return arr2;
	}
	Crumbs.h.gaussianBlur = function(Uint8, width, length, factor, abyss) {
		const m = Crumbs.h.gaussianMatrix(factor);
		const c = Math.floor(factor * 3 - 1);

		let a = [];
		for (let i = 0; i < length; i++) {
			a.push(new Uint8ClampedArray(width));
		}
		for (let i = 0; i < length; i++) {
			for (let ii = 0; ii < width; ii++) {
				a[i][ii] = Uint8[i * width + ii];
			}
		}
		for (let i = 0; i < length; i++) {
			a[i] = Crumbs.h.matrixApplyUint8(a[i], m, c, abyss);
		}
		Uint8 = new Uint8ClampedArray(Uint8.length);
		for (let i = 0; i < length; i++) {
			for (let ii = 0; ii < width; ii++) {
				Uint8[i * width + ii] = a[i][ii];
			}
		}

		a = [];
		for (let i = 0; i < width; i++) {
			a.push(new Uint8ClampedArray(length));
		}
		for (let i = 0; i < width; i++) {
			for (let ii = 0; ii < length; ii++) {
				a[i][ii] = Uint8[i * length + ii];
			}
		}
		for (let i = 0; i < width; i++) {
			a[i] = Crumbs.h.matrixApplyUint8(a[i], m, c, abyss);
		}
		let toReturn = new Uint8ClampedArray(Uint8.length);
		for (let i = 0; i < width; i++) {
			for (let ii = 0; ii < length; ii++) {
				toReturn[i * length + ii] = a[i][ii];
			}
		}
		return toReturn;
	}
	Crumbs.h.gaussianBlurColor = function(imageData, factor, abyss) {
		const data = imageData.data;
		let r = new Uint8ClampedArray(data.length / 4), g = new Uint8ClampedArray(data.length / 4), b = new Uint8ClampedArray(data.length / 4), a = new Uint8ClampedArray(data.length / 4);
		const w = imageData.width;
		const h = imageData.height
		for (let i = 0; i < imageData.length / 4; i++) {
			const p = i * 4;
			r[i] = data[p];
			g[i] = data[p + 1];
			b[i] = data[p + 2];
			a[i] = data[p + 3];
		}
		r = Crumbs.h.gaussianBlur(r, w, h, factor, abyss);
		g = Crumbs.h.gaussianBlur(g, w, h, factor, abyss);
		b = Crumbs.h.gaussianBlur(b, w, h, factor, abyss);
		a = Crumbs.h.gaussianBlur(a, w, h, factor, abyss);
		let newData = new Uint8ClampedArray(data.length);
		for (let i = 0; i < r.length; i++) {
			const p = i * 4;
			newData[p] = r[i];
			newData[p + 1] = g[i];
			newData[p + 2] = b[i];
			newData[p + 3] = a[i];
		}
		imageData.data = newData;
		return imageData;
	}
	Crumbs.h.grayscaleMap = function(imageData) {
		const data = imageData.data;
		let newData = new Uint8ClampedArray(data.length / 4);
		for (let i = 0; i < data.length / 4; i++) {
			const p = i * 4;
			newData[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
		}
		return newData;
	}
	Crumbs.h.fillPattern = function(ctx, img, w, h, dx, dy, dw, dh, sx, sy, sw, sh, offx, offy) {
		if (img.alt != 'blank') {
			[dx, dy, dw, dh, sx, sy, sw, sh, offx, offy] = [dx||0, dy||0, dw||img.width, dh||img.height, sx||0, sy||0, sw||img.width, sh||img.height, offx||0, offy||0];

			if (offx<0) { offx -= Math.floor(offx / dw) * dw; }
			else if (offx>0) { offx = (offx % dw) - dw; }
			if (offy<0) { offy -= Math.floor(offy / dh) * dh; }
			else if (offy>0) { offy = (offy % dh) - dh; }

			for (let y = offy; y < h; y += dh) {
				for (let x = offx; x < w; x += dw) {
					ctx.drawImage(img, sx, sy, sw, sh, dx+x, dy+y, dw, dh);
					// console.log(img.src.slice(25), sx, sy, sw, sh, dx+x, dy+y, dw, dh)
				}
			}
		}
	}
	Crumbs.h.pointOnRotatedEllipse = function(cx, cy, rx, ry, rotation, theta) {
  		const xUnrot = rx * Math.cos(theta);
  		const yUnrot = ry * Math.sin(theta);
  		const cosR = Math.cos(rotation);
  		const sinR = Math.sin(rotation);
  		return [cx + xUnrot * cosR - yUnrot * sinR, cy + xUnrot * sinR + yUnrot * cosR];
	}

	Loader = function() {
        this.loadingN=0;
        this.assetsN=0;
        this.assets = { };
        this.assetsLoading = new Set();
        this.assetsLoaded = new Set();
        this.domain = '';
        this.loaded = 0;
        this.doneLoading = 0;

        this.blank = document.createElement('canvas');
        this.blank.width = 8;
        this.blank.height = 8;
        this.blank.alt = 'blank';

		this[undefined] = this.blank;

        this.Load=function(assets) {
            for (let i in assets) {
                this.loadingN++;
                this.assetsN++;
                let asset = assets[i];
                if (!this.assetsLoading.has(asset) && !this.assetsLoaded.has(asset))
                {
                    let img=new Image();
                    if (!Game.local) img.crossOrigin = 'anonymous';
                    img.alt = asset;
                    img.onload = bind(this, this.onLoad);
                    this.assets[asset] = img;
                    this.assetsLoading.add(asset);
                    if (asset.indexOf('/')!=-1) img.src = asset;
                    else img.src = this.domain + asset;
                }
            }
        }
        this.Replace = function(old, newer) {
            if (!this.assets[old]) this.Load([old]);
            let img = new Image();
            if (!Game.local) img.crossOrigin = 'anonymous';
            if (newer.indexOf('/') != -1) img.src = newer;
            else img.src = this.domain + newer;
            img.alt = newer;
            img.onload = bind(this, this.onLoad);
            this.assets[old] = img;
        }
        this.onLoadReplace = function() { }
        this.onLoad = function(e) {
            this.assetsLoaded.add(e.target.alt);
            this.assetsLoading.delete(e.target.alt);
            this.loadingN--;
            if (this.doneLoading == 0 && this.loadingN <= 0 && this.loaded != 0) {
                this.doneLoading=1;
                this.loaded();
            }
        }
        this.waitForLoad=function(assets,callback)
        {
            //execute callback if all assets are ready to use, else check again every 200ms
            let me = this;
            let checkLoadedLoop = function() {
                for (let i = 0; i < assets.length; i++) {
                    if (!me.assetsLoaded.has(assets[i])) { setTimeout(checkLoadedLoop,200); return false }
                }
                callback();
                return true;
            }
            me.Load(assets);
            checkLoadedLoop();
        }
        this.getProgress=function() {
            return (1 - this.loadingN / this.assetsN);
        }
    }

    Pic = function(what) {
        return Game.Loader.assetsLoaded.has(what) ? Game.Loader.assets[what] : (what && !Game.Loader.assetsLoading.has(what) && Game.Loader.Load([what]), Game.Loader.blank);
    }


	Crumbs.t = 0; //saved
	Game.registerHook('logic', function() { Crumbs.t++; });

	Crumbs.objects = {};
	Crumbs.sortedObjectList = {};
	Crumbs.prefs = {
		objects: { },
		particles: { },
		anchorDisplay: 0,
		colliderDisplay: 0,
		warnDuplicateComponents: 1
	}
	Crumbs.particles = {};

	Crumbs.createCanvas = function(id, parentElement, css) {
		let div = document.createElement('canvas');
		div.id = id; div.style.background = 'none'; 
		let cont = document.createElement('div');
		cont.classList.add('CrumbsCanvaContainer');
		if (css) { cont.style = css; }
		cont.appendChild(div);
		parentElement.appendChild(cont);
		return l(id);
	}
	Crumbs.scopedCanvas = { };
	Crumbs.validScopes = [];
	Crumbs.canvas = function(parentEle, key, id, css) {
		this.l = Crumbs.createCanvas(id, parentEle, css);
		this.c = this.l.getContext('2d');
		this.key = key;
		this.shaders = [];

		this.background = 'none';

		this.mouseX = 0;
		this.mouseY = 0;

		Crumbs.scopedCanvas[key] = this;
		Crumbs.objects[key] = [];
		this.objects = Crumbs.objects[key];
		Crumbs.particles[key] = [];
		Crumbs.sortedObjectList[key] = [];
		this.sortedObjects = Crumbs.sortedObjectList[key];
		Crumbs.validScopes.push(key);
		Crumbs.prefs.objects[key] = 1;
		Crumbs.prefs.particles[key] = 1;
	}
	Crumbs.canvas.prototype.setSelf = function() {
		this.l.width = this.l.parentNode.offsetWidth;
		this.l.height = this.l.parentNode.offsetHeight;
		this.mouseX = Game.mouseX - this.l.getBoundingClientRect().left;
		this.mouseY = Game.mouseY - this.l.getBoundingClientRect().top + (App?0:32);
	}
	Crumbs.canvas.prototype.getShader = function(type) {
		for (let i of this.shaders) {
			if (i.type == type) { return i; }
		}
	}
	Crumbs.canvas.prototype.getAllShaders = function(type) {
		let arr = [];
		for (let i of this.shaders) {
			if (i.type == type) { arr.push(i); }
		}
		return arr;
	}
	Crumbs.canvas.prototype.addShader = function(shader, index) {
		if (index < 0) { throw 'Index must be 0 or a positive number.'; }
		if (typeof index === 'undefined') { index = this.shaders.length; }
		if (typeof index !== 'number') { throw 'Index must be a number.'; }
		this.shaders.splice(index, 0, shader);
	}
	Crumbs.h.injectCSS(`.CrumbsCanvaContainer { width: 100%; height: 100%; position: absolute; pointer-events: none; }`);

	new Crumbs.canvas(l('game'), 'foreground', 'foregroundCanvas', 'z-index: 2147483647; ');
	new Crumbs.canvas(l('sectionLeft'), 'left', 'leftCanvas', 'position: absolute; top: 0; left: 0; z-index: 5;'); l('backgroundLeftCanvas').style.display = 'none';
	Game.LeftBackground = Crumbs.scopedCanvas.left.c;
	new Crumbs.canvas(l('rows'), 'middle', 'middleCanvas', 'z-index: 2147483647; position: absolute; top: 0; left: 0;');
	new Crumbs.canvas(l('store'), 'right', 'rightCanvas', 'z-index: 2147483647; position: absolute; top: 0; left: 0;');
	l('backgroundCanvas').remove(); 
	new Crumbs.canvas(l('game'), 'background', 'backgroundCanvas', 'z-index: -1000000000'); 
	Game.Background = Crumbs.scopedCanvas.background.c;

	Crumbs.updateCanvas = function() {
		for (let i in Crumbs.scopedCanvas) {
			Crumbs.scopedCanvas[i].setSelf();
		}
	};
	Crumbs.updateCanvas();
	window.addEventListener('resize',function(event) {
		Crumbs.updateCanvas();
	});
	
	Crumbs.getCanvasByScope = function(s) {
		return Crumbs.scopedCanvas[s].c;
	};
	Crumbs.settings = {
		globalCompositeOperation: 'source-over',
		imageSmoothingEnabled: true,
		imageSmoothingQuality: 'low'
	};
	Crumbs.unfocusedSpawn = true;
	Crumbs.object = function(obj, parent) {
		//idk what would happen if I used the traditional class structure in here and honestly im too lazy to find out
		if (typeof obj === 'undefined') { obj = {}; }
		if (typeof obj !== 'object') { throw 'Crumbs.object constructor parameter must be an object or undefined.'; }
		//stuff: enabled, parent, scope, imgs, imgUsing, id, order, x, y, behaviors, alpha, width, height, offsetX, offsetY, scaleX, scaleY, noDraw, children
		for (let i in Crumbs.objectDefaults) {
			this[i] = Crumbs.objectDefaults[i];
		}
		for (let i in obj) {
			this[i] = obj[i];
		}
		if (parent) { this.parent = parent; }
		
		this.t = Crumbs.t; //the time when it was created
		this.scaleFactorX = 1;
		this.scaleFactorY = 1;
	};
	Crumbs.behaviorSym = Symbol('f');
	Crumbs.initSym = Symbol('init');
	Crumbs.behavior = function(func, init) {
		this[Crumbs.behaviorSym] = func;
		this.init = init;
		if (typeof init === 'function') { 
			this[Crumbs.initSym] = init;
		} else {
			for (let i in init) {
				this[i] = init[i];
			}
		}
	};
	Crumbs.behavior.prototype.replace = function(original, newCode) {
		eval('this[Crumbs.behaviorSym]='+this[Crumbs.behaviorSym].toString().replace(original, newCode));
		return this;
	};
	Crumbs.behavior.prototype.inject = function(line, code) {
		const funcStr = this[Crumbs.behaviorSym].toString();
		let lines = funcStr.split('\n');
		lines.splice(line, 0, code);
		eval('this[Crumbs.behaviorSym]='+lines.join('\n'));
		return this;
	}
	Crumbs.behaviorInstance = function(b, init) {
		if (typeof b === 'function') {
			b = new Crumbs.behavior(b);
		}
		if (typeof b === 'object') { 
			const bb = b[Crumbs.initSym] && b[Crumbs.initSym].call(this);
			if (bb) {
				for (let i in bb) { this[i] = bb[i]; }
			} else {
				for (let i in b) {
					this[i] = b[i];
				}
			}
		}
		this[Crumbs.behaviorSym] = b;
		const t = typeof init;
		if (t === 'object') {
			for (let i in init) { this[i] = init[i]; }
		}
		if (t === 'function') {
			init.call(this);
		}
	}
	Crumbs.behaviorInstance.prototype.reset = function() {
		const b = this[Crumbs.behaviorSym];
		const bb = b[Crumbs.initSym] && b[Crumbs.initSym].call(this);
		if (bb) {
			for (let i in bb) { this[i] = bb[i]; }
		} else {
			for (let i in b) {
				this[i] = b[i];
			}
		}
		this[Crumbs.behaviorSym] = b;
	}
	Crumbs.behaviorInstance.prototype.getBehavior = function() {
		return this[Crumbs.behaviorSym];
	}
	Crumbs.anchor = function(x, y) {
		this.x = x;
		this.y = y;
	}
	Crumbs.defaultAnchors = {
		'top-left': new Crumbs.anchor(0, 0),
		'top': new Crumbs.anchor(0.5, 0),
		'top-right': new Crumbs.anchor(1, 0),
		'left': new Crumbs.anchor(0, 0.5),
		'center': new Crumbs.anchor(0.5, 0.5),
		'right': new Crumbs.anchor(1, 0.5),
		'bottom-left': new Crumbs.anchor(0, 1),
		'bottom': new Crumbs.anchor(0.5, 1),
		'bottom-right': new Crumbs.anchor(1, 1)
	}
	Crumbs.object.prototype.setAnchor = function(anchor) {
		this.anchor = Crumbs.defaultAnchors[anchor] || anchor;
		if (typeof this.anchor === 'string') { throw '"'+anchor+'" is not a valid anchor!"'; }
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
		imgs: [],
		imgUsing: 0,
		scope: Crumbs.scopedCanvas['foreground'],
		anchor: Crumbs.defaultAnchors.center,
		init: null, //Crumbs.objectInits.default, set after it is initialized
		behaviors: null, //Crumbs.objectBehaviors.idle, set after it is initialized
		id: null,
		order: 0,
		width: null,
		height: null,
		offsetX: 0,
		offsetY: 0,
		sx: 0,
		sy: 0,
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
	Crumbs.object.prototype.getInfo = function() {
		return this; 
	};
	Crumbs.object.prototype.commenceInit = function() {
		const c = [].concat(this.components);
		this.components = [];
		for (let i in c) { this.addComponent(c[i]); }
		if (!Array.isArray(this.behaviors)) { this.behaviors = [].concat(this.behaviors); }
		for (let i in this.behaviors) {
			if (this.behaviors[i] instanceof Crumbs.behaviorInstance) { continue; }
			else if (this.behaviors[i] instanceof Crumbs.behavior) { this.behaviors[i] = new Crumbs.behaviorInstance(this.behaviors[i]); }
			else if (typeof this.behaviors[i] === 'function') { this.behaviors[i] = new Crumbs.behaviorInstance(new Crumbs.behavior(this.behaviors[i])); }
			else { throw 'Object behavior must be an instance of Crumbs.behavior, Crumbs.behaviorInstance, or is a function!'; }
		}

		if (!Array.isArray(this.imgs)) { this.imgs = [].concat(this.imgs); }

		if (this.parent) { 
			this.scope = this.parent.scope; 
		} else if (typeof this.scope === 'string') {
			this.scope = Crumbs.scopedCanvas[this.scope];
		} 

		this.setAnchor(this.anchor);

		const childrenToSpawn = [].concat(this.children);
		this.children = [];
		for (let i in childrenToSpawn) {
			this.spawnChild(childrenToSpawn[i]);
		}
		
		const t = typeof this.init;
		if (t === 'function') {
			this.init.call(this);  
		} else if (t === 'object') {
			this.set(this.init);
		}

		if (this.parent === null) {
			let pushed = false;
			for (let i = 0; i < this.scope.objects.length; i++) {
				if (this.scope.objects[i] === null) { this.index = i; this.scope.objects[i] = this; pushed = true; break; }
			}
			if (!pushed) { this.index = this.scope.objects.length; this.scope.objects.push(this); }
		} else {
			let pushed = false;
			for (let i = 0; i < this.parent.children.length; i++) {
				if (this.parent.children[i] === null) { this.index = i; this.parent.children[i] = this; pushed = true; break; }
			}
			if (!pushed) { this.index = this.parent.children.length; this.parent.children.push(this); }
		}

		if (this.parent === null) { this.updateChildren(); }
	}
	Crumbs.object.prototype.die = function() {
		if (this.parent) { this.parent.removeChild(this.index) }
		else { this.scope.objects[this.index] = null; }
	};
	Crumbs.h.tempVar = false;
	Crumbs.object.prototype.spawnChild = function(obj, custom) {
		const h = new Crumbs.object(obj, this);
		if (custom) { for (let i in custom) {
			h[i] = custom[i];
		} }
		h.commenceInit();
		return h;
	};
	Crumbs.object.prototype.spawnChildVisible = function(obj, custom) {
		if (!Game.visible || !Crumbs.lastUpdate + Crumbs.sleepDetectionBuffer >= Date.now()) {
			return;
		}
		return this.spawnChild(obj, custom);
	}
	Crumbs.object.prototype.hasChildren = function() {
		return (this.children.length > 0);
	};
	Crumbs.object.prototype.removeChild = function(index) {
		this.children[index] = null; //unlike with root level particles, children arrays are not cleaned every 3600 draw ticks, so please use them wisely.
	};
	Crumbs.object.prototype.addComponent = function(comp) {
		if (!comp) { return; }
		if (Crumbs.prefs.warnDuplicateComponents) { for (let i in this.components) {
			if (this.components[i].constructor === comp.constructor) {
				console.warn('An object has two components of the same type!');
				console.log(comp);
			}
		} }
		if (comp.init) { comp.init(this); }
		this.components.push(comp);
	};
	Crumbs.object.prototype.removeComponent = function(type) {
		for (let i in this.components) {
			if (this.components[i] instanceof Crumbs.component[type]) {
				return this.components.splice(i, 1);
			}
		}
		return null;
	};
	Crumbs.object.prototype.getComponent = function(type) {
		for (let i in this.components) {
			if (this.components[i] instanceof (Crumbs.component[type] || type)) {
				return this.components[i];
			}
		}
		return null;
	};
	Crumbs.object.prototype.addBehavior = function(behavior) {
		if (behavior instanceof Crumbs.behavior) { behavior = new Crumbs.behaviorInstance(behavior); }
		else if (typeof behavior === 'function') { const b = new Crumbs.behavior(behavior); behavior = new Crumbs.behaviorInstance(b); }
		else if (!behavior instanceof Crumbs.behaviorInstance) { throw 'Object behavior must be an instance of Crumbs.behavior, Crumbs.behaviorInstance, or is a function!'; }
		this.behaviors.push(behavior);
	};
	Crumbs.object.prototype.reorder = function(at) {
		this.scope.objects[this.index] = null;
		this.scope.objects[at] = this;
		this.index = at;
	};
	Crumbs.object.prototype.triggerBehavior = function() {
		if (!this.enabled) { return; }
		for (let i in this.components) {
			if (this.components[i].enabled) { this.components[i].logic(this); }
		}
		for (let b in this.behaviors) {
			this.behaviors[b][Crumbs.behaviorSym][Crumbs.behaviorSym].call(this.getInfo(), this.behaviors[b]);
		}
	};
	Crumbs.object.prototype.updateChildren = function() {
		if (!this.enabled) { return; }
		this.triggerBehavior();
		if (this.parent !== null) {
			this.scaleFactorX = this.parent.scaleX * this.parent.scaleFactorX;
			this.scaleFactorY = this.parent.scaleY * this.parent.scaleFactorY;
		}
		for (let i in this.children) {
			if (this.children[i] !== null) {
				this.children[i].updateChildren();
			}
		}
	};
	Crumbs.object.prototype.findChild = function(id) {
		for (let i in this.children) { 
			if (this.children[i] === null) { continue; }
			if (this.children[i].id === id) {
				return this.children[i];
			} else {
				let cd = this.children[i].findChild(id);
				if (cd !== null) { return cd; }
			}
		}
		return null;
	};
	Crumbs.object.prototype.getChildren = function(id) {
		if (!id) { return [].concat(this.children); }
		let toReturn = [];
		for (let i in this.children) {
			if (this.children[i] === null) { continue; }
			if (this.children[i].id === id) {
				toReturn.push(this.children[i]);
			} else {
				toReturn.concat(this.children[i].getChildren(id)); 
			}
		}
		return toReturn;
	};
	Crumbs.reorderAllObjects = function() {
		for (let i in Crumbs.objects) {
			let counter = 0;
			for (let ii = 0; ii < Crumbs.objects[i].length; ii++) {
				if (Crumbs.objects[i][ii]) {
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
	Crumbs.updateObjects = function() { //called every logic frame
		if (window.gamePause) { return; } //p for pause support
		for (let i in Crumbs.objects) { 
			if (Crumbs.objectsEnabled(i)) {
				for (let ii in Crumbs.objects[i]) {
					if (Crumbs.objects[i][ii] !== null) { Crumbs.objects[i][ii].updateChildren(); }
				} 
			}
		} 
		Crumbs.lastUpdate = Date.now();
		if (Game.T % 3600 == 0) { Crumbs.reorderAllObjects(); } 
	};
	Game.registerHook('logic', Crumbs.updateObjects);

	Crumbs.spawn = function(obj, custom) {
		const h = new Crumbs.object(obj);
		if (custom) { for (let i in custom) {
			h[i] = custom[i];
		} }
		h.commenceInit();
		return h;
	};
	Crumbs.spawnVisible = function(obj, custom) {
		if ((Crumbs.lastUpdate + Crumbs.sleepDetectionBuffer < Date.now() || !Game.visible) && !Crumbs.unfocusedSpawn) { return false; } 
		return Crumbs.spawn(obj, custom);
	}
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

	Crumbs.component = {};
	Crumbs.defaultComp = {};

	Crumbs.component.rect = function(obj) {
		for (let i in Crumbs.defaultComp.rect) {
			this[i] = Crumbs.defaultComp.rect[i];
		}
		for (let i in obj) {
			this[i] = obj[i];
		}
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
	Crumbs.component.rect.prototype.postDraw = function(m, ctx) {
		const pWidth = Crumbs.getPWidth(m) * m.width / Pic(m.imgs[m.imgUsing]).width;
		const pHeight = Crumbs.getPHeight(m) * m.height / Pic(m.imgs[m.imgUsing]).height;
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
                if (Crumbs.validPathConfigs.includes(ii)) {
                    ctx[ii] = p.obj[ii];
                } 
                else if (Crumbs.validPathFuncs.includes(ii)) {
                    ctx[ii](p.obj[ii]);
                }
                else { throw 'Unrecognized config '+ii+'!'; }
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
	};
	Crumbs.defaultComp.canvasManipulator = {
		enabled: true,
		function: function(m, ctx) { }
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
	Crumbs.component.text.prototype.logic = function(m) { };
	Crumbs.component.text.prototype.preDraw = function(m, ctx) {
		ctx.font = this.size+'px '+this.font;
		ctx.textAlign = this.align;
		ctx.direction = this.direction;
		ctx.fillStyle = this.color;
		ctx.lineWidth = this.outline;
		ctx.strokeStyle = this.outlineColor;
	};
	Crumbs.component.text.prototype.postDraw = function(m, ctx) {
		if (this.maxWidth) {
			ctx.fillText(this.content, m.offsetX, m.offsetY, this.maxWidth);
		} else {
			ctx.fillText(this.content, m.offsetX, m.offsetY);
		}
		if (this.outline) {
			if (this.maxWidth) {
				ctx.strokeText(this.content, m.offsetX, m.offsetY, this.maxWidth);
			} else {
				ctx.strokeText(this.content, m.offsetX, m.offsetY);
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
	};
	Crumbs.defaultComp.patternFill = {
		enabled: true,
		width: 2,
		height: 2,
		offX: 0,
		offY: 0,
		dWidth: null,
		dHeight: null,
		sWidth: null,
		sHeight: null,
		sx: null,
		sy: null
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
	Crumbs.component.patternFill.prototype.postDraw = function(m, ctx) {
		const pWidth = Crumbs.getPWidth(m);
		const pHeight = Crumbs.getPHeight(m);
		if (!this.noDrawStatus) {
			let [dx, dy, dw, dh, sw, sh] = [-Crumbs.getOffsetX(m.anchor, this.dWidth || pWidth) + m.offsetX, -Crumbs.getOffsetY(m.anchor, this.dHeight || pHeight) + m.offsetY, this.dWidth || pWidth, this.dHeight|| pHeight, this.sWidth || Pic(m.imgs[m.imgUsing]).width, this.sHeight || Pic(m.imgs[m.imgUsing]).height];
			Crumbs.h.fillPattern(ctx, Pic(m.imgs[m.imgUsing]), this.width, this.height, dx, dy, dw, dh, this.sx || 0, this.sy || 0, sw, sh, this.offX, this.offY);
		}

		m.noDraw = this.noDrawStatus;
	};

	Crumbs.component.tCounter = function() {
		obj = obj||{};
		for (let i in Crumbs.defaultComp.tCounter) {
			this[i] = Crumbs.defaultComp.tCounter[i];
		}
		for (let i in obj) {
			this[i] = obj[i];
		}
	}
	Crumbs.defaultComp.tCounter = {
		enabled: true,
		function: null,
	}
	Crumbs.component.tCounter.prototype.enable = function() { this.enabled = true; };
	Crumbs.component.tCounter.prototype.disable = function() { this.enabled = false; };
	Crumbs.component.tCounter.prototype.init = function(m) { m.tCount = 0; };
	Crumbs.component.tCounter.prototype.logic = function(m) { if (this.function) { m.tCount += this.function.call(m, m); } else { m.tCount++; } };
	Crumbs.component.tCounter.prototype.preDraw = function() { };
	Crumbs.component.tCounter.prototype.postDraw = function() { };

	Crumbs.component.pointerInteractive = function(obj) {
		obj = obj||{};
		for (let i in Crumbs.defaultComp.pointerInteractive) {
			this[i] = Crumbs.defaultComp.pointerInteractive[i];
		}
		for (let i in obj) {
			this[i] = obj[i];
		}
		if (Crumbs.colliderTypes[this.boundingType]) { 
			this.boundingType = Crumbs.colliderTypes[this.boundingType];
		}

		this.hovered = false;
		this.click = false;
	}
	Crumbs.defaultComp.pointerInteractive = {
		enabled: true,
		onClick: function() { },
		onRelease: function() { },
		onMouseover: function() { },
		onMouseout: function() { },
		alwaysInteractable: false,
		boundingType: 'rect'
	}
	Crumbs.component.pointerInteractive.prototype.enable = function() {
		this.enabled = true;
	};
	Crumbs.component.pointerInteractive.prototype.disable = function() {
		this.enabled = false;
	};
	Crumbs.component.pointerInteractive.prototype.logic = function(m) {
		const pWidth = Crumbs.getPWidth(m);
		const pHeight = Crumbs.getPHeight(m);
		let b = this.getHoverStatus(m, pWidth, pHeight);
		if (b && !this.alwaysInteractable) {
			const scope = m.scope.sortedObjects;
			for (let i = scope.indexOf(m) + 1; i < scope.length; i++) {
				const o = scope[i];
				if (!o) { continue; }
				const comp = o.getComponent('pointerInteractive');
				if (!comp) { continue; }
				if (!comp.getHoverStatus(o, Crumbs.getPWidth(o), Crumbs.getPHeight(o))) { continue; }
				b = false;
				break;
			}
		}
		if (b && !this.hovered) { this.hovered = true; this.onMouseover.call(m); }
		else if (!b && this.hovered) { this.hovered = false; this.onMouseout.call(m); }
		if (this.hovered) { 
			if (!this.click && Crumbs.pointerHold) { this.click = true; this.onClick.call(m); }
			if (this.click && !Crumbs.pointerHold) { this.click = false; this.onRelease.call(m); }
		}
	};
	Crumbs.component.pointerInteractive.prototype.preDraw = function(m, ctx) { };
	Crumbs.pointerHold = false;
	AddEvent(document, 'mousedown', function() { Crumbs.pointerHold = true; });
	AddEvent(document, 'mouseup', function() { Crumbs.pointerHold = false; });
	AddEvent(document, 'touchstart', function() { Crumbs.pointerHold = true; });
	AddEvent(document, 'touchend', function() { Crumbs.pointerHold = false; });
	Crumbs.colliderType = function(func, str) {
		this.checkFunc = func;
		str && (this.key = str);
		if (this.key) { Crumbs.colliderTypes[this.key] = this; }
	}
	Crumbs.colliderTypes = {
		
	}
	new Crumbs.colliderType(function(s, m, pWidth, pHeight) { 
		return Crumbs.h.inRect(s.mouseX - m.getTrueX(), s.mouseY - m.getTrueY(), {
			w: pWidth,
			h: pHeight,
			r: m.getTrueRotation(),
			x: Crumbs.getOffsetX(m.anchor, pWidth),
			y: Crumbs.getOffsetY(m.anchor, pHeight)
		});
	}, 'rect');
	new Crumbs.colliderType(function(s, m, pWidth, pHeight) { 
		return Crumbs.h.inOval(
			s.mouseX - m.getTrueX(), 
			s.mouseY - m.getTrueY(), 
			pWidth / 2, 
			pHeight / 2, 
			Crumbs.getOffsetX(m.anchor, pWidth) - pWidth / 2, 
			Crumbs.getOffsetY(m.anchor, pHeight) - pHeight / 2, 
			m.getTrueRotation()
		);
	}, 'oval');
	Crumbs.defaultComp.pointerInteractive.boundingType = Crumbs.colliderTypes.rect;
	Crumbs.component.pointerInteractive.prototype.getHoverStatus = function(m, pWidth, pHeight) {
		return this.boundingType.checkFunc(m.scope, m, pWidth, pHeight)
	}
	Crumbs.component.pointerInteractive.prototype.postDraw = function(m, ctx) {
		if (Crumbs.prefs.colliderDisplay) {
			const pWidth = Crumbs.getPWidth(m);
			const pHeight = Crumbs.getPHeight(m);
			const prevStrokeStyle = ctx.strokeStyle;
			const prevLineWidth = ctx.lineWidth;
			ctx.lineWidth = 2;
			ctx.strokeStyle = '#5de2fc';
			if (this.boundingType == 'rect') {
				ctx.strokeRect(-Crumbs.getOffsetX(m.anchor, pWidth), -Crumbs.getOffsetY(m.anchor, pHeight), pWidth, pHeight);
			} else if (this.boundingType == 'oval') { 
				ctx.beginPath();
				ctx.ellipse(-Crumbs.getOffsetX(m.anchor, pWidth) + pWidth / 2, -Crumbs.getOffsetY(m.anchor, pHeight) + pHeight / 2, pWidth / 2, pHeight / 2, 0, 0, Math.PI * 2);
				ctx.stroke();
			}
			ctx.lineWidth = prevLineWidth;
			ctx.strokeStyle = prevStrokeStyle;
		}
	};

	Crumbs.component.bloom = function(obj) {
		obj = obj||{};
		for (let i in Crumbs.defaultComp.bloom) {
			this[i] = Crumbs.defaultComp.bloom[i];
		}
		for (let i in obj) {
			this[i] = obj[i];
		}

		this.data = null;
		this.lastUpdate = 0;
	}
	Crumbs.defaultComp.bloom = {
		enabled: true,
		threshold: 128, //minimum brightness to pass filter
		factor: 5, //gaussian blur factor
		updateRate: 0 //minimum amount of ticks to wait before each update
	}
	Crumbs.component.bloom.prototype.enable = function() { this.enabled = true; } 
	Crumbs.component.bloom.prototype.disable = function() { this.enabled = false; }
	Crumbs.component.bloom.prototype.update = function(m) {
		let c = document.createElement('canvas');
		c.width = m.scope.c.canvas.width;
		c.height = m.scope.c.canvas.height;
		let ctx = c.getContext('2d');
		//Crumbs.drawObject(m, ctx);
		let data = ctx.getImageData(0, 0, c.width, c.height);
		const passed = Crumbs.h.grayscaleMap(data);
		for (let i = 0; i < passed.length; i++) {
			if (passed[i] < this.threshold) {
				const p = i * 4;
				data.data[p] = 0;
				data.data[p + 1] = 0;
				data.data[p + 2] = 0;
				data.data[p + 3] = 0;
			}
		}
		data = Crumbs.h.gaussianBlurColor(data, this.factor, 0);
		this.data = data;
	};
	Crumbs.component.bloom.prototype.logic = function(m) { };
	Crumbs.component.bloom.prototype.preDraw = function(m) { if (Crumbs.t - this.lastUpdate > this.updateRate) { this.update(m); } };
	Crumbs.component.bloom.prototype.postDraw = function(m, ctx) {
		ctx.putImageData(Crumbs.h.blend('additive', ctx.getImageData(0, 0, m.scope.c.canvas.width, m.scope.c.canvas.height), this.data), 0, 0);
	};

	Crumbs.component.linearFade = function(obj) {
		obj = obj||{};
		for (let i in Crumbs.defaultComp.linearFade) {
			this[i] = Crumbs.defaultComp.linearFade[i];
		}
		for (let i in obj) {
			this[i] = obj[i];
		}
		
		this.noDrawStatus = false;
	}
	Crumbs.defaultComp.linearFade = {
		progress: 1, //midpoint of fade
		distance: 30, //px, total distance, scales
		sliceWidth: 3, //px between each redraw
		horizontal: false,
		initialAlpha: null, //can force opacity set, if not set it uses base opacity of object
		finalAlpha: null, //if not set uses 0

		enabled: true
	}
	Crumbs.component.linearFade.prototype.enable = function() { this.enabled = true; } 
	Crumbs.component.linearFade.prototype.disable = function() { this.enabled = false; }
	Crumbs.component.linearFade.prototype.logic = function(m) {

	}
	Crumbs.component.linearFade.prototype.preDraw = function(m) {
		this.noDrawStatus = m.noDraw;
		m.noDraw = true;
	}
	Crumbs.component.linearFade.prototype.postDraw = function(m, ctx) {
		//best I can do without webGL
		if (!m.imgs[m.imgUsing]) { return; }
		const pWidth = Crumbs.getPWidth(m);
		const pHeight = Crumbs.getPHeight(m);
		const prevAlpha = ctx.globalAlpha;
		if (this.horizontal) {
			this.drawHorizontal(m, ctx, pWidth, pHeight);
		} else {
			this.drawVertical(m, ctx, pWidth, pHeight)
		}
		ctx.globalAlpha = prevAlpha;

		m.noDraw = this.noDrawStatus;
		//you know what I tried to make it not a giant blob of spaghetti but then I realized said blob might be more efficient
	}
	Crumbs.component.linearFade.prototype.drawVertical = function(m, ctx, pWidth, pHeight) {
		const dx = pWidth * m.scaleX * m.scaleFactorX;
		const dyM = m.scaleY * m.scaleFactorY;
		const pic = Pic(m.imgs[m.imgUsing]);
		const initOffset = this.progress * pHeight - this.distance / 2;
		const ox = -Crumbs.getOffsetX(m.anchor, pWidth) + m.offsetX;
		const oy = -Crumbs.getOffsetY(m.anchor, pHeight) + m.offsetY;
		const slicesTotal = Math.ceil(this.distance / this.sliceWidth);
		const alphaStep = ((this.initialAlpha ?? m.alpha) - (this.finalAlpha ?? 0)) / slicesTotal;

		ctx.globalAlpha = this.initialAlpha ?? m.alpha;
		if (initOffset >= 0) { ctx.drawImage(pic, 0, 0, pWidth, initOffset, ox, oy, dx, initOffset * dyM); }
		for (let i = 0; i < slicesTotal; i++) {
			ctx.globalAlpha -= alphaStep;
			if (initOffset + i * this.sliceWidth > pHeight) { return; }
			ctx.drawImage(pic, 0, initOffset + i * this.sliceWidth, pWidth, this.sliceWidth, ox, oy + initOffset + i * this.sliceWidth, dx, Math.ceil(this.sliceWidth * dyM));
		}
		ctx.globalAlpha = this.finalAlpha ?? 0;
		if (initOffset + slicesTotal * this.sliceWidth > pHeight || !ctx.globalAlpha) { return; }
		ctx.drawImage(pic, 
			0, 
			initOffset + slicesTotal * this.sliceWidth, 
			pWidth, 
			pHeight - slicesTotal * this.sliceWidth - initOffset, 
			ox, 
			oy + initOffset + slicesTotal * this.sliceWidth,
			dx,
			(pHeight - slicesTotal * this.sliceWidth - initOffset) * dyM
		);
	}
	Crumbs.component.linearFade.prototype.drawHorizontal = function(m, ctx, pWidth, pHeight) {
		const dxM = m.scaleX * m.scaleFactorX;
		const dy = pHeight * m.scaleY * m.scaleFactorY;
		const pic = Pic(m.imgs[m.imgUsing]);
		const initOffset = this.progress * pWidth - this.distance / 2;
		const ox = -Crumbs.getOffsetX(m.anchor, pWidth) + m.offsetX;
		const oy = -Crumbs.getOffsetY(m.anchor, pHeight) + m.offsetY;
		const slicesTotal = Math.ceil(this.distance / this.sliceWidth);
		const alphaStep = ((this.initialAlpha ?? m.alpha) - (this.finalAlpha ?? 0)) / slicesTotal;

		ctx.globalAlpha = this.initialAlpha ?? m.alpha;
		if (initOffset >= 0) { ctx.drawImage(pic, 0, 0, initOffset, pHeight, ox, oy, initOffset * dxM, dy); }
		for (let i = 0; i < slicesTotal; i++) {
			ctx.globalAlpha -= alphaStep;
			if (initOffset + i * this.sliceWidth > pWidth) { return; }
			ctx.drawImage(pic, initOffset + i * this.sliceWidth, 0, this.sliceWidth, pHeight, ox + initOffset + i * this.sliceWidth, oy, Math.ceil(this.sliceWidth * dxM), dy);
		}
		ctx.globalAlpha = this.finalAlpha ?? 0;
		if (initOffset + slicesTotal * this.sliceWidth > pWidth || !ctx.globalAlpha) { return; }
		ctx.drawImage(pic, 
			initOffset + slicesTotal * this.sliceWidth, 
			0,
			pWidth - slicesTotal * this.sliceWidth - initOffset, 
			pHeight, 
			ox + initOffset + slicesTotal * this.sliceWidth, 
			oy,
			(pHeight - slicesTotal * this.sliceWidth - initOffset) * dxM,
			dy
		);
	}
	//testing code
	//Crumbs.spawn({ imgs: 'wrinkler.png', x: 100, y: 100, anchor: 'top', components: new Crumbs.component.linearFade({ progress: 0.5, distance: 40, sliceWidth: 1 }) });
	
	Crumbs.shader = {};
	Crumbs.shaderDefaults = {};
	
	Crumbs.shader.gaussianBlur = function(obj) {
		obj = obj||{};
		for (let i in Crumbs.shaderDefaults.gaussianBlur) {
			this[i] = Crumbs.shaderDefaults.gaussianBlur[i];
		}
		for (let i in obj) {
			this[i] = obj[i];
		}
	}
	Crumbs.shaderDefaults.gaussianBlur = {
		enabled: true,
		factor: 1
	}
	Crumbs.shader.gaussianBlur.prototype.update = function(data) {
		return Crumbs.h.gaussianBlurColor(data, this.factor, 0);
	}

	Crumbs.shader.allWhite = function(obj) {
		for (let i in Crumbs.shaderDefaults.allWhite) {
			this[i] = Crumbs.shaderDefaults.allWhite[i];
		}
	}
	Crumbs.shaderDefaults.allWhite = { enabled: true }
	Crumbs.shader.allWhite.prototype.update = function(data) {
		for (let i = 0; i < data.data.length; i++) {
			data.data[i] = 255;
		}
		return data;
	}

	Crumbs.preloads = [];
	Crumbs.preloadRequired = false;
	Crumbs.preload = function(items) {
		items = [].concat(items);
		Crumbs.preloads = Crumbs.preloads.concat(items);
		Crumbs.preloadRequired = true;
	}
	
	Crumbs.particle = function(obj, x, y, r, a, scope) {
		//a super-lightweight variant of Crumbs.object
		//is always drawn on top of other objects and has no sense of order
		//behavior is simply a function
		//has some builtin expiry mechanic 
		//for best performance, please put the initiating object somewhere and use the reference to call to it
		for (let i in Crumbs.particleDefaults) { this[i] = Crumbs.particleDefaults[i]; }
		for (let i in obj) { if (i!='img') { this[i] = obj[i]; } }

		this.obj = obj;

		this.x = x;
		this.y = y;
		this.rotation = r;
		this.alpha = a;

		this.scope = Crumbs.particles[scope];
		if (this.scope) { this.scope.push(this); } else { throw scope+' is not a valid particle scope!'; }

		if (this.init) { this.init.call(this); }
	}
	Crumbs.particleDefaults = {
		width: 1,
		height: 1,
		//img: '',
		life: 2 * Game.fps,
		init: null,
		behavior: null,
		reusePool: null
	};
	Crumbs.spawnParticle = function(what, x, y, r, a, scope) {
		if (!Game.visible) { return {}; }
		if (what.reusePool && what.reusePool.at(-1)) {
			const s = what.reusePool.splice(what.reusePool.length - 1, 1)[0];
			return Crumbs.reuseParticle.call(s, x, y, r, a, scope);
		}
		
		return new Crumbs.particle(what, x, y, r, a, scope);
	}
	Crumbs.particle.prototype.die = function() {
		this.scope.splice(this.scope.indexOf(this), 1);
		if (this.reusePool) { this.reusePool.push(this); }
	}
	Crumbs.particle.prototype.update = function() {
		this.life--;
		if (this.life <= 0) { this.die(); return; }
		if (this.behavior) { 
			this.behavior.call(this); 
		}
	}
	Crumbs.updateParticles = function() {
		if (window.gamePause) { return; }
		for (let i in Crumbs.particles) {
			for (let ii in Crumbs.particles[i]) {
				Crumbs.particles[i][ii].update();
			}
		}
	}
	Game.registerHook('draw', Crumbs.updateParticles);
	Crumbs.reuseParticle = function(x, y, r, a, scope) {
		for (let i in this.obj) { this[i] = this.obj[i]; }
		this.x = x;
		this.y = y;
		this.rotation = r;
		this.alpha = a;
		this.scope = Crumbs.particles[scope];
		if (this.scope) { this.scope.push(this); } else { throw scope+' is not a valid particle scope!'; }

		if (this.init) { this.init.call(this); }
		return this;
	}
	Crumbs.reusePools = [];
	Crumbs.newReusePool = function(str) {
		let a = [];
		Crumbs.reusePools.push(a);
		return a;
	}
	Crumbs.pruneParticles = function(pool) {
		pool.splice(0, pool.length);
	}
	Game.registerHook('logic', function() {
		if (Game.T % 120 * Game.fps !== 0) { return; }
		for (let i in Crumbs.reusePools) {
			Crumbs.pruneParticles(Crumbs.reusePools[i]);
		}
	})

	//below for the actual drawing
	Crumbs.compileObjects = function(s) {
		let arr = []; //each entry is an object, which in this case includes all childrens, sorted by the order variable
		for (let i of Crumbs.objects[s]) {
			if (i !== null) {
				arr.push(i);
			}
		}
		arr = Crumbs.mergeSort(arr, 0, arr.length - 1);
		let c = 0;
		while (c < arr.length) {
			const arr2 = arr[c].recursiveCompile();
			arr.splice(c, 1, ...arr2);
			c += arr2.length;
		}
		return arr;
	};
	Crumbs.object.prototype.compile = function() {
		if (!this.enabled) { return []; }
		if (!this.children.length) { return [this]; }
		let arr = [];
		arr.push(this);
		for (let i of this.children) {
			if (i !== null) { 
				arr.push(i); 
			}
		}
		return Crumbs.mergeSort(arr, 0, arr.length - 1);
	};
	Crumbs.object.prototype.recursiveCompile = function() {
		if (!this.enabled) { return []; }
		if (!this.children.length) { return [this]; }
		let arr = [];
		arr.push(this);
		for (let i of this.children) {
			if (i !== null) { arr.push(i); }
		}
		arr = Crumbs.mergeSort(arr, 0, arr.length - 1);
		let c = 0;
		while (c < arr.length) {
			if (arr[c] != this) { 
				const arr2 = arr[c].recursiveCompile();
				arr.splice(c, 1, ...arr2); //spread operator oh no (performance go die die die)
				//ok but actually performance isnt a concern, memory is
				c += arr2.length;
			} else {
				c++;
			}
		}
		return arr;
	}
	Crumbs.merge = function(arr, left, middle, right) {
		//merges two object arrays together sorting based on order
		let a1 = new Array(middle - left + 1);
		let a2 = new Array(right - middle);

		for (let i = 0; i < a1.length; i++) {
			a1[i] = arr[left + i];
		}
		for (let i = 0; i < a2.length; i++) {
			a2[i] = arr[middle + 1 + i];
		}

		let i = 0;
    	let j = 0;	
		let k = left;
	
	    while (i < a1.length && j < a2.length) {
	        if (a1[i].order < a2[j].order) {
	            arr[k] = a1[i];
	            i++;
	        } else {
	            arr[k] = a2[j];
	            j++;
	        }
			k++;
	    }
	    while (i < a1.length) {
	        arr[k] = a1[i];
			i++;
			k++;
	    }
	    while (j < a2.length) {
	        arr[k] = a2[j];
			j++;
			k++;
	    }
	
	    return arr;
	};
	//I love stealing code
	Crumbs.mergeSort = function(arr, left, right) {
	    if (left >= right) {
	        return arr;
	    }
	    
		const middle = left + parseInt((right - left) / 2);
	    
	    Crumbs.mergeSort(arr, left, middle);
	    Crumbs.mergeSort(arr, middle + 1, right);
	    
	    Crumbs.merge(arr, left, middle, right);

		return arr;
	}

	Crumbs.getOffsetX = function(anchor, width) {
		return anchor.x * width;
	};
	Crumbs.getOffsetY = function(anchor, height) {
		return anchor.y * height;
	};
	Crumbs.getPWidth = function(o) {
		return (o.width??(Pic(o.imgs[o.imgUsing]).width)) * o.scaleX * o.scaleFactorX; 
	};  
	Crumbs.getPHeight = function(o) {
		return (o.height??Pic(o.imgs[o.imgUsing]).height) * o.scaleY * o.scaleFactorY; 
	};

	Crumbs.drawAnchorDisplay = function(o, ctx, p) {
		ctx.save();
		if (o.anchorDisplayColor) { ctx.fillStyle = o.anchorDisplayColor; } else if (o.parent) { ctx.fillStyle = '#57d2f2'; } else { ctx.fillstyle = '#ccfffb'; }
		ctx.globalAlpha = 1;
		ctx.fillRect(o.offsetX - 3, o.offsetY - 3, 6, 6);
		ctx.restore();
	}
	//testing comment
	//Crumbs.spawn({ x: 100, y: 100, imgs: 'glint.png', scaleX: 2, scaleY: 2, children: { y: 30, imgs: 'glint.png', scaleX: 0.5, scaleY: 0.5 }, id: 1, behaviors: function() { this.rotation += 0.01; } });
	Crumbs.iterateObject = function(o, ctx) {
		ctx.save(); 
		
		ctx.globalAlpha = o.alpha;
		let p = null;
		if (o.imgs.length) { p = Pic(o.imgs[o.imgUsing]); }
		//pWidth and pHeight basically means actual width and actual height
		const pWidth = Crumbs.getPWidth(o); 
		const pHeight = Crumbs.getPHeight(o);
		for (let ii = 0; ii < o.components.length; ii++) {
			if (o.components[ii].enabled) { o.components[ii].preDraw(o, ctx); }
		}
		const ox = Crumbs.getOffsetX(o.anchor, pWidth);
		const oy = Crumbs.getOffsetY(o.anchor, pHeight);

		//in the case of parent, rotate in the other direction to make sure x and y are still absolute offsets
		const c = o.parent?Math.cos(-o.parent.rotation):1;
		const s = o.parent?Math.sin(-o.parent.rotation):0;
		ctx.translate(o.x * c - o.y * s, o.x * s + o.y * c);

		if (o.rotation) {
			ctx.rotate(o.rotation);
		} 
		
		const toDraw = o.compile();
		for (let i in toDraw) {
			if (toDraw[i] != o) {
				Crumbs.iterateObject(toDraw[i], ctx);
				continue;
			}
			
			if (!o.noDraw && o.imgs.length) { 
				ctx.drawImage(p, o.sx, o.sy, o.width ?? p.width, o.height ?? p.height, -ox + o.offsetX * o.scaleFactorX, -oy + o.offsetY * o.scaleFactorY, pWidth, pHeight); 
			}
			if (Crumbs.prefs.anchorDisplay) { Crumbs.drawAnchorDisplay(o, ctx); }
			for (let ii = o.components.length - 1; ii >= 0; ii--) {
				if (o.components[ii].enabled) { o.components[ii].postDraw(o, ctx); }
			}
		}
		
		ctx.restore(); 
	}
	Crumbs.object.prototype.getTrueX = function() {
		if (this.parent) {
			return this.x + this.parent.getTrueX();
		}
		return this.x;
	}
	Crumbs.object.prototype.getTrueY = function() {
		if (this.parent) {
			return this.y + this.parent.getTrueY();
		}
		return this.y;
	}
	Crumbs.object.prototype.getTrueRotation = function() {
		if (this.parent) {
			return this.rotation + this.parent.getTrueRotation();
		}
		return this.rotation;
	}

	Crumbs.drawObjects = function() {
		for (let c in Crumbs.scopedCanvas) {
			let list = Crumbs.compileObjects(c);
			Crumbs.sortedObjectList[c] = list;
			Crumbs.scopedCanvas[c].sortedObjects = Crumbs.sortedObjectList[c];
			Crumbs.scopedCanvas[c].objects = Crumbs.objects[c];
			Crumbs.scopedCanvas[c].l.style.background = Crumbs.scopedCanvas[c].background;
			let ctx = Crumbs.scopedCanvas[c].c;
			ctx.globalAlpha = 1;
			ctx.clearRect(0, 0, Crumbs.scopedCanvas[c].l.width, Crumbs.scopedCanvas[c].l.height); 
			const settingObj = {globalCompositeOperation: ctx.globalCompositeOperation, imageSmoothingEnabled: ctx.imageSmoothingEnabled, imageSmoothingQuality: ctx.imageSmoothingQuality};
			for (let i in Crumbs.settings) {
				ctx[i] = Crumbs.settings[i];
			}
			for (let i = 0; i < list.length; i++) {
				if (list[i].parent) { continue; }
				let o = list[i];
				if (!o.enabled) { continue; }
				Crumbs.iterateObject(o, ctx);
			}
			for (let i in Crumbs.particles[c]) {
				const p = Crumbs.particles[c][i];
				if (p.globalCompositeOperation) { ctx.globalCompositeOperation = p.globalCompositeOperation; }
				ctx.translate(p.x, p.y);
				ctx.rotate(p.rotation);
				ctx.globalAlpha = p.alpha;
				ctx.drawImage(Pic(p.obj.img), -p.width / 2, -p.height / 2, p.width, p.height);
				ctx.rotate(-p.rotation);
				ctx.translate(-p.x, -p.y);
				if (p.globalCompositeOperation) { ctx.globalCompositeOperation = settingObj.globalCompositeOperation; }
			}
			ctx.globalAlpha = 1;
			for (let i in settingObj) {
				ctx[i] = settingObj[i];
			}
			if (Crumbs.preloadRequired) {
				const prev = ctx.globalAlpha;
				ctx.globalAlpha = 0;
				for (let i in Crumbs.preloads) {
					ctx.drawImage(Pic(Crumbs.preloads[i]), 0, 0);
				}
				ctx.globalAlpha = prev;
				Crumbs.preloadRequired = false;
			}
			if (!Crumbs.scopedCanvas[c].shaders.length) { continue; }
			let data = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
			for (let i of Crumbs.scopedCanvas[c].shaders) {
				data = i.update(data);
			}
			ctx.putImageData(data, 0, 0);
		}
		if (Crumbs.preloads.length) { Crumbs.preloads = []; }
	};

    Game.Load(function() { });

	Game.LoadMod((window.crumbs_load_local)?'./Implementation.js':'https://cursedsliver.github.io/Crumbs-engine/Implementation.js');
    
	l('versionNumber').innerHTML='<div id="gameVersionText" style="display: inline; pointer-events: none;">v. '+Game.version+'</div>'+(!App?('<div id="httpsSwitch" style="cursor:pointer;display:inline-block;background:url(img/'+(Game.https?'lockOn':'lockOff')+'.png);width:16px;height:16px;position:relative;top:4px;left:0px;margin:0px -2px;"></div>'):'')+(Game.beta?' <span style="color:#ff0;">beta</span>':'');
	if (!App) { 
		Game.attachTooltip(l('httpsSwitch'),'<div style="padding:8px;width:350px;text-align:center;font-size:11px;">'+loc("You are currently playing Cookie Clicker on the <b>%1</b> protocol.<br>The <b>%2</b> version uses a different save slot than this one.<br>Click this lock to reload the page and switch to the <b>%2</b> version!",[(Game.https?'HTTPS':'HTTP'),(Game.https?'HTTP':'HTTPS')])+'</div>','this'); 
		AddEvent(l('httpsSwitch'),'click',function(){
			PlaySound('snd/pop'+Math.floor(Math.random()*3+1)+'.mp3',0.75);
			if (location.protocol=='https:') location.href='http:'+window.location.href.substring(window.location.protocol.length);
			else if (location.protocol=='http:') location.href='https:'+window.location.href.substring(window.location.protocol.length);
		});
	}
	Crumbs.h.injectCSS('#CrumbsEngineVersion { margin-top: 2px; pointer-events: none; }');
	l('gameVersionText').insertAdjacentHTML('beforebegin','<div class="title" style="font-size:22px;" id="CrumbsEngineVersion">Crumbs engine '+Crumbs.version+'</div>');
	
	
	Crumbs.h.resolveInjects();
	Game.registerHook('check', Crumbs.h.resolveInjects);
};

Game.registerMod('Crumbs engine', {
	init: Crumbs_Init_On_Load,
	save: function() { return Crumbs.t + ''; },
	load: function(str) { Crumbs.t = parseInt(str); }
});