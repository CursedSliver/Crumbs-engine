/*
MIT License

Copyright (c) 2025 CursedSliver

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
if (typeof Crumbs !== 'object') { var Crumbs = {}; }

var CrumbsEngineLoaded = false;
if (typeof crumbs_load_local === 'undefined') { var crumbs_load_local = false; }
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
			// @ts-ignore
			AddEvent(bigCookie,'mouseout',function(event){ Game.BigCookieState=0; });
			// @ts-ignore
			AddEvent(bigCookie,'mouseover',function(event){ Game.BigCookieState=2; });
		}
	}
	Crumbs.h.patchCtx = function(ctx) {
		let saveCount = 0;

		const originalSave = ctx.save;
		const originalRestore = ctx.restore;

		ctx.save = function() {
  			saveCount++;
  			console.log(`save() — stack depth: ${saveCount}`);
  			//console.trace("Trace for save()");
  			return originalSave.call(ctx);
		};

		ctx.restore = function() {
  			if (saveCount > 0) {
  				saveCount--;
  			} else {
    			console.warn("restore() without save()");
  			}
  			console.log(`restore() — stack depth: ${saveCount}`);
  			//console.trace("Trace for restore()");
  			return originalRestore.call(ctx);
		};
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
	Crumbs.h.loadShader = function(gl, type, source) {
		//lol I just got this from mdn docs
		const shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			alert(
				`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`,
			);
			gl.deleteShader(shader);
			return null;
		}
		return shader;
	}
	Crumbs.h.createProgram = function(gl, vs, fs) {
		const program = gl.createProgram();
		const vsp = Crumbs.h.loadShader(gl, gl.VERTEX_SHADER, vs);
		const fsp = Crumbs.h.loadShader(gl, gl.FRAGMENT_SHADER, fs);

		if (!vsp || !fsp) {
			if (vsp) { gl.deleteShader(vsp); }
			if (fsp) { gl.deleteShader(fsp); }
			gl.deleteProgram(program);
			throw new Error('Shader compilation failed; check shader compile logs.');
		}

		gl.attachShader(program, vsp);
		gl.attachShader(program, fsp);

		gl.linkProgram(program);

		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			const info = gl.getProgramInfoLog(program);
			gl.deleteProgram(program);
			gl.deleteShader(vsp);
			gl.deleteShader(fsp);
			throw new Error('Program linking failed: ' + info);
		}
		return [program, vsp, fsp];
	}
	Crumbs.h.isPowerOf2 = function(n) { return (n & (n - 1)) === 0; }
	Crumbs.h.copyImage = function(image) {
		const canvas = new OffscreenCanvas(image.width, image.height);
		const ctx = canvas.getContext('2d');
		ctx.drawImage(image, 0, 0);

		return canvas;
	}
	Crumbs.h.emptyDraw = function() {
		Crumbs.scopedCanvas.background.c.drawImage(Game.Loader.blank, 0, 0);
	}

	let prevAssets = Game.Loader.assets;
	let prevAssetsLoading = Game.Loader.assetsLoading;
	let prevAssetsLoaded = Game.Loader.assetsLoaded;
	Loader = function() {
        this.loadingN=0; 
        this.assetsN=0;
        this.assets = {};
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
            if (!Game.local) img.crossOrigin = 'anonymous'
            if (newer.indexOf('/') != -1) img.src = newer;
            else img.src = this.domain + newer;
            img.alt = newer;
			// @ts-ignore
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
			const a = Crumbs.imagesToAwait;
			if (a.has(e.target.alt)) {
				const g = a.get(e.target.alt);
				for (let i in g) {
					const [resolve, reject, callback] = g[i];
					try { resolve([e.target, callback]); }
					catch(e) { reject(e); }
				}
				a.delete(e.target.alt);
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
	Game.Loader.assets = prevAssets;
	Game.Loader.assetsLoaded = new Set();
	for (let i in prevAssetsLoaded) {
		Game.Loader.assetsLoaded.add(prevAssetsLoaded[i]);
	}
	Game.Loader.assetsLoading = new Set();
	for (let i in prevAssetsLoading) {
		Game.Loader.assetsLoading.add(prevAssetsLoading[i]);
	}

    Pic = function(what) {
        return Game.Loader.assetsLoaded.has(what) ? Game.Loader.assets[what] : (what && !Game.Loader.assetsLoading.has(what) && Game.Loader.Load([what]), Game.Loader.blank);
    }


	Crumbs.t = 0; //saved
	Game.registerHook('logic', function() { 
		const p = window.PForPause;
		Crumbs.t += p?p.timeFactor:1; 
	});

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
	Crumbs.webGLSupported = true;
	Crumbs.resizeObserver = new ResizeObserver(entries => {
		for (let entry of entries) {
			Crumbs.scopedCanvas[entry.target.dataset.canvasId].setDims(entry.contentRect.width, entry.contentRect.height);
		}
		Crumbs.toRecomputeBoundingClientRect = true;
	});
	Crumbs.toRecomputeBoundingClientRect = false;
	Crumbs.canvasMutationObserver = new MutationObserver(() => {
		Crumbs.toRecomputeBoundingClientRect = true;
	});
	Crumbs.canvasMutationObserver.observe(l('game'), {
		subtree: true,
		childList: true,
		attributes: true
		//no characterData, just dont be stupid when creating canvases ok
	});
	window.addEventListener('scroll', () => {
		Crumbs.toRecomputeBoundingClientRect = true;
	}, { passive: true });
	Crumbs.canvas = function(parentEle, key, id, css) {
		this.l = Crumbs.createCanvas(id, parentEle, css);
		this.l.parentNode.dataset.canvasId = key;
		this.c = this.l.getContext('2d');
		this.key = key;
		this.shaders = [];

		this.background = 'none';

		this.redrawPerFrame = true;

		this.boundingClientRect = this.l.getBoundingClientRect();

		this.mouseX = 0;
		this.mouseY = 0;

		this.left = 0;
		this.top = 0;

		Crumbs.scopedCanvas[key] = this;
		Crumbs.objects[key] = [];
		this.objects = Crumbs.objects[key];
		Crumbs.particles[key] = [];
		Crumbs.sortedObjectList[key] = [];
		this.sortedObjects = Crumbs.sortedObjectList[key];
		Crumbs.validScopes.push(key);
		Crumbs.prefs.objects[key] = 1;
		Crumbs.prefs.particles[key] = 1;
		this.shaders = new Map();

		this.setDims();
		Crumbs.resizeObserver.observe(this.l.parentNode);
	}
	Crumbs.canvas.prototype.setDims = function(w, h) {
		this.l.width = w ?? this.l.parentNode.offsetWidth;
		this.l.height = h ?? this.l.parentNode.offsetHeight;
	}
	Crumbs.canvas.prototype.setPos = function() {
		this.boundingClientRect = this.l.getBoundingClientRect();
		this.left = this.boundingClientRect.left;
		this.top = this.boundingClientRect.top - (App?0:32);
	}
	Crumbs.canvas.prototype.setMousePos = function() {
		this.mouseX = Game.mouseX - this.left;
		this.mouseY = Game.mouseY - this.top;
	}
	Crumbs.shaderData = function(shader, order, localOrder) {
		this.enabled = true;
		this.shader = shader;
		this.order = order ?? Infinity;
		this.localOrder = localOrder ?? 0; 
	}
	Crumbs.canvas.prototype.addShader = function(shader, order, localOrder) {
		this.shaders.set(shader, new Crumbs.shaderData(shader, order, localOrder));
	}
	Crumbs.canvas.prototype.getShaderData = function(shader) {
		return this.shaders.get(shader);
	}
	Crumbs.canvas.prototype.enableShader = function(shader) {
		this.shaders.get(shader).enabled = true;
	}
	Crumbs.canvas.prototype.disableShader = function(shader) {
		this.shaders.get(shader).enabled = false;
	}
	Crumbs.canvas.prototype.removeShader = function(shader) {
		this.shaders.delete(shader);
	}
	Crumbs.canvas.prototype.destroy = function() {
		delete Crumbs.scopedCanvas[this.key];
		Crumbs.validScopes.splice(Crumbs.validScopes.indexOf(this.key), 1);
		Crumbs.resizeObserver.unobserve(this.l.parentNode);
		this.l.parentNode.remove();
	}
	Crumbs.TYPE_IDENTIFIER = Symbol('type');
	Crumbs.SHADER = Symbol('Crumbs.shader');
	Crumbs.shaderData.prototype[Crumbs.TYPE_IDENTIFIER] = Crumbs.SHADER;
	Crumbs.shaderData.prototype.compile = function() {
		return [this];
	}
	Crumbs.shaderData.prototype.recursiveCompile = function() {
		return [this];
	}
	Crumbs.shaderData.prototype.apply = function(c) {
		/**
		 * @type WebGLRenderingContext
		 */
		const gl = Crumbs.bufferGL;

		gl.viewport(0, 0, c.width, c.height);
		gl.useProgram(this.s.program);


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
			if (Crumbs.toRecomputeBoundingClientRect) { 
				Crumbs.scopedCanvas[i].setPos(); 
				Crumbs.toRecomputeBoundingClientRect = false;
			}
			Crumbs.scopedCanvas[i].setMousePos();
		}
	};
	Crumbs.updateCanvas();
	// @ts-ignore
	window.addEventListener('resize',function(event) {
		Crumbs.updateCanvas();
	});
	
	Crumbs.getCanvasByScope = function(s) {
		return Crumbs.scopedCanvas[s].c;
	};
	Crumbs.settings = {
		globalCompositeOperation: 'source-over',
		filter: '',
		imageSmoothingEnabled: true,
		imageSmoothingQuality: 'low'
	};
	Crumbs.unfocusedSpawn = true;
	// @ts-ignore
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
	//this system is genuinely terrible
	//only reason why im keeping it still is because of precedence (??)
	Crumbs.image = function(image, promise) {
		//should probably NOT pass in a string, otherwise it has a chance of becoming undefined
		if (typeof image == 'string') {
			if (Game.Loader.assetsLoaded.has(image)) {
				this.img = Pic(image);
			} else {
				promise = new Promise((resolve, reject) => {
					if (Crumbs.imagesToAwait.has(image)) {
						Crumbs.imagesToAwait.get(image).push([resolve, reject, null]);
					} else {
						Crumbs.imagesToAwait.set(image, [[resolve, reject, null]]);
						Pic(image);
					}
					this.img = null;
				});
			}
		}
		else { this.img = image; }
		if (promise) {
			promise.then((arr) => {
				const [image, callback] = arr;
				if (callback) { 
					this.img = callback(image);
				} else {
					this.img = image;
				}
				if (this.toCompress) { 
					this.declareReady();
					Crumbs.h.compressCanvas(this.img).then(img => { 
						this.img = img;
					}); 
				} else { 
					this.declareReady();
				}
			}).catch((e) => {
				console.error(e);
			});
		}
		if (!this.img) { 
			this.ready = false; 
		} 
		else { 
			this.ready = true; 
		}
	}
	Crumbs.image.prototype.declareReady = function() {
		this.ready = true;
		for (let i in this.afterReady) {
			this.afterReady[i](this.img);
		}
		if (this.afterReady) { this.afterReady = null; }
	}
	Crumbs.image.prototype.registerAfterReady = function(func) {
		if (this.ready) { return; }
		if (this.afterReady) { this.afterReady.push(func); }
		else { this.afterReady = [func]; }
	}
	Crumbs.image.prototype.compress = function() {
		if (this.img instanceof Image || this.img instanceof ImageBitmap) { return new Promise((resolve) => { resolve(); }); }
 		if (this.ready) { 
			return new Promise((resolve) => {
				Crumbs.h.compressCanvas(this.img).then(img => { this.img = img; resolve(); }); 
			});
		} else {
			this.toCompress = true;
		}
	}
	Crumbs.h.compressCanvas = function(canva) {
		return canva.convertToBlob({ type: 'image/webp', quality: 1 })
			.then(blob => {
				try { canva.width = 0; canva.height = 0; } catch(e) {}

				return new Promise((resolve, reject) => {
					const img = new Image();
					const url = URL.createObjectURL(blob);
					img.onload = () => {
						URL.revokeObjectURL(url);
						resolve(img);
					};
					img.onerror = (e) => {
						URL.revokeObjectURL(url);
						reject(e || new Error('Failed to load compressed image'));
					};
					img.src = url;
				});
			});
	}
	Crumbs.image.prototype.replace = function(imageModule, noCopy) {
		if (imageModule.ready) { this.img = noCopy?imageModule.img:Crumbs.h.copyImage(imageModule.img); }
		else { 
			imageModule.registerAfterReady(img => { this.img = noCopy?img:Crumbs.h.copyImage(img); });
		}
		return this;
	}
	Crumbs.image.prototype.manipulate = function(width, height, filters, drawCallback) {
		if (this.ready) { 
			this.replace(Crumbs.manipImage(this, null, width ?? this.img.width, height ?? this.img.height, filters, drawCallback));
		} else {
			this.registerAfterReady(img => { 
				this.replace(Crumbs.manipImage(this, null, width ?? this.img.width, height ?? this.img.height, filters, drawCallback));
			});
		}
		return this;
	}
	Crumbs.image.prototype.applyShader = function(shader, scale) {
		if (this.ready) { 
			this.replace(Crumbs.alterImage(this, shader, scale));
		} else {
			this.registerAfterReady(img => { 
				this.replace(Crumbs.alterImage(this, shader, scale));
			});
		}
		return this;
	}
	Crumbs.image.prototype.registerInLoader = function(key) {
		this.compress().then(() => { Game.Loader.assets[key] = this.img; });
	}
	Crumbs.image.prototype.duplicate = function() {
		if (this.ready) {
			return new Crumbs.image(Crumbs.h.copyImage(this.img));
		} else {
			const h = new Crumbs.image(null);
			this.registerAfterReady(img => { h.replace(this); h.declareReady(); });
			return h;
		}
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
		behaviors: [],
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
	Crumbs.OBJECT = Symbol('Crumbs.object');
	Crumbs.object.prototype[Crumbs.TYPE_IDENTIFIER] = Crumbs.OBJECT;
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
		this.behaviors = [].concat(this.behaviors);
		for (let i in this.behaviors) {
			if (this.behaviors[i] instanceof Crumbs.behaviorInstance) { continue; }
			// @ts-ignore
			else if (this.behaviors[i] instanceof Crumbs.behavior) { this.behaviors[i] = new Crumbs.behaviorInstance(this.behaviors[i]); }
			// @ts-ignore
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
		if (this.parent) { this.parent.removeChild(this.index); }
		else { this.scope.objects[this.index] = null; }
	};
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
		for (let i in this.components) {
			if (this.components[i].onComponentsChange) {
				this.components[i].onComponentsChange(this);
			}
		}
		this.components.push(comp);
	};
	Crumbs.object.prototype.removeComponent = function(type) {
		for (let i in this.components) {
			if (this.components[i] instanceof Crumbs.component[type]) {
				for (let ii in this.components) {
					if (this.components[ii].onComponentsChange) {
						this.components[ii].onComponentsChange(this);
					}
				}
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
	Crumbs.object.prototype.getAllComponents = function(type) {
		let result = [];
		for (let i = 0; i < this.components.length; i++) {
			if (this.components[i] instanceof (Crumbs.component[type] || type)) {
				result.push(this.components[i]);
			}
		}
		return result;
	}
	Crumbs.object.prototype.addBehavior = function(behavior) {
		// @ts-ignore
		if (behavior instanceof Crumbs.behavior) { behavior = new Crumbs.behaviorInstance(behavior); }
		// @ts-ignore
		else if (typeof behavior === 'function') { const b = new Crumbs.behavior(behavior); behavior = new Crumbs.behaviorInstance(b); }
		else if (!(behavior instanceof Crumbs.behaviorInstance)) { throw 'Object behavior must be an instance of Crumbs.behavior, Crumbs.behaviorInstance, or is a function!'; }
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
			this.behaviors[b][Crumbs.behaviorSym][Crumbs.behaviorSym].call(this, this.behaviors[b]);
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
		if (typeof scope == 'string') { scope = Crumbs.scopedCanvas[scope]; }
		if (scope) {
			for (let i in scope.objects) {
				if (scope.objects[i] !== null && scope.objects[i].id == id) {
					return scope.objects[i];
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

	Crumbs.changeScopeOf = function(o, scope) {
		scope = (scope instanceof Crumbs.canvas)?scope:Crumbs.scopedCanvas[scope];

		o.die();
		o.scope = scope;
		for (let i in scope.objects) {
			if (scope.objects[i] === null) { 
				scope.objects[i] = o;
				o.index = parseInt(i);
				return;
			}
		}
		scope.objects.push(o);
		o.index = scope.objects.length - 1;
	}

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
	// @ts-ignore
	Crumbs.component.rect.prototype.logic = function(m) {
	};
	// @ts-ignore
	Crumbs.component.rect.prototype.preDraw = function(m, ctx) {
		ctx.fillStyle = this.color;
		ctx.lineWidth = this.outline;
		ctx.strokeStyle = this.outlineColor;
	};
	Crumbs.component.rect.prototype.postDraw = function(m, ctx) {
		const pWidth = Crumbs.getPWidth(m) * m.width / Crumbs.getRawPic(m.imgs[m.imgUsing]).width;
		const pHeight = Crumbs.getPHeight(m) * m.height / Crumbs.getRawPic(m.imgs[m.imgUsing]).height;
		ctx.fillRect(-Crumbs.getOffsetX(m.anchor, pWidth) + m.offsetX, -Crumbs.getOffsetY(m.anchor, pHeight) + m.offsetY, pWidth, pHeight);
		if (this.outline) {
			ctx.strokeRect(-Crumbs.getOffsetX(m.anchor, pWidth) + m.offsetX, -Crumbs.getOffsetY(m.anchor, pHeight) + m.offsetY, pWidth, pHeight);
		}
	};
	Crumbs.component.rect.prototype.overrideDraw = true;

	Crumbs.component.settings = function(obj) {
		obj = obj||{};
		const def = Crumbs.defaultComp.settings;
		this.enabled = obj.enabled||def.enabled;
		const globals = ['globalCompositeOperation', 'filter', 'imageSmoothingEnabled', 'imageSmoothingQuality'];
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
	// @ts-ignore
	Crumbs.component.settings.prototype.logic = function(m) { };
	// @ts-ignore
	Crumbs.component.settings.prototype.preDraw = function(m, ctx) {
		for (let i in this.obj) {
			ctx[i] = this.obj[i];
		}
	};
	// @ts-ignore
	Crumbs.component.settings.prototype.postDraw = function(m, ctx) { 
		//if (this.obj.filter) { ctx.filter = 'none'; }
	};
	Crumbs.component.settings.prototype.overrideDraw = true;

	Crumbs.component.canvasManipulator = function(obj) {
		//USE WITH CAUTION
		for (let i in Crumbs.defaultComp.canvasManipulator) {
			this[i] = Crumbs.defaultComp.canvasManipulator[i];
		}
		for (let i in obj) { this[i] = obj[i]; }
	};
	Crumbs.defaultComp.canvasManipulator = {
		enabled: true,
		function: null,
		before: null
	};
	Crumbs.component.canvasManipulator.prototype.enable = function() {
		this.enabled = true;
	};
	Crumbs.component.canvasManipulator.prototype.disable = function() {
		this.enabled = false;
	};
	// @ts-ignore
	Crumbs.component.canvasManipulator.prototype.logic = function(m) { };
	Crumbs.component.canvasManipulator.prototype.preDraw = function(m, ctx) { 
		if (this.before) { ctx.save(); Crumbs.setupContext(m, ctx); this.before(m, ctx); ctx.restore(); }
	};
	Crumbs.component.canvasManipulator.prototype.postDraw = function(m, ctx) {
		if (this.function) { this.function(m, ctx); }
	};
	Crumbs.component.canvasManipulator.prototype.overrideDraw = true;
	
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
	// @ts-ignore
	Crumbs.component.text.prototype.logic = function(m) { };
	// @ts-ignore
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
	Crumbs.component.text.prototype.overrideDraw = true;

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
	// @ts-ignore
	Crumbs.component.patternFill.prototype.logic = function(m) {
	};
	// @ts-ignore
	Crumbs.component.patternFill.prototype.preDraw = function(m, ctx) {
		this.noDrawStatus = m.noDraw;
		m.noDraw = true;
	};
	Crumbs.component.patternFill.prototype.postDraw = function(m, ctx) {
		const pWidth = Crumbs.getPWidth(m);
		const pHeight = Crumbs.getPHeight(m);
		if (!this.noDrawStatus) {
			let [dx, dy, dw, dh, sw, sh] = [-Crumbs.getOffsetX(m.anchor, this.dWidth || pWidth) + m.offsetX, -Crumbs.getOffsetY(m.anchor, this.dHeight || pHeight) + m.offsetY, this.dWidth || pWidth, this.dHeight|| pHeight, this.sWidth || Crumbs.getRawPic(m.imgs[m.imgUsing]).width, this.sHeight || Crumbs.getRawPic(m.imgs[m.imgUsing]).height];
			Crumbs.h.fillPattern(ctx, Crumbs.getRawPic(m.imgs[m.imgUsing]), this.width, this.height, dx, dy, dw, dh, this.sx || 0, this.sy || 0, sw, sh, this.offX, this.offY);
		}

		m.noDraw = this.noDrawStatus;
	};
	Crumbs.component.patternFill.prototype.overrideDraw = true;

	Crumbs.component.tCounter = function(obj) {
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
	Crumbs.component.tCounter.prototype.overrideDraw = false;

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
				if (!o || o[Crumbs.TYPE_IDENTIFIER] !== Crumbs.OBJECT) { continue; }
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
	// @ts-ignore
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
			if (this.boundingType.key == 'rect') {
				ctx.strokeRect(-Crumbs.getOffsetX(m.anchor, pWidth), -Crumbs.getOffsetY(m.anchor, pHeight), pWidth, pHeight);
			} else if (this.boundingType.key == 'oval') { 
				ctx.beginPath();
				ctx.ellipse(-Crumbs.getOffsetX(m.anchor, pWidth) + pWidth / 2, -Crumbs.getOffsetY(m.anchor, pHeight) + pHeight / 2, pWidth / 2, pHeight / 2, 0, 0, Math.PI * 2);
				ctx.stroke();
			}
			ctx.lineWidth = prevLineWidth;
			ctx.strokeStyle = prevStrokeStyle;
		}
	};
	Crumbs.component.pointerInteractive.prototype.overrideDraw = false;

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
		enabled: true,
		progress: 1, //midpoint of fade
		distance: 30, //px, total distance, scales
		sliceWidth: 3, //px between each redraw
		horizontal: false, //otherwise vertical
		flip: false, //whether to flip the fade direction
		initialAlpha: null, //can force opacity set, if not set it uses base opacity of object
		finalAlpha: null, //if not set uses 0
		cutOff: false //whether to stop drawing BEFORE the fade begins (the fade itself is unaffected)
	}
	Crumbs.component.linearFade.prototype.enable = function() { this.enabled = true; } 
	Crumbs.component.linearFade.prototype.disable = function() { this.enabled = false; }
	// @ts-ignore
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
		ctx.globalCompositeOperation = m.getComponent('settings')?.globalCompositeOperation ?? ctx.globalCompositeOperation;
		if (this.horizontal) {
			this.drawHorizontal(m, ctx, pWidth, pHeight);
		} else {
			this.drawVertical(m, ctx, pWidth, pHeight);
		}
		ctx.globalAlpha = prevAlpha;

		m.noDraw = this.noDrawStatus;
		//you know what I tried to make it not a giant blob of spaghetti but then I realized said blob might be more efficient
	}
	Crumbs.component.linearFade.prototype.drawVertical = function(m, ctx, pWidth, pHeight) {
		const dx = pWidth;
		const dyM = m.scaleY * m.scaleFactorY;
		const pic = Crumbs.getRawPic(m.imgs[m.imgUsing]);
		const width = m.width ?? pic.width;
		const height = m.height ?? pic.height;
		if (this.progress + this.distance / 2 / height <= 0) { return; }
		const initOffset = (this.progress * height - this.distance / 2) * dyM;
		const initOffsetPure = this.progress * height - this.distance / 2;
		const ox = -Crumbs.getOffsetX(m.anchor, pWidth) + m.offsetX;
		const oy = -Crumbs.getOffsetY(m.anchor, pHeight) + m.offsetY;
		const sliceWidth = this.sliceWidth;
		const slicesTotal = Math.ceil(this.distance * dyM / sliceWidth);
		const alphaStep = (this.flip?-1:1) * ((this.initialAlpha ?? m.alpha) - (this.finalAlpha ?? 0)) / slicesTotal;

		ctx.globalAlpha = this.flip?(this.finalAlpha ?? 0):(this.initialAlpha ?? m.alpha);
		if (initOffset >= 0 && (!this.cutOff && !this.flip)) { ctx.drawImage(pic, m.sx, m.sy, width, initOffsetPure, ox, oy, dx, initOffset); }
		if (this.progress - this.distance / 2 / pic.height > 1) { return; }
		for (let i = 0; i < slicesTotal; i++) {
			ctx.globalAlpha -= alphaStep;
			if (initOffset + i * sliceWidth > pHeight) { return; }
			ctx.drawImage(pic, m.sx, (m.sy || 0) + initOffsetPure + i * sliceWidth / dyM, width, sliceWidth, ox, oy + initOffset + i * sliceWidth, dx, sliceWidth);
		}
		ctx.globalAlpha = this.flip?(this.initalAlpha ?? m.alpha):(this.finalAlpha ?? 0);
		if (initOffset + slicesTotal * sliceWidth > pHeight || !ctx.globalAlpha || (this.cutOff && this.flip)) { return; }
		ctx.drawImage(pic, 
			m.sx, 
			(m.sy || 0) + initOffset + slicesTotal * sliceWidth, 
			width, 
			height - slicesTotal * sliceWidth - initOffset, 
			ox, 
			oy + initOffset + slicesTotal * sliceWidth,
			dx,
			(pHeight - slicesTotal * sliceWidth - initOffset) * dyM
		);
	}
	Crumbs.component.linearFade.prototype.drawHorizontal = function(m, ctx, pWidth, pHeight) {
		const dxM = m.scaleX * m.scaleFactorX;
		const dy = pHeight;
		const pic = Crumbs.getRawPic(m.imgs[m.imgUsing]);
		const width = m.width ?? pic.width;
		const height = m.height ?? pic.height;
		if (this.progress + this.distance / 2 / width <= 0) { return; }
		const initOffset = (this.progress * width - this.distance / 2) * dxM;
		const initOffsetPure = this.progress * width - this.distance / 2;
		const ox = -Crumbs.getOffsetX(m.anchor, pWidth) + m.offsetX;
		const oy = -Crumbs.getOffsetY(m.anchor, pHeight) + m.offsetY;
		const sliceWidth = this.sliceWidth;
		const slicesTotal = Math.ceil(this.distance * dxM / sliceWidth);
		const alphaStep = (this.flip?-1:1) * ((this.initialAlpha ?? m.alpha) - (this.finalAlpha ?? 0)) / slicesTotal;

		ctx.globalAlpha = this.flip?(this.finalAlpha ?? 0):(this.initialAlpha ?? m.alpha);
		if (initOffset >= 0 && (!this.cutOff && !this.flip)) { ctx.drawImage(pic, 0, 0, initOffsetPure / dxM, height, ox, oy, initOffset, dy); }
		if (this.progress - this.distance / 2 / pic.width > 1) { return; }
		for (let i = 0; i < slicesTotal; i++) {
			ctx.globalAlpha -= alphaStep;
			if (initOffsetPure + i * sliceWidth > pWidth) { return; }
			ctx.drawImage(pic, (m.sx || 0) + initOffsetPure + i * sliceWidth / dxM, m.sy, sliceWidth / dxM, height, ox + initOffsetPure + i * sliceWidth, oy, sliceWidth, dy);
		}
		ctx.globalAlpha = this.flip?(this.initalAlpha ?? m.alpha):(this.finalAlpha ?? 0);
		if (initOffset + slicesTotal * sliceWidth > pWidth || !ctx.globalAlpha || (this.cutOff && this.flip)) { return; }
		ctx.drawImage(pic, 
			(m.sx || 0) + initOffset + slicesTotal * sliceWidth, 
			m.sy,
			width - slicesTotal * sliceWidth - initOffset, 
			height, 
			ox + initOffset + slicesTotal * sliceWidth, 
			oy,
			(pHeight - slicesTotal * sliceWidth - initOffset) * dxM,
			dy
		);
	}
	Crumbs.component.linearFade.prototype.overrideDraw = true;
	//testing code
	//const what = Crumbs.spawn({ imgs: 'wrinkler.png', x: 100, y: 100, scope: 'left', anchor: 'top', components: [new Crumbs.component.settings({ globalCompositeOperation: 'lighter' }), new Crumbs.component.linearFade({ progress: 0.5, distance: 40, sliceWidth: 1 })] }); what.scaleX = 1; what.scaleY = 1;

	Crumbs.component.tooltip = function(obj) {
		obj = obj||{};
		for (let i in Crumbs.defaultComp.tooltip) {
			this[i] = Crumbs.defaultComp.tooltip[i];
		}
		for (let i in obj) {
			this[i] = obj[i];
		}

		if (Crumbs.colliderTypes[this.boundingType]) { 
			this.boundingType = Crumbs.colliderTypes[this.boundingType];
		}

		this.pointerInteractiveCache = null;
		this.hovered = false;
		this.click = false;
	}
	Crumbs.defaultComp.tooltip = {
		enabled: true,
		content: '', //string or function
		origin: 'middle',
		crate: false,
		alwaysInteractable: false,
		hideOnClick: false,
		boundingType: Crumbs.colliderTypes.rect
	}
	Crumbs.component.tooltip.prototype.enable = function() {
		this.enabled = true;
	}
	Crumbs.component.tooltip.prototype.disable = function() {
		this.enabled = false;
	}
	Crumbs.component.tooltip.prototype.onComponentsChange = function(m) {
		this.pointerInteractiveCache = m.getComponent('pointerInteractive');
	}
	Crumbs.component.tooltip.prototype.init = function(m) {
		this.onComponentsChange(m);
	}
	Crumbs.component.tooltip.prototype.logic = function(m) {
		let b = false;
		if (this.pointerInteractiveCache && this.pointerInteractiveCache.boundingType == this.boundingType) {
			b = this.pointerInteractiveCache.hovered;
		} else {
			const pWidth = Crumbs.getPWidth(m);
			const pHeight = Crumbs.getPHeight(m);
			b = this.getHoverStatus(m, pWidth, pHeight);
			if (b && !this.alwaysInteractable) {
				const scope = m.scope.sortedObjects;
				for (let i = scope.indexOf(m) + 1; i < scope.length; i++) {
					const o = scope[i];
					if (!o) { continue; }
					const comp = o.getComponent('tooltip') || o.getComponent('pointerInteractive');
					if (!comp) { continue; }
					if (!comp.getHoverStatus(o, Crumbs.getPWidth(o), Crumbs.getPHeight(o))) { continue; }
					b = false;
					break;
				}
			}
		}
		if (b && !this.hovered) { this.hovered = true; this.triggerTooltip(m, Crumbs.getPWidth(m), Crumbs.getPHeight(m)); }
		else if (!b && this.hovered) { this.hovered = false; this.hideTooltip(); }
		if (this.hideOnClick && this.hovered) { 
			if (!this.click && Crumbs.pointerHold) { this.click = true; this.hideTooltip(); }
			if (this.click && !Crumbs.pointerHold) { this.click = false; this.triggerTooltip(); }
		}
	}
	Crumbs.component.tooltip.prototype.getHoverStatus = function(m, pWidth, pHeight) {
		return this.boundingType.checkFunc(m.scope, m, pWidth, pHeight);
	}
	Crumbs.component.tooltip.prototype.triggerTooltip = function(m, pWidth, pHeight) {
		if (Crumbs.pointerHold && this.hideOnClick) { return; }

		Game.tooltip.shouldHide = 0;
		Crumbs.tooltipRegister.style.display = '';
		if (this.crate) { 
			Crumbs.tooltipRegister.style.width = pWidth + 'px';
			Crumbs.tooltipRegister.style.height = pHeight + 'px';
			Game.setOnCrate(Crumbs.tooltipRegister); 
			Crumbs.onCrate = m;
		} else {
			Crumbs.tooltipRegister.style.width = '';
			Crumbs.tooltipRegister.style.height = '';
		}
		const dynamic = (typeof this.content === 'function');
		if (dynamic) { 
			Crumbs.dynamicTooltipFunction = function(c) { return function() { return c.content.call(m, c); } }(this);
			Game.tooltip.dynamic = 1;
		}
		Game.tooltip.draw(Crumbs.tooltipRegister, dynamic?Crumbs.dynamicTooltipFunction:this.content, this.origin);
		Game.tooltip.wobble();
	}
	const follower = document.createElement('div');
	Crumbs.h.injectCSS('#tooltipRegister { display: block; position: fixed; pointer-events: none; z-index: 2147483647; left: 0px; top: 0px; width: 1000px; height: 1000px; border-radius: 500px; }')
	follower.id = 'tooltipRegister';
	follower.style.display = 'none';
	document.body.appendChild(follower);
	Crumbs.onCrate = null;
	Crumbs.tooltipRegister = follower;
	AddEvent(document, 'mousemove', function(e) {
		if (Game.onCrate || Crumbs.onCrate) { return; } 

		Crumbs.tooltipRegister.style.left = (e.clientX - 8) + 'px';
		Crumbs.tooltipRegister.style.top = (e.clientY - 8) + 'px';		
	});
	Game.registerHook('draw', function() {
		if (Game.onCrate && Crumbs.onCrate) {
			Crumbs.tooltipRegister.style.left = (Crumbs.onCrate.getTrueX() - Crumbs.getOffsetX(Crumbs.onCrate.anchor, Crumbs.getPWidth(Crumbs.onCrate)) + Crumbs.onCrate.scope.boundingClientRect.left) + 'px';
			Crumbs.tooltipRegister.style.top = (Crumbs.onCrate.getTrueY() - Crumbs.getOffsetY(Crumbs.onCrate.anchor, Crumbs.getPHeight(Crumbs.onCrate)) + Crumbs.onCrate.scope.boundingClientRect.top) + 'px';
		}
	})
	Crumbs.component.tooltip.prototype.hideTooltip = function() {
		Game.tooltip.shouldHide = 1;
		if (this.crate) {
			Game.setOnCrate(0);
			Crumbs.onCrate = null;
		}
		Crumbs.tooltipRegister.style.display = 'none';
		Game.tooltip.dynamic = 0;
		Game.tooltip.update();
	}
	Crumbs.dynamicTooltipFunction = function() {

	}
	Crumbs.component.tooltip.prototype.preDraw = function() {

	}
	Crumbs.component.tooltip.prototype.postDraw = function() {

	}
	Crumbs.component.tooltip.prototype.overrideDraw = false;

	Crumbs.component.dynamicShader = function(obj) {
		//only ever use this if the shader needs to change constantly!!
		obj = obj||{};
		for (let i in Crumbs.defaultComp.dynamicShader) {
			this[i] = Crumbs.defaultComp.dynamicShader[i];
		}
		for (let i in obj) {
			this[i] = obj[i];
		}

		this.noDrawStatus = false;
	}
	Crumbs.defaultComp.dynamicShader = {
		enabled: true,
		shader: null,
		width: null,
		height: null
	}
	Crumbs.component.dynamicShader.prototype.enable = function() {
		this.enabled = true;
	}
	Crumbs.component.dynamicShader.prototype.disable = function() {
		this.enabled = false;
	}
	Crumbs.component.dynamicShader.prototype.logic = function(m) {
		
	}
	Crumbs.component.dynamicShader.prototype.preDraw = function(m) {
		this.noDrawStatus = m.noDraw;
		m.noDraw = true;
	}
	Crumbs.component.dynamicShader.prototype.postDraw = function(m) {
		if (this.noDrawStatus) { return; }
		m.noDraw = this.noDrawStatus;
	}
	Crumbs.component.dynamicShader.prototype.overrideDraw = true;
	Crumbs.bufferEffectsCanva = new OffscreenCanvas(Math.max(512, l('game').offsetWidth), Math.max(512, l('game').offsetHeight));
	Crumbs.bufferGL = Crumbs.bufferEffectsCanva.getContext('webgl');
	Crumbs.buffersList = new Map();
	Crumbs.setupBufferEffectsCanva = function(buffer, program) {
		return;
		/**
		 * @type WebGLRenderingContext
		 */
		const gl = Crumbs.bufferGL;

		const posBuf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
			-1, -1,
			1, -1,
			-1, 1,
			-1, 1,
			1, -1,
			1, 1
		]), gl.DYNAMIC_DRAW);

		const aPos = gl.getAttribLocation(program, 'a_pos');
		gl.enableVertexAttribArray(aPos);
		gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

		const uvBuf = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
			0, 0,
			1, 0,
			0, 1,
			0, 1,
			1, 0,
			1, 1
		]), gl.DYNAMIC_DRAW);

		const aUV = gl.getAttribLocation(program, 'aUV');
		if (aUV !== -1 && aUV !== null) {
			gl.enableVertexAttribArray(aUV);
			gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 0, 0);
		}

		Crumbs.buffersList.set('posBuf', posBuf);
		Crumbs.buffersList.set('uvBuf', uvBuf);
	}
	if (Crumbs.webGLSupported) { Crumbs.setupBufferEffectsCanva(); }
	window.addEventListener('resize', function() { 
		Crumbs.bufferEffectsCanva.width = Math.max(512, l('game').offsetWidth);
		Crumbs.bufferEffectsCanva.height = Math.max(512, l('game').offsetHeight);
	});
	if (!Crumbs.bufferGL) {
		Crumbs.webGLSupported = false;
		console.warn('Note: WebGL is not supported by your browser, so certain advanced shader effects will not function.');
		console.warn('Note: WebGL is not supported by your browser, so certain advanced shader effects will not function.');
		console.warn('Note: WebGL is not supported by your browser, so certain advanced shader effects will not function.');
		console.warn('Note: WebGL is not supported by your browser, so certain advanced shader effects will not function.');
		console.warn('Note: WebGL is not supported by your browser, so certain advanced shader effects will not function.');
	}
	Crumbs.shader = function(fs, vs) {
		//delete the shaders after linking program as it is no longer needed?
		console.log(vs ?? this.vs, fs ?? this.fs, Crumbs.bufferGL);
		const prog = Crumbs.h.createProgram(Crumbs.bufferGL, vs ?? this.vs, fs ?? this.fs);
		this.program = prog[0];

		this.setup();
	}
	Crumbs.shader.prototype.vs = `precision mediump float;

	attribute vec2 a_pos; 
	attribute vec2 aUV;

	varying vec2 vUV;

	void main() {
	    vUV = vec2(aUV.x, aUV.y);
	    gl_Position = vec4(a_pos, 0.0, 1.0);
	}`;
	Crumbs.shader.prototype.fs = `precision mediump float;
	 
	uniform sampler2D u_tex;
	varying vec2 vUV;

	void main() {
    	gl_FragColor = texture2D(u_tex, vUV);
	}`;
	Crumbs.shader.prototype.setup = function(canvas) {

	}
	Crumbs.shader.prototype.parse = function(image, scale) {
		//ONLY use for alterImage or other things that will only ever process the image once
		//for persistent redraws and changing shaders, use whatever is provided that will hopefully cache the texture
		//scale not yet supported.
		scale = scale ?? 1;
		/**
		 * @type WebGLRenderingContext
		 */
		const gl = Crumbs.bufferGL;
		const src = Crumbs.getRawPic(image);

		if (!Crumbs.webGLSupported) {
			return src;
		}

		const w = src.width;
		const h = src.height;
		if (w * h * scale * scale > 2 ** 20) { console.warn('Overly large dimensions of '+src?.alt+', may cause instability.'); }

		if (w > Crumbs.bufferEffectsCanva.width) { 
			Crumbs.bufferEffectsCanva.width = w;
		}
		if (h > Crumbs.bufferEffectsCanva.height) {
			Crumbs.bufferEffectsCanva.height = h;
		}

		gl.useProgram(this.program);
		gl.viewport(0, 0, w, h);

		const tex = gl.createTexture();
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);

		const uTex = gl.getUniformLocation(this.program, 'u_tex');
		if (uTex !== -1 && uTex !== null) gl.uniform1i(uTex, 0);

		gl.drawArrays(gl.TRIANGLES, 0, 6);

		const out = new OffscreenCanvas(w, h);
		const ctx = out.getContext('2d');
		ctx.drawImage(Crumbs.bufferEffectsCanva, 0, Crumbs.bufferEffectsCanva.height - h, w, h, 0, 0, w, h);

		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.deleteTexture(tex);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);

		Crumbs.bufferEffectsCanva.width = Math.max(l('game').offsetWidth, 512);
		Crumbs.bufferEffectsCanva.height = Math.max(l('game').height, 512);

		return out;
	}
	Crumbs.grayscale = new Crumbs.shader(`precision mediump float;
	uniform sampler2D uTex;
	varying vec2 vUV;

	void main() {
		vec4 c = texture2D(uTex, vUV);
  		float g = dot(c.rgb, vec3(0.299, 0.587, 0.114));
  		gl_FragColor = vec4(vec3(g), c.a);
	}`);
	Crumbs.testModule = new Crumbs.image('perfectCookie.png');
	Crumbs.test = function() {
		Crumbs.testModule.applyShader(Crumbs.grayscale);
		Crumbs.spawn({ imgs: Crumbs.testModule, x: 100, y: 100, scaleX: 0.5, scaleY: 0.5, anchor: 'top-left' });
	}

	//newPropertyName is totally optional, old can be an imageModule string or image/canva
	Crumbs.imagesToAwait = new Map(); //value: [resolve, reject, callback]
	Crumbs.manipImage = function(old, newPropertyName, width, height, filters, drawCallback) {
		if (typeof old === 'string' && Game.Loader.assetsLoaded.has(old)) { 
			return new Crumbs.image(Crumbs.manipLoadedImg(old, newPropertyName, width, height, filters, drawCallback));  
		}

		if (typeof old === 'string') { return new Crumbs.image(null, new Promise((resolve, reject) => {
			if (Crumbs.imagesToAwait.has(old)) {
				Crumbs.imagesToAwait.get(old).push([resolve, reject, image => {
					return Crumbs.manipLoadedImg(image, newPropertyName, width, height, filters, drawCallback);
				}]);
			} 
			
			Crumbs.imagesToAwait.set(old, [resolve, reject, image => {
				return Crumbs.manipLoadedImg(image, newPropertyName, width, height, filters, drawCallback);
			}]);
		})); } 

		if (old instanceof Crumbs.image && !old.ready) { 
			return new Crumbs.image(null, new Promise((resolve, reject) => {
				//this system kinda bad but whatever
				Crumbs.imagesToAwait.get(old).push([resolve, reject, (image) => {
					return Crumbs.manipLoadedImg(image, newPropertyName, width. height, filters, drawCallback);
				}]);
			}));
		}

		return new Crumbs.image(Crumbs.manipLoadedImg(old, newPropertyName, width, height, filters, drawCallback));
	}
	Crumbs.manipLoadedImg = function(old, newPropertyName, width, height, filters, drawCallback) {
		//basically allows easily applying filters to a loaded image to avoid redrawing with shaders 
		const asset = Crumbs.getRawPic(old);
		const c = new OffscreenCanvas(width || asset.width, height || asset.height);
		const ctx = c.getContext('2d');
		ctx.filter = filters || '';
		if (drawCallback) {
			drawCallback(ctx, asset, c);
		} else {
			ctx.drawImage(asset, 0, 0, c.width, c.height);
		}
		if (newPropertyName) { 
			Crumbs.h.compressCanvas(c).then(img => { Game.Loader.assets[newPropertyName] = img; }); 
			if (!Game.Loader.assetsLoaded.has(newPropertyName)) { Game.Loader.assetsLoaded.add(newPropertyName); }
		}

		return c;
	}
	Crumbs.alterImage = function(image, shader, scale) {
		//change an image using a webgl shader
		scale = scale ?? 1;
		if (typeof image != 'string' && !(image instanceof Crumbs.image && !image.ready)) { 
			return new Crumbs.image(shader.parse(image, scale));
		}
			
		//is an url
		if ((image instanceof Crumbs.image && !image.ready)
		|| (Game.Loader.assetsLoading.has(image) && Crumbs.imagesToAwait.has(image))) {
			//tried to load this via alterImage multiple times??
			return new Crumbs.image(null, new Promise((resolve, reject) => {
				Crumbs.imagesToAwait.get(image).push([resolve, reject, (image) => {
					return shader.parse(image, scale);
				}]);
			}));
		}

		if (Game.Loader.assetsLoaded.has(image) && Game.Loader.assets[image]) { 
			return new Crumbs.image(shader.parse(Pic(image), scale));
		} 

		//url that is not loaded/loading somewhere else
		//this loads the image because Pic can do that
		return new Crumbs.image(null, new Promise((resolve, reject) => {
			Crumbs.imagesToAwait.set(image, [[resolve, reject, (image) => {
				return shader.parse(image, scale);
			}]]);
			Pic(image);
		}));
	}
	Crumbs.registerImageInLoader = function(image, key) {
		if (image instanceof Crumbs.image) { 
			image.compress();
			if (image.ready) { 
				Game.Loader.assets[key] = image.img; 
				Game.Loader.assetsLoaded.add(key);
			}
			else { 
				image.registerAfterReady((image) => { 
					Game.Loader.assets[key] = image;
					Game.Loader.assetsLoaded.add(key);
				});
			}
		} 
		else { 
			Game.Loader.assets[key] = image; 
			Game.Loader.assetsLoaded.add(key);
		}
	}


	Crumbs.preloads = [];
	Crumbs.preloadRequired = false;
	Crumbs.preload = function(items) {
		items = [].concat(items);
		Crumbs.preloads = Crumbs.preloads.concat(items);
		Crumbs.preloadRequired = true;
	}
	
	// @ts-ignore
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

		// @ts-ignore
		if (this.init) { this.init.call(this); }
	}
	Crumbs.particleDefaults = {
		width: 1,
		height: 1,
		sx: 0,
		sy: 0,
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
		this.life -= window.PForPause?window.PForPause.timeFactor:1;
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
	/**
	 * @x {number}
	 * @y {number}
	 * @r {number}
	 * @a {number}
	 * @scope {string}
	 * @this Crumbs.particle refers to the particle object being reused
	 */
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
	// @ts-ignore
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
		const it = Crumbs.scopedCanvas[s].shaders.entries();
		for (let [key, i] of it) {
			arr.push(i);
		}
		arr = Crumbs.mergeSort(arr, 0, arr.length - 1);
		let c = 0;
		while (c < arr.length) {
			const arr2 = arr[c].recursiveCompile();
			arr.splice(c, 1, ...arr2);
			c += arr2.length;
		}
		
		let i = 0;
		while (i < arr.length) {
			let j = i + 1;
			while (j < arr.length && arr[j].order === arr[i].order) j++;
			if (j - i > 1) {
				let allHaveLocal = true;
				for (let _k = i; _k < j; _k++) {
					if (typeof arr[_k].localOrder === 'undefined') { allHaveLocal = false; break; }
				}
				if (allHaveLocal) {
					for (let a = i; a < j - 1; a++) {
						for (let b = i; b < j - 1 - (a - i); b++) {
							if (arr[b].localOrder > arr[b + 1].localOrder) {
								const tmp = arr[b];
								arr[b] = arr[b + 1];
								arr[b + 1] = tmp;
							}
						}
					}
				}
			}
			i = j;
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
	    
		// @ts-ignore
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
		return (o.width??(Crumbs.getRawPic(o.imgs[o.imgUsing]).width)) * o.scaleX * o.scaleFactorX; 
	};  
	Crumbs.getPHeight = function(o) {
		return (o.height??Crumbs.getRawPic(o.imgs[o.imgUsing]).height) * o.scaleY * o.scaleFactorY; 
	};

	// @ts-ignore
	Crumbs.drawAnchorDisplay = function(o, ctx) {
		ctx.save();
		if (o.anchorDisplayColor) { ctx.fillStyle = o.anchorDisplayColor; } else if (o.parent) { ctx.fillStyle = '#57d2f2'; } else { ctx.fillstyle = '#ccfffb'; }
		ctx.globalAlpha = 1;
		ctx.fillRect(o.offsetX - 3, o.offsetY - 3, 6, 6);
		ctx.restore();
	}
	Crumbs.getRawPic = function(img) {
		if (!img) { return Game.Loader.blank; }
		if (img instanceof Crumbs.image) { 
			if (!img.img) { 
				return Game.Loader.blank;
			}
			return img.img;
		} else if (typeof img == 'string') {
			return Pic(img);
		}
		return img;
	}
	//testing comment
	//Crumbs.spawn({ x: 100, y: 100, imgs: 'glint.png', scaleX: 2, scaleY: 2, children: { y: 30, imgs: 'glint.png', scaleX: 0.5, scaleY: 0.5 }, id: 1, behaviors: function() { this.rotation += 0.01; } });
	Crumbs.iterateObject = function(o, ctx) {
		ctx.save(); 
		
		ctx.globalAlpha = o.alpha;
		const p = o.imgs.length?Crumbs.getRawPic(o.imgs[o.imgUsing]):null;
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
			
			if (!o.noDraw && o.imgs.length ) { 
				ctx.drawImage(p, o.sx, o.sy, o.width ?? p.width, o.height ?? p.height, -ox + o.offsetX * o.scaleFactorX, -oy + o.offsetY * o.scaleFactorY, pWidth, pHeight); 
			}
			for (let ii = o.components.length - 1; ii >= 0; ii--) {
				if (o.components[ii].enabled) { o.components[ii].postDraw(o, ctx); }
			}
			if (Crumbs.prefs.anchorDisplay) { Crumbs.drawAnchorDisplay(o, ctx); }
		}
		
		ctx.restore(); 
	}
	Crumbs.forceDrawObject = function(o, ctx, callback) {
		//a carbon copy of Crumbs.iterateObject but it doesnt iterate and ignores noDraw and components
		ctx.save();

		ctx.globalAlpha = o.alpha;
		const p = o.imgs.length?Crumbs.getRawPic(o.imgs[o.imgUsing]):null;

		const pWidth = Crumbs.getPWidth(o); 
		const pHeight = Crumbs.getPHeight(o);
		const ox = Crumbs.getOffsetX(o.anchor, pWidth);
		const oy = Crumbs.getOffsetY(o.anchor, pHeight);

		const c = o.parent?Math.cos(-o.parent.rotation):1;
		const s = o.parent?Math.sin(-o.parent.rotation):0;
		ctx.translate(o.x * c - o.y * s, o.x * s + o.y * c);

		if (o.rotation) {
			ctx.rotate(o.rotation);
		} 

		callback?.call(o, ctx);

		ctx.drawImage(p, o.sx, o.sy, o.width ?? p.width, o.height ?? p.height, -ox + o.offsetX * o.scaleFactorX, -oy + o.offsetY * o.scaleFactorY, pWidth, pHeight);
		
		ctx.restore();
	}
	//HELPER ONLY
	Crumbs.setupContext = function(o, ctx) {
		ctx.globalAlpha = o.alpha;

		const c = o.parent?Math.cos(-o.parent.rotation):1;
		const s = o.parent?Math.sin(-o.parent.rotation):0;
		ctx.translate(o.x * c - o.y * s, o.x * s + o.y * c);

		if (o.rotation) {
			ctx.rotate(o.rotation);
		} 
	}
	Crumbs.drawPure = function(o, ctx, callback) {
		callback ?? callback.call(o, ctx);
		const p = o.imgs.length?Crumbs.getRawPic(o.imgs[o.imgUsing]):null;
		const ox = Crumbs.getOffsetX(o.anchor, Crumbs.getPWidth(o));
		const oy = Crumbs.getOffsetY(o.anchor, Crumbs.getPHeight(o));
		const pWidth = Crumbs.getPWidth(o); 
		const pHeight = Crumbs.getPHeight(o);
		ctx.drawImage(p, o.sx, o.sy, o.width ?? p.width, o.height ?? p.height, -ox + o.offsetX * o.scaleFactorX, -oy + o.offsetY * o.scaleFactorY, pWidth, pHeight);
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
		for (let scope in Crumbs.scopedCanvas) {
			if (!Crumbs.scopedCanvas[scope].redrawPerFrame) { continue; }
			Crumbs.drawObjectsIn(scope);
		}
		if (Crumbs.preloads.length) { Crumbs.preloads = []; }
	};
	Crumbs.drawObjectsIn = function(scope) {
		const c = scope;

		let list = Crumbs.compileObjects(c);
		Crumbs.sortedObjectList[c] = list;
		Crumbs.scopedCanvas[c].sortedObjects = Crumbs.sortedObjectList[c];
		Crumbs.scopedCanvas[c].objects = Crumbs.objects[c];
		Crumbs.scopedCanvas[c].l.style.background = Crumbs.scopedCanvas[c].background;
		let ctx = Crumbs.scopedCanvas[c].c;
		ctx.globalAlpha = 1;
		ctx.clearRect(0, 0, Crumbs.scopedCanvas[c].l.width, Crumbs.scopedCanvas[c].l.height); 
		const settingObj = {globalCompositeOperation: ctx.globalCompositeOperation, filter: ctx.filter, imageSmoothingEnabled: ctx.imageSmoothingEnabled, imageSmoothingQuality: ctx.imageSmoothingQuality};
		for (let i in Crumbs.settings) {
			ctx[i] = Crumbs.settings[i];
		}
		for (let i = 0; i < list.length; i++) {
			if (list[i].parent) { continue; }
			if (!list[i].enabled) { continue; }
			if (list[i][Crumbs.TYPE_IDENTIFIER] === Crumbs.SHADER) {
				list[i].apply();
				continue;
			}
			Crumbs.iterateObject(list[i], ctx);
		}
		for (let i in Crumbs.particles[c]) {
			const p = Crumbs.particles[c][i];
			if (p.globalCompositeOperation) { ctx.globalCompositeOperation = p.globalCompositeOperation; }
			ctx.translate(p.x, p.y);
			ctx.rotate(p.rotation);
			ctx.globalAlpha = p.alpha;
			ctx.drawImage(Crumbs.getRawPic(p.obj.img), -p.width / 2, -p.height / 2, p.width, p.height);
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
		if (!Crumbs.scopedCanvas[c].shaders.length) { return; }
		let data = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
		for (let i of Crumbs.scopedCanvas[c].shaders) {
			data = i.update(data);
		}
		ctx.putImageData(data, 0, 0);
	}

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
	init: function() {
		const self = this;

		if (window.crumbs_nofetch_bridges) { 
			this.header.call(this);
			return;
		}
		fetch(this.bridgesSource, { credentials: 'omit' })
			.then(resp => {
				if (!resp.ok) throw new Error('Failed to fetch bridges JSON: ' + resp.status);
				return resp.json();
			})
			.then(json => {
				if (json && typeof json === 'object') {
					self.bridges = json;
				} else {
					console.warn('Bridges JSON did not contain an object, keeping defaults.');
				}
			})
			.catch(err => {
				console.error('Error loading bridges JSON:', err);
				Game.Notify('Critical error', 'An error occurred with Crumbs engine bridge loading: <br>' + err.toString(), [1, 7]);
			})
			.finally(() => {
				self.header.call(self);
			}); 
	},
	header: function() { 
		for (let i in this.bridges) {
			if (Game.mods[i]) { 
				if (!this.bridges[i]) { continue; }
				if (typeof this.bridges[i] == 'string') { this.bridges[i] = [].concat(this.bridges[i]).concat(null); }
				if (this.bridges[i][0]) { this.bridgesToLoad++; } 
				if (this.bridges[i][1]) { this.bridgesToLoad++; } 
			}
		}

		Crumbs_Init_On_Load();

		window.CrumbsEngineModObj = this;

		eval('Game.registerMod='+Game.registerMod.toString().replace('mod.init=0;', '').replace('if (mod.load && Game.modSaveData[id]) mod.load(Game.modSaveData[id]);', '').replace('mod.init();', 
			'if (!window.CrumbsEngineModObj.loadBridge(id, 1)) { mod.init(); mod.init = 0; if (mod.load && Game.modSaveData[id]) mod.load(Game.modSaveData[id]); setTimeout(window.CrumbsEngineModObj.loadBridge(id, 0), 200); } else { const int = setInterval(function(mod) { if (!CrumbsEngineModObj.ready) { return; } mod.init(); mod.init = 0; if (mod.load && Game.modSaveData[id]) mod.load(Game.modSaveData[id]); setTimeout(window.CrumbsEngineModObj.loadBridge(id, 0), 200); clearInterval(int); }, 10, mod); }'));
	},
	loadBridge: function(id, order) {
		if (!this.bridges[id] || !this.bridges[id][order]) { return true; }
		if (this.bridges[id][order]) { 
			this.bridgesToLoad++; 
			window.CrumbsEngineLoaded = false;
		}
		if (!this.coreReady) {
			this.bridgesPendingCoreReady.push(this.bridges[id][order]);
			return;
		}
		if (this.bridges[id][order]) { Game.LoadMod(this.bridges[id][order]); }
	},
	loadAllViableBridges: function() {
		for (let i in this.bridges) {
			if (Game.mods[i]) { 
				if (!this.bridges[i]) { continue; }
				if (this.bridges[i][0]) { Game.LoadMod(this.bridges[i][0]); } //after target mod init
				if (this.bridges[i][1]) { Game.LoadMod(this.bridges[i][1]); } //before target mod init
			}
		}
	},
	declareBridgeLoaded: function() {
		this.bridgesLoaded++;
		if (!this.coreReady) { return; }
		if (this.bridgesLoaded == this.bridgesToLoad) { 
			window.CrumbsEngineLoaded = true;
			this.ready = true;
		} else {
			window.CrumbsEngineLoaded = false;
			this.ready = false;
		}
	},
	bridgesSource: (window.crumbs_load_local?'./bridgesList.json':'https://cursedsliver.github.io/Crumbs-engine/bridgesList.json'),
	bridgesPendingCoreReady: [],
	bridges: {
        'P for Pause': [(window.crumbs_load_local?'.':'https://cursedsliver.github.io/Crumbs-engine/bridges')+'/PForPauseBridge.js', null]
    },
	bridgesToLoad: 0,
	bridgesLoaded: 0,
	ready: false,
	coreReady: false,
	setReady: function() {
		this.coreReady = true;
		for (let i in this.bridgesPendingCoreReady) {
			Game.LoadMod(this.bridgesPendingCoreReady[i]);
		}
		this.bridgesPendingCoreReady = [];
		if (this.bridgesLoaded == this.bridgesToLoad) { 
			this.ready = true;
			window.CrumbsEngineLoaded = true;
		}
	},
	save: function() { return Crumbs.t + ''; },
	load: function(str) { Crumbs.t = parseInt(str); }
});