
	//template objects inits and behaviors
    Crumbs.objectInits = {}; //inits return array containing x, y, scaleX, scaleY, and rotation, and takes in one variable for scope
	Crumbs.objectInits.default = function() { };
	Crumbs.objectDefaults.init = Crumbs.objectInits.default;
	Crumbs.objectInits.bottomRandom = function() {
		this.x = Math.random() * this.scope.l.offsetWidth;
		this.y = this.scope.l.offsetHeight;
	};
	Crumbs.objectInits.topRandom = function() {
		this.x = Math.random() * this.scope.l.offsetWidth;
	};
	Crumbs.objectInits.totalRandom = function() {
		this.x = Math.random() * this.scope.l.offsetWidth;
		this.y = Math.random() * this.scope.l.offsetHeight;
	};
	Crumbs.objectInits.center = function() {
		this.x = this.scope.l.offsetWidth / 2;
		this.y = this.scope.l.offsetHeight / 2;
	};
	Crumbs.objectInits.bigCookie = function() {
		this.x = this.scope.l.offsetWidth / 2;
		this.y = this.scope.l.offsetHeight * 0.4;
	};
	Crumbs.objectBehaviors = {}; //behaviors return object to modify stuff
	Crumbs.objectBehaviors.idle = new Crumbs.behavior(function() { });
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
		if ((Crumbs.t - this.t) % p.cooldown == 0) { if (p.back) { frame--; if (frame < 0) { frame = this.imgs.length; } } else { frame++; if (frame >= this.imgs.length) { frame = 0; } } }
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
		if ((Crumbs.t - this.t) >= p.t) { this.die(); }
	}, { t: 1e21 });
	Crumbs.objectBehaviors.centerOnBigCookie = new Crumbs.behavior(function() { this.x = this.scope.l.width / 2; this.y = this.scope.l.height * 0.4; });
	Crumbs.objectBehaviors.pruneOnNonvisibleGravityBound = new Crumbs.behavior(function() {
		if (this.x > this.scope.l.offsetWidth + 100 || this.x < -100 || this.y > this.scope.l.offsetHeight + 100) { this.die(); }
	});

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

	Crumbs.cookieObject = {
		width: 48,
		height: 48,
		imgs: ['icons.png'],
		scope: 'left'
	}
	Crumbs.dollarObject = {
		imgs: ['dollar'],
		width: 64,
		height: 64,
		sx: Math.floor(Math.random() * 8) * 64,
		sy: 0,
		scope: 'left',
	}

	Crumbs.wrinklerBit = {
		imgs: ['wrinklerBits.png', 'shinyWrinklerBits.png'],
		width: 100,
		height: 200,
		sx: 0,
		sy: -10,
		anchor: 'top-left',
		scope: 'left'
	};

	Crumbs.spawnCookieShower = function() {
		if (Game.prefs.particles && Game.cookies && Game.T%Math.ceil(Game.fps/Math.min(10,Game.cookiesPs))==0) {
			Crumbs.spawnFallingCookie(0, -64, 0, 0, 2, 'fallingCookie');
		}
	};
	Crumbs.spawnFallingCookie = function(x, y, yd, speed, t, id, onMouse, sc, order, noInit, iconInput) {
		if (Game.AscendTimer || !Game.prefs.particles) { return; }
		let icon = iconInput || (Game.season=='fools'?[]:((Math.random()<0.0001)?[17,5]:choose(Crumbs.cookieIcons)));
		let c = {
			behaviors: [
				new Crumbs.behaviorInstance(Crumbs.objectBehaviors.cookieFall, {yd: yd}), 
				new Crumbs.behaviorInstance(Crumbs.objectBehaviors.horizontal, {speed: speed}), 
				new Crumbs.behaviorInstance(Crumbs.objectBehaviors.expireAfter, {t: t * Game.fps}), 
				new Crumbs.behaviorInstance(Crumbs.objectBehaviors.fadeout, {speed: 1 / (t * Game.fps)}),
				new Crumbs.behaviorInstance(Crumbs.objectBehaviors.pruneOnNonvisibleGravityBound)
			],
			x: (onMouse?Game.mouseX:x),
			y: (onMouse?Game.mouseY:y),
			scaleX: sc ?? 1,
			scaleY: sc ?? 1,
			order: order ?? -2,
			id: id,
			rotation: Math.random() * 2 * Math.PI,
			sx: icon[0] * 48,
			sy: icon[1] * 48,
		};
		if (!onMouse && !noInit) { c.init = Crumbs.objectInits.topRandom; }
		if (icon[2]) { c.imgs = icon[2]; }
		return Crumbs.spawnVisible((Game.season=='fools'?Crumbs.dollarObject:Crumbs.cookieObject), c);
	};
	Game.registerHook('logic', function() { Crumbs.spawnCookieShower(); });
	eval('Game.Logic='+Game.Logic.toString().replace(`if (Game.prefs.particles && Game.cookies && Game.T%Math.ceil(Game.fps/Math.min(10,Game.cookiesPs))==0) Game.particleAdd();//cookie shower`, ''));
	eval('Game.ClickCookie='+Game.ClickCookie.toString().replace('Game.particleAdd();', '').replace('Game.particleAdd(Game.mouseX,Game.mouseY,Math.random()*4-2,Math.random()*-2-2,Math.random()*0.5+0.75,1,2);', '').replace('if (Game.prefs.numbers)', 'Crumbs.spawnCookieClickPopup(Game.mouseX+Math.random()*8-4, Game.mouseY-8+Math.random()*8-4, "+"+Beautify(amount,1)); if (false)'));

	Crumbs.spawnWrinklerBits = function(type, originId, id) {
		const o = Crumbs.findObject('wrinkler'+originId);
		return Crumbs.spawnVisible(Crumbs.wrinklerBit, {
			behaviors: [new Crumbs.behaviorInstance(Crumbs.objectBehaviors.cookieFall, {yd: Math.random()*-2-2}), new Crumbs.behaviorInstance(Crumbs.objectBehaviors.horizontal, {speed: Math.random()*4-2}), new Crumbs.behaviorInstance(Crumbs.objectBehaviors.expireAfter, {t: 1 * Game.fps}), new Crumbs.behaviorInstance(Crumbs.objectBehaviors.fadeout, {speed: 1 / (1 * Game.fps)})],
			imgUsing: type,
			sx: ((id * 3) % 8) * 100,
			x: o.x,
			y: o.y,
			offsetX: o.offsetX - 50,
			offsetY: o.offsetY,
			rotation: o.rotation,
			order: o.order,
		});
	};

	Crumbs.fallingCookieOnclick = function() {
		if (Game.prefs.particles) {
			Crumbs.spawnFallingCookie(0, -64, 0, 0, 2, 'fallingCookie', false, 1, 0);
			Crumbs.spawnFallingCookie(0, 0, Math.random()*-2-2, Math.random()*4-2, 1, 'clickedCookie', true, Math.random()*0.5+0.75, 2);
		}
	}
	Game.registerHook('click', function() {
		Crumbs.fallingCookieOnclick();
	});
	Crumbs.killAllFallingCookies = function() {
		let list = Crumbs.getObjects('fallingCookie', 'left');
		for (let i = list.length - 1; i >= 0; i--) {
			list[i].die();
		}
	}

	eval('Game.UpdateWrinklers='+replaceAll('part.r=-me.r;', '', replaceAll(`Game.particleAdd(Game.mouseX,Game.mouseY,Math.random()*4-2,Math.random()*-2-2,Math.random()*0.5+0.75,1.5,2);`, `Crumbs.spawnFallingCookie(0, 0, Math.random()*-2-2, Math.random()*4-2, 1, 'wrinklerPoppedCookie', true, Math.random()*0.5+0.75);`, Game.UpdateWrinklers.toString()).replace('inRect(', 'Crumbs.h.inRectOld(').replace(`var part=Game.particleAdd(x,y,Math.random()*4-2,Math.random()*-2-2,1,1,2,me.type==1?'shinyWrinklerBits.png':'wrinklerBits.png');`, `Crumbs.spawnWrinklerBits(me.type, me.id, Math.floor(ii + Math.floor(3 * (me.id + 1) * Math.random()) + 2));`).replace(`var part=Game.particleAdd(x,y,Math.random()*4-2,Math.random()*-2-2,1,1,2,me.type==1?'shinyWrinklerBits.png':'wrinklerBits.png');`, `Crumbs.spawnWrinklerBits(me.type, me.id, ii);`)));

	Crumbs.wrinklerShadowObj = {
		anchor: 'top',
		y: 30,
		scaleX: 5,
		scaleY: 5,
		order: 1,
		imgs: ['img/wrinklerShadow.png'],
		behaviors: new Crumbs.behaviorInstance(function(p) {
			if (Game.prefs.fancy && Game.wrinklers[this.parent.wId].close > 0) {
				this.noDraw = false;
				this.alpha = Game.wrinklers[this.parent.wId].close;
				return;
			} 
			this.noDraw = true;
		})
	}
	Crumbs.wrinklerEyeObj = {
		imgs: ['', 'img/wrinklerBlink.png', 'img/wrinklerGooglies.png'],
		anchor: 'top',
		offsetY: -10+Math.sin(Game.T*0.2+i*3+1.2),
		order: 3,
		scope: 'left',
		behaviors: new Crumbs.behaviorInstance(function(p) {
			if (Game.prefs.notScary && Game.wrinklers[this.parent.wId].close > 0) {
				this.offsetY = -10+Math.sin(Game.T*0.2+this.wId*3+1.2);
				this.imgUsing = Math.sin(Game.T*0.003+i*11+137+Math.sin(Game.T*0.017+i*13))>0.9997?1:2;
				this.alpha = Game.wrinklers[this.parent.wId].close;
				return;
			}
			this.imgUsing = 0;
		})
	}
	Crumbs.objectBehaviors.wrinklerSkins = new Crumbs.behavior(function(p) {
		if (Game.wrinklers[this.wId].phase > 0) {
			if (Game.wrinklers[this.wId].type > 0) { this.imgUsing = Game.WINKLERS?5:2; return; }
			if (Game.season == 'christmas') { this.imgUsing = Game.WINKLERS?6:3; return; }
			this.imgUsing = Game.WINKLERS?4:1; return;
		}
		this.imgUsing = 0;
	});
	Crumbs.objectBehaviors.wrinklerMovement = new Crumbs.behavior(function(p) {
		const sw=100+2*Math.sin(Game.T*0.2+this.wId*3);
		const sh=200+5*Math.sin(Game.T*0.2-2+this.wId*3);
		const me = Game.wrinklers[this.wId];
		this.scaleX = sw / 100;
		this.scaleY = sh / 200;
		this.x = me.x;
		this.y = me.y;
		this.offsetX = -sw/2 + 50;
		this.rotation = -(me.r)*Math.PI/180;
		this.alpha = me.close;
	});
	Crumbs.objectBehaviors.wrinklerParticles = new Crumbs.behavior(function(p) {
		if (!Game.prefs.particles) { return; }
		const me = Game.wrinklers[this.wId];
		if (me.phase == 2 && Math.random() < 0.03) {
			Crumbs.spawnFallingCookie(me.x, me.y, Math.random()*-2-2, Math.random()*4-2, 1, 'wrinklerPassive', false, Math.random()*0.5+0.5, 4, true);
		}
	});
    Crumbs.onWrinklerClick = function() {
		if (Game.OnAscend) { return; }
        const me = Game.wrinklers[this.wId];
        if (Game.keys[17] && Game.sesame) { me.type = !me.type; PlaySound('snd/shimmerClick.mp3'); return; }
        Game.playWrinklerSquishSound();
        me.clicks++;
        if (me.clicks >= 50) Game.Win('Wrinkler poker');
        me.hurt = 1;
        me.hp -= 0.75;
        if (Game.prefs.particles && !Game.prefs.notScary && !Game.WINKLERS && !(me.hp <= 0.5 && me.phase > 0)) {
            for (let i = 0; i < 3; i++) { Crumbs.spawnWrinklerBits(me.type, me.id, Math.floor(i + Math.floor(3 * (me.id + 1) * Math.random()) + 2)); }
        }
    }
	Crumbs.wrinklerSkins = ['', 'img/wrinkler.png', 'img/shinyWrinkler.png', 'img/winterWrinkler.png', 'winkler.png', 'shinyWinkler.png', 'winterWinkler.png'];
	Crumbs.wrinklerObj = {
		imgs: Crumbs.wrinklerSkins,
		order: 1.5,
		scope: 'left',
		anchor: 'top',
		offsetY: -10,
		behaviors: [
			new Crumbs.behaviorInstance(Crumbs.objectBehaviors.wrinklerSkins), 
			new Crumbs.behaviorInstance(Crumbs.objectBehaviors.wrinklerMovement), 
			new Crumbs.behaviorInstance(Crumbs.objectBehaviors.wrinklerParticles)
		],
		components: [
            new Crumbs.component.canvasManipulator({ function: function(m, ctx) {
                if (Game.wrinklers[m.wId].type != 1 || Math.random() >= 0.3 || !Game.prefs.particles) { return; }
                ctx.globalAlpha=Math.random()*0.65+0.1;
                var s=Math.random()*30+5;
                ctx.globalCompositeOperation='lighter';
                ctx.drawImage(Pic('glint.png'),-s/2+Math.random()*50-25,-s/2+Math.random()*200,s,s);
            } }),
            new Crumbs.component.pointerInteractive({ boundingType: 'rect', onRelease: Crumbs.onWrinklerClick }),
        ],
		children: [
			Crumbs.wrinklerShadowObj,
			Crumbs.wrinklerEyeObj
		]
	}
	Crumbs.initWrinklers = function() {
		for (let i = 0; i < Game.wrinklerLimit; i++) {
			let w = Crumbs.findObject('wrinkler'+i, 'left');
			if (w !== null) { w.die(); }
		}
		for (let i = 0; i < Game.wrinklerLimit; i++) {
			const h = Crumbs.spawn(Crumbs.wrinklerObj, { id: 'wrinkler'+i, wId: i });
			for (let i in h.children) {
				h.children[i].wId = i;
			}
		}
	};
	Crumbs.objectBehaviors.milkBehavior = new Crumbs.behavior(function() {
		if (!Game.prefs.milk) { this.getComponent('patternFill').disable(); this.noDraw = true; return; } else { this.getComponent('patternFill').enable(); this.noDraw = false; }
		let toReturn = {imgs: [Game.Milk.pic]};
		if (Game.milkType!=0 && Game.ascensionMode!=1) { toReturn.imgs = [Game.AllMilks[Game.milkType].pic]; }
		let a=1;
		let y = Crumbs.scopedCanvas.left.l.height * Game.milkHd;
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
		toReturn.y = Crumbs.scopedCanvas.left.l.height - y;
		this.getComponent('patternFill').width = Crumbs.scopedCanvas.left.l.width + 480;
		this.getComponent('patternFill').offX = Math.floor((Game.T*2-(Game.milkH-Game.milkHd)*2000+480*2)%480);
		this.set(toReturn);
	})
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
		if (!Game.prefs.cursors || Game.AscendTimer) { return; }
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
	Crumbs.objectBehaviors.fadeWithDragon = new Crumbs.behavior(function() {
		if (Game.hasBuff('Dragonflight') || Game.hasBuff('Dragon Harvest')) { this.alpha = 0.25; } else { this.alpha = 1; }
	});
	Crumbs.initCursors = function() {
		Crumbs.spawn({
			init: Crumbs.objectInits.bigCookie,
			anchor: 'top-left',
			scope: 'left',
			components: new Crumbs.component.canvasManipulator({
				function: Crumbs.cursorDraw
			}),
			behaviors: [new Crumbs.behaviorInstance(Crumbs.objectBehaviors.centerOnBigCookie), new Crumbs.behaviorInstance(Crumbs.objectBehaviors.fadeWithDragon)],
			id: 'cursors'
		});
	};
	Crumbs.objectBehaviors.dragonDisplayBehavior = new Crumbs.behavior(function() {
		if (Game.hasBuff('Dragonflight') || Game.hasBuff('Dragon Harvest')) { this.noDraw = false; } else { this.noDraw = true; return; }
		let s=2*(1+Math.sin(Game.T*0.013)*0.1);
		this.y = -(s*300)/(1.4+0.2*Math.sin(Game.T*0.01));
		this.scaleX = s;
		this.scaleY = s;
	});
	Crumbs.objectBehaviors.drawOnEaster = new Crumbs.behavior(function() {
		if (Game.season == 'easter') { this.noDraw = false; } else { this.noDraw = true; }
	});
	Crumbs.objectInits.cookieWidgets = function() {
		this.spawnChild({
			imgs: 'cookieShadow.png',
			order: -1.5,
			scaleX: 8,
			scaleY: 8,
			y: 20
		});
		this.spawnChild({
			imgs: 'nest.png',
			order: -1.2,
			y: 130,
			scaleX: (0.98)*2,
			scaleY: (0.98*161/151)*2,
			behaviors: new Crumbs.behaviorInstance(Crumbs.objectBehaviors.drawOnEaster)
		});
		this.spawnChild({
			order: 1,
			components: new Crumbs.component.canvasManipulator({ function: function(m, ctx) {
				if (!Game.prefs.particles) { return; }
				let goodBuff = false;
				for (var i in Game.buffs) {
					if (Game.buffs[i].aura == 1) { goodBuff = true; }
				}
				if (!goodBuff) { return; }
				ctx.globalCompositeOperation = 'lighter';
				for (var i = 0; i < 1; i++) {
					ctx.globalAlpha = Math.random() * 0.65 + 0.1;
					var size = Math.random() * 30 + 5;
					var a = Math.random() * Math.PI * 2;
					var d = 256 * Game.BigCookieSize * 0.9 * Math.random() / 2;
					ctx.drawImage(Pic('glint.png'), -size / 2 + Math.sin(a) * d, -size / 2 + Math.cos(a) * d, size, size);
				}
			} })
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
		if (Game.prefs.particles) {
            if (goodBuff) { this.imgUsing = 1; alphaMult = 1; } else if (badBuff) { this.imgUsing = 2; alphaMult = 1; } else { this.imgUsing = 0; }
        } else {
            this.imgUsing = 0;
        }
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
	Crumbs.objectBehaviors.cookieController = new Crumbs.behavior(function() {
		if (Game.AscendTimer) { this.enabled = false; }
	});
	Crumbs.cookieAscendBreakFunc = function(m, ctx) {
		if (!Game.AscendTimer) { return; }
		var tBase = Math.max(0, (Game.AscendTimer - Game.AscendBreakpoint) / (Game.AscendDuration - Game.AscendBreakpoint));
		//flares
		var n = 9;
		var t = Game.AscendTimer / Game.AscendBreakpoint;
		if (Game.AscendTimer < Game.AscendBreakpoint) {
			ctx.save();
			ctx.translate(Game.cookieOriginX, Game.cookieOriginY);
			for (var i = 0; i < n; i++) {
				if (Math.floor(t / 3 * n * 3 + i * 2.7) % 2) {
					var t2 = Math.pow((t / 3 * n * 3 + i * 2.7) % 1, 1.5);
					ctx.globalAlpha = (1 - t) * (Game.drawT % 2 == 0 ? 0.5 : 1);
					var sw = (1 - t2 * 0.5) * 96;
					var sh = (0.5 + t2 * 1.5) * 96;
					ctx.drawImage(Pic('shineSpoke.png'), -sw / 2, -sh - 32 - (1 - t2) * 256, sw, sh);
				}
				ctx.rotate(Math.PI * 2 / n);
			}
			ctx.restore();
		}


		//flash at breakpoint
		if (tBase < 0.1 && tBase > 0) {
			ctx.globalAlpha = 1 - tBase / 0.1;
			ctx.fillStyle = '#fff';
			ctx.fillRect(-m.x, -m.y, ctx.canvas.width, ctx.canvas.height);
			ctx.globalAlpha = 1;
		}
		if (tBase > 0.8) {
			ctx.globalAlpha = (tBase - 0.8) / 0.2;
			ctx.fillStyle = '#000';
			ctx.fillRect(-m.x, -m.y, ctx.canvas.width, ctx.canvas.height);
			ctx.globalAlpha = 1;
		}
	}
	Game.registerHook('reincarnate', function() { Crumbs.findObject('bigCookie').enabled = true; });
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
			id: 'shine1',
			order: -2,
			scaleX: 4,
			scaleY: 4,
			components: new Crumbs.component.settings({ globalCompositeOperation: 'source-over' }),
			behaviors: new Crumbs.behaviorInstance(Crumbs.objectBehaviors.shine1)
		}
		const shine2 = {
			imgs: ['img/shine.png', 'img/shineGold.png', 'img/shineRed.png'],
			id: 'shine2',
			order: -2.1,
			scaleX: 4,
			scaleY: 4,
			components: new Crumbs.component.settings({ globalCompositeOperation: 'source-over' }),
			behaviors: new Crumbs.behaviorInstance(Crumbs.objectBehaviors.shine2)
		}
		const veilMain = {
			id: 'veilMain',
			imgs: 'img/shimmeringVeil.png',
			order: 0,
			scaleX: 2.5,
			scaleY: 2.5,
			components: new Crumbs.component.settings({ globalCompositeOperation: 'lighter' }),
			behaviors: new Crumbs.behaviorInstance(Crumbs.objectBehaviors.veilMain)
		}
		const glintGen = {
			id: 'veilGlintGenerator',
			components: [new Crumbs.component.settings({ globalCompositeOperation: 'lighter' }), new Crumbs.component.canvasManipulator({ function: Crumbs.veilGlintGenerator })]
		}
		const dragon = {
			imgs: 'dragonBG.png',
			order: -1.8,
			anchor: 'top',
			behaviors: new Crumbs.behaviorInstance(Crumbs.objectBehaviors.dragonDisplayBehavior)
		};
		this.spawnChild(shine1);
		this.spawnChild(shine2);
		this.spawnChild(veilMain);
		this.spawnChild(glintGen);
		this.spawnChild(dragon);
	}
	Crumbs.initCookie = function() {
		if (Crumbs.findObject('bigCookie')) { Crumbs.findObject('bigCookie').die(); }
		let bigCookieAnchor = Crumbs.spawn({
			anchor: 'center',
			scope: 'left',
			id: 'bigCookie',
			init: Crumbs.objectInits.cookieInit,
			behaviors: [
				new Crumbs.behaviorInstance(Crumbs.objectBehaviors.centerOnBigCookie),
				new Crumbs.behaviorInstance(Crumbs.objectBehaviors.cookieController)
			]
		});
		bigCookieAnchor.spawnChild({
			imgs: 'img/perfectCookie.png',
			id: 'bigCookieDisplay',
			order: -1,
			init: Crumbs.objectInits.cookieWidgets,
			behaviors: [
				new Crumbs.behaviorInstance(Crumbs.objectBehaviors.cookieWobble)
			]
		});
	};

    Crumbs.objectBehaviors.brokenCookieChunk = new Crumbs.behavior(function(p) {
        var tBase=Math.max(0,(Game.AscendTimer-Game.AscendBreakpoint)/(Game.AscendDuration-Game.AscendBreakpoint));
        var t=Math.pow(tBase,0.5);
        var x2 = 0;
        var y2 = 0;
        if (tBase > 0) {
            this.x = this.y = 0;
        }
        else {
            var shake=Game.AscendTimer/Game.AscendBreakpoint;
            x2=(Math.random()*2-1)*5*shake; 
            y2=(Math.random()*2-1)*5*shake;
        }
        var s = 256 * (t*0.5+1);
        var d=t*(80+((p.cID+2)%3)*40);
        var h = -(((p.cNum+4)%10)*0.1)*Math.PI*2;
        this.rotation = -t*Math.PI*0.2;
        this.alpha = 1 - t;
        this.offsetX = -s*0.5 + Math.sin(h)*d+x2;
        this.offsetY = -s*0.5 + Math.cos(h)*d+y2;
        this.scaleX = this.scaleY = s *  0.00390625;
    });
    Crumbs.objectBehaviors.brokenCookieHalo = new Crumbs.behavior(function() {
        this.noDraw = Game.AscendTimer > Game.AscendBreakpoint;
        if (this.noDraw) { return; }
        this.alpha = Game.AscendTimer / Game.AscendBreakpoint;
    });
    Crumbs.objectBehaviors.brokenCookieRing = new Crumbs.behavior(function(p) {
        let tBase=(Game.AscendTimer-Game.AscendBreakpoint)/(Game.AscendDuration-Game.AscendBreakpoint);
        this.alpha = tBase >= 0 ? 1 - tBase**0.25 : 0;
        this.rotation = Game.T * (p.id == 1 ? 0.007 : -0.002);
        this.scaleX = this.scaleY = 4.6875 * (0.5 + (p.id == 1 ? tBase ** 0.6 : (1-tBase) ** 0.4));
    });
    Crumbs.objectBehaviors.brokenCookie = new Crumbs.behavior(function() {
        if (!Game.AscendTimer) { this.enabled = false; }
        else {
            var shake=Game.AscendTimer/Game.AscendBreakpoint;
            if (shake < 1) {
                this.x+=(Math.random()*2-1)*10*shake;
                this.y+=(Math.random()*2-1)*10*shake;
            }
        }
    });
    Crumbs.initBrokenCookie = function() {
        let brokenCookieAnchor = Crumbs.spawn({
            scope: 'left',
            id: 'brokenCookie',
            behaviors: [
                new Crumbs.behaviorInstance(Crumbs.objectBehaviors.centerOnBigCookie),
                new Crumbs.behaviorInstance(Crumbs.objectBehaviors.brokenCookie)
            ]
        });
        for (let i = 1; i <= 2; i++) {
            brokenCookieAnchor.spawnChild({
                id: 'brokenCookieRing' + i,
                imgs: 'img/heavenRing' + i + '.jpg',
                order: 0,
                behaviors: new Crumbs.behaviorInstance(Crumbs.objectBehaviors.brokenCookieRing, { id: i }),
                components: new Crumbs.component.settings({ globalCompositeOperation: 'lighter' })
            });
        }
        let chunks = {0:7,1:6,2:3,3:2,4:8,5:1,6:9,7:5,8:0,9:4};
        for (let i = 0; i < 10; i++) {
            brokenCookieAnchor.spawnChild({
                imgs: 'img/brokenCookie.png',
                sx: 256 * chunks[i],
                width: 256,
                id: 'brokenCookiePiece' + i,
                order: 1,
                anchor: 'top-left',
                behaviors: new Crumbs.behaviorInstance(Crumbs.objectBehaviors.brokenCookieChunk, { cID: i, cNum: chunks[i] })
            });
        }
        brokenCookieAnchor.spawnChild({
            imgs: 'img/brokenCookieHalo.png',
            id: 'brokenCookieHalo',
            scaleX: 2,
            scaleY: 2,
            order: 2,
            behaviors: new Crumbs.behaviorInstance(Crumbs.objectBehaviors.brokenCookieHalo)
        });
        Crumbs.spawn({
            scope: 'left',
            order: 3,
            components: new Crumbs.component.canvasManipulator({ function: Crumbs.cookieAscendBreakFunc })
        });
    }
    eval('Game.UpdateAscendIntro='+Game.UpdateAscendIntro.toString().replace("if (Game.AscendTimer==1) PlaySound('snd/charging.mp3');", "if (Game.AscendTimer==1) { PlaySound('snd/charging.mp3'); Crumbs.findObject('brokenCookie').enabled = true; }"))
	eval('Game.Ascend='+Game.Ascend.toString().replace('Game.AscendTimer=1;', 'Game.AscendTimer=1; Crumbs.killAllFallingCookies();'));
	Crumbs.objectBehaviors.cookieShowerBackground = new Crumbs.behavior(function() {
		if (!Game.prefs.particles || Game.cookiesPs<=50 || Game.AscendTimer!=0) { this.noDraw = true; this.getComponent('patternFill').disable(); return; } else { this.noDraw = false; this.getComponent('patternFill').enable(); }
		if (Game.elderWrathD>=1 && !Game.prefs.notScary) { this.alpha=1-((Math.min(Game.elderWrathD,1.5)-1)/0.5); } else { this.alpha = 1; }
		
		if (Game.cookiesPs>1000) { this.imgUsing = 2; }
		else if (Game.cookiesPs>500) { this.imgUsing = 1; }
		else if (Game.cookiesPs>50) { this.imgUsing = 0; }

		const p = this.getComponent('patternFill');
		p.width = Crumbs.scopedCanvas.left.l.width;
		p.height = Crumbs.scopedCanvas.left.l.height;
		p.offY = (Math.floor(Game.T*2)%512);
	});
	Crumbs.initCookieWall = function() {
		Crumbs.spawn({
			anchor: 'top-left',
			scope: 'left',
			id: 'cookieWall',
			order: -4,
			imgs: ['img/cookieShower1.png', 'img/cookieShower2.png', 'img/cookieShower3.png'],
			components: new Crumbs.component.patternFill(),
			behaviors: new Crumbs.behaviorInstance(Crumbs.objectBehaviors.cookieShowerBackground)
		});
	};
	Crumbs.objectBehaviors.background = new Crumbs.behavior(function() {
		if (Game.OnAscend) { this.noDraw = true; return; } else { this.noDraw = false; }
		this.imgs[0] = 'img/'+Game.bg+'.jpg';
		
		const p = this.getComponent('patternFill');
		p.width = Crumbs.scopedCanvas.background.l.width;
		p.height = Crumbs.scopedCanvas.background.l.height;
	});
	Crumbs.objectBehaviors.ascendBackground = new Crumbs.behavior(function(p) {
		if ((p.fancyRequire && !Game.prefs.fancy) || !Game.OnAscend) { this.noDraw = true; return; } else { this.noDraw = false; }
		if (p.alphaFluctuation) { this.alpha = 0.5*(0.5+Math.sin(Game.T*0.02)*0.3); }
		let b = Game.ascendl.getBounds();
		let x = (b.left+b.right)/2;
		let y = (b.top+b.bottom)/2;
		let s = Game.AscendZoom*p.sMult();
		let c = this.getComponent('patternFill');
		c.width = Game.Background.canvas.width;
		c.height = Game.Background.canvas.height;
		c.offX = Game.AscendOffX * 0.25 * s + x;
		c.offY = Game.AscendOffY * 0.25 * s + y;
		this.width = s * 1024;
		this.height = s * 1024;
	}, { fancyRequire: false, alphaFluctuation: false, sMult: function() { return (1+Math.cos(Game.T*0.0027)*0.05); } });
	Crumbs.initBackground = function() {
		Crumbs.spawn({
			anchor: 'top-left',
			scope: 'background',
			components: new Crumbs.component.canvasManipulator({
				function: function(m, ctx) {
					ctx.fillStyle = 'black';
					ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
				}
			}),
			order: -Infinity
		})
		Crumbs.spawn({
			anchor: 'top-left',
			scope: 'background',
			id: 'gameBG',
			imgs: Game.bg,
			components: new Crumbs.component.patternFill(),
			behaviors: new Crumbs.behaviorInstance(Crumbs.objectBehaviors.background)
		});
		Crumbs.spawn({
			anchor: 'top-left',
			scope: 'background',
			imgs: 'starbg.jpg',
			//alpha: 0.5,
			components: new Crumbs.component.patternFill(),
			behaviors: new Crumbs.behaviorInstance(Crumbs.objectBehaviors.ascendBackground)
		});
		Crumbs.spawn({
			anchor: 'top-left',
			scope: 'background',
			imgs: 'starbg.jpg',
			order: 0.5,
			//alpha: 0.5,
			components: new Crumbs.component.patternFill(),
			behaviors: new Crumbs.behaviorInstance(Crumbs.objectBehaviors.ascendBackground, { fancyRequire: true, alphaFluctuation: true, sMult: function() { return 2*(1+Math.sin(Game.T*0.002)*0.07); } })
		});
	}
	Crumbs.objectBehaviors.fillWhole = new Crumbs.behavior(function() {
		this.scaleX = this.scope.l.offsetWidth / Pic(this.imgs[this.imgUsing]).width;
		this.scaleY = this.scope.l.offsetHeight / Pic(this.imgs[this.imgUsing]).height;
	});
	Crumbs.objectBehaviors.shadedBorderAura = new Crumbs.behavior(function() {
		var goodBuff=0;
		var badBuff=0;
		for (var i in Game.buffs)
		{
			if (Game.buffs[i].aura==1) goodBuff=1;
			if (Game.buffs[i].aura==2) badBuff=1;
		}
		this.imgUsing = 0;
		if (badBuff) { this.imgUsing = 2; }
		if (goodBuff) { this.imgUsing = 1; if (Game.prefs.fancy) { this.getComponent('settings').obj.globalCompositeOperation = 'lighter'; } } else { this.getComponent('settings').obj.globalCompositeOperation = 'source-over'; }
	});
	Crumbs.shadedBorderObj = {
		anchor: 'top-left',
		order: 1,
		id: 'shadedBorders',
		imgs: ['shadedBordersSoft.png', 'shadedBordersGold.png', 'shadedBordersRed.png', 'shadedBorders.png'],
		behaviors: [new Crumbs.behaviorInstance(Crumbs.objectBehaviors.fillWhole)]
	}
	Crumbs.initShadedBorders = function() {
		Crumbs.spawn(Crumbs.shadedBorderObj, { scope: 'background' });
		Crumbs.spawn(Crumbs.shadedBorderObj, { scope: 'left', components: new Crumbs.component.settings({ globalCompositeOperation: 'source-over' }), behaviors: [new Crumbs.behaviorInstance(Crumbs.objectBehaviors.fillWhole), new Crumbs.behaviorInstance(Crumbs.objectBehaviors.shadedBorderAura)] });
	}
	Crumbs.objectBehaviors.petInteractive = new Crumbs.behavior(function(p) {
		if (!p.enableCondition() || Game.AscendTimer) { this.findChild(p.pet+'Display').enabled = false; this.active = false; return; } else { this.findChild(p.pet+'Display').enabled = true; this.active = true; this.scaleX = this.scaleY = Game.specialTab == p.pet ? 2 : 1; this.x = Game.specialTab == p.pet ? 48 : 24; }
	}, { pet: '', enableCondition: function() { } });
	Crumbs.objectBehaviors.petDisplayMove = new Crumbs.behavior(function(p) {
        if (!Game.prefs.fancy) { this.offsetX = 0; this.offsetY = 0; return; }
		this.offsetX = Game.specialTab == p.tab ? 0 : Math.sin(Game.T * 0.2 + this.parent.placement) * 3;
		this.offsetY = -(Game.specialTab == p.tab ? 6 : Math.abs(Math.cos(Game.T * 0.2 + this.parent.placement)) * 6);
	}, { tab: '' });
    Crumbs.objectBehaviors.petDisplaySize = new Crumbs.behavior(function(p) { this.scaleX = this.scaleY = Game.specialTab == p.tab ? 0.25 : 0.5; }, { tab: '' });
	Crumbs.objectBehaviors.enableOnHover = new Crumbs.behavior(function(p) { this.noDraw = !p?.target.getComponent('pointerInteractive').hovered; }, { target: null });
	Crumbs.objectBehaviors.petShineEnable = new Crumbs.behavior(function(p) { this.noDraw = !(p.target?.getComponent('pointerInteractive').hovered || (Game.specialTab && p.target.id.includes(Game.specialTab))); }, { target: null });
	Crumbs.objectBehaviors.follow = new Crumbs.behavior(function(p) { this.x = p.target.x + (p.offset?p.target.offsetX:0); this.y = p.target.y + (p.offset?p.target.offsetY:0); }, { target: null, offset: false });
	Crumbs.shine = function(scaleMult, target1, target2) {
		return {
			order: 10, 
			imgs: 'img/shine.png',
			scaleX: scaleMult,
			scaleY: scaleMult,
			behaviors: [
                new Crumbs.behaviorInstance(Crumbs.objectBehaviors.spin, { spin: (0.5/360)*Math.PI*2 }), 
                new Crumbs.behaviorInstance(Crumbs.objectBehaviors.petShineEnable, { target: target1 }),
                new Crumbs.behaviorInstance(Crumbs.objectBehaviors.petDisplaySize, { tab: target1.id }),
                new Crumbs.behaviorInstance(Crumbs.objectBehaviors.follow, { target: target2 })
            ]
		};
	}
	Crumbs.objectBehaviors.petManager = new Crumbs.behavior(function() {
		const height = this.scope.l.offsetHeight;

		let count = 0;
		for (let i in this.children) {
			if (!this.children[i].active) { this.children[i].getComponent('pointerInteractive').disable(); continue; } 
			else { this.children[i].getComponent('pointerInteractive').enable(); }
			this.children[i].y = height - 72 - 48 * count;
			this.children[i].placement = count;
			count++;
		}
	});
	Crumbs.initPets = function() {
		Crumbs.spawn({
			id: 'petAnchor',
			noDraw: true,
			scope: 'left',
			order: 100,
			behaviors: new Crumbs.behaviorInstance(Crumbs.objectBehaviors.petManager)
		});
		//Crumbs.initDragon(anchor);
		//Crumbs.initSanta(anchor);
        Crumbs.createPet({
			special: 'dragon',
			image: 'dragon.png?v='+Game.version,
			skinFunction: function() {
				this.sx = Game.dragonLevels[Game.dragonLevel].pic * 96;
			},
			enableCondition: function() { return (Game.Has('A crumbly egg')); }
		});

		Crumbs.createPet({
			special: 'santa',
			image: 'santa.png?v='+Game.version,
			skinFunction: function() {
				this.sx = 96 * Game.santaLevel;
			},
			enableCondition: function() { return (Game.Has('A festive hat')); }
		});
	}
	Crumbs.createPet = function(obj) {
		//creates the crumbs object only
		//obj description
		//special: specialTab string
		//image: spritesheet
		//skinFunction: function to update the sprite of the pet
		//enableCondition: function to check if the pet is enabled
		const anchor = Crumbs.findObject('petAnchor', 'left');
		let h = anchor.spawnChild({
			id: obj.special,
			scaleX: 1,
			scaleY: 1,
			order: 100,
			x: 24,
			width: 48,
			height: 48,
			placement: 0,
			active: false,
			children: {
				id: obj.special+'Display',
				imgs: obj.image,
				order: 100,
				width: 96,
				scaleX: 0.5,
				height: 96,
				scaleY: 0.5,
				behaviors: [
					new Crumbs.behaviorInstance(new Crumbs.behavior(obj.skinFunction)),
					new Crumbs.behaviorInstance(Crumbs.objectBehaviors.petDisplayMove, { tab: obj.special }),
                    new Crumbs.behaviorInstance(Crumbs.objectBehaviors.petDisplaySize, { tab: obj.special })
				]
			},
			components: new Crumbs.component.pointerInteractive({ onRelease: function() { if (document.elementFromPoint(Game.mouseX, Game.mouseY) == l('specialPic')) return; PlaySound('snd/press.mp3'); if (Game.specialTab == obj.special) { Game.ToggleSpecialMenu(false); } else { Game.specialTab = obj.special; Game.ToggleSpecialMenu(true); } } }),
			behaviors: [new Crumbs.behaviorInstance(Crumbs.objectBehaviors.petInteractive, { pet: obj.special, enableCondition: obj.enableCondition })]
		});
		h.spawnChild(Crumbs.shine(0.5, h, h.findChild(obj.special+'Display')));
	}
	Crumbs.objectBehaviors.nebulaTrack = new Crumbs.behavior(function() {
		if (this.children.length < 2) { return; }
		if (!Game.OnAscend) { 
			this.findChild('nebula1').enabled = false; this.findChild('nebula2').enabled = false; return; 
		} else { 
			this.findChild('nebula1').enabled = true; this.findChild('nebula2').enabled = true; 
		}
		let b=Game.ascendl.getBounds();
		this.x = (b.left+b.right)/2 + Game.AscendOffX * Game.AscendZoom;
		this.y = (b.top+b.bottom)/2 + Game.AscendOffY * Game.AscendZoom;
	});
	Crumbs.objectBehaviors.nebulaSpin1 = new Crumbs.behavior(function() {
		this.rotation = Game.T*0.001;
		let s = (600+150*Math.sin(Game.T*0.007))*Game.AscendZoom / 128;
		this.scaleX = s;
		this.scaleY = s;
	});
	Crumbs.objectBehaviors.nebulaSpin2 = new Crumbs.behavior(function() {
		this.rotation = -Game.T*0.0007;
		let s = (600+150*Math.sin(Game.T*0.0037))*Game.AscendZoom / 128;
		this.scaleX = s;
		this.scaleY = s;
	});
	Crumbs.initNebula = function() {
		//Crumbs.initNebulaConservative(); return;
		let nebulaAnchor = Crumbs.spawn({
			id: 'nebulaAnchor',
			noDraw: true,
			scope: 'background',
			order: 2,
			components: new Crumbs.component.settings({ globalCompositeOperation: 'lighter' }),
			behaviors: new Crumbs.behaviorInstance(Crumbs.objectBehaviors.nebulaTrack)
		});
		nebulaAnchor.spawnChild({
			id: 'nebula1',
			imgs: 'heavenRing1.jpg',
			//alpha: 0.5,
			order: 2,
			behaviors: new Crumbs.behaviorInstance(Crumbs.objectBehaviors.nebulaSpin1)
		});
		nebulaAnchor.spawnChild({
			id: 'nebula2',
			imgs: 'heavenRing2.jpg',
			//alpha: 0.5,
			order: 3,
			behaviors: new Crumbs.behaviorInstance(Crumbs.objectBehaviors.nebulaSpin2)
		});
		//I seriously dont get it somehow I need to turn alpha to 1 in order to get the effects that vanilla creates with an alpha of 0.5 ?????????????
	}
	Crumbs.initNebulaConservative = function() {
		Crumbs.spawn({
			id: 'nebulaAnchor',
			noDraw: true,
			scope: 'background',
			order: 2,
			components: [new Crumbs.component.settings({ globalCompositeOperation: 'lighter' }), new Crumbs.component.canvasManipulator({ function: function(m, ctx) { 
				ctx.fillStyle = 'black';
				ctx.fillRect(0, 0, 1000, 1000)
				ctx.globalCompositeOperation = 'lighter';
				ctx.globalAlpha = 0.5;
				ctx.rotate(Game.T * 0.001);
				let s = (600 + 150 * Math.sin(Game.T * 0.007)) * Game.AscendZoom;
				ctx.drawImage(Pic('heavenRing1.jpg'), -s / 2, -s / 2, s, s);
				ctx.rotate(-Game.T * 0.0017);
				s = (600 + 150 * Math.sin(Game.T * 0.0037)) * Game.AscendZoom;
				ctx.drawImage(Pic('heavenRing2.jpg'), -s / 2, -s / 2, s, s);
			} })],
			behaviors: new Crumbs.behaviorInstance(Crumbs.objectBehaviors.nebulaTrack)
		});
	}

	Crumbs.drawEyeOfTheWrinkler = function(m, ctx) {
		if (!Game.Has('Eye of the wrinkler')) { return; }
		for (var i in Game.wrinklers)
		{
			if (Game.wrinklers[i].selected)
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
	Crumbs.initEyeOfTheWrinkler = function() {
		Crumbs.spawn({
			scope: 'left',
			id: 'eyeOfTheWrinkler',
			components: new Crumbs.component.canvasManipulator({ function: Crumbs.drawEyeOfTheWrinkler }),
			order: 10
		});
	}

	Crumbs.cookieClickPopup = {
		order: 8,
		id: 'cookieClickText',
		scope: 'left',
		anchor: 'bottom',
		behaviors: new Crumbs.behaviorInstance(function() {
			this.alpha -= 1 / (4 * Game.fps);
			if (this.alpha <= 0) { 
				this.die(); 
				return; 
			}
			this.y -= 2;
		})
	}
	Crumbs.spawnCookieClickPopup = function(x, y, text) {
		if (!Game.prefs.numbers) { return; }
		Crumbs.spawnVisible(Crumbs.cookieClickPopup, {
			'x': x,
			'y': y,
			components: [new Crumbs.component.text({
				size: 20,
				color: '#fff',
				align: 'center',
				content: text
			})]
		});
	}
	Crumbs.initAll = function() { Crumbs.unfocusedSpawn = true; Crumbs.initWrinklers(); Crumbs.initMilk(); Crumbs.initCursors(); Crumbs.initCookie(); Crumbs.initCookieWall(); Crumbs.initBackground(); Crumbs.initShadedBorders(); Crumbs.initPets(); Crumbs.initNebula(); Crumbs.initEyeOfTheWrinkler(); Crumbs.initBrokenCookie(); Crumbs.unfocusedSpawn = false; }
	if (Game.ready) { Crumbs.initAll(); } else { Game.registerHook('create', Crumbs.initAll); }
	
	//extreme unfunniness intensifies
	
	Game.DrawWrinklers = function() { }

	Crumbs.h.rebuildBigCookieButton();

	Game.DrawSpecial = function() { };

    Game.DrawBackground = function() {
		Timer.clean();
			//background
		Crumbs.updateCanvas();
			if (!Game.Background)//init some stuff
			{
					//preload ascend animation bits so they show up instantly
					Game.LeftBackground.globalAlpha=0;
					Game.LeftBackground.drawImage(Pic('brokenCookie.png'),0,0);
					Game.LeftBackground.drawImage(Pic('brokenCookieHalo.png'),0,0);
					Game.LeftBackground.drawImage(Pic('starbg.jpg'),0,0);
			}
			
			var ctx=Game.LeftBackground;
			
			if (!Game.OnAscend)
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
						
						//Game.Background.fillPattern(Pic(Game.bg+'.jpg'),0,0,Game.Background.canvas.width,Game.Background.canvas.height,512,512,0,0);
						/*if (Game.bgR>0)
						{
							Game.Background.globalAlpha=Game.bgR;
							Game.Background.fillPattern(Pic(Game.bgFade+'.jpg'),0,0,Game.Background.canvas.width,Game.Background.canvas.height,512,512,0,0);
						}
						Game.Background.globalAlpha=1;
						Game.Background.drawImage(Pic('shadedBordersSoft.png'),0,0,Game.Background.canvas.width,Game.Background.canvas.height);*/
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
					if (false)
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
				
				if (Game.AscendTimer==0)
				{
					//Game.DrawWrinklers();Timer.track('wrinklers');
					
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
					
					//Game.DrawSpecial();Timer.track('evolvables');
					
					//Game.particlesDraw(2);Timer.track('text particles');
				}
			}
		Crumbs.drawObjects();
	};

    Crumbs.unfocusedSpawn = false;
	
	CrumbsEngineLoaded = true;