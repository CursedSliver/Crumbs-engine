var LOCALLY_HOSTED = true;

var decay = {};
var kaizoCookiesVer = 'v1.0';
var kaizoCookies = null;

var kaizoWarning = true;

//additional helper functions
var upgradeDescsToReplace = [];

function replaceDesc(name, toReplaceWith) {
	if (!Game.ready) { upgradeDescsToReplace.push([name, toReplaceWith]); return; } 
	Game.Upgrades[name].baseDesc = toReplaceWith;
	Game.Upgrades[name].desc = toReplaceWith;
	Game.Upgrades[name].ddesc = toReplaceWith;
}
var achievDescsToReplace = [];
function replaceAchievDesc(name, toReplaceWith) {
	if (!Game.ready) { achievDescsToReplace.push([name, toReplaceWith]); return; }
	Game.Achievements[name].baseDesc = toReplaceWith;
	Game.Achievements[name].desc = toReplaceWith; 
	Game.Achievements[name].ddesc = toReplaceWith;
}
function addLoc(str) {
	locStrings[str] = str;
}
function auraDesc(id, str, actionStr) {
	addLoc(str);
	Game.dragonAuras[id].desc=loc(str);
	Game.dragonLevels[id+3].action = Game.dragonLevels[id+3].action.slice(0, Game.dragonLevels[id+3].action.indexOf('<small>'))+'<small>'+actionStr+'</small>';
}
var cookieChanges = [];
function cookieChange(name, newPow) {
	if (!Game.ready) { cookieChanges.push([name, newPow]); }
	if (!Game.Upgrades[name]) { return false; }
	if (!(typeof Game.Upgrades[name].power == 'function')) { Game.Upgrades[name].power = newPow; } else {
		eval('Game.Upgrades["'+name+'"].power='+Game.Upgrades[name].power.toString().replace('var pow=2;', 'var pow='+newPow+';').replace(') pow=3;', ') pow=1.5*'+newPow+';'));
	}
	var flavorText = Game.Upgrades[name].desc.slice(Game.Upgrades[name].desc.indexOf('<q>'), Game.Upgrades[name].desc.length);
	Game.Upgrades[name].desc = loc("Cookie production multiplier <b>+%1%</b>.", newPow)+flavorText;
	Game.Upgrades[name].ddesc = loc("Cookie production multiplier <b>+%1%</b>.", newPow)+flavorText;
	Game.Upgrades[name].baseDesc = loc("Cookie production multiplier <b>+%1%</b>.", newPow)+flavorText;
}
function getVer(str) {
	if (str[0] !== 'v') { return false; }
	str = str.slice(1, str.length);
	str = str.split('.');
	for (let i in str) { str[i] = parseFloat(str[i]); }
	return str;
}
function isv(str) { //"isValid"
	if (typeof str === 'string') { 
		if (str.includes('NaN') || str.includes('undefined') || str === '') {
			return false;
		}
	}
	if (typeof str !== 'string' && isNaN(str)) { return false; }
	if (typeof str === 'undefined') { return false; }
	return true;
}
function selectStatement(str, index, beginningCount) {
	if (index == -1) { return false; }
	var count = 0;
	if (beginningCount) { count = beginningCount; }
	var inited = false;
	var start = index;
	var inStrSingle = false;
	var inStrDouble = false;
	var inStrTemplate = false;
	var inStr = function() { return (inStrSingle || inStrDouble || inStrTemplate); }
	while (true) {
		if (str[index] == '{' && !inStr()) { inited = true; count++; }
		if (str[index] == '}' && !inStr()) { count--; }
		var states = [!inStrSingle && !inStrDouble && !inStrTemplate, inStrSingle && !inStrDouble && !inStrTemplate, !inStrSingle && inStrDouble && !inStrTemplate, !inStrSingle && !inStrDouble && inStrTemplate];
		if (str[index] == "'" && states[0]) { inStrSingle = true; }
		if (str[index] == "'" && states[1]) { inStrSingle = false; }
		if (str[index] == '"' && states[0]) { inStrDouble = true; }
		if (str[index] == '"' && states[2]) { inStrDouble = false; }
		if (str[index] == '`' && states[0]) { inStrTemplate = true; }
		if (str[index] == '`' && states[3]) { inStrTemplate = false; }
		if (count <= 0 && inited) { break; } 
		if (index >= str.length) { break; }
		index++;
	}
	return str.slice(start, index) + '}';
}
function inRect(x,y,rect)
{
	//declaring this so wrinklers work
	var dx = x+Math.sin(-rect.r)*(-(rect.h/2-rect.o)),dy=y+Math.cos(-rect.r)*(-(rect.h/2-rect.o));
	var h1 = Math.sqrt(dx*dx + dy*dy);
	var currA = Math.atan2(dy,dx);
	var newA = currA - rect.r;
	var x2 = Math.cos(newA) * h1;
	var y2 = Math.sin(newA) * h1;
	if (x2 > -0.5 * rect.w && x2 < 0.5 * rect.w && y2 > -0.5 * rect.h && y2 < 0.5 * rect.h) return true;
	return false;
}
function geometricMean(arr) {
	var sum = 0; 
	var amountValid = 0;
	for (let i = 0; i < arr.length; i++) {
		if (arr[i] != 0) { sum += Math.log(arr[i]); amountValid++; }
	} 
	sum /= Math.max(1, amountValid);
	return Math.exp(sum) //wtf is an antilog
}
function cyclicDist(v1, v2, c) {
	//v1 - v2, but in the context of mod c
	return (c + v1 - v2) % c;
}
function avgColors(arr, returnOpacity) {
	//rgba format, a is in terms of 0-1
	var length = 0;
	for (let i in arr) {
		length += arr[i][3] ?? 1;
	}
	if (length == 0) {
		return (returnOpacity?[0, 0, 0, 0]:[0, 0, 0, 1]);
	}
	var toReturn = [0, 0, 0, 0];
	for (let i in arr) {
		if (typeof arr[i][3] !== 'undefined') {
			toReturn[0] += arr[i][0] * arr[i][3];
			toReturn[1] += arr[i][1] * arr[i][3];
			toReturn[2] += arr[i][2] * arr[i][3];
			toReturn[3] += arr[i][3];
		} else {
			toReturn[0] += arr[i][0];
			toReturn[1] += arr[i][1];
			toReturn[2] += arr[i][2];
			toReturn[3] += 1;
		}
	}
	return [toReturn[0] / length, toReturn[1] / length, toReturn[2] / length, (returnOpacity?Math.min(toReturn[3], 1):1)];
}
function colorCycleFrame(prev, post, fraction) {
	//"prev" and "post" must be arrays with 3 numbers for rgb
	prev[3] = prev[3] ?? 1;
	post[3] = post[3] ?? 1;
	return [prev[0] * (1 - fraction) + post[0] * fraction, prev[1] * (1 - fraction) + post[1] * fraction, prev[2] * (1 - fraction) + post[2] * fraction, prev[3] * (1 - fraction) + post[3] * fraction];
}

function allValues(checkpoint) {
	if (!decay.DEBUG) { return false; }
	var str = '[DEBUGGING: '+checkpoint+']';
	str += '\nCookies in bank: '+Game.cookies;
	str += '\nCBTA: '+Game.cookiesEarned;
	str += '\nCPS: '+Game.cookiesPs;
	str += '\nDecay general: '+decay.gen;
	str += '\nDecay momentum: '+decay.momentum;
	str += '\n[DEBUGGER OF '+checkpoint+' END]';
	console.log(str);
}

function transmuteChar(c) {
	c = c.toLowerCase();
	var l = ['q','w','e','r','t','y','u','i','o','p','a','s','d','f','g','h','j','k','l','z','x','c','v','b','n','m'];
	l.splice(l.indexOf(c), 1);
	return choose(l);
}

if (!Game.styleSheets) {
	Game.styleSheets = null; 
	for (let i in document.styleSheets) { 
		try { if (document.styleSheets[i].cssRules.length > 500) { Game.styleSheets = document.styleSheets[i]; break; } } 
		catch(error) { } 
	} 
	if (Game.styleSheets === null) { Game.Notify('Unable to inject CSS!', 'Something went wrong. Please contact the mod developers. '); }
}
var cssList = '';
function injectCSS(str) {
	cssList += str+'\n';
}

function preLoads() {
	//stuff to strictly load before game is ready
	eval('Game.LoadSave='+Game.LoadSave.toString().replace(`if (Game.mobile || Game.Has('Perfect idling') || Game.Has('Twin Gates of Transcendence'))`, `if (false)`));
	for (let i in Game.wrinklers) {
		Game.wrinklers[i].close = 0;
		Game.wrinklers[i].sucked = 0;
		Game.wrinklers[i].phase = 0;
	}
}

let gp = Game.Objects['Wizard tower'].minigame; //grimoire proxy
let pp = Game.Objects['Temple'].minigame; //pantheon proxy
let gap = Game.Objects['Farm'].minigame; //garden proxy
let sp = Game.Objects['Bank'].minigame; //stock market proxy
var grimoireUpdated = false;
var gardenUpdated = false;
var pantheonUpdated = false;
var stockUpdated = false;

Game.registerMod("Kaizo Cookies", { 
	init: function() {
		if (kaizoCookies) { return; }
		kaizoCookies = this;
		if (App) { if (CrumbsEngineLoaded) { this.header(); } else { Game.Notify('Incorrect loading order!', 'Please restart the game, and load Crumbs Engine before Kaizo cookies.', 0); } return; }
		if (typeof CrumbsEngineLoaded === 'undefined' || !CrumbsEngineLoaded) { 
			Game.LoadMod(LOCALLY_HOSTED?'./Crumbs.js':'https://raw.githack.com/CursedSliver/Crumbs-engine/main/Crumbs.js'); 
		}
		const checkPrerequisites = function() {
			if (typeof CrumbsEngineLoaded !== 'undefined' && CrumbsEngineLoaded) { kaizoCookies.header(); clearInterval(interval); }
		}
		const interval = setInterval(checkPrerequisites, 10);
	},
	header: function() { 
		if (kaizoCookies.warn) { console.log('header reactivation attempted!'); return; }
		preLoads();
		
        // notification!
		Game.Notify(`Oh, so you think comp is too easy?`, `Good luck.`, [21,32],10,1);

		//uhhhhh
		Game.priceIncrease = 1.1475;

		this.actualModObj = decay;

		//anti mhur
		Game.firstHC = 10000000;
		Game.HowMuchPrestige = function(cookies) { return Math.pow(cookies/Game.firstHC,1/Game.HCfactor); }
		eval('Game.HowManyCookiesReset='+Game.HowManyCookiesReset.toString().replace('1000000000000', 'Game.firstHC'));
		Game.HCfactor = 4;

		eval('Game.Logic='+Game.Logic.toString().replace('Game.prefs.autosave)', 'Game.prefs.autosave && !kaizoWarning)').replace('Game.CanClick=1;', 'Game.CanClick=1; if (kaizoWarning && Game.T%15==0) { kaizoCookies.warn(); }'));
		this.warn = function() {
			Game.Notify('WARNING', 'We\'ve detected that you are loading this mod on a progressed save, which can lead to unknown issues and corrupted saves. Please IMMEDIATELY quit and <b>load this mod on a NEW SAVE</b>!', [1, 7], 1e21, 0, true);
		}

		//the cccem solution, fixes import corruption on mod load
		if (!(typeof Game.Objects.Temple.minigame === "undefined")){Game.Objects.Temple.minigame.slot=[Game.Objects.Temple.minigame.slot[0],Game.Objects.Temple.minigame.slot[1],Game.Objects.Temple.minigame.slot[2]]};

		//no more ads (requested by fifi)
		l('smallSupport').style.display = 'none';
		l('support').style.display = 'none';

		this.images = {
			custImg: App?this.dir+'/modicons.png':"https://raw.githack.com/CursedSliver/asdoindwalk/main/modicons.png",
			bigGolden: App?this.dir+'/bigGoldenCookie.png':'https://rawcdn.githack.com/CursedSliver/asdoindwalk/6ed030c47616e40f7af133b0fb97817cc29c34ad/bigGoldenCookie.png',
			bigWrath: App?this.dir+'/bigWrathCookie.png':'https://rawcdn.githack.com/CursedSliver/asdoindwalk/6ed030c47616e40f7af133b0fb97817cc29c34ad/bigWrathCookie.png',
			classic: App?this.dir+'/classicCookie.png':'https://rawcdn.githack.com/CursedSliver/asdoindwalk/6ed030c47616e40f7af133b0fb97817cc29c34ad/classicCookie.png',
			yeetDragon: App?this.dir+'/yeetDragonCookie.png':'https://rawcdn.githack.com/CursedSliver/asdoindwalk/6ed030c47616e40f7af133b0fb97817cc29c34ad/yeetDragonCookie.png',
			minecraft: App?this.dir+'/minecraftCookie.png':'https://rawcdn.githack.com/CursedSliver/asdoindwalk/6ed030c47616e40f7af133b0fb97817cc29c34ad/minecraftCookie.png',
			terraria: App?this.dir+'/Chocolate_Chip_Cookie.png':'https://rawcdn.githack.com/CursedSliver/asdoindwalk/6ed030c47616e40f7af133b0fb97817cc29c34ad/Chocolate_Chip_Cookie.png',
			cursed: App?this.dir+'/cursed.gif':'https://rawcdn.githack.com/CursedSliver/asdoindwalk/6ed030c47616e40f7af133b0fb97817cc29c34ad/cursed.gif',
			powerGradient: App?this.dir+'/powerGradient.png':'https://rawcdn.githack.com/CursedSliver/asdoindwalk/17fa58e6bc19db999c3ee572a78fb9f8c209c277/powerGradient.png',
			powerOrb: App?this.dir+'/realOrb.png':'https://raw.githack.com/CursedSliver/asdoindwalk/main/realOrb.png',
			powerGradientBlue: App?this.dir+'/powerGradientBlue.png':'https://rawcdn.githack.com/CursedSliver/asdoindwalk/ce2abfaebf8d19b4ae237e395c556f6ff56b7d7a/powerGradientBlue.png',
			powerGradientRed: App?this.dir+'/powerGradientRed.png':'https://rawcdn.githack.com/CursedSliver/asdoindwalk/ce2abfaebf8d19b4ae237e395c556f6ff56b7d7a/powerGradientRed.png',
			reingold: App?this.dir+'/reingold.png':'https://rawcdn.githack.com/CursedSliver/asdoindwalk/a05043b53d6ce5e14bd20619043ac041fb83fb32/reingold.png',
			wrinklerSoul: App?this.dir+'/wrinklerSoul.png':'https://rawcdn.githack.com/CursedSliver/asdoindwalk/41768db06f58dbc887c833dfe5eddd35edf731ba/wrinkler%20soul.png',
			shinySoul: App?this.dir+'/shinySoul.png':'https://rawcdn.githack.com/CursedSliver/asdoindwalk/11f1614010c17f5dae3fbf81b0b77cb3e1a7d11f/shinysoul.png',
			wrinklerSplits: App?this.dir+'/wrinklerSplits.png':'https://rawcdn.githack.com/CursedSliver/asdoindwalk/c418ad86395548c861c12012865f43f874bca975/wrinklerSplits.png'
		};
		decay.timePlayed = 0; //amount of time (not frames uses deltatime) while game active
		Game.registerHook('logic', function() { if (Game.deltaTime < 1000) { decay.timePlayed += Game.deltaTime; } });

		//loading everything queued
		this.loadAllChanges = function() {
			for (let i in upgradeDescsToReplace) {
				replaceDesc(upgradeDescsToReplace[i][0], upgradeDescsToReplace[i][1]);
			}
			for (let i in achievDescsToReplace) {
				replaceAchievDesc(achievDescsToReplace[i][0], achievDescsToReplace[i][1]);
			}
			for (let i in cookieChanges) {
				cookieChange(cookieChanges[i][0], cookieChanges[i][1]);
			}
		} 
		if (!Game.ready) { Game.registerHook('create', this.loadAllChanges); } else { this.loadAllChanges(); }

		//prerequisite mods
		Game.lastTimestamp = 0;
		Game.deltaTime = 0; //ms
		if (!App) { 
			eval('Game.Loop='+Game.Loop.toString().replace(`Timer.say('START');`,`const startTimestamp=Date.now();Timer.say('START');`).replace('setTimeout(Game.Loop,1000/Game.fps);','Game.deltaTime = Date.now()-Game.lastTimestamp; Game.lastTimestamp = startTimestamp; setTimeout(Game.Loop,Math.max(1000/Game.fps-(Date.now()-startTimestamp),0)); ')); 
			Game.LoadMod(`https://glander.club/asjs/qdNgUW9y`);
			Game.registerHook('logic', function() {
				if (typeof changeKeyBind != 'undefined') { changeKeyBind = 1; }
			});
			AddEvent(window,'keydown',function(e){
				if (!PauseGame) { return; }
				let hasTriggered = false;
    			if (e.key.toLowerCase()=='c' && (e.ctrlKey || Game.keys[17])) { hasTriggered = true; } 
				if (e.key.toLowerCase()=='p' && (e.ctrlKey || Game.keys[17])) { hasTriggered = true; } 
				
				if (!hasTriggered) { return; }
				kaizoCookies.togglePause();
				Game.UpdateMenu();
			});
			Game.LoadMod('https://hellopir2.github.io/cc-mods/buffTimer.js');
		}
		this.paused = false;
		this.prepauseAllowanceSettings = {};
		this.togglePause = function() {
			if (Game.OnAscend) { return; }
			if (kaizoCookies.paused) { kaizoCookies.unpauseGame(); } else { kaizoCookies.pauseGame(); }
		}
		this.skippedGameCanOnPause = ['openStats', 'closeNotifs'];
		this.pauseGame = function() {
			if (kaizoCookies.paused) { return; }
			PauseGame();
			kaizoCookies.paused = true;
			for (let i in decay.gameCan) {
				kaizoCookies.prepauseAllowanceSettings[i] = decay.gameCan[i];
				if (!kaizoCookies.skippedGameCanOnPause.includes(i)) { decay.gameCan[i] = false; }
			}
		}
		this.unpauseGame = function() {
			if (!kaizoCookies.paused) { return; }
			PauseGame();
			kaizoCookies.paused = false;
			for (let i in decay.gameCan) {
				decay.gameCan[i] = kaizoCookies.prepauseAllowanceSettings[i];
			}
		}
		addLoc('Shortcuts: Ctrl+C, Ctrl+P');
		addLoc('Pause'); addLoc('Unpause');
		eval('Game.DrawWrinklers='+Game.DrawWrinklers.toString().replace('if (Game.prefs.particles', 'if (Game.prefs.particles && !kaizoCookies.paused'));
		AddEvent(document, 'mousemove', function() { if (kaizoCookies.paused) { Game.tooltip.update(); } });
		AddEvent(document, 'keyup', function(e) {
			if (!kaizoCookies.paused) { return; }
			if (!Game.promptOn)
			{
				if ((e.shiftKey || e.ctrlKey) && !Game.buyBulkShortcut)
				{
					Game.buyBulkOld=Game.buyBulk;
					if (e.shiftKey) Game.buyBulk=100;
					if (e.ctrlKey) Game.buyBulk=10;
					Game.buyBulkShortcut=1;
					Game.storeBulkButton(-1);
				}
			}
			if ((!e.shiftKey && !e.ctrlKey) && Game.buyBulkShortcut)
			{
				Game.buyBulk=Game.buyBulkOld;
				Game.buyBulkShortcut=0;
				Game.storeBulkButton(-1);
			}
			for (let i in Game.Objects) { Game.Objects[i].refresh(); }
		});

		//overriding notification so some really important notifs can last for any amount of time even with quick notes on
		eval('Game.Notify='+Game.Notify.toString().replace('quick,noLog', 'quick,noLog,forceStay').replace('if (Game.prefs.notifs)', 'if (Game.prefs.notifs && (!forceStay))'));

		/*=====================================================================================
        Decay
        =======================================================================================*/
		//the decay object is declared outside of the mod object for conveience purposes
		//decay: a decreasing multiplier to buildings, and theres a different mult for each building. The mult decreases the same way for each building tho
		decay.mults = []; for (let i in Game.Objects) { decay.mults.push(1); } 
		decay.mults.push(1); //the "general multiplier", is just used for checks elsewhere (and "egg")
		decay.gen = decay.mults[20];
		decay.incMult = 0.04; //decay mult is decreased by this multiplicative every second
		decay.min = 0.15; //the minimum power that the update function uses; the lower it is, the slower the decay will pick up
		decay.rateTS = 1; //tickspeed
		decay.halts = {}; //simulates decay stopping from clicking (simulated below)
		decay.effectiveHalt = 0; //the amount of halt that comes out in the end, can be any positive number really
        decay.requiredHalt = 1; //the amount of halting power required to fully halt
		decay.decHalt = 1; //the amount that every halt channel decreases by every second by default
		decay.haltDecMin = 0.05; //minimum value of decay.decHalt
		decay.fatigue = 0; //at 1000, become fatigued
		decay.fatigueMax = 1000; //the point in which you become exhausted
		decay.clickWork = 1; //the base amount of work that each click does
		decay.workProgressMult = 1; //the multiplier to work done (each click) via progression (e.g. cookies earned this ascend)
		decay.exhaustion = 0; //buff like timer that counts down by 1 every frame, represents the fatigued state of being unable to halt decay via clicking
		decay.exhaustionBegin = 24 * Game.fps; //the initial amount of exhaustion set
		decay.exhaustionBeginMult = 1; //mult that is dynamically changed
		decay.broken = 1; //represents the current boost to decay propagation from the breaking point mechanic (^2 in the case of rate, ^0.5 in the case of momentum) and halting requirement 
		decay.breakingPoint = 0.0001; //if decay.gen is below this, decay is considered broken
		decay.breakingEscalationPow = 10; //for every however many zeroes that decay.gen has after its decimal point, increase by 1 (starts at 0 and takes a max with 2)
		decay.brokenMult = 1; //multiplier to the effect of decay.broken after it is broken
		decay.momentum = 1; //increases with each game tick, but decreased on certain actions (hardcoded to be at least 1)
		decay.momentumTS = 1; //tickspeed
		decay.TSMultFromMomentum = 1; //tickspeed
		decay.smoothMomentumFactor = 0.15; //some momentum is negated so it isnt very obvious with the log scaling; the less it is, the smoother it will be (not necessarily a good thing as it also delays momentum)
		decay.momentumFactor = 2; //the more this is, the less powerful momentum is (very strongly affects momentum)
		decay.momentumIncFactor = 1.5; //the larger, the less momentum increases (straight mult)
		decay.momentumLogInc = 2.5; //directly affects momentum increase (instead of momentum interpretation)
		decay.clickHaltBaseTime = 0.5; //amount of halting applied with no bonuses per click
		decay.purityToDecayPow = 1.5; //purity multiplies decay rate to this power
		decay.purityToMomentumPow = 2; //purity multiplies decay momentum to this power
		decay.unshackledPurityMult = 0.75; //unshackled purity upgrade
		decay.momentumOnHaltBuffer = 2; //for its effect on halting, this amount is negated from it when calcualting
		decay.momentumOnHaltLogFactor = 4; //the more it is, the less momentum will affect halting power
		decay.momentumOnHaltPowFactor = 0.5; //the less it is, the less momentum will affect halting power
		decay.wrinklerSpawnThreshold = 0.5; //above this decay mult, wrinklers can never spawn regardless of chance
		decay.wrinklerApproachFactor = 2; //the more it is, the slower wrinklers approach the big cookie with increased decay
		decay.wrinklerApproachPow = 0.5; //the more it is, the faster wrinklers approach the big cookie with increased decay
		decay.wcPow = 0.25; //the more it is, the more likely golden cookies are gonna turn to wrath cokies with less decay
		decay.pastCapPow = 0.1; //the power applied to the number to divide the mult if going past purity cap with unshackled purity
		decay.bankedPurification = 0; //adds to mult and multiplies close 
		decay.hasExtraPurityCps = false; //whether has extra cps bonuses from purity that is outside of puritys gain itself
		decay.extraPurityCps = 1; //the actual thing (should have had this from the start but whatever)
        Game.cookiesInTermsOfCps = Game.cookies / Game.cookiesPs;
		decay.times = { //frames
			//not the most efficient possible but ah well, as long as I dont use this for too many things at once
			sinceLastPurify: 100, 
			sincePledgeEnd: 100,
			sinceLastAmplify: 200,
			sinceLastHalt: 100,
			sincePowerGain: 1000,
			sincePowerClick: 1000,
			sinceOrbClick: 1000,
			sinceSeason: 3000,
			sinceLastWork: 1000,
			sinceLastExhaustion: 10000,
			sinceExhaustionRecovery: 10000,
			sinceWrinklerSpawn: 10
		};
		decay.buffDurPow = 0.5; //the more this is, the more that decay will affect buff duration
		decay.purifyMomentumMult = 2; //multiplied to the amount decrease; deprecated
		decay.haltReverseMomentumFactor = 0.985; //each point of halt called when decay.stop multiplies the momentum with this amount
		decay.haltSubtractMomentum = 1000000; //no clue what this does but just make it as large as possible tysm
		decay.cpsList = [];
		decay.multList = []; //gets processed every 3 ticks because its not very important
		decay.exemptBuffs = ['clot', 'building debuff', 'loan 1 interest', 'loan 2 interest', 'loan 3 interest', 'gifted out', 'haggler misery', 'pixie misery', 'stagnant body', 'unending flow', 'powerSurge', 'powerClick', 'coagulated', 'cursed', 'smited', 'distorted'];
		decay.gcBuffs = ['frenzy', 'click frenzy', 'dragonflight', 'dragon harvest', 'building buff', 'blood frenzy', 'cookie storm'];
		decay.justMult = 0; //debugging use
		decay.infReached = false;
		decay.unlocked = false;
		decay.momentumUnlocked = false;
		decay.cpsDiff = 1;
		decay.acceleration = 1; //hoisting it up there to prevent funny issues
		if (Game.cookiesEarned > 5555) { decay.unlocked = true; }
		if (Game.cookiesEarned > 5.555e18) { decay.momentumUnlocked = true; }
		decay.DEBUG = true; //disable or enable the debugger statements
		decay.hasEncounteredNotif = false;
		decay.prefs = {
			ascendOnInf: 1,
			wipeOnInf: 0,
			preventNotifs: { /*actually set later on*/},
			widget: 1,
			particles: 1,
			scrollClick: 0,
			RunTimer: 1,
			LegacyTimer: 1,
			typingDisplay: 1
		}
		Game.TCount = 0;

		//decay core
		decay.update = function(buildId, tickSpeed) { 
			if (Game.Has('Purity vaccines')) { return decay.mults[buildId]; }
			if (buildId == 20) {
				return decay.getCpsDiffFromDecay();
			}
			var c = decay.mults[buildId];
			if (Game.Has('Purification domes')) { tickSpeed *= decay.getBuildingSpecificTickspeed(buildId); }
    		c *= Math.pow(Math.pow(1 - (1 - Math.pow((1 - decay.incMult / Game.fps), Math.max(1 - c, decay.min))), (Math.max(1, Math.pow(c, decay.purityToDecayPow)))), tickSpeed * (1 - Math.min(decay.effectiveHalt / decay.requiredHalt, 1)));
			return c;
		} 
		Game.log10Cookies = Math.log10(Game.cookiesEarned + 10);
		decay.updateAll = function() {
			Game.TCount++;
			Game.log10Cookies = Math.log10(Game.cookiesEarned + 10);
			if (Game.cookiesEarned <= decay.featureUnlockThresholds.rate) { decay.unlocked = false; return false; } else { decay.unlocked = true; }
			if (Game.cookiesEarned <= decay.featureUnlockThresholds.momentum) { decay.momentumUnlocked = false; } else { decay.momentumUnlocked = true; }
			if (decay.momentum < 1) { decay.momentum = 1; }
			if (decay.infReached) { decay.onInf(); decay.infReached = false; }
			if (!Game.OnAscend) {
				const t = decay.getTickspeed();
				decay.rateTS = t;
				decay.purityToDecayPow = decay.getPurityToDecayPow();
				decay.purityToMomentumPow = decay.purityToDecayPow / 3;
				decay.effectiveHalt = decay.getEffectiveHalt();
                decay.requiredHalt = decay.getRequiredHalt();
				decay.updateBreaking();
				if (Game.Has('Purification domes')) {
					for (let i in decay.mults) {
						var c = decay.update(i, t);
						if (!isFinite(1 / c)) { c = 1 / (Number.MAX_VALUE * 0.9999999999); if (!isNaN(c)) { decay.infReached = true; } }
						decay.mults[i] = c;
					}
				} else { 
					var c = decay.update(0, t);
					if (!isFinite(1 / c)) { c = 1 / (Number.MAX_VALUE * 0.9999999999); if (!isNaN(c)) { decay.infReached = true; } }
					for (let i in decay.mults) {
						decay.mults[i] = c;
					}
				}
				decay.recover();
				decay.updateFatigue();
				if (decay.momentumUnlocked) { decay.momentum = decay.updateMomentum(decay.momentum); }
				Game.recalculateGains = 1; //uh oh
				decay.cpsList.push(Game.unbuffedCps);
				if (decay.cpsList.length > Game.fps * 1.5) {
					decay.cpsList.shift();
				}
				if (Game.T%3==0) { 
					decay.multList.push(decay.gen); 
					if (decay.multList.length > 100) {
						decay.multList.shift();
					}
				}
				if (decay.powerUnlocked()) { decay.updatePower(); }
			}
			if (Game.pledgeT > 0) {
				var strength = Game.getPledgeStrength();
				decay.purifyAll(strength[0], strength[1], strength[2], 'pledge');
			}
			if (Game.pledgeC > 0) {
				Game.pledgeC--;
				if (Game.pledgeC == 0) {
					Game.Upgrades["Elder Pledge"].icon[0] = 9;
					Game.Upgrades["Elder Pledge"].icon[1] = 9;
					Game.Upgrades["Elder Pledge"].icon[2] = 'img/icons.png';
					Game.upgradesToRebuild = 1;
					Game.Lock('Elder Pledge');
					Game.Unlock('Elder Pledge');
				}
			}
			for (let i in decay.times) {
				decay.times[i]++;
			}
			if (decay.times.sinceLastPurify > 30) { decay.bankedPurification += Game.auraMult('Fierce Hoarder') / (4 * Game.fps * Math.pow(1 + decay.bankedPurification, 0.5)); }
			decay.gen = decay.mults[20];
			decay.cpsDiff = decay.gen;
			Game.updateVeil();

			decay.updateWrinklers();
			if (Game.T%6 == 0) { 
				decay.wrinklerSpawnRate = decay.setWrinklerSpawnRate();
				decay.wrinklerApproach = decay.setWrinklerApproach();
				decay.wrinklerResistance = decay.setWrinklerResistance();
				decay.wrinklerRegen = decay.setWrinklerRegen();
				decay.wrinklerLossMult = decay.setWrinklerLossMult();
				Game.wrinklerHP = decay.setWrinklerMaxHP();
			}

			decay.updatePowerOrbs();

			decay.updateCovenant();

			if (decay.ascendIn) {
				decay.ascendIn--;
				if (decay.ascendIn == 0) { 
					Game.Ascend(1); 
				} else if (decay.ascendIn%Game.fps == 0) {
					Game.Notify(''+decay.ascendIn/Game.fps, '', 0, 2);
				}
				if (Game.keys[27]) { decay.ascendIn = 0; Game.Notify(loc('Ascending cancelled!'), '', 0); }
			}

			if (Game.ascensionMode == 42069) {
				decay.acceleration = Math.max(1, decay.acceleration + decay.updateAcc());
			}

            Game.cookiesInTermsOfCps = Game.cookies / Game.cookiesPs;
		}
		Game.registerHook('logic', decay.updateAll);
		decay.draw = function() {
			decay.setWidget();
			decay.updateStats();
			decay.updateTypingDisplay();
			if (Game.drawT%2) {
				decay.updatePowerGauge();
			}
		}
		decay.updateMomentum = function(m) {
			if (Game.Has('Purity vaccines')) { return m; }
			decay.momentumTS = decay.getMomentumMult();
			var mult = decay.momentumTS * Math.pow(1 + decay.incMult, 5) * Math.pow(Math.max(decay.gen, 1), decay.purityToMomentumPow) / (16 * Game.fps);
			m += ((Math.log((m + decay.momentumLogInc - 1)) / Math.log(decay.momentumLogInc)) * (1 - Math.min(1, decay.effectiveHalt / decay.TSMultFromMomentum)) / decay.momentumIncFactor) * mult;
			
			return Math.max(1, m);
		}
		decay.getTickspeed = function() {
			var tickSpeed = 1;
			tickSpeed *= Math.pow(decay.broken, 2);
			decay.TSMultFromMomentum = decay.getTickspeedMultFromMomentum();
			tickSpeed *= decay.TSMultFromMomentum;
			tickSpeed *= Game.eff('decayRate');
			if (Game.veilOn()) { tickSpeed *= 1 - Game.getVeilBoost(); }
			if (Game.hasGod) {
				var godLvl = Game.hasGod('asceticism');
				if (godLvl == 1) { tickSpeed *= 0.7; }
				else if (godLvl == 2) { tickSpeed *= 0.8; }
				else if (godLvl == 3) { tickSpeed *= 0.9; }
			}
			if (decay.covenantStatus('wrathBan')) { tickSpeed *= 1.05; }
			if (Game.hasBuff('Storm of creation').arg1) { tickSpeed *= 1 - Game.hasBuff('Storm of creation').arg1; }
			if (Game.hasBuff('Unending flow').arg1) { tickSpeed *= 1 - Game.hasBuff('Unending flow').arg1; }
			if (Game.hasBuff('Stagnant body').arg1) { tickSpeed *= 1 + Game.hasBuff('Stagnant body').arg1; }
            if (Game.hasBuff('Coagulated')) { tickSpeed *= 1.5; }
            if (Game.hasBuff('Cursed')) { tickSpeed *= 3; }
			if (Game.ascensionMode==42069) { tickSpeed *= 0.5; }
			if (Game.hasBuff('Power poked')) { tickSpeed *= Game.hasBuff('Power poked').power; }
			if (Game.Has('Lumpy evolution')) {
				var n = 0;
				for (let i in Game.Objects) { if (Game.Objects[i].level >= 10) { n++; } }
				tickSpeed *= (1 - n / 100);
			}
			if (decay.isConditional('typing')) { tickSpeed *= 0.15; }
			tickSpeed *= decay.acceleration;
			tickSpeed *= Math.pow(1.25, decay.NGMState);

			return tickSpeed;
		}
		decay.getTickspeedMultFromMomentum = function() {
			return 1 + (Math.max(Math.log2(decay.momentum * 2), 1) / Math.log2(decay.momentumFactor)) * (1 - 1 / Math.pow(decay.momentum, decay.smoothMomentumFactor));
		}
		decay.getMomentumMult = function() {
			//getTickspeed but for momentum
			var tickSpeed = 1;
			tickSpeed *= Math.pow(decay.broken, 0.5);
			tickSpeed *= (1 - Math.pow(0.75, Math.log10(Math.max(Game.cookiesEarned - decay.featureUnlockThresholds.momentum, 1))));
			tickSpeed *= Game.eff('decayMomentum');
			if (Game.veilOn()) { tickSpeed *= 1 - Game.getVeilBoost(); }
			if (Game.hasGod) {
				var godLvl = Game.hasGod('asceticism');
				if (godLvl == 1) { tickSpeed *= 0.7; }
				else if (godLvl == 2) { tickSpeed *= 0.8; }
				else if (godLvl == 3) { tickSpeed *= 0.9; }
			}
			if (decay.isConditional('godz')) { tickSpeed *= (1 + Game.BuildingsOwned * 0.01); } else if (Game.hasBuff('Devastation').arg2) { tickSpeed *= Game.hasBuff('Devastation').arg2; }
			if (decay.covenantStatus('wrathBan')) { tickSpeed *= 1.05; }
			tickSpeed *= Math.pow(2, Math.max(0, Game.gcBuffCount() - 1));
			if (Game.hasBuff('Storm of creation').arg1) { tickSpeed *= 1 - Game.hasBuff('Storm of creation').arg1; }
			if (Game.hasBuff('Unending flow').arg1) { tickSpeed *= 1 - Game.hasBuff('Unending flow').arg1; }
			if (Game.hasBuff('Stagnant body').arg1) { tickSpeed *= 1 + Game.hasBuff('Stagnant body').arg1; }
			if (Game.Has('Market manipulator')) { tickSpeed *= 0.95; }
            if (Game.hasBuff('Cursed')) { tickSpeed *= 3; }
			if (Game.ascensionMode==42069) { tickSpeed *= 0.5; }
			if (Game.hasBuff('Power poked')) { tickSpeed *= Game.hasBuff('Power poked').power; }
			if (Game.Has('Lumpy evolution')) {
				var n = 0;
				for (let i in Game.Objects) { if (Game.Objects[i].level >= 10) { n++; } }
				tickSpeed *= (1 - n / 100);
			}
			if (decay.isConditional('typing')) { tickSpeed *= 0.15; }
			tickSpeed *= decay.acceleration;
			tickSpeed *= Math.pow(1.1, decay.NGMState);
			
			return tickSpeed;
		}
		decay.getPurityToDecayPow = function() {
			var base = 2;
			base += 0.25 * Math.max(0, Game.gcBuffCount() - 1);
			if (Game.Has('Unshackled Purity')) { base *= decay.unshackledPurityMult; }
			return base;
		}
		decay.getBuildingSpecificTickspeed = function(buildId) {
			var tickSpeed = 1;
			if (Game.ObjectsById[buildId].tieredUpgrades.purity.bought) { tickSpeed *= 1 - decay.purityTierStrengthMap[buildId]; }
			if (Game.Has('Ultra-concentrated sweetener')) { tickSpeed *= 1 - 0.02 * Math.min(Game.ObjectsById[buildId].level, 20); }
			
			return tickSpeed;
		}
		decay.purify = function(buildId, mult, close, cap, uncapped, fromAll) {
			if (!decay.unlocked) { return false; }
			if (buildId == 20) { decay.mults[20] = decay.getCpsDiffFromDecay(); return; }
			if (!fromAll) { decay.gainPower((Math.min(mult, 4) - 1) * 3); mult *= decay.getPurificationMult(); uncapped = Game.Has('Unshackled Purity'); }
			if (decay.mults[buildId] >= cap) { 
				if (!uncapped) { return false; } else {
					mult = 1 + (mult - 1) / Math.pow(decay.mults[buildId] / cap, decay.pastCapPow);
				}
			}
			if (uncapped && decay.mults[buildId] * mult >= cap && !(decay.mults[buildId] >= cap)) {
				mult /= cap / decay.mults[buildId];
				decay.mults[buildId] = cap;
				mult = 1 + (mult - 1) / Math.pow(decay.mults[buildId] / cap, decay.pastCapPow);
			}
			decay.mults[buildId] *= mult;
			if (decay.mults[buildId] >= cap && !uncapped) { 
				decay.mults[buildId] = cap; return true; 	
			}
			if (decay.mults[buildId] < 1) { 
				decay.mults[buildId] *= Math.pow(10, -Math.log10(decay.mults[buildId]) * close);
			}
			if (decay.mults[buildId] > cap && !uncapped) { decay.mults[buildId] = cap; }
		}
		decay.purifyAll = function(mult, close, cap, id) {
			if (typeof id === 'undefined') { id = ''; }
			mult *= decay.getPurificationMult();
			var u = false;
			if (Game.Has('Unshackled Purity')) { u = true; }
			for (let i in decay.mults) {
				if (decay.purify(i, mult + decay.bankedPurification, 1 - Math.pow(1 / (1 + decay.bankedPurification), 0.5) * (1 - close), cap * (1 + decay.bankedPurification), u, true)) { decay.triggerNotif('purityCap'); }
			}
			decay.bankedPurification *= 0.5;
			if (id !== 'pledge') { decay.times.sinceLastPurify = 0; decay.gainPower((Math.min(mult, 4) - 1) * 25); } else { decay.gainPower((mult - 1) * 3); }
			if (Game.hasGod) {
				var godLvl = Game.hasGod('creation');
				if (godLvl == 1) {
					Game.gainBuff('creation storm', 4, 0.48);
				} else if (godLvl == 2) {
					Game.gainBuff('creation storm', 16, 0.24);
				} else if (godLvl == 3) {
					Game.gainBuff('creation storm', 64, 0.12);
				}
			}
		}
		decay.getPurificationMult = function() {
			var mult = 1;
			if (decay.isConditional('typing') || decay.isConditional('typingR')) { mult *= 3; }
			return mult;
		}
		decay.refresh = function(buildId, to) { 
   			decay.mults[buildId] = Math.max(to, decay.mults[buildId]);
		}
		decay.refreshAll = function(to) {
			for (let i in decay.mults) {
				decay.refresh(i, to);
			}
			decay.momentum = 1;
			decay.times.sinceLastPurify = 0;
			Game.recalculateGains = 1;
		}
		decay.haltChannel = function(obj) {
			this.decMult = 1; //multiplier to decrease
			this.overtimeLimit = 10; 
			this.factor = 0.15; //more = faster that decay recovers from decreasing effective halt
			this.keep = 0.35; //fraction of halt each stop kept as overtime
			this.tickspeedPow = 0.35; //represents the amount that the current tickspeed affects its effectiveness, more = more effect
			this.overtimeDec = 0.25; //fraction of normal decHalt applied to overtime when normal halt is in effect
			this.overtimeEfficiency = 0.35; //overtime multiplier
			this.power = 1; //the amount of effective halt that "1" is equivalent to
			this.haltMax = 1; //power but more finnicky, the upper cap of halt

			this.autoExpire = false; //automatically delete itself from the channel upon reaching 0 halt and 0 overtime
			this.group = null;

			this.halt = 0;
			this.overtime = 0;
			
			for (let i in obj) {
				this[i] = obj[i];
			}
		}
		decay.haltChannel.prototype.addHalt = function(val) {
			this.halt = Math.max(this.halt, val);
			this.overtime = Math.min(this.overtimeLimit, this.overtime + this.halt * this.keep); 
		}
		decay.haltChannel.prototype.recover = function() {
			const decHalt = decay.decHalt * Math.pow(Math.max(decay.rateTS, 1), this.tickspeedPow) * this.decMult / Game.fps;
			this.halt = Math.max(0, this.halt - decHalt);
			if (this.halt == 0) {
				this.overtime = Math.max(0, this.overtime - decHalt);
			} else {
				this.overtime = Math.max(0, this.overtime - decHalt * this.overtimeDec);
			}
		}
		decay.haltChannel.prototype.getEffectiveHalt = function() {
			return Math.min(Math.pow(this.halt + this.overtime * this.overtimeEfficiency, this.factor), this.haltMax) * this.power;
		}
		decay.halts['click'] = new decay.haltChannel({});
		decay.halts['others'] = new decay.haltChannel({
			keep: 0, //no overtime
			tickspeedPow: 0
		});
		decay.haltChannelGroup = function() {
			this.channels = [];
			for (let i in arguments) { this.addChannel(arguments[i]); }
		}
		decay.haltChannelGroup.prototype.addChannel = function(channel) {
			channel.group = this;
			this.channels.push(channel);
		}
		decay.haltChannelGroup.prototype.removeChannel = function(input) {
			if (typeof input === 'number') { this.channels.splice(input, 1); }
			if (input instanceof decay.haltChannel) { this.channels.splice(this.channels.indexOf(input), 1); }
		}
		decay.haltChannelGroup.prototype.recover = function() {
			for (let i of this.channels) { 
				i.recover();
				if (i.autoExpire && i.halt <= 0 && i.overtime <= 0) { this.removeChannel(i); }
			}
		}
		decay.haltChannelGroup.prototype.getEffectiveHalt = function() {
			let halt = 0;
			for (let i of this.channels) { halt += i.getEffectiveHalt(); }
			return halt;
		}
		decay.stop = function(val, channel) {
			val *= Game.eff('haltPower') * decay.getHaltMult();			
			if (!channel) { channel = 'others'; }
			decay.halts[channel].addHalt(val);
			decay.momentum = 1 + (decay.momentum - 1) * Math.pow(decay.haltReverseMomentumFactor, Math.log2(Math.max(val * 2, 2)));
			decay.momentum -= Math.log2(Math.max(val * 2, 2)) / decay.haltSubtractMomentum;
			if (decay.momentum < 1) { decay.momentum = 1; }
			decay.times.sinceLastHalt = 0;
		}
		decay.recover = function() { 
			var decHaltMult = Math.pow(Math.max(decay.rateTS, 1), decay.haltTickingPow);
			for (let i in decay.halts) {
				decay.halts[i].recover();
			}
		}
		decay.getHaltMult = function() {
			var mult = 1;
			if (decay.isConditional('typing') || decay.isConditional('typingR')) { mult *= 5; }
			return mult;
		}
		decay.getEffectiveHalt = function() {
			//gets the effective halting power 
			let halt = 0;
			for (let i in decay.halts) {
				halt += decay.halts[i].getEffectiveHalt();
			}
			return halt / (Math.pow(1 + Math.log(Math.max(1, decay.momentum - decay.momentumOnHaltBuffer)) / Math.log(decay.momentumOnHaltLogFactor), decay.momentumOnHaltPowFactor));
		}
        decay.getRequiredHalt = function() {
            let r = 1;
			r *= decay.broken / Math.sqrt(decay.brokenMult);
            if (decay.gen > 1) { r *= Math.pow(decay.gen, 0.7); }
            if (decay.momentumUnlocked) { r *= decay.momentum; }
            if (Game.hasBuff('Coagulated')) { r *= 1.5; }
            if (Game.hasBuff('Cursed')) { r *= 3; }
			r *= Math.pow(1.15, decay.NGMState);
            
            return r;
        }
		decay.amplify = function(buildId, mult, anticlose) {
			if (buildId == 20) { decay.mults[20] = decay.getCpsDiffFromDecay(); return; }
			if (!decay.unlocked) { return false; }
			decay.mults[buildId] *= Math.pow(10, -Math.abs(Math.log10(decay.mults[buildId]) * anticlose));
			decay.mults[buildId] *= 1 / mult;
			if (isNaN(decay.mults[buildId]) || !decay.mults[buildId]) { decay.mults[buildId] = 1 / Number.MAX_VALUE; }
		}
		decay.amplifyAll = function(mult, anticlose) {
			for (let i in decay.mults) {
				decay.amplify(i, mult, anticlose);
			}
			decay.times.sinceLastAmplify = 0;
		}
		decay.work = function(amount) {
			//working increases fatigue
			if (Game.cookiesEarned < decay.featureUnlockThresholds.fatigue) { return; }
			if (!amount) { amount = 1; }
			decay.fatigue += amount;
			if (decay.fatigue >= decay.fatigueMax && !decay.exhaustion) { decay.fatigue = 0; decay.exhaust(); }
			decay.times.sinceLastWork = 0;
		}
		decay.exhaust = function() {
			decay.exhaustion = decay.exhaustionBegin;
			decay.fatigue = 0;
			Game.Notify('Exhausted!', '', 0);
			decay.triggerNotif('fatigue');
		}
		decay.updateFatigue = function() {
			if (decay.exhaustion) { 
				decay.exhaustion--; 
				if (decay.exhaustion <= 0) { decay.times.sinceExhaustionRecovery = 0; Game.Notify('Refreshed!', '', 0); }
			}
			if (decay.times.sinceLastWork >= 30 * Game.fps) {
				decay.fatigue = Math.max(0, decay.fatigue - 10);
			}
		}
		decay.symptomsFromFatigue = function(source) {
			//source: 0 is speed, 1 is opacity
			if (decay.exhaustion > 0 || (kaizoCookies.paused && !source)) { return 0; }
			return Math.pow(1 - decay.fatigue / decay.fatigueMax, 0.75) * (Math.min(decay.times.sinceExhaustionRecovery, 60) / 60);
		}
		decay.leftSectionSpeed = function(source) { return decay.symptomsFromFatigue(source); }
		Game.milkX = 0;
		Game.showerY = 0;
		Game.cursorR = 0;
		Game.cursorConverge = 0;
		Game.cursorClickCD = 0;
		/*eval('Game.DrawBackground='+Game.DrawBackground.toString().replace('ctx.globalAlpha=0.5*alphaMult;', 'ctx.globalAlpha=decay.symptomsFromFatigue(1)*0.5*alphaMult;')
			 .replace('ctx.globalAlpha=0.5;', 'ctx.globalAlpha=decay.symptomsFromFatigue(1)*0.5;')
			 .replace('ctx.globalAlpha=0.25', 'ctx.globalAlpha=decay.symptomsFromFatigue(1)*0.25')
			 .replace('var x=Math.floor((Game.T*2-(Game.milkH-Game.milkHd)*2000+480*2)%480);', 'Game.milkX += 3 * decay.symptomsFromFatigue(); if (Game.milkX >= 480) { Game.milkX -= 480; } var x = Math.floor(Game.milkX) - (Game.milkH - Game.milkHd) * 2000 + 480*2;')
			 .replace('var y=(Math.floor(Game.T*2)%512);', 'Game.showerY += 3 * decay.symptomsFromFatigue(); if (Game.showerY >= 512) { Game.showerY = 0; } var y=Game.showerY;')
			 .replace('//var spe=-1;', 'let fatigue = decay.symptomsFromFatigue(); Game.cursorR += 0.15 * fatigue; Game.cursorClickCD += 0.0375 * fatigue; Game.cursorConverge += 0.015 * fatigue;')
			 .replace('if (i==0 && fancy) rot-=Game.T*0.1;', 'if (i==0 && fancy) rot-=Game.cursorR;')
			 .replace('if (fancy) w+=Math.sin((n+Game.T*0.01)*Math.PI/2)*4;', 'if (fancy) w+=Math.sin((n+Game.cursorConverge)*Math.PI/2)*4;')
			 .replace('if (fancy) w=(Math.sin(Game.T*0.025+(((i+n*12)%25)/25)*Math.PI*2));', 'if (fancy) { w=(Math.sin(Game.cursorClickCD+(((i+n*12)%25)/25)*Math.PI*2)); }')
			 .replace('//shiny border during frenzies etc', `if (decay.exhaustion > 0 || decay.times.sinceExhaustionRecovery < 60) { ctx.globalAlpha = 1 - decay.symptomsFromFatigue(); ctx.drawImage(Pic('shadedBorders.png'),0,0,ctx.canvas.width,ctx.canvas.height); ctx.globalAlpha = 1; }`)
			);*/
		eval('Crumbs.objectBehaviors.milkBehavior.f='+Crumbs.objectBehaviors.milkBehavior.f.toString().replace('height - y;', 'height - y; Game.milkX += 3 * decay.leftSectionSpeed(); if (Game.milkX >= 480) { Game.milkX -= 480; }').replace('Math.floor((Game.T*2-(Game.milkH-Game.milkHd)*2000+480*2)%480)', 'Math.floor(Game.milkX) - (Game.milkH - Game.milkHd) * 2000 + 480*2;'));
		Crumbs.findObject('milk').behaviors = [new Crumbs.behaviorInstance(Crumbs.objectBehaviors.milkBehavior)];
		eval('Crumbs.objectBehaviors.cookieShowerBackground.f='+Crumbs.objectBehaviors.cookieShowerBackground.f.toString().replace('if (Game.cookiesPs', 'Game.showerY += 3 * decay.leftSectionSpeed(); if (Game.cookiesPs').replace('(Math.floor(Game.T*2)%512)', 'Game.showerY'));
		Crumbs.findObject('cookieWall').behaviors = [new Crumbs.behaviorInstance(Crumbs.objectBehaviors.cookieShowerBackground)];
		eval('Crumbs.objectBehaviors.shine1.f='+Crumbs.objectBehaviors.shine1.f.toString().replace('this.alpha = 0.5 * alphaMult', 'this.alpha = 0.5 * alphaMult * decay.leftSectionSpeed(1)'));
		Crumbs.findObject('bigCookie').findChild('shine1').behaviors = [new Crumbs.behaviorInstance(Crumbs.objectBehaviors.shine1)];
		eval('Crumbs.objectBehaviors.shine2.f='+Crumbs.objectBehaviors.shine2.f.toString().replace('this.alpha = 0.25 * alphaMult', 'this.alpha = 0.25 * alphaMult * decay.leftSectionSpeed(1)'));
		Crumbs.findObject('bigCookie').findChild('shine2').behaviors = [new Crumbs.behaviorInstance(Crumbs.objectBehaviors.shine2)];
		eval('Crumbs.cursorDraw='+Crumbs.cursorDraw.toString().replace('ctx.save();', 'let fatigue = decay.leftSectionSpeed(); Game.cursorR += 0.15 * fatigue; Game.cursorClickCD += 0.0375 * fatigue; Game.cursorConverge += 0.015 * fatigue; ctx.save();')
			 .replace('if (i==0 && fancy) rot-=Game.T*0.1;', 'if (i==0 && fancy) rot-=Game.cursorR;')
			 .replace('if (fancy) w+=Math.sin((n+Game.T*0.01)*Math.PI/2)*4;', 'if (fancy) w+=Math.sin((n+Game.cursorConverge)*Math.PI/2)*4;')
			 .replace('if (fancy) w=(Math.sin(Game.T*0.025+(((i+n*12)%25)/25)*Math.PI*2));', 'if (fancy) { w=(Math.sin(Game.cursorClickCD+(((i+n*12)%25)/25)*Math.PI*2)); }')
		);
		Crumbs.findObject('cursors').getComponent('canvasManipulator').function = Crumbs.cursorDraw;
		Crumbs.spawn({
			imgs: 'shadedBorders.png',
			scope: 'left',
			anchor: 'top-left',
			alpha: 0,
			order: 20,
			behaviors: [
				new Crumbs.behaviorInstance(Crumbs.objectBehaviors.fillWhole),
				new Crumbs.behaviorInstance(function() { this.alpha = 1 - decay.leftSectionSpeed(); })
			]
		});
		eval('Crumbs.spawnCookieShower='+Crumbs.spawnCookieShower.toString().replace('Game.prefs.particles', 'Math.random() < decay.leftSectionSpeed() && Game.prefs.particles'));
		eval('Crumbs.fallingCookieOnclick='+Crumbs.fallingCookieOnclick.toString().replace('Crumbs.spawn(', 'if (Math.random() < decay.leftSectionSpeed()) Crumbs.spawn('));
		decay.breakingPointMap = {
			0: 0.0001,
			1: 0.0005,
			2: 0.001,
			3: 0.005,
			4: 0.007,
			5: 0.008,
			6: 0.009,
			7: 0.01,
			max: 7
		}
		decay.updateBreaking = function() { 
			if (!Game.Has('Legacy') && decay.NGMState == 0) { return; }
			decay.breakingPoint = decay.breakingPointMap[decay.NGMState];
			if (decay.NGMState > decay.breakingPointMap.max) { decay.breakingPoint = decay.breakingPointMap[decay.breakingPointMap.max]; }
			if (decay.gen <= decay.breakingPoint) { 
				decay.broken = decay.brokenMult * Math.max(-Math.log10(decay.gen) / decay.breakingEscalationPow, 2);
			} else { decay.broken = 1; }
		}
 		decay.get = function(buildId) {
			return decay.mults[buildId];
		}
		decay.onInf = function() {
			Game.Win('Ultimate death');
			if (decay.prefs.wipeOnInf && Game.ascensionMode != 42069) { Game.HardReset(2); Game.Notify('Infinite decay', 'Your game was reset due to infinite decay!', [21, 25], Game.fps * 3600 * 24 * 365, false, 1); decay.setRates(); return; }
			if (decay.prefs.ascendOnInf || Game.ascensionMode == 42069) { decay.forceAscend(true); Game.Notify('Infinite decay', 'Excess decay caused a forced ascension without gaining any prestige or heavenly chips.', [21, 25], Game.fps * 3600 * 24 * 365, false, 1); decay.refreshAll(1); }
		}
		decay.forceAscend = function(wipePrestige) {
			if (wipePrestige) { Game.cookiesEarned = 0; }
			Game.Ascend(1);
		}
		//these are set at the reincarnate hooked decay function
		decay.unlockThresholds = {
			normal: {
				rate: 5555,
				fatigue: 55555555,
				shiny: 5555555555,
				momentum: 5.555e21,
				leading: 5.555e51,
				bomberNat: 5.555e24,
				phantom: 5.555e42,
				armored: 5.555e33,
			},
			unshackled: {
				rate: 55,
				fatigue: 55555,
				momentum: 5.555e13,
				shiny: 555555,
				leading: 5.555e18,
				bomberNat: 5.555e9,
				phantom: 5.555e15,
				armored: 5.555e12,
			}
		};
		decay.featureUnlockThresholds = decay.unlockThresholds.normal;
		decay.assignThreshold = function() {
			if (Game.ascensionMode == 42069) {
				decay.featureUnlockThresholds = decay.unlockThresholds.unshackled;
			} else {
				decay.featureUnlockThresholds = decay.unlockThresholds.normal;
			}
		};
		//unshackled decay stuff is at the challenge mode section
		decay.wipeSave = function() {
			for (let i in decay.mults) {
				decay.mults[i] = 1;
			}
			decay.halt = 0;
			decay.haltOvertime = 0;
			decay.bankedPurification = 0;
			decay.momentum = 1;
			for (let i in decay.times) { decay.times[i] = 1000; }
			decay.cpsList = [];
			decay.multList = [];
			decay.bankedPurification = 0;
			decay.hasEncounteredNotif = false;
			for (let i in decay.prefs.preventNotifs) {
				decay.prefs.preventNotifs[i] = false;
			}
			decay.power = 0;
			for (let i in decay.challenges) {
				if (decay.challenges[i].reset) { decay.challenges[i].reset(); }
				decay.challenges[i].wipe();
			}
			decay.getCompletionCount();
			decay.currentConditional = null;
			decay.killAllPowerOrbs();
			for (let i in decay.gameCan) { decay.gameCan[i] = true; }
			Game.pledgeT = 0;
			Game.pledgeC = 0;
			Game.veilPreviouslyCollapsed = false;
			Game.setVeilMaxHP(); Game.veilHP = Game.veilMaxHP;
			decay.resetSW(); decay.wipeSW(); decay.createDefaultSWCodes();

			Game.cookieClicksGlobal = 0;

			for (let i in Game.EnchantedPermanentUpgrades) { Game.EnchantedPermanentUpgrades[i] = -1; }

			Game.ascensionMode = 0;
			decay.assignThreshold();
			decay.acceleration = 1;

			decay.unlocked = false;
			decay.momentumUnlocked = false;

			decay.wrinklerSpawnRate = decay.setWrinklerSpawnRate();
			decay.wrinklerApproach = decay.setWrinklerApproach();
			decay.wrinklerResistance = decay.setWrinklerResistance();
			decay.wrinklerRegen = decay.setWrinklerRegen();
			Game.wrinklerHP = decay.setWrinklerMaxHP();

			decay.NGMState = 0;
			decay.NGMResets = 0;
			decay.cookiesTotalNGM = 0;
			decay.goldenClicksTotalNGM = 0;
			decay.trueStartDate = Date.now();
			decay.cookieClicksTotalNGM = 0;
			decay.lumpsTotalNGM = 0;
			decay.spellsCastTotalNGM = 0;
			decay.harvestsTotalNGM = 0;

			for (let i in decay.seFrees) { decay.seFrees[i] = 0; }
		}
		Game.registerHook('reset', function(hard) { if (kaizoCookies.paused) { kaizoCookies.togglePause(); } if (hard) { decay.wipeSave(); } });
		eval('Game.HardReset='+Game.HardReset.toString().replace('Game.lumpRefill=0;', 'Game.lumpRefill=0; decay.setRates();'));
		decay.getCpSBoostFromPrestige = function() {
			let degradation = 1;
			if (Game.prestige > 1000000) {
				degradation = 1 / (Math.log10(Game.prestige / 1000000) * 2 + 1)
			}
			return parseFloat(Game.prestige)*Game.heavenlyPower*Game.GetHeavenlyMultiplier()*degradation;
		}

		//this is so the player can actually know what is going on
		decay.notifs = {
			initiate: {
				title: 'decay',
				desc: function() { return loc('Due to aging and corruption in your facilities, CpS continuously decreases over time. You can temporarily stop it from decreasing with certain actions, such as clicking the big cookie; or purify the decay\'s effects by, for example, clicking a Golden or Wrath cookie.<br>To compensate, you get a +300% CpS multiplier that very slowly, decreases over time. <br>Currently: %1.', ['+'+Beautify(300 * Math.pow(1 - decay.incMult, 12), 3)+'%']); },
				icon: [3, 1, kaizoCookies.images.custImg]
			},
			achievement: {
				title: 'Achievements',
				desc: 'Obtaining an achievement also purifies your decay by a very large amount, but cannot yield any purity.',
				icon: [5, 6]
			},
			purity: {
				title: 'Purity',
				desc: 'If you can purify all of your decay, any extra purification power will be spent as an increase in CpS. The extra CpS (called "purity") acts as a sacrifical buffer for the decay; the more purity you have, the quicker the decay will be in eating through them.',
				icon: [10, 4, kaizoCookies.images.custImg]
			},
			wrinkler: {
				title: 'Wrinklers',
				desc: 'Wrinklers now spawn passively, approach the big cookie quicker the more decay you have, and does very bad things upon reaching the big cookie. Luckily, if you manage to pop them, you get to extract their souls which you can offer to the big cookie by dragging them into it, temporarily stopping decay.<br>Also, the withering affects clicks, unlike in vanilla',
				icon: [19, 8]
			},
			wrath: {
				title: 'Wrath cookies',
				desc: 'Wrath cookies now replace Golden cookies according to the amount of decay you have when it spawns; the more decay you have, the more often that Wraths replace Golden cookies. Luckily, it still purifies decay the same way as Golden cookies do.',
				icon: [15, 5]
			},
			gpoc: {
				title: 'Grandmapocalypse', 
				desc: 'The Grandmapocalypse, in the vanilla sense, no longer exists. It has been replaced by the decay mechanic. In addition, all other Grandmapocalypse-related items now help you combat the decay.',
				icon: [27, 11]
			}, 
			decayII: {
				title: 'decay: the return',
				desc: 'The decay gets stronger as you progress through the game, but you also obtain more items to help you fight it as the game goes on. ',
				icon: [3, 1, kaizoCookies.images.custImg]
			},
			veil: {
				title: 'Shimmering Veil',
				desc: 'While there are no sources to directly examine how your Shimmering Veil is doing, you can infer its health from the brightness of the veil around the big cookie, as well as the particles swirling around it.',
				icon: [9, 10]
			},
			buff: {
				title: 'Buffs under decay',
				desc: 'Positive buffs now run out faster the more decay you have accumulated. Stay vigilant!<br>(This uses the current amount of decay, which means that any decay accumulated before the buff was obtained will also cause the buff to last a shorter period of time.)',
				icon: [22, 6]
			},
			multipleBuffs: {
				title: 'Buff stacking',
				desc: 'Stacking more than one Golden cookie buff slightly increases your decay\'s momentum (feature unlocked at 5.555 quintillion cookies baked), but makes the decay rate increase with purity scale significantly harder.',
				icon: [23, 6]
			},
			fthof: {
				title: 'Force the Hand of Fate',
				desc: 'Notice: Force the Hand of Fate has had two effects removed from its pool (namely, building special and elder frenzy). Planners may not be accurate.<br>(Also, Golden cookies spawned by it do not purify decay.)',
				icon: [22, 11]
			},
			purityCap: {
				title: 'Purity limit',
				desc: 'All methods of purification have a hard limit on how much purity they can apply. This limit varies per the method.<br>(Telling you this because you just reached a purity limit!)',
				icon: [10, 4, kaizoCookies.images.custImg]
			},
			buildVariance: {
				title: 'Building size',
				desc: 'You might know that your amount of buildings affect decay, but did you know that the buildings\' size affects it too? The more space that a building would take up lore-wise, the more decay it contributes.',
				icon: [2, 6]
			},
			momentum: {
				title: 'Decay momentum',
				desc: 'If you don\'t do anything about the decay for a while, the rate of growth will start to slowly increase and your clicks will get less effective at stopping decay; this is momentum. Unlike decay itself, purifying decay CANNOT reverse momentum; however, halting decay such as via clicking the big cookie, can halt its growth and even (very slowly) reverse its momentum!',
				icon: [2, 1, kaizoCookies.images.custImg]
			},
			boost: {
				title: 'Purity boosts',
				desc: 'Some upgrades decrease your decay, but not all decreases decrease the same thing! There are three main ways:<br>"Decay rate" - The amount of decay that gets generated per second<br>"Decay momentum" - The decay momentum, which increases the decay rate if the decay is left uninterrupted (requires a few quintillion cookies baked all time to unlock)<br>"Decay propagation" - Decay rates AND decay momentum',
				icon: [20, 6]
			},
			autoclicker: {
				title: 'Autoclickers',
				desc: 'Please note: this mod is not balanced around autoclickers, and those will severely impact the intended experience. <br>If you are using an autoclicker and want to get the full experience, you should stop using them ASAP.',
				icon: [12, 0]
			},
			garden: {
				title: 'The garden',
				desc: 'The garden has been sped up and most mutations are significantly more common; the rarer it is in vanilla, the more boost it got. In addition, many of the slower-to-grow plants have been sped up dramatically. Lastly, all soils now tick faster and the refill works differently.',
				icon: [2, 18]
			},
			momentumPlus: {
				title: 'Too much momentum',
				desc: 'Momentum not only increases your rate of decay, but also makes methods that normally stop it less effective! There\'s really no way around it - if you got this much momentum, the only way to recover control is to keep clicking the cookie or popping wrinklers until it dies down.',
				icon: [2, 1, kaizoCookies.images.custImg]
			},
			pesudonat: {
				title: 'Pesudo-naturals',
				desc: function() { return loc('While some golden cookies, such as those spawned by Dragon Orbs - share the same pool as a naturally spawned Golden cookie, they are not all the same! Namely, non-forced Golden cookies that don\'t contribute to the Golden cookies clicked stat will purify decay with greatly reduced efficiency. This applies to Dragon Orbs, Lucky day fortune, and one of the spawns from Distilled essence of redoubled luck.') },
				icon: [10, 14]
			},
			momentumUnlock: {
				title: 'Momentum unlock',
				desc: function() { return loc('Momentum is only unlocked after obtaining at least %1 cookies this ascension. Before it\'s unlocked, momentum boosts do nothing.', [Beautify(5.555e18, 0)]); },
				icon: [2, 1, kaizoCookies.images.custImg]
			},
			shinyWrinkler: {
				title: 'Shiny wrinklers',
				desc: 'Shiny wrinklers, with their hard shell, have especially evolved to endure the kinds of intensive clicking that bakers like you force on them, and also causes a much greater cookie loss than normal wrinklers. However, also due to their hard shell - they move rather slowly, and produces a special, golden soul rather distinct from their normal counterparts that gives you some cookies upon being offered to the big cookie.',
				icon: [24, 12]
			},
			reindeer: {
				title: 'Reindeers',
				desc: 'Reindeers in this mod also purify decay, but not as much as golden cookies. Luckily, they spawn more often and drop upgrades more often!',
				icon: [12, 9]
			},
			stormDrop: {
				title: 'Cookie storm drops',
				desc: 'Golden cookies summoned from a cookie storm still purify decay, but much, much less.',
				icon: [11, 3]
			},
			overtime: {
				title: 'Decay halting overtime',
				desc: function() { return loc('Did you know that each big cookie click or wrinkler pop, in addition to immediately stopping decay, also adds a fraction of the halting duration to an overtime meter? The overtime meter kicks in a bit after you stop clicking/popping, and while it is less effective than normal halting, you can accumulate as much of it as you want as long as you keep clicking, up to a cap that scales with the halting strength of the halting method you used.<br>(You can trigger this notification in options to see your overtime value at the time of use.)')+'<div class="line"></div>'+loc('Current overhead: <b>%1</b>.', Beautify(decay.haltOvertime, 2))+'</div>'; },
				icon: [2, 3, kaizoCookies.images.custImg]
			},
			powerOrb: {
				title: 'Power orbs',
				desc: 'Did you know that just clicking the power orbs halt decay for an extended period of time, and will prevent your power from decreasing? Note, however, that power orbs will leave if you ignore them!',
				icon: 0
			},
			dragonflight: {
				title: 'Dragonflight!',
				desc: 'Dragonflight had also been changed in this mod. While the effect stays the same, the chances has been dramatically altered; now, it is much more common (alongside Dragon harvest), but also gets significantly more common for every golden cookie effect you have active at the time of clicking. However, it is now strictly incompatible with click frenzy and there is no way to stack click frenzy with it anymore, and any golden cookies forced to be a Click frenzy during a Dragonflight will now be forced to be any effect other than Click frenzy.',
				icon: [0, 25]
			},
			godzamok: {
				title: 'Godzamok reminder',
				desc: 'Reminder that Godzamok\'s buff stacks with itself strength wise, even when the buff tooltip doesn\'t say! (In general, no buff tooltips ever update after being created.)',
				icon: [23, 18]
			},
			fatigue: {
				title: 'Click fatigue',
				desc: 'While clicking is a super effective way to stop decay, it isn\'t foolproof. As you click more and more, the magical power that resides within the act of clicking the big cookie needs to recharge more and more. Luckily, by default, these periods of exhaustion only last 24 seconds!<br>Sneaky tip: the darker the aura around the big cookie, the more fatigue you have.',
				icon: 0
			},
			degradation: {
				title: 'Prestige degradation',
				desc: 'For balancing purposes, each prestige past 1000000 becomes slightly less effective than before. You can see just how much CpS boost your prestige provides by hovering over the various sources that tell you the amount of CpS boost that prestige is worth for.',
				icon: [10, 1, kaizoCookies.images.custImg]
			},
			breakingPoint: { 
				title: 'Breaking point',
				desc: 'If you haven\'t already, you might want to reread the description of the Legacy heavenly upgrade (the very first one and the prerequisite to all other heavenly upgrades) - it has been changed.',
				icon: [7, 3, kaizoCookies.images.custImg]
			},
			wrinklerAmplify: {
				title: 'Wrinkler decay amplification',
				desc: 'If a wrinkler that has touched the big cookie is popped or explodes with less than 1 cookie eaten, it will amplify decay.',
				icon: [19, 8]
			}
		}
		for (let i in decay.notifs) {
			if (typeof decay.notifs[i].desc == 'string') { addLoc(decay.notifs[i].desc); decay.notifs[i].desc = loc(decay.notifs[i].desc); }
			if (typeof decay.notifs[i].title == 'string') { addLoc(decay.notifs[i].title); decay.notifs[i].title = loc(decay.notifs[i].title); }
			decay.prefs.preventNotifs[i] = false;
			if (!decay.notifs[i].pref) { decay.notifs[i].pref = 'decay.prefs.preventNotifs.'+i; }
		} //it's always nice to support localizations
		addLoc('Momentum is only unlocked after obtaining at least %1 cookies this ascension. Before it\'s unlocked, momentum boosts do nothing.');
		addLoc('While some golden cookies, such as those spawned by Dragon Orbs - share the same pool as a naturally spawned Golden cookie, they are not all the same! Namely, non-forced Golden cookies that don\'t contribute to the Golden cookies clicked stat will purify decay with greatly reduced efficiency. This applies to Dragon Orbs, Lucky day fortune, and one of the spawns from Distilled essence of redoubled luck.');
		addLoc('Due to aging and corruption in your facilities, CpS continuously decreases over time. You can temporarily stop it from decreasing with certain actions, such as clicking the big cookie; or purify the decay\'s effects by, for example, clicking a Golden or Wrath cookie.<br>To compensate, you get a +300% CpS multiplier that very slowly, decreases over time. <br>Currently: %1.');
		addLoc('Did you know that each big cookie click or wrinkler pop, in addition to immediately stopping decay, also adds a fraction of the halting duration to an overtime meter? The overtime meter kicks in a bit after you stop clicking/popping, and while it is less effective than normal halting, you can accumulate as much of it as you want as long as you keep clicking, up to a cap that scales with the halting strength of the halting method you used.<br>(You can trigger this notification in options to see your current overtime value.)');
		addLoc('Current overhead: <b>%1</b>.');
		decay.notifsLoaded = false;
		decay.triggerNotif = function(key, bypass) {
			if (!decay.notifsLoaded) { return; }
			if (typeof eval(decay.notifs[key].pref) === 'undefined') { console.log('Corresponding pref not found. Input: '+key); return false; }
			if (eval(decay.notifs[key].pref)) { if (typeof bypass === 'undefined' || !bypass) { return false; } }
			if (!decay.unlocked) { return false; }
			Game.Notify(decay.notifs[key].title, (typeof decay.notifs[key].desc == 'function')?(decay.notifs[key].desc()):(decay.notifs[key].desc), decay.notifs[key].icon, 1e21, false, true);
			eval(decay.notifs[key].pref+'=true;');
			if (!decay.hasEncounteredNotif) { Game.Notify('Options', 'Look into the options menu for additional options, the ability to PAUSE THE GAME, and to replay these informational notifications!', 0, 1e21, false, true); }
			decay.hasEncounteredNotif = true; 
		}
		Game.buffCount = function() {
			var count = 0;
			for (let i in Game.buffs) { if (!decay.exemptBuffs.includes(Game.buffs[i].type.name)) { count++; } }
			return count;
		}
		Game.gcBuffCount = function() {
			var count = 0;
			for (let i in Game.buffs) { if (decay.gcBuffs.includes(Game.buffs[i].type.name)) { count++; } }
			return count;
		}
		decay.checkTriggerNotifs = function() {
			if (Game.drawT % 10 != 0) { return false; }
			if (decay.unlocked) { decay.triggerNotif('initiate'); }
			if (decay.gen > 1.2) { decay.triggerNotif('purity'); }
			if (decay.gen <= 0.5) { decay.triggerNotif('gpoc'); }
			if (decay.incMult >= 0.04) { decay.triggerNotif('decayII'); }
			if (Game.buffCount() && decay.gen <= 0.5) { decay.triggerNotif('buff'); }
			if (Game.gcBuffCount() > 1) { decay.triggerNotif('multipleBuffs'); }
			//if (Game.Objects['Idleverse'].amount > 0 && Game.Objects['Cortex baker'].amount > 0) { decay.triggerNotif('buildVariance'); } //this is kinda dumb
			if (decay.momentum > 1.05) { decay.triggerNotif('momentum'); }
			if (decay.momentum > 7.5) { decay.triggerNotif('momentumPlus'); }
			if (Game.prestige > 1000000) { decay.triggerNotif('degradation'); }
		}
		Game.registerHook('logic', decay.checkTriggerNotifs);
		decay.onWin = function(what) {
			if (what == 'Morale boost' || what == 'Glimmering hope' || what == 'Saving grace' || what == 'Last chance') {
				decay.purifyAll(1, 0.95, 1);
			}
		}
		eval('Game.Win='+Game.Win.toString().replace('Game.recalculateGains=1;', 'decay.onWin(what); Game.recalculateGains=1;'));
		eval('Game.shimmerTypes["golden"].popFunc='+Game.shimmerTypes["golden"].popFunc.toString().replace("if (me.wrath) Game.Win('Wrath cookie');", "if (me.wrath) { decay.triggerNotif('wrath'); Game.Win('Wrath cookie'); }"));

		allValues('decay init');
		
		//ui and display and stuff
		decay.term = function(mult) {
			if (mult > 1) { return 'purity'; }
			return 'decay';
		}
		decay.toggle = function(prefName,button,on,off,invert)		{
			if (decay.prefs[prefName])
			{
				l(button).innerHTML=off;
				decay.prefs[prefName]=0;
			}
			else
			{
				l(button).innerHTML=on;
				decay.prefs[prefName]=1;
			}
			l(button).className='smallFancyButton prefButton option'+((decay.prefs[prefName]^invert)?'':' off');
		}
		decay.writePrefButton = function(prefName,button,on,off,callback,invert) {
			//I love stealing code from orteil
			var invert=invert?1:0;
			if (!callback) callback='';
			callback+='PlaySound(\'snd/tick.mp3\');';
			return '<a class="smallFancyButton prefButton option'+((decay.prefs[prefName]^invert)?'':' off')+'" id="'+button+'" '+Game.clickStr+'="decay.toggle(\''+prefName+'\',\''+button+'\',\''+on+'\',\''+off+'\',\''+invert+'\');'+callback+'">'+(decay.prefs[prefName]?on:off)+'</a>';
		}
		decay.writeInfoSnippetButton = function(prefName, button) {
			if (!eval(decay.notifs[prefName].pref)) { return ''; }
			return '<a class="smallFancyButton" id="'+button+'"'+Game.clickStr+'="decay.triggerNotif(\''+prefName+'\', true);">'+decay.notifs[prefName].title+'</a><br>';
		}
		addLoc('Ascend on infinite decay');
		addLoc('Wipe save on infinite decay');
		addLoc('Upon reaching infinite decay, ascend without gaining any prestige or heavenly chips');
		addLoc('Informational widget');
		addLoc('Widget below the big cookie that displays information without having to look into the stats menu.');
		addLoc('Easy clicks');
		addLoc('Assistance option; allows you to click the big cookie by scrolling, but click speed is capped to 9 clicks per second.');
		addLoc('Show run timer');
		addLoc('Shows a more accurate timer of the run started stat.');
		addLoc('Show legacy timer');
		addLoc('Shows a more accurate timer of the legacy started stat.');
		addLoc('<b>none.</b><br><small>(You can see and replay information snippets you\'ve collected throughout the game here. The first one occurs at 5,555 cookies baked this ascension.)</small>');
		addLoc('Typing display');
		addLoc('Shows your keyboard inputs in real time.');
		decay.getPrefButtons = function() {
			var str = '';
			//str += decay.writePrefButton('ascendOnInf', 'AscOnInfDecayButton', loc('Ascend on infinite decay')+' ON', loc('Ascend on infinite decay')+' OFF')+'<label>('+loc("Upon reaching infinite decay, ascend without gaining any prestige or heavenly chips")+')</label><br>';
			str += decay.writePrefButton('wipeOnInf', 'WipeOnInfDecayButton', loc('Wipe save on infinite decay')+' ON', loc('Wipe save on infinite decay')+' OFF')+'<label>('+loc("Upon reaching infinite decay, wipe save")+')</label><br>';
			str += decay.writePrefButton('widget', 'widgetButton', loc('Informational widget')+' ON', loc('Informational widget')+' OFF')+'<label>('+loc('Widget below the big cookie that displays information without having to look into the stats menu. (only works when decay is unlocked)')+')</label><br>';
			str += decay.writePrefButton('scrollClick', 'scrollClickButton', loc('Easy clicks')+' ON', loc('Easy clicks')+' OFF')+'<label>('+loc('Assistance option; allows you to click the big cookie by scrolling, but click speed is capped to 9 clicks per second.')+')</label><br>';
			str += decay.writePrefButton('RunTimer','RunTimerButton',loc("Show run timer")+' ON',loc("Show run timer")+' OFF', 'if (decay.prefs.RunTimer) { l(\'Timer\').style.display = \'\'; } else { l(\'Timer\').style.display = \'none\'; }')+'<label>('+loc('Shows a more accurate timer of the run started stat.')+')</label><br>';
			str += decay.writePrefButton('LegacyTimer','LegacyTimerButton',loc("Show legacy timer")+' ON',loc("Show legacy timer")+' OFF', 'if (decay.prefs.LegacyTimer) { l(\'Timer2\').style.display = \'\'; } else { l(\'Timer2\').style.display = \'none\'; }')+'<label>('+loc('Shows a more accurate timer of the legacy started stat.')+')</label><br>';
			str += decay.writePrefButton('typingDisplay', 'typingDisplayButton', loc('Typing display')+' ON', loc('Typing display')+' OFF', 'if (decay.prefs.typingDisplay) { l(\'typingDisplayContainer\').style.display = \'\' } else { l(\'typingDisplayContainer\').style.display = \'none\'; }')+'<label>('+loc('Shows your keyboard inputs in real time.')+')</label><br>';
			str += 'Replay information snippets:<br>'
			var str2 = '';
			for (let i in decay.notifs) {
				str2 += decay.writeInfoSnippetButton(i, i+' Button')+'';
			}
			if (str2 == '') {
				str2 = loc('<b>none.</b><br><small>(You can see and replay information snippets you\'ve collected throughout the game here. The first one occurs at 5,555 cookies baked this ascension.)</small>');
			}
			return str + str2;
		}
		eval('Game.UpdateMenu='+Game.UpdateMenu.toString()
			 .replace(`rs; game will reload")+')</label><br>'+`, `rs; game will reload")+')</label><br>'+decay.getPrefButtons()+`)
			 .replace(`(App?'<div class="listing"`,`'<div class="listing"><a class="option smallFancyButton" '+Game.clickStr+'="kaizoCookies.togglePause();Game.UpdateMenu();">'+(kaizoCookies.paused?loc('Unpause'):loc('Pause'))+'</a><label>'+loc('Shortcuts: Ctrl+C, Ctrl+P')+'</label></div><br>'+(App?'<div class="listing"`)
			 .replace(`parseFloat(Game.prestige)*Game.heavenlyPower*heavenlyMult`, `decay.getCpSBoostFromPrestige()`)
		);
		injectCSS('#Timer1 { pointer-events: none; }');
		injectCSS('#Timer2 { pointer-events: none; }');

		decay.getCpsDiffFromDecay = function() {
			var prev = 0;
			var post = 0;
			for (let i in Game.Objects) {
				prev += decay.buildCpsWithoutDecay[i](Game.Objects[i]);
				post += Game.Objects[i].cps(Game.Objects[i]);
			}
			return post / prev;
		};
		
		decay.getDec = function() {
			if (decay.cpsList.length < Game.fps * 1.5) { return ''; }

			var repeatedFirst = [];
			for (let i = 0; i < 10; i++) {
				repeatedFirst.push(decay.cpsList[0]); //this makes the math incorrect, but the tradeoff of making clicking feel much more powerful and immediate, is well worth it
			}
			var str = ((1 - geometricMean(decay.cpsList.slice(0, Math.min(30, decay.cpsList.length)).concat(repeatedFirst)) / decay.cpsList[0]) * 100).toFixed(2);
			//geometric mean makes it fit better to large jumps in cps, also it is always less than arithmetic mean so it makes user feel better lol (ortroll)
			if (str.includes('-')) {
				str = str.replace('-', '+');
			} else {
				str = '-' + str;
			}
			return ' (' + str + '%/s)';
		}
		eval('Game.Draw='+Game.Draw.toString().replace(`ify(Game.cookiesPs*(1-Game.cpsSucked),1)+'</div>';`, `ify(Game.cookiesPs*(1-Game.cpsSucked),1)+decay.getDec()+'</div>';`));
		

		decay.diffStr = function() {
			if (!decay.unlocked) { return ''; }
			var str = '<b>CpS multiplier from '+decay.term(decay.cpsDiff)+': </b>';
			if (decay.gen < 0.0001) {
				str += '1 / ';
				str += Beautify(1 / decay.gen);
			} else { 
				if (decay.gen > 1) { 
					str += '<small>+</small>'; 
					str += Beautify(((decay.gen - 1) * 100), 3);
				} else { 
					str += '<small>-</small>'; 
					str += Beautify(((1 - decay.gen) * 100), 3);
				}
				str += '%';
			}
			return str;
		}

		addLoc('Decay rate multiplier from your momentum:');
		decay.momentumStr = function() {
			if (!decay.unlocked) { return ''; }
			var str = '<b>'+loc('Decay rate multiplier from your momentum:')+'</b> x';
			str += Beautify(decay.TSMultFromMomentum, 3);
			return str;
		}

		addLoc('Decay propagation multiplier from your acceleration:');
		decay.accStr = function() {
			var str = '<b>'+loc('Decay propagation multiplier from your acceleration:')+'</b> x';
			str += Beautify(decay.acceleration, 5);
			return str;
		}

		decay.effectStrs = function(funcs, id) {
			var num = 0;
			if (typeof id != 'number') { num = decay.cpsDiff; } else { num = decay.get(id); }
			if (Array.isArray(funcs)) { 
				for (let i in funcs) {
					num = funcs[i](num, i);
				}
			}
			var str = '';
			if (num > 1) { 
				str += '<small>+</small>'; 
				str += Beautify(((num - 1) * 100), 3);
				str += '%';
			} else if (num >= 0.0001) { 
				str += '<small>-</small>'; 
				str += Beautify(((1 - num) * 100), 3);
				str += '%';
			} else {
				str += '1 / ';
				str += Beautify(1 / num);
			}
			return str;
		}

		for (let i in Game.Objects) {
			eval('Game.Objects["'+i+'"].tooltip='+Game.Objects[i].tooltip.toString().replace(`okie",LBeautify(me.totalCookies)))+'</div>')`, `okie",LBeautify(me.totalCookies)))+'</div>')+(Game.Has('Purification domes')?('<div class="descriptionBlock">Production multiplier <b>'+decay.effectStrs([], me.id)+'</b> from your '+((decay.get(me.id)>1)?'purity':'decay')+' for this building.</div>'):'')`));
		}
		eval('Game.Object='+Game.Object.toString().replace(`okie",LBeautify(me.totalCookies)))+'</div>')`, `okie",LBeautify(me.totalCookies)))+'</div>')+(Game.Has('Purification domes')?('<div class="descriptionBlock">Production multiplier <b>'+decay.effectStrs([], me.id)+'</b> from your '+((decay.get(me.id)>1)?'purity':'decay')+' for this building.</div>'):'')`));

		eval('Game.UpdateMenu='+Game.UpdateMenu.toString().replace(`(giftStr!=''?'<div class="listing">'+giftStr+'</div>':'')+`, `(giftStr!=''?'<div class="listing">'+giftStr+'</div>':'')+'<div id="decayMultD" class="listing">'+decay.diffStr()+(decay.hasExtraPurityCps?(' <small>('+loc('additionally: ')+'x'+Beautify(decay.extraPurityCps, 4)+')</small>'):'')+'</div><div id="decayMomentumMultD" class="listing" style="'+(decay.momentumUnlocked?'':'display:none;')+'">'+decay.momentumStr()+'</div><div id="decayAccD" class="listing" style="'+((Game.ascensionMode===42069)?'':'display:none;')+'">'+decay.accStr()+'</div>'+`).replace(`'<div class="listing"><b>'+loc("Cookies per second:")`,`'<div id="CpSD" class="listing"><b>'+loc("Cookies per second:")`).replace(`'<div class="listing"><b>'+loc("Raw cookies per second:")`,`'<div id="RawCpSD" class="listing"><b>'+loc("Raw cookies per second:")`).replace(`'<div class="listing"><b>'+loc("Cookies per click:")`,`'<div id="CpCD" class="listing"><b>'+loc("Cookies per click:")`));
		Game.UpdateMenu();
		Game.getWithered = function() {
			if (Game.cpsSucked > 0.99) {
				return Beautify(Math.round((1 / (1 - Game.cpsSucked)) - 1), 0)+' / '+Beautify(Math.round(1 / (1 - Game.cpsSucked)), 0);
			} else {
				return Beautify(Math.round(Game.cpsSucked*100),1)+'%';
			}
		}
		addLoc('additionally: ');
		decay.updateStats = function() {
			if (Game.onMenu=='stats') { 
				document.getElementById('decayMultD').innerHTML = decay.diffStr() + (decay.hasExtraPurityCps?(' <small>('+loc('additionally: ')+'x'+Beautify(decay.extraPurityCps, 4)+')</small>'):'');
				document.getElementById('CpSD').innerHTML = '<b>'+loc("Cookies per second:")+'</b> '+Beautify(Game.cookiesPs,1)+' <small>'+'('+loc("multiplier:")+' '+Beautify(Math.round(Game.globalCpsMult*100),1)+'%)'+(Game.cpsSucked>0?' <span class="warning">('+loc("withered:")+' '+Game.getWithered()+')</span>':'')+'</small>';
				document.getElementById('RawCpSD').innerHTML = '<b>'+loc("Raw cookies per second:")+'</b> '+Beautify(Game.cookiesPsRaw,1)+' <small>'+'('+loc("highest this ascension:")+' '+Beautify(Game.cookiesPsRawHighest,1)+')'+'</small>';
				document.getElementById('CpCD').innerHTML = '<b>'+loc("Cookies per click:")+'</b> '+Beautify(Game.computedMouseCps,1);
				document.getElementById('decayMomentumMultD').innerHTML = decay.momentumStr();
				document.getElementById('decayAccD').innerHTML = decay.accStr();
			}
		}
		//"D" stands for display, mainly just dont want to conflict with any other id and lazy to check

		var newDiv = document.createElement('div'); 
		newDiv.id = 'decayWidget'; 
		injectCSS('.leftSectionWidget { font-size: 26px; text-shadow: rgb(0, 0, 0) 0px 1px 4px; position: relative; text-align: center; padding: 3px; display: inline-block; z-index: 6; left: 50%; transform: scale(0.75) translate(-66.7%, -133.3%); background: rgba(0, 0, 0, 0.4); line-height: 1.25; border-radius: 10px; pointer-events: none; }'); //wtf is this black magic
		injectCSS('.widgetDisplay { position: relative; display:inline-flex; justify-content: center; align-items: center; width: 100%; margin: 4px 0px 4px 0px; }');
		injectCSS('.brActor { position: relative; padding: 0px 0px 0px 0px; }');
		injectCSS('.widgetText { display: inline; margin: 4px 58px 4px 58px; }');
		injectCSS('.widgetIcon { position: absolute; }');
		injectCSS('.widgetIcon.toLeft { left: 0; }');
		injectCSS('.widgetIcon.toRight { right: 0; }');
		newDiv.classList.add('leftSectionWidget');
		newDiv.style = 'top: 500px;'; 
		l('sectionLeft').appendChild(newDiv);
		decay.setWidget = function() {
			const avail = decay.unlocked || decay.momentumUnlocked || (Game.ascensionMode === 42069);
			if (!decay.prefs.widget || !avail) { l('decayWidget').style = 'display:none;'; return false; }
			if (!decay.unlocked) { l('decayCpsMult').style = 'display:none'; } else { l('decayCpsMult').style = ''; }
			if (!decay.momentumUnlocked) { l('decayMomentum').style = 'display:none'; } else { l('decayMomentum').style = ''; }
			if (Game.ascensionMode !== 42069) { l('decayAcceleration').style = 'display:none'; } else { l('decayAcceleration').style = ''; }
			var str = '';
			str = decay.effectStrs();
			l('decayCpsData').innerHTML = str+(decay.hasExtraPurityCps?'<br><div style="font-size: 16px;">x'+Beautify(decay.extraPurityCps, 4)+'</div>':'');
			if (decay.hasExtraPurityCps) { l('decayCpsData').style.margin = '4px 58px 0px 58px'; } else { l('decayCpsData').style.margin = ''; }
			if (decay.gen > 1) {
				l('decayRateIconLeft').style = writeIcon([10, 4, kaizoCookies.images.custImg]);
				l('decayRateIconRight').style = writeIcon([10, 4, kaizoCookies.images.custImg]);
			} else {
				l('decayRateIconLeft').style = writeIcon([3, 1, kaizoCookies.images.custImg]);
				l('decayRateIconRight').style = writeIcon([3, 1, kaizoCookies.images.custImg]);
			}
			l('decayMomentumData').innerHTML = 'x'+Beautify(decay.TSMultFromMomentum, 3);
			l('decayAccelerationData').innerHTML = 'x'+Beautify(decay.acceleration, 5);
			var verticalPlacement = 0.95; 
			if (Game.specialTab == 'dragon') { verticalPlacement = 0.8; } else if (Game.specialTab == 'santa') { verticalPlacement = 0.88; }
			verticalPlacement = Math.max(verticalPlacement * l('sectionLeft').offsetHeight, 250);
			l('decayWidget').style = 'top:'+verticalPlacement+'px';
		}
		addLoc('CpS multiplier from your decay');
		addLoc('Decay rate multiplier from your momentum');
		addLoc('Decay propagation multiplier from your acceleration');
		l('decayWidget').innerHTML = `<div id="decayCpsMult" `+Game.getTooltip('<div style="width: 250px; text-align: center;">'+loc('CpS multiplier from your decay/purity')+'</div>', 'middle', false)+` class="widgetDisplay"><div class="icon widgetIcon toLeft" id="decayRateIconLeft" style="`+writeIcon([3, 1, kaizoCookies.images.custImg])+`"></div>`+`<div id="decayCpsData" class="widgetText">initializing...</div>`+`<div class="icon widgetIcon toRight" id="decayRateIconRight" style="`+writeIcon([3, 1, kaizoCookies.images.custImg])+`"></div></div>`+
			`<div id="brActor1" class="brActor"></div>`+
			`<div id="decayMomentum" `+Game.getTooltip('<div style="width: 250px; text-align: center;">'+loc('Decay rate multiplier from your momentum')+'</div>', 'middle', false)+` class="widgetDisplay"><div class="icon widgetIcon toLeft" style="`+writeIcon([2, 1, kaizoCookies.images.custImg])+`"></div>`+`<div id="decayMomentumData" class="widgetText">initializing...</div>`+`<div class="icon widgetIcon toRight" style="`+writeIcon([2, 1, kaizoCookies.images.custImg])+`"></div></div>`+
			`<div id="brActor2" class="brActor"></div>`+
			`<div id="decayAcceleration" `+Game.getTooltip('<div style="width: 250px; text-align: center;">'+loc('Decay propagation multiplier from your acceleration')+'</div>', 'middle', false)+` class="widgetDisplay"><div class="icon widgetIcon toLeft" style="`+writeIcon([7, 0, kaizoCookies.images.custImg])+`"></div>`+`<div id="decayAccelerationData" class="widgetText">initializing...</div>`+`<div class="icon widgetIcon toRight" style="`+writeIcon([7, 0, kaizoCookies.images.custImg])+`"></div></div>`;
		
		//decay scaling
		decay.setRates = function() {
			var d = 1;
			d *= Math.pow(0.997, Game.log10Cookies);
			d *= Math.pow(0.99975, Math.log2(Math.max(Game.goldenClicksLocal - 77, 1)));
			d *= Math.pow(0.9995, Math.max(Math.sqrt(Game.AchievementsOwned) - 4, 0));
			d *= Math.pow(0.999, Math.max(Math.pow(decay.getBuildingContribution(), 0.33) - 10, 0));
			if (Game.Has('Legacy')) { d *= 0.98; }
			if (Game.Has('Lucky day')) { d *= 0.995; }
			if (Game.Has('Serendipity')) { d *= 0.995; }
			if (Game.Has('Get lucky')) { d *= 0.995; }
			if (Game.Has('One mind')) { d *= 0.995; }
			if (Game.Has('Shimmering veil')) { d *= 0.995; }
			if (Game.Has('Unshackled Purity')) { d *= 0.99; }
			if (Game.Has('Purification domes')) { d *= 0.99; }
			decay.incMult = Math.max(1 - d, 0.00001);

			var w = 0.8;
			w *= 1 + Game.log10Cookies / 60;
			decay.wrinklerSpawnThreshold = w; 
			
			decay.wcPow = 0.25;

			decay.min = Math.min(1, 0.15 + (1 - d) * 3.5);

			decay.brokenMult = 1 + Math.max(Game.log10Cookies / 30 - 0.75, 0);

			decay.exhaustionBeginMult = 1 / (1 + Game.milkProgress / 50);
			decay.exhaustionBeginMult *= 1 / d;

			var dh = 1;
			dh *= Math.max(1 / Math.pow(d, 1.75), decay.haltDecMin);
			decay.decHalt = dh;

			decay.workProgressMult = 0.8 / d;
			decay.workProgressMult *= Math.pow(Game.log10Cookies * 3, 0.25);
			decay.workProgressMult *= Math.pow(Math.max(Game.log10Cookies - 18, 1), 0.5);
			decay.workProgressMult *= Math.pow(Math.max(Game.log10Cookies / 3 - 15, 1), 0.75);
			if (Game.resets < 1) { decay.workProgressMult *= 1.5; }
			if (Game.resets > 2) { decay.workProgressMult *= 1.2; }
			decay.workProgressMult *= Math.log2(decay.acceleration); 

			decay.buffDurPow = 0.5 - 0.15 * Game.auraMult('Epoch Manipulator');

			decay.wrinklersN = Crumbs.getObjects('w').length;

			decay.setOthers();
		}
		decay.getBuildingContribution = function() {
			//the bigger the building, the more "space" they take up, thus increasing decay by more
			let c = 0;
			let add = 0;
			if (Game.Has('Thousand fingers')) add +=    Math.log10(Game.BuildingsOwned); 
			if (Game.Has('Million fingers')) add+=		0.6989700043360189; //log10(5)
			if (Game.Has('Billion fingers')) add+=		1; //log10(10)
			if (Game.Has('Trillion fingers')) add+=		1.3010299956639813; //log10(20)
			if (Game.Has('Quadrillion fingers')) add+=	1.3010299956639813;
			if (Game.Has('Quintillion fingers')) add+=	1.3010299956639813;
			if (Game.Has('Sextillion fingers')) add+=	1.3010299956639813;
			if (Game.Has('Septillion fingers')) add+=	1.3010299956639813;
			if (Game.Has('Octillion fingers')) add+=	1.3010299956639813;
			if (Game.Has('Nonillion fingers')) add+=	1.3010299956639813;
			if (Game.Has('Decillion fingers')) add+=	1.3010299956639813;
			if (Game.Has('Undecillion fingers')) add+=	1.3010299956639813;
			if (Game.Has('Unshackled cursors')) add+=	1.3979400086720377; //log10(25)
			c += add * Game.Objects['Cursor'].amount * 0.1;
			let grandmaPer = 0;
			if (Game.Has('One mind')) { grandmaPer += Game.Objects['Grandma'].amount / 100; }
			if (Game.Has('Communal brainsweep')) { grandmaPer += Game.Objects['Grandma'].amount / 100; }
			if (Game.Has('Elder Pact')) { grandmaPer += Game.Objects['Portal'].amount / 40; }
			c += grandmaPer + Game.Objects['Grandma'].amount;
			c += Game.Objects['Farm'].amount * 3 + Game.Objects['Mine'].amount * 3 + Game.Objects['Factory'].amount * 1.5 + Game.Objects['Bank'].amount * 1.25;
			c += Game.Objects['Temple'].amount * 1.25 + Game.Objects['Wizard tower'].amount + Game.Objects['Shipment'].amount + Game.Objects['Alchemy lab'].amount;
			c += Game.Objects['Portal'].amount * (1 + Game.Has('Deity-sized portals') * 1.5) + Game.Objects['Time machine'].amount;
			c += Game.Objects['Antimatter condenser'].amount * 2.5 + Game.Objects['Prism'].amount + Game.Objects['Chancemaker'].amount * 1.5;
			c += Game.Objects['Fractal engine'].amount * 2.71828 + Math.pow(Game.Objects['Javascript console'].amount, 1.2);
			c += Game.Objects['Idleverse'].amount * 7.5 + Game.Objects['Cortex baker'].amount * 6 + Game.Objects['You'].amount * 2;
			return c;
		}
		decay.setOthers = function() {
			var ho = 10; //halt overtime max setting
			for (let i in decay.offBrandFingers) {
				if (decay.offBrandFingers[i].bought) { ho *= 1.15; }
			}
			decay.haltOTLimit = ho;
		}
		Game.registerHook('check', decay.setRates);
		Game.registerHook('reincarnate', decay.setRates);
		//make certain actions force a setRate
		for (let i in Game.Objects) {
			eval('Game.Objects["'+i+'"].buy='+Game.Objects[i].buy.toString().replace('if (this.buyFunction) this.buyFunction();', 'if (this.buyFunction) { this.buyFunction(); } decay.setRates();'));
		}
		//raw cps boosts
		decay.rawCpsMults = function(mult) {
			mult *= (1 + 3 * Math.pow(1 - decay.incMult, 12));
			mult *= decay.cpsPurityMults();
			if (decay.challengeStatus('combo1')) { mult *= 1 + 9.09 / (Math.max(Game.log10Cookies - 15, 0) / 4 + 1); }
			if (decay.challengeStatus('comboGSwitch')) { mult *= 1.1; }
			if (Game.Has('Wrinkler ambergris')) { mult *= 1.06; }
			for (let i in Game.UpgradesByPool['tech']) {
				if (Game.Has(Game.UpgradesByPool['tech'][i].name)) { mult *= 1.02; }
			}
			return mult;
		}
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace(`var rawCookiesPs=Game.cookiesPs*mult;`, `mult = decay.rawCpsMults(mult); var rawCookiesPs=Game.cookiesPs*mult;`))
		//the other actions are in their respective minigame sections

		//timer thingy omar made
		Game.AccurateSayTime=function(time,detail)
		{
			if (time<=0) return '';
			var str='';
			var detail=detail||0;
			time=Math.floor(time);
			if (detail==-1)
			{
				var days=0;
				var hours=0;
				var minutes=0;
				var seconds=0;
				if (time>=1000*60*60*24) days=(Math.floor(time/(1000*60*60*24)));
				if (time>=1000*60*60) hours=(Math.floor(time/(1000*60*60)));
				if (time>=1000*60) minutes=(Math.floor(time/(1000*60)));
				if (time>=1000) seconds=(Math.floor(time/1000));
				hours-=days*24;
				minutes-=hours*60+days*24*60;
				seconds-=minutes*60+hours*60*60+days*24*60*60;
				var bits=[];
				if (time>=1000*60*60*24) bits.push(Beautify(days));
				if (time>=1000*60*60) bits.push(("0"+Beautify(hours)).slice(-2));
				if (time>=1000*60) bits.push(("0"+Beautify(minutes)).slice(-2));
				if (time>=1000) bits.push(("0"+Beautify(seconds)).slice(-2));
				bits.push(("00"+Beautify(time%1000)).slice(-3));
				str=bits.join(':');
			}
			return str;
		}
	
        l('CrumbsEngineVersion').insertAdjacentHTML('beforebegin','<div class="title" style="font-size:25px;" id="Timer"></div>');
		l('CrumbsEngineVersion').insertAdjacentHTML('beforebegin','<div class="title" style="font-size:25px;" id="Timer2"></div>');
	
		Game.registerHook('draw', () => {
		    var date=new Date();
		    date.setTime(Date.now()-Game.startDate);
		    var timeInMiliseconds=date.getTime();
		    var startDate=Game.AccurateSayTime(timeInMiliseconds,-1);
			date.setTime(Date.now()-Game.fullDate);
			var fullDate=Game.AccurateSayTime(date.getTime(),-1);
			if (!fullDate || fullDate.length<1) fullDate='a long while';
			if (decay.prefs.RunTimer){
				l('Timer').innerHTML = '<b>'+'</b>'+(startDate);
			}
			if (decay.prefs.LegacyTimer){
				l('Timer2').innerHTML = '<b>'+'</b>'+(fullDate);
			}		
	    });

		allValues('decay ui and scaling');

		//decay visuals
		decay.cookiesPsAnim = function() {
			if (!decay.unlocked) { return ''; }
			var colors = [];
			var sec = Game.fps;
			if (decay.times.sinceLastPurify < 3 * sec) {
				var frac = Math.pow(decay.times.sinceLastPurify / (3 * sec), 0.7);
				colors.push(colorCycleFrame([51, 255, 68], [51, 255, 68, 0], frac));
			}
			if (Game.pledgeT > 0) {
				var frame = Math.floor(Game.pledgeT / (2 * sec)) + Math.pow((Game.pledgeT / (2 * sec)) - Math.floor(Game.pledgeT / (2 * sec)), 0.5);
				if (Math.floor(frame) % 2) { 
					colors.push(colorCycleFrame([51, 255, 68], [42, 255, 225], (frame - Math.floor(frame)))); 
				} else {
					colors.push(colorCycleFrame([42, 255, 225], [51, 255, 68], (frame - Math.floor(frame)))); 
				}
			}
			if (decay.times.sincePledgeEnd < 3 * sec) {
				var frac = Math.pow(decay.times.sincePledgeEnd / (3 * sec), 1.5);
				colors.push(colorCycleFrame([51, 255, 68], [51, 255, 68, 0], frac));
			}
			if (decay.times.sinceLastAmplify < 5 * sec) {
				var frac = Math.pow(decay.times.sinceLastAmplify / (3 * sec), 1.5);
				colors.push(colorCycleFrame([119, 30, 143], [119, 30, 143, 0], frac));
			}
			if (Game.veilOn() && Game.cpsSucked == 0) {
				var frame = Math.floor(Game.T / (10 * sec)) + Math.pow((Game.T / (10 * sec)) - Math.floor(Game.T / (10 * sec)), 0.33);
				if (Math.floor(frame) % 2) { 
					colors.push(colorCycleFrame([255, 236, 69, 0], [255, 236, 69, 0.66], (frame - Math.floor(frame)))); 
				} else {
					colors.push(colorCycleFrame([255, 236, 69, 0.66], [255, 236, 69, 0], (frame - Math.floor(frame)))); 
				}
			}
			var result = avgColors(colors, true);
			if (result[3] < 1) {
				if (Game.cpsSucked == 0) {
					result = avgColors([result, [255, 255, 255, 1 - result[3]]], false);
				} else {
					result = avgColors([result, [255, 0, 0, 1 - result[3]]], false);
				}
			}
			if (colors.length > 0) {
				return 'color: rgb('+result[0]+','+result[1]+','+result[2]+');';
			} else {
				return '';
			}
		}
		eval('Game.Draw='+Game.Draw.toString().replace(`class="wrinkled"':'')+'>'`, `class="wrinkled"':'')+' style="'+decay.cookiesPsAnim()+'">'`));
		decay.conditionalAnim = function() {
			if (!decay.currentConditional) { return; }
			var frame = Game.T / (2 * Game.fps);
			var colors = [];
			if (Math.floor(frame) % 2) {
				colors = colorCycleFrame([190, 0, 0, 0.44], [190, 0, 106, 0.44], frame - Math.floor(frame));
			} else {
				colors = colorCycleFrame([190, 0, 106, 0.44], [190, 0, 0, 0.44], frame - Math.floor(frame));
			}
			if (l('activeConditional')) { l('activeConditional').style.backgroundColor = ' rgba('+colors[0]+','+colors[1]+','+colors[2]+','+colors[3]+')'; }
		}
		Game.registerHook('draw', decay.conditionalAnim);

		decay.buildCpsWithoutDecay = {};
		for (let i in Game.Objects) {
			decay.buildCpsWithoutDecay[i] = Game.Objects[i].cps.toString().replaceAll('this.name', '"'+i+'"'); //CCSE support
			decay.buildCpsWithoutDecay[i] = eval('decay.buildCpsWithoutDecay["'+i+'"]='+decay.buildCpsWithoutDecay[i]);
			eval('Game.Objects["'+i+'"].cps='+Game.Objects[i].cps.toString().replace('CpsMult(me);', 'CpsMult(me); mult *= decay.get(me.id); '));
		}
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace(`{Game.cookiesPs+=9;Game.cookiesPsByType['"egg"']=9;}`,`{Game.cookiesPs+=9*decay.gen;Game.cookiesPsByType['"egg"']=9*decay.gen;}`));
		eval("Game.shimmerTypes['golden'].initFunc="+Game.shimmerTypes['golden'].initFunc.toString()
			 .replace(' || (Game.elderWrath==1 && Math.random()<1/3) || (Game.elderWrath==2 && Math.random()<2/3) || (Game.elderWrath==3)', ' || ((!decay.covenantStatus("wrathBan") && Math.random() > Math.pow(decay.gen, decay.wcPow * Game.eff("wrathReplace"))) || (decay.covenantStatus("wrathTrap")))')
			 .replace('var dur=13;', 'var dur=13; if (decay.covenantStatus("wrathTrap")) { dur = 2; me.wrathTrapBoosted = true; } else { me.wrathTrapBoosted = false; } if (decay.covenantStatus("frenzyStack")) { me.canBoostFrenzy = true; } else { me.canBoostFrenzy = false; } if (decay.covenantStatus("dragonStack")) { me.canBoostDH = true; } else { me.canBoostDH = false; }')
		);
		addLoc('+%1/min');

		//UI changes (brought from 1.0501)
		l("sectionRight").style["background"] = "url(img/panelBG.png)";

		Game.GiveUpAscend=function(bypass)
		{
			if (!bypass) Game.Prompt('<h3>Give up</h3><div class="block">Are you sure? You\'ll have to start this run over and won\'t gain any heavenly chips!</div>',[['Yes','Game.ClosePrompt();Game.GiveUpAscend(1);'],'No']);
			else
			{
				if (Game.prefs.popups) Game.Popup('Game reset');
				else Game.Notify('Gave up','Let\'s try this again!',[0,5],4);
				Game.Reset();
			}
		}

		addLoc('Ascending in...');
		Game.ShowLegacy=function()
		{
			var str='<h3>Legacy</h3>';
			str+='<div class="block" id="legacyPromptData" style="overflow:hidden;position:relative;text-align:center;"></div>';
			str+='<a class="option" style="position:absolute;right:4px;bottom:4px;" '+Game.clickStr+'="Game.ClosePrompt();Game.GiveUpAscend();" '+Game.getTooltip(
							'<div style="min-width:200px;text-align:center;">Abandon the current run; you will not ascend, you will lose your current progress, but you will keep anything ascending normally keeps.</div>'
							,'bottom-right')+
				'>Give up</a>';
			Game.Prompt(str,[['Ascend','Game.ClosePrompt();if (decay.broken == 1) { Game.Ascend(1); } else { decay.ascendIn = 15 * Game.fps; Game.Notify(loc("Ascending in..."), "", 0); }'],'br','Cancel'],Game.UpdateLegacyPrompt,'legacyPrompt');
			l('promptOption0').className='option framed large title';
			l('promptOption0').style='margin:16px;padding:8px 16px;animation:rainbowCycle 5s infinite ease-in-out,pucker 0.2s ease-out;box-shadow:0px 0px 0px 1px #000,0px 0px 1px 2px currentcolor;background:linear-gradient(to bottom,transparent 0%,currentColor 500%);width:auto;text-align:center;';
			l('promptOption0').style.display='none';
			
			setTimeout(function() { l('promptOption0').style.display='inline-block'; Game.UpdateLegacyPrompt(); }, 6 / Game.fps * 1000);
		}

		addLoc('Due to the fact that <b>decay has progressed past its breaking point</b>, it take an additional <b>%1</b> seconds for the ascend animation to start! You can cancel the ascension countdown at any time using the esc key.');
		Game.UpdateLegacyPrompt=function()
		{
			if (!l('legacyPromptData')) return 0;
			l('legacyPromptData').innerHTML=
				'<div class="icon" style="pointer-event:none;transform:scale(2);opacity:0.25;position:absolute;right:-8px;bottom:-8px;background-position:'+(-19*48)+'px '+(-7*48)+'px;"></div>'+
                loc("Do you REALLY want to ascend?<div class=\"line\"></div>You will lose your progress and start over from scratch.<div class=\"line\"></div>All your cookies will be converted into prestige and heavenly chips.")+'<div class="line"></div>'+(Game.canLumps()?loc("You will keep your achievements, building levels and sugar lumps."):loc("You will keep your achievements."))+
				'<div class="line"></div>'+((decay.broken>1)?('<div class="listing"></div>'+loc('Due to the fact that <b>decay has progressed past its breaking point</b>, it take an additional <b>%1</b> seconds for the ascend animation to start! You can cancel the ascension countdown at any time using the esc key.', Game.sayTime(15 * Game.fps))):'');
		}

		Game.Ascend = function(bypass) {
			if (!bypass) Game.ShowLegacy();
			else
			{
				Game.Notify(loc("Ascending"),loc("So long, cookies."),[20,7],4);
				Game.OnAscend=0;Game.removeClass('ascending');
				Game.addClass('ascendIntro');
				//trigger the ascend animation
				Game.AscendTimer=1;
				Game.killShimmers();
				l('toggleBox').style.display='none';
				l('toggleBox').innerHTML='';
				Game.choiceSelectorOn=-1;
				Game.ToggleSpecialMenu(0);
				Game.AscendOffX=0;
				Game.AscendOffY=0;
				Game.AscendOffXT=0;
				Game.AscendOffYT=0;
				Game.AscendZoomT=1;
				Game.AscendZoom=0.2;
				
				Game.jukebox.reset();
				PlayCue('preascend');
			}
			
		}

		eval('Game.Reincarnate=' + Game.Reincarnate.toString().replace(`if (!bypass) Game.Prompt('<id Reincarnate><h3>'+loc("Reincarnate")+'</h3><div class="block">'+loc("Are you ready to return to the mortal world?")+'</div>',[[loc("Yes"),'Game.ClosePrompt();Game.Reincarnate(1);'],loc("No")]);`, `if (!bypass) Game.Prompt('<id Reincarnate><h3>'+loc("Reincarnate")+'</h3><div class="block">'+'<div class="icon" style="pointer-event:none;transform:scale(2);opacity:0.50;position:absolute;right:-8px;bottom:-8px;background-position:'+(-10*48)+'px '+(-0*48)+'px;"></div>'+loc("Are you ready to return to the mortal world?")+'</div>',[[loc("Yes"),'Game.ClosePrompt();Game.Reincarnate(1);'],loc("No")]);`));

		//new game minus
		decay.cookiesTotalNGM = Game.cookiesReset + Game.cookiesEarned;
		decay.goldenClicksTotalNGM = Game.goldenClicks;
		decay.trueStartDate = Game.startDate;
		decay.cookieClicksTotalNGM = Game.cookieClicks;
		decay.lumpsTotalNGM = Game.lumpsTotal;
		//decay.spellsCastTotalNGM
		//decay.harvestsTotalNGM
		eval('Game.Earn='+Game.Earn.toString().replace(';', '; decay.cookiesTotalNGM += howmuch;'));
		eval('Game.shimmerTypes.golden.popFunc='+Game.shimmerTypes.golden.popFunc.toString().replace('Game.goldenClicksLocal++;', 'Game.goldenClicksLocal++; decay.goldenClicksTotalNGM++;'));
		Game.registerHook('click', function() { decay.cookieClicksTotalNGM++; });
		eval('Game.gainLumps='+Game.gainLumps.toString().replace('Game.lumpsTotal+=total;', 'Game.lumpsTotal+=total; decay.lumpsTotalNGM += total;'));
		decay.NGMResets = 0;
		decay.NGMState = 0;
		//exclusively to be used to level up NGM
		decay.NGMReset = function() {
			let [a, b, c, d, e, f, g] = [decay.cookiesTotalNGM, decay.goldenClicksTotalNGM, decay.trueStartDate, decay.cookieClicksTotalNGM, decay.lumpsTotalNGM, decay.spellsCastTotalNGM, decay.harvestsTotalNGM];
			if (decay.NGMResets > 0 && decay.NGMState == 0) { decay.NGMState = decay.NGMResets; }
			else if (decay.NGMState == decay.NGMResets) { decay.NGMState++; decay.NGMResets++; }
			let state = decay.NGMState;
			let resets = decay.NGMResets;
			
			Game.HardReset(2);

			decay.NGMState = state;
			decay.NGMResets = resets;
			decay.cookiesTotalNGM = a;
			decay.goldenClicksTotalNGM = b;
			decay.trueStartDate = c;
			decay.cookieClicksTotalNGM = d;
			decay.lumpsTotalNGM = e;
			if (isv(f)) { decay.spellsCastTotalNGM = f; }
			if (isv(g)) { decay.harvestsTotalNGM = g; }
			Game.Notify('New game minus', 'Difficulty heightened!<br>You can disable the effects of New game minus at any time for the rest of the legacy using the options menu.', [15, 5]); 
			
		}
		decay.saveNGMInfo = function() {
			let str = '';
			str += decay.NGMState + ',';
			str += decay.NGMResets + ',';
			str += decay.cookiesTotalNGM + ',';
			str += decay.goldenClicksTotalNGM + ',';
			str += decay.trueStartDate + ',';
			str += decay.cookieClicksTotalNGM + ',';
			str += decay.lumpsTotalNGM + ',';
			str += decay.spellsCastTotalNGM + ',';
			str += decay.harvestsTotalNGM;

			return str;
		}
		decay.loadNGMInfo = function(str) {
			if (!isv(str)) { return; }
			let info = str.split(',');
			for (let i in info) { info[i] = parseFloat(info[i]); }

			decay.NGMState = info.shift();
			decay.NGMResets = info.shift();
			decay.cookiesTotalNGM = info.shift();
			decay.goldenClicksTotalNGM = info.shift();
			decay.trueStartDate = info.shift();
			decay.cookieClicksTotalNGM = info.shift();
			decay.lumpsTotalNGM = info.shift();
			decay.spellsCastTotalNGM = info.shift();
			decay.harvestsTotalNGM = info.shift();
		}
		addLoc('New game minus');
		addLoc('Do you REALLY want to start a new New game minus legacy?<br><small>You will lose your progress, your achievements, and your heavenly chips, start over with <b>increased difficulty</b>, and <b>without gaining any benefits</b>!</small>');
		addLoc('Are you REALLY, <b>REALLY</b>, sure about this? The game will get harder, you will gain <b>NO</b> benefits or boosts, and while you can disable the negative effects of New game minus at any time - you won\'t get your current progress back!<br><small>Don\'t say we didn\'t warn you!</small>');
		addLoc('Are you ready to return to where you left off?<br>Last time you were in New game minus, you were <b>%1</b> layers deep.');
		addLoc('This will wipe your current progress, including all of your prestige!');
		decay.askNGMReset = function(stage) {
			if (decay.NGMResets > 0 && decay.NGMState == 0) {
				if (stage == 0) {
					Game.Prompt('<id NGMRestore><h3>'+loc('New game minus')+'</h3><div class="block">'+tinyIcon([15,5])+'<div class="line"></div>'+loc('Are you ready to return to where you left off?<br>Last time you were in New game minus, you were <b>%1</b> layers deep.', Beautify(decay.NGMResets))+'<br>'+loc('This will wipe your current progress, including all of your prestige!'),[[EN?'Yes!':loc("Yes"),'Game.ClosePrompt();decay.askNGMReset(1);','float:left'],[loc("No"),0,'float:right']]);
				}
				else if (stage == 1) { decay.NGMReset(); }
				return;
			}
			if (stage == 0) {
				Game.Prompt('<id NGMReset><h3>'+loc('New game minus')+'</h3><div class="block">'+tinyIcon([15,5])+'<div class="line"></div>'+loc("Do you REALLY want to start a new New game minus legacy?<br><small>You will lose your progress, your achievements, and your heavenly chips, start over with <b>increased difficulty</b>, and <b>without gaining any benefits</b>!</small>")+'</div>',[[EN?'Yes!':loc("Yes"),'Game.ClosePrompt();decay.askNGMReset(1);','float:left'],[loc("No"),0,'float:right']]);
			}
			else if (stage == 1) {
				Game.Prompt('<id NGMReset><h3>'+loc('New game minus')+'</h3><div class="block">'+tinyIcon([15,5])+'<div class="line"></div>'+loc('Are you REALLY, <b>REALLY</b>, sure about this? The game will get harder, you will gain <b>NO</b> benefits or boosts, and while you can disable the negative effects of New game minus at any time - you won\'t get your current progress back!<br><small>Don\'t say we didn\'t warn you!</small>'),[[EN?'Do it!':loc("Yes"),'Game.ClosePrompt();decay.askNGMReset(2);','float:left'],[loc("No"),0,'float:right']]);
			}
			else if (stage == 2) { decay.NGMReset(); }
		}
		decay.revertNGM = function() {
			decay.NGMState = 0;
			Game.Notify('New game minus disabled!', '', 0);
			Game.UpdateMenu();
		}
		addLoc('Exit New game minus');
		addLoc('Are you sure? You can reactivate New game minus at any time, but doing so will wipe your progress again.');
		decay.askNGMRevert = function(stage) {
			if (decay.NGMState == 0) { return; }
			Game.Prompt('<id NGMRevert><h3>'+loc('Exit New game minus')+'</h3><div class="block">'+loc('Are you sure? You can reactivate New game minus at any time, but doing so will wipe your progress again.')+'</div>', [[loc("Yes"),'Game.ClosePrompt();decay.revertNGM();',''],[loc("No"),0]]);
		}
		Game.getNormalAchievsN = function() {
			let c = 0;
			for (let i in Game.Achievements) {
				if (Game.Achievements[i].pool == 'normal') { c++; }
			}
			return c;
		}
		Game.normalAchievsN = Game.getNormalAchievsN();
		new Game.Upgrade('New game minus', '', 0, [15, 5], function() {
			if (decay.NGMResets > 0 && decay.NGMState == 0) {
				decay.askNGMReset(0);
			} else {
				let completions = Game.AchievementsOwned / Game.normalAchievsN;
				let threshold = decay.NGMAchievReqMap[decay.NGMState]; 
				if (decay.NGMState > decay.NGMAchievReqMap.max) { threshold = decay.NGMAchievReqMap[decay.NGMAchievReqMap.max]; }
				if (completions >= threshold) { decay.askNGMReset(0); }
			}
			Game.Upgrades['New game minus'].bought = 0;
		}); Game.last.pool = 'toggle'; Game.last.order = 100000;
		decay.NGMAchievReqMap = {
			0: 0.85,
			1: 0.9,
			2: 0.92,
			3: 0.94,
			4: 0.96,
			5: 0.97,
			6: 0.98,
			max: 6
		}
		decay.NGMCookiesReq = 1e63;
		addLoc('Resets <b>everything</b> and adds one New game minus layer, starting a new legacy with stronger decay than before. In addition, breaking point will be present in the first ascension as well.<br>Only unlocked upon obtaining at least <b>%1</b>, and advancing a layer requires achievement completions to be complete.');
		addLoc('Reset <b>everything</b> and return to <b>layer %1</b> of New game minus.');
		addLoc('Unlocked upon obtaining an achievement completion of at least <b>%1%</b>.');
		addLoc('Next layer: <b>layer %1</b>');
		Game.last.descFunc = function() {
			if (decay.NGMResets > 0 && decay.NGMState == 0) {
				return loc('Reset <b>everything</b> and return to <b>layer %1</b> of New game minus.', decay.NGMResets);
			}
			let completions = Game.AchievementsOwned / Game.normalAchievsN;
			let threshold = decay.NGMAchievReqMap[decay.NGMState]; 
			if (decay.NGMState > decay.NGMAchievReqMap.max) { threshold = decay.NGMAchievReqMap[decay.NGMAchievReqMap.max]; }
			return '<div style="text-align:center;"><b>'+((completions>=threshold)?loc('Unlocked'):loc('Locked'))+'</b><br><small>'+loc('Unlocked upon obtaining an achievement completion of at least <b>%1%</b>.', Beautify(threshold * 100))+'</small><br>'+loc('Next layer: <b>layer %1</b>', Beautify(decay.NGMResets + 1))+'</div><div class="line"></div>'+loc('Resets <b>everything</b> and adds one New game minus layer, starting a new legacy with stronger decay than before. In addition, breaking point will be present in the first ascension as well.<br>Only unlocked upon obtaining at least <b>%1</b>, and advancing a layer requires achievement completions to be complete.', Beautify(decay.NGMCookiesReq))+'<q>Endless content, forever.</q>';
		}
		Game.registerHook('check', function() { if (Game.cookiesEarned + Game.cookiesReset > decay.NGMCookiesReq || (decay.NGMResets > 0 && decay.NGMState == 0)) { Game.Unlock('New game minus'); } });
		addLoc('Cookies baked (cross-legacies total):');
		addLoc('First legacy started:');
		addLoc(', with %1 new game minus layer%2');
		addLoc('cross-legacies total: ');
		addLoc('Sugar lumps harvested across all legacies:');
		addLoc('Disables New game minus and reverts all of its effects for this legacy and all future legacies, until New game minus is invoked again');
		eval('Game.UpdateMenu='+Game.UpdateMenu.toString()
			 .replace(`Beautify(Game.cookiesEarned+Game.cookiesReset)+'</div></div>'+`, `Beautify(Game.cookiesEarned+Game.cookiesReset)+'</div></div>'+(decay.cookiesTotalNGM==(Game.cookiesEarned+Game.cookiesReset)?'':('<div class="listing"><b>'+loc("Cookies baked (cross-legacies total):")+'</b> <div class="price plain">'+Game.tinyCookie()+Beautify(decay.cookiesTotalNGM)+'</div></div>'))+`)
			 .replace(`(Game.resets?('<div`, `(decay.NGMResets?('<div class="listing"><b>'+loc("First legacy started:")+'</b> '+(loc('%1 ago', Game.sayTime((Date.now() - decay.trueStartDate) / 1000 * Game.fps))))+loc(', with %1 new game minus layer%2', [decay.NGMResets, ((decay.NGMResets==1||(!EN))?'':'s')])+'</div>':'')+(Game.resets?('<div`)
			 .replace(`+loc("all time:")+' '+Beautify(Game.goldenClicks)+`, `+loc("all time:")+' '+Beautify(Game.goldenClicks)+(decay.goldenClicksTotalNGM==Game.goldenClicks?'':('; '+loc('cross-legacies total: ')+Beautify(decay.goldenClicksTotalNGM)))+`)
			 .replace(`Beautify(Game.lumpsTotal)+'</div></div>'`, `Beautify(Game.lumpsTotal)+'</div></div>'+(decay.lumpsTotalNGM==Game.lumpsTotal?'':('<div class="listing"><b>'+loc("Sugar lumps harvested across all legacies:")+'</b> <div class="price lump plain">'+Beautify(decay.lumpsTotalNGM)+'</div></div>'))`)
			 .replace(`eep backups on your computer")+'</label></div>'):'')+`, `eep backups on your computer")+'</label></div>'):'')+(decay.NGMState==0?'':'<br><div class="listing"><a class="option smallFancyButton" '+Game.clickStr+'="decay.askNGMRevert();Game.UpdateMenu();">'+loc('Exit New game minus')+'</a><label>'+loc('Disables New game minus and reverts all of its effects for this legacy and all future legacies, until New game minus is invoked again')+'</label></div><br>')+`)
			);
		
		/*=====================================================================================
        Wrinklers
        =======================================================================================*/
		decay.wrinklerSpawnRate = 0;
		decay.wrinklerApproach = 15;
		decay.wrinklerResistance = 0.75;
		decay.wrinklerRegen = 0.02;
		decay.wrinklerLossMult = 1;
		Crumbs.initWrinklers = function() {
			for (let i = 0; i < Game.wrinklerLimit; i++) {
				let w = Crumbs.findObject('wrinkler'+i, 'left');
				if (w !== null) { w.die(); }
			}
		};
		Crumbs.initWrinklers();
		Game.rebuildWrinklers = function(absMax) {
			Game.wrinklerLimit = absMax;
			Game.wrinklers=[];
			for (var i=0;i<Game.wrinklerLimit;i++) {
				Game.wrinklers.push({id:parseInt(i),close:0,sucked:0,phase:0,x:0,y:0,r:0,hurt:0,hp:Game.wrinklerHP,selected:0,type:0,clicks:0});
			}
		};
		Game.rebuildWrinklers(2);
		decay.setWrinklerApproach = function() {
			var base = 45 / Math.pow(Game.eff('wrinklerApproach'), 1.5); //the bigger the number, the slower it approaches
			base *= 1 + Game.auraMult("Dragon God") * 2;
			if (Game.Has('Wrinklerspawn')) { base *= 1.1; }
			if (Game.hasGod) {
				const godLvl = Game.hasGod('scorn');
				if (godLvl == 1) { base *= 1 / (1 - 0.45); }
				else if (godLvl == 2) { base *= 1 / (1 - 0.3); }
				else if (godLvl == 3) { base *= 1 / (1 - 0.15); }
			}
			if (decay.challengeStatus('live1')) { base *= 1/0.8; }
			return Math.max(2, base / Math.pow((Math.log(1 / Math.min(1, decay.gen)) / Math.log(decay.wrinklerApproachFactor)), decay.wrinklerApproachPow));
		};
		decay.setWrinklerSpawnRate = function() {
			if (decay.gen >= decay.wrinklerSpawnThreshold || !decay.unlocked || Game.Has("Wrinkler doormat")) { return 0; }
			var base = 0.985;
			if (decay.gen > 1) { base = Math.pow(base, 1 / Math.pow(decay.gen, 0.1)); }

			var mult = 1 / Math.pow(Math.max(Game.log10Cookies - 12, 0), 0.3);
			return 1 - Math.pow(base, mult);
		};
		decay.setWrinklerResistance = function() {
			//the amount of health decrease per click
			var base = 0.75;
			var fingerMult = 1;
			for (let i in decay.multiFingers) {
				if (decay.multiFingers[i].bought) { fingerMult += 0.15; }
			}
			base *= fingerMult;
			return base;
		};
		decay.setWrinklerRegen = function() {
			//per frame
			var r = 0.02 * (1 / (1 - decay.incMult));
			return r;
		};
		decay.setWrinklerMaxHP = function() {
			var h = 12.6 * Math.pow(1 - decay.incMult, 4.5);
			if (Game.Has('Unholy bait')) { h *= 0.9; }
			return h;
		};
		decay.setWrinklerLossMult = function() {
			let m = 1;
			if (Game.Has('Sacrilegious corruption')) { m *= 0.8; }
			return m;
		}
		decay.wrinklersN = 0;
		decay.wrinklerMovement = new Crumbs.behavior(function() {
			const pos = Crumbs.h.rv(this.rad, 0, 108 + this.dist * 212); //108 pixels
			this.x = this.leftSection.offsetWidth / 2 + pos[0]; this.y = this.leftSection.offsetHeight * 0.4 + pos[1];
			this.rotation = Math.PI * 2 - this.rad;
			if (this.getComponent('pointerInteractive').hovered) { this.hurt = Math.max(this.hurt, 12); }

			this.scaleX = (this.size * 0.25 + 0.5) * (1+0.02*Math.sin(Game.T*0.2+Number(this.index)*2));
			this.scaleY = (this.size * 0.25 + 0.5) * (1+0.025*Math.sin(Game.T*0.2-2+Number(this.index)*2));
		});
		decay.wrinklerVisualMovement = new Crumbs.behavior(function() {
			this.rotation = (Math.sin(Game.T*1)*this.parent.hurt)*0.004;
			if (Game.prefs.fancy) { this.rotation += Math.sin(Game.T*0.05+this.parent.rad * 10)*0.08 + Math.sin(Game.T*0.09+this.parent.dist * 4)*0.06; }
			this.alpha = Math.max((Crumbs.t - this.t) / 240, 1 - this.parent.dist);
		});
		decay.wrinklerSkins = new Crumbs.behavior(function() {
			if (this.parent.shiny) { this.imgUsing = Game.WINKLERS?5:2; return; }
			if (Game.season == 'christmas') { this.imgUsing = Game.WINKLERS?6:3; return; }
			this.imgUsing = Game.WINKLERS?4:1; return;
		});
		decay.wrinklerSplits = new Crumbs.behavior(function() {
			if (this.parent.parent.explosionProgress < 0.25) { this.noDraw = true; return; } else { this.noDraw = false; }
			this.sx = Math.floor(this.parent.parent.explosionProgress * 4) * 100;
			this.sy = this.parent.shiny?200:0;
		})
		decay.wrinklerAI = new Crumbs.behavior(function() {
			this.dist = Math.max(this.dist - this.speedMult * (1 / (Game.fps * decay.wrinklerApproach)) * (this.shiny?0.33:1), 0);
		});
		decay.wrinklerStats = new Crumbs.behavior(function() {
			this.hp = Math.min(this.hp + decay.wrinklerRegen, this.hpMax);
			if (this.dist == 0) { 
                this.sucked += Math.max(Game.cpsSucked, (Math.pow(Game.cookiesInTermsOfCps, 0.2) - 5)) * (this.shiny?3:1) * Game.cookiesPs * decay.wrinklersN / Game.fps; this.explosionProgress += (1 / ((this.bomber?(2+this.size):(20+10*this.size)) * Game.fps)); 
            }
            if (this.explosionProgress >= 1) { decay.wrinklerExplosion.call(this); }
			if (Math.random()<0.01 && !Game.prefs.notScary) this.hurt=Math.max(this.hurt,Math.random() * 10);
			this.hurt = Math.max(this.hurt - 2, 0);
		});
		decay.wrinklerParticles = new Crumbs.behavior(function() { 
			if (Game.prefs.particles) {
				if (this.dist == 0 && Math.random() < 0.015) {
					Crumbs.spawn(Crumbs.spawnFallingCookie(this.x, this.y, Math.random()*-2-2, Math.random()*4-2, 1, 'wrinklerPassive', false, Math.random()*0.5+0.5, 4, true));
				}
				if (this.shiny && Math.random()<0.3) {
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
						}
					}); return;
				}
			} 
		});
		eval('Crumbs.objectInits.wrinklerWidgets='+Crumbs.objectInits.wrinklerWidgets.toString().replace(`anchor: 'top-left',`, `anchor: 'top',`).replaceAll('Game.wrinklers[this.wId]', 'this')); //LMAO
		decay.compileSucking = function() {
			let list = Crumbs.getObjects('w');
			let sucking = 0;
			for (let i of list) {
				if (i.dist == 0) { sucking++; }
			}
			return sucking;
		};
		decay.wrinklerBitSelection = {
			0: 1,
			1: 5,
			2: 3,
			3: 7,
			4: 6,
			5: 2,
			6: 0,
			7: 4
		}
		eval('Crumbs.wrinklerBit='+Crumbs.wrinklerBit.toString().replace(`anchor: 'top-left',`, `anchor: 'top',`));
		decay.spawnWrinklerbits = function(obj, amount, speed, ydFunc, xdFunc) {
			const seed1 = Math.floor(Math.random() * 8);
			const seed2 = Math.floor(Math.random() * 5);
			for (let i = 0; i < amount; i++) { 
				let w = Crumbs.wrinklerBit(decay.wrinklerBitSelection[(seed1 + i * seed2)%8] + Crumbs.objects.left.length); //is this necessary?
				if (obj.shiny) { w.imgs = 'shinyWrinklerBits'; }
				w.behaviors = [new Crumbs.behaviorInstance(Crumbs.objectBehaviors.cookieFall, {yd: ydFunc?ydFunc():(Math.random()*-2-2)}), new Crumbs.behaviorInstance(Crumbs.objectBehaviors.horizontal, {speed: xdFunc?xdFunc():(Math.random()*4-2)}), new Crumbs.behaviorInstance(Crumbs.objectBehaviors.expireAfter, {t: speed * Game.fps}), new Crumbs.behaviorInstance(Crumbs.objectBehaviors.fadeout, {speed: 1 / (speed * Game.fps)})];
				w.x = obj.x;
				w.y = obj.y;
				w.rotation = obj.rotation;
				w.scaleX = obj.scaleX;
				w.scaleY = obj.scaleY;
				Crumbs.spawn(w);
			}
		};
		decay.wrinklerSizeHPMap = {
			0: 1.75,
			1: 4.5,
			2: 10,
			3: 20
		}
		decay.wrinklerHPFromSize = function(size) {
			if (size < 4) { return decay.wrinklerSizeHPMap[size]; }
			return 1 + (size + 3) * size;
		}
		decay.wrinklersInit = function() {
		}
		Game.dropHalloweenCookie = function(me) {
			var failRate=0.95;
			if (Game.HasAchiev('Spooky cookies')) failRate=0.8;
			if (Game.Has('Starterror')) failRate*=0.9;
			failRate*=1/Game.dropRateMult();
			if (Game.hasGod)
			{
				var godLvl=Game.hasGod('seasons');
				if (godLvl==1) failRate*=0.9;
				else if (godLvl==2) failRate*=0.95;
				else if (godLvl==3) failRate*=0.97;
			}
			if (me.shiny) failRate*=0.9;
			if (Math.random()>failRate)//halloween cookie drops
			{
				var cookie=choose(['Skull cookies','Ghost cookies','Bat cookies','Slime cookies','Pumpkin cookies','Eyeball cookies','Spider cookies']);
				if (!Game.HasUnlocked(cookie) && !Game.Has(cookie))
				{
					Game.Unlock(cookie);
					Game.Notify(Game.Upgrades[cookie].dname,loc("You also found <b>%1</b>!",Game.Upgrades[cookie].dname),Game.Upgrades[cookie].icon);
				}
			}
		}
		decay.reinitWrinkler = function(w) {
			//resets stats based on its attributes
			if (w.phantom) { w.findChild('wc').getComponent('settings').obj.globalCompositeOperation = 'lighter'; } else { w.findChild('wc').getComponent('settings').obj.globalCompositeOperation = 'source-over'; }
		}
        addLoc('Popped a wrinkler');
		decay.onWrinklerClick = function() { 
			if (this.phantom) {
				
			} else {
				this.hp -= decay.wrinklerResistance * (this.shiny?0.33:1); 
				this.hurt = Math.ceil(decay.wrinklerResistance * 60);
			}

			if (this.hp > 0) { return; }
				
            if (this.size <= 0) { 
                decay.wrinklerDeath.call(this);
            } else {
                this.size--;
                this.hurt += decay.wrinklerResistance * 45;
                this.hpMax = decay.wrinklerHPFromSize(this.size);
                this.hp = this.hpMax;
                decay.spawnWrinklerbits(this, 3 + Math.floor(Math.random() * 3), 0.5);
            }
            decay.wrinklersN--;
		}
		addLoc('Decay amplified!');
        decay.wrinklerDeath = function() {
            this.die();
            if (this.sucked) {
				this.sucked *= decay.wrinklerLossMult;
                Game.Notify(loc("Popped a wrinkler"), loc("You lost <b>%1</b>!", loc("%1 cookie", LBeautify(this.sucked))), [19, 8], 6);
                if (this.sucked >= 1) { Game.Popup('<div style="font-size:80%;">' + loc("-%1!", loc("%1 cookie", LBeautify(this.sucked))) + '</div>', Game.mouseX, Game.mouseY); }
				else { Game.Popup('<div style="font-size:80%;">' + loc('Decay amplified!') + '</div>', Game.mouseX, Game.mouseY); decay.amplifyAll(1.5, 0.15); decay.triggerNotif('wrinklerAmplify'); }
                for (let i = 0; i < 7; i++) {
                    Crumbs.spawn(Crumbs.spawnFallingCookie(0, 0, Math.random() * +4 - 6, Math.random() * 8 - 4, 2.5, 'wrinklerPoppedCookie', true, Math.random() * 0.5 + 0.75, 3));
                }
                Game.DropEgg(0.9);
                if (Game.season == 'halloween') { Game.dropHalloweenCookie(); }
                Game.cookies = Math.max(0, Game.cookies - this.sucked);
                Game.gainBuff('coagulated', 6);
                Game.gainBuff('cursed', 2);

                decay.onWrinklerSuckedPop(this);
            } else {
                decay.onWrinklerIntercept(this);
            }
            decay.spawnWrinklerbits(this, 8, 1.5);
            if (this.shiny) Game.Win('Last Chance to See');
            Game.wrinklerPopped++;
            decay.onWrinklerPop(this);
        }
        addLoc('Decay rates and halting requirement +50% for %1!');
        new Game.buffType('coagulated', function(time) {
            return {
                name: 'Coagulated',
                desc: loc('Decay rates and halting requirement +50% for %1!', Game.sayTime(time, -1)),
                time: time*Game.fps,
                add: true,
                icon: [8, 3, kaizoCookies.images.custImg],
                aura: 2
            }
        });
        addLoc('Decay propagation and halting requirement +200% for %1!');
        addLoc('Decay rates and halting requirement +200% for %1!');
        new Game.buffType('cursed', function(time) {
            return {
                name: 'Cursed',
                desc: (decay.momentumUnlocked?loc('Decay propagation and halting requirement +200% for %1!', Game.sayTime(time, -1)):loc('Decay rates and halting requirement +200% for %1!', Game.sayTime(time, -1))),
                time: time*Game.fps,
                max: true,
                icon: [18, 6],
                aura: 2
            }
        });
        addLoc('Bombers incoming!');
        new Game.buffType('distorted', function(time) {
            return {
                name: 'Distorted',
                desc: loc('Bombers incoming!'),
                time: time*Game.fps,
                max: true,
                icon: [9, 2, kaizoCookies.images.custImg],
                aura: 2
            }
        });
        decay.wrinklerExplosionBitsFunc = function() {
            return (Math.round(Math.random()) * 2 - 1) * (Math.random() * 5 + 4);
        }
        decay.wrinklerExplosion = function() { 
            this.sucked += Game.cookies * (this.bomber?0.05:0.25);
			this.sucked *= decay.wrinklerLossMult;
            Game.Notify(loc("Wrinkler exploded!"), loc('You lost <b>%1</b>!', loc('%1 cookie', LBeautify(this.sucked))+'</div>'), [19, 8], 6);
            if (this.sucked >= 1) { Game.Popup('<div style="font-size:80%;">' + loc("-%1!", loc("%1 cookie", LBeautify(this.sucked))) + '</div>', this.x, this.y); }
			else { Game.Popup('<div style="font-size:80%;">' + loc('Decay amplified!') + '</div>', Game.mouseX, Game.mouseY); decay.amplifyAll(1.5, 0.15); decay.triggerNotif('wrinklerAmplify'); }
            Game.cookies = Math.max(0, Game.cookies - this.sucked);
            if (!this.bomber) { Game.gainBuff('clot', 66, 0.5); }
            Game.gainBuff('coagulated', (this.bomber?8:30));
            Game.gainBuff('cursed', 8);
            if (this.bomber) { Game.gainBuff('distorted', 12); }

            decay.spawnWrinklerbits(this, 16, 2, decay.wrinklerExplosionBitsFunc, decay.wrinklerExplosionBitsFunc);

            this.die();
        }
		decay.wrinklerImgList = [Crumbs.objectImgs.empty, 'img/wrinkler.png', 'img/shinyWrinkler.png', 'img/winterWrinkler.png', 'winkler.png', 'shinyWinkler.png', 'winterWinkler.png'];
		decay.spawnWrinkler = function(obj) {
			//obj can have: rad, dist, size, shiny (bool), leading (bool), bomber (bool), armored (bool), phantom (bool)
			//size is 1 for normal, 0 for small, 2 for medium
			obj = obj??{};
			let wc = {
				imgs: decay.wrinklerImgList,
				anchor: 'top',
				id: 'wc',
				init: Crumbs.objectInits.wrinklerWidgets,
				order: 1.5,
				children: {
					imgs: kaizoCookies.images.wrinklerSplits,
					anchor: 'top',
					order: 1.55,
					width: 100,
					height: 200,
					behaviors: new Crumbs.behaviorInstance(decay.wrinklerSplits)
				},
				components: new Crumbs.component.settings({ globalCompositeOperation: 'source-over' }),
				behaviors: [new Crumbs.behaviorInstance(decay.wrinklerSkins), new Crumbs.behaviorInstance(decay.wrinklerVisualMovement)]
			}
			let w = {
				id: 'w',
				imgs: 'wrinkler.png',
				order: 1.5,
				scope: 'left',
				leftSection: Crumbs.getCanvasByScope('left').canvas.parentNode,
				anchor: 'top',
				offsetY: -10,
				noDraw: true,
				rad: obj.rad??0,
				dist: obj.dist??1,
				sucked: 0,
				children: wc,
				components: [
					new Crumbs.component.pointerInteractive({ boundingType: 'oval', onRelease: decay.onWrinklerClick })
				],
				init: decay.wrinklersInit,
				behaviors: [new Crumbs.behaviorInstance(decay.wrinklerMovement),
							new Crumbs.behaviorInstance(decay.wrinklerAI),
							new Crumbs.behaviorInstance(decay.wrinklerStats),
							new Crumbs.behaviorInstance(decay.wrinklerParticles)],
				hp: 5,
				hpMax: 5, 
				hurt: 0, //works a bit differently, and actually decreases by 1 every frame until 0
				size: 1,
				speedMult: 1,
                explosionProgress: 0, //number between 0 and 1, upon reaching 1, explode
				shiny: false,
				leading: false,
				bomber: false,
				armored: false,
				phantom: false
			}
			w.hpMax = decay.wrinklerHPFromSize(w.size);
			w.hp = w.hpMax;
			for (let i in obj) { w[i] = obj[i]; }
			decay.wrinklersN++;
			const r = Crumbs.spawn(w);
			if (!r) { return; }
			decay.times.sinceWrinklerSpawn = 0;
			decay.reinitWrinkler(r);
			return r;
		}
		decay.spawnWrinklerLead = function() {
			if (!decay.unlocked || decay.wrinklersN >= 72) { return; }
			let obj = {};
			const rand = Math.random() * 100;
			obj.size = randomFloor(Math.pow(Math.max(Game.log10Cookies * (1 + Math.random() * 0.5) - 18, 0), 0.5));
			if (rand > 90) { obj.size++; }
			if (rand > 60) { obj.size++; } 
			if (rand > 25 && Game.log10Cookies > 12) { obj.size++; }
			if (obj.size > 1 && Game.Has('Elder spice') && Math.random() < 0.07) { obj.size--; } 
			obj.rad = Math.random() * Math.PI * 2;
			obj.speedMult = Math.random() * 0.4 + 0.8;
			for (let i = 0; i < Math.floor(Math.random() * (Math.sqrt(Game.log10Cookies))); i++) {
				let pool = [];
				if (!obj.shiny && Math.random() < 0.1 && Game.cookiesEarned > decay.featureUnlockThresholds.shiny) { pool.push('shiny'); }
				if (!obj.bomber && Math.random() < 0.01 && Game.cookiesEarned > decay.featureUnlockThresholds.bomberNat) { pool.push('bomber'); }
				if (!obj.armored && Math.random() < 0.03 && Game.cookiesEarned > decay.featureUnlockThresholds.armored) { pool.push('armored'); }
				if (!obj.phantom && Math.random() < 0.04 && Game.cookiesEarned > decay.featureUnlockThresholds.phantom) { pool.push('phantom'); }
				if (!obj.leading && Math.random() < 0.01 && Game.cookiesEarned > decay.featureUnlockThresholds.leading) { pool.push('leading'); }
				if (pool.length) { obj[choose(pool)] = true; }
			}
			return decay.spawnWrinkler(obj); 
		};
		decay.wSoulMovement = new Crumbs.behavior(function(p) {
			if (!this.grabbed) { this.y -= p.dy; }
			if (this.grabbed) {
				if (!this.getComponent('pointerInteractive').click) { this.grabbed = false; }
				p.dx += (Math.min(Game.mouseX, this.leftSection.offsetWidth) - this.x) * 0.2;
				p.dx *= 0.9;
				p.dy += (this.y - Game.mouseY) * 0.2;
				p.dy *= 0.9;
				this.x = Math.min(Game.mouseX, this.leftSection.offsetWidth);
				this.y = Game.mouseY;
				this.lastGrab = Crumbs.t;
			} else {
				p.dy += p.ddy;
				p.dx += ((this.x < Game.cookieOriginX)?-1:1) * 10 / Math.sqrt((this.x - Game.cookieOriginX)**2 + (this.y - Game.cookieOriginY)**2 + 1) * (this.shiny?3:1);
				this.x += p.dx;
				p.dx *= 1 - (0.01);
				p.dy *= 1 - (0.01);
			}
			this.dxExport = p.dx; 
			this.dyExport = p.dy; //spagetti code go br
			if (this.y < -50) { this.die(); }
		}, { dy: 0, dx: 0, ddy: 10 / Game.fps });
		decay.wSoulClaim = new Crumbs.behavior(function() {
			if ((this.x - Game.cookieOriginX)**2 + (this.y - Game.cookieOriginY)**2 < 4096) { this.inAura += 1 + (this.dxExport*this.dxExport + this.dyExport*this.dyExport)*0.1; } 
			else if (this.inAura == 0 || this.dxExport + this.dyExport < 20) { this.inAura = 0; }
			else { this.inAura = 1000; }
			this.alpha = 1 - this.inAura / (2 * Game.fps)
			if (this.inAura > 2 * Game.fps) { decay.onWSoulClaim(this); this.die(); }
		});
		decay.wrinklerSoulShine1 = {
			order: 9,
			alpha: 0.5,
			imgs: ['img/shine.png', 'img/shineGold.png'],
			scaleX: 0.625,
			scaleY: 0.625,
			init: function() { if (this.parent.shiny) { this.imgUsing = 1; this.components.push(new Crumbs.component.settings({ globalCompositeOperation: 'lighter' })); } },
			behaviors: [
				new Crumbs.behaviorInstance(Crumbs.objectBehaviors.spin, { spin: 0.05 }),
				function() { this.alpha = this.parent.alpha * 0.5; }
			]
		};
		decay.wrinklerSoulShine2 = {
			order: 8.8,
			alpha: 0.25,
			imgs: ['img/shine.png', 'img/shineGold.png'],
			scaleX: 0.65,
			scaleY: 0.65,
			init: function() { if (this.parent.shiny) { this.imgUsing = 1; this.components.push(new Crumbs.component.settings({ globalCompositeOperation: 'lighter' })); } },
			behaviors: [
				new Crumbs.behaviorInstance(Crumbs.objectBehaviors.spin, { spin: -0.05 }),
				function() { this.alpha = this.parent.alpha * 0.25; }
			]
		};
		decay.spawnWrinklerSoul = function(x, y, shiny, ddy, dx) {
			let s = {
				id: 's',
				scope: 'left',
				x: x,
				y: y,
				scaleX: shiny?0.9:1.3,
				scaleY: shiny?0.9:1.3,
				leftSection: Crumbs.getCanvasByScope('left').canvas.parentNode,
				imgs: shiny?kaizoCookies.images.shinySoul:kaizoCookies.images.wrinklerSoul,
				order: 10,
				components: [new Crumbs.component.pointerInteractive({ boundingType: 'oval', onClick: function() { this.grabbed = true; }, onRelease: function() { this.grabbed = false; } })],
				behaviors: [
					new Crumbs.behaviorInstance(decay.wSoulMovement, { ddy: ddy * (shiny?1.5:1), dx: dx * (shiny?1.5:1) }),
					new Crumbs.behaviorInstance(decay.wSoulClaim)
				],
				children: [decay.wrinklerSoulShine1],
				shiny: shiny,
				grabbed: false,
				inAura: 0,
				lastGrab: Crumbs.t - 150
			};
			if (Game.prefs.fancy) { s.children.push(decay.wrinklerSoulShine2); }
			Crumbs.spawn(s);
		}
		decay.halts['wSoul'] = new decay.haltChannel({
			keep: 0.7,
			overtimeLimit: 4,
			overtimeEfficiency: 0.9,
			power: 1,
			factor: 0.6
		});
		decay.halts['wSoulShiny'] = new decay.haltChannel({
			keep: 0.7,
			overtimeLimit: 6,
			overtimeEfficiency: 1,
			power: 1,
			factor: 0.5
		});
		decay.onWSoulClaim = function(me) {
			decay.stop(3 * (me.shiny?2:1), (me.shiny?'wSoulShiny':'wSoul')); 
			decay.gainPower(15 * ((me.shiny)?3:1));
			if (me.shiny) { 
				const toEarn = Math.min(Game.cookies * 0.1, Game.cookiesPs * 1800);
				Game.Earn(toEarn);
				Game.Popup('<div style="font-size: 80%;">' + loc('+%1!', loc('%1 cookie', Beautify(toEarn))) + '</div>', me.x, me.y);
			}
		}
		decay.wrinklerQueues = []; //each item is an object containing 0 corresponding to key "t", and another array containing objects for spawning with key "w"
		//"w" array: contains object with: id, type, t (time to wait until this spawn)
		decay.spawnFollowerWrinkler = function(type, origin, distribution, wait) {
			//"distribution" is number describing the id deviation from the wrinklerLead; deviation is described by a curve, chance to land described by integrals (except that I dont need to do integrals which thank god)
			//distribution must be number between 0 and 1; the larger it is, the more spread out wrinklers are
			var m = Game.getWrinklersMax();
			if (!origin) {
				//spawn a wrinkler literally anywhere at uniformly same chance
				origin = 0;
				distribution = 1;
			} 
			var l = [];
			for (let i = 0; i < m; i++) {
				l.push(1);
			}
			var apply = 1;
			for (let i = origin; i != (origin + Math.ceil(m/2)) % m; i++) {
				if (i >= m) { i = i % m; }
				l[i] *= apply;
				apply *= 1 - Math.pow(1 - distribution, 1 / Math.sqrt(1 + cyclicDist(i, origin, m)));
			}
			apply = 1;
			for (let i = origin; i != (origin + Math.ceil(m/2)) % m; i--) {
				if (i <= 0) { i += m; }
				l[i] *= apply;
				apply *= 1 - Math.pow(1 - distribution, 1 / Math.sqrt(1 + cyclicDist(origin, i, m)));
			}
			var at = 0;
			for (let i in l) {
				at += l[i];
			}
			at *= Math.random();
			for (let i in l) {
				at -= l[i];
				if (at <= 0) { at = i; break; }
			}
			
			return {id: at, type: type, t: wait}; 
		}
		decay.updateWrinklers = function() {
			if (Math.random() < decay.wrinklerSpawnRate / (Math.sqrt(decay.wrinklersN) + 1)) {
				if ((Math.random() < 1 - 1 / Math.pow(-(decay.times.sinceWrinklerSpawn / Game.fps) * Math.log10(decay.gen) + 1, 0.15)) || (decay.gen >= 1 && Math.random() < 1 - 1 / Math.pow((decay.times.sinceWrinklerSpawn / Game.fps) + 1, 0.075)) || Math.random() < 0.15) {
					decay.spawnWrinklerLead();
				} 
			}
		};
		addLoc('-%1!');
		addLoc('You lost <b>%1</b>!');
		decay.onWrinklerSuckedPop = function(me) {
			decay.triggerNotif('wrinkler');
			if (me.shiny) { decay.triggerNotif('shinyWrinkler'); }
		}
		decay.onWrinklerPop = function(me) {
			decay.spawnWrinklerSoul(me.x, me.y, me.shiny, (5 * (me.shiny?0.5:1)) / Game.fps, (Math.random() - 0.5) * 6);
		}
		replaceDesc('Wrinkler doormat', 'Wrinklers no longer spawn.<q>Quite possibly the cleanest doormat one will ever see.</q>');
		replaceDesc('Unholy bait', 'Wrinklers have <b>10%</b> less health.<q>A nice snack to distract them during the OBLITERATION.</q>');
		replaceDesc('Wrinklerspawn', 'Wrinklers are <b>10%</b> slower.<q>Really, it just makes the big cookie seem more crowded than it actually is.</q>');
		replaceDesc('Sacrilegious corruption', 'Wrinklers lose <b>20%</b> less cookies on pop.<q>Ah yes, mankind\'s best friend: words.</q>');
		replaceDesc('Elder spice', 'Each wrinkler has a <b>7%</b> chance to start with <b>1</b> less layer.<q>What a lovely smell!</q>');
		eval('Game.UpdateWrinklers='+Game.UpdateWrinklers.toString().replace('var xBase=0;', 'decay.updateWrinklers(); return;'));
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace('var suckRate=1/20;', 'var suckRate=1/2; sucking = decay.compileSucking();').replace('Game.cpsSucked=Math.min(1,sucking*suckRate);', 'Game.cpsSucked=1 - Math.min(1,Math.pow(suckRate, sucking)); Game.cpsSucked *= (1 - Math.min(Game.auraMult("Dragon Guts"), 1));'));
		Game.registerHook('cookiesPerClick', function(val) { return val * (1 - Game.cpsSucked); }); //withering affects clicking
		Game.getWrinklersMax = function() {
			return 2;
		}
		Game.Objects['Grandma'].sellFunction = function() { Game.Win('Just wrong'); }
		addLoc('First Chance to Suffer');
		addLoc('Burst the especially insufferable <b>shiny wrinkler</b>.<q>What a good citizen!</q>');
		Game.Achievements['Last Chance to See'].dname = loc('First Chance to Suffer'); 
		Game.Achievements["Last Chance to See"].name= loc('First Chance to Suffer');
		replaceAchievDesc('Last Chance to See', loc('Burst the especially insufferable <b>shiny wrinkler</b>.<q>What a good citizen!</q>'));
		Game.Achievements["Last Chance to See"].pool = "normal";
		Game.Achievements["Last Chance to See"].order = 21000.262;
		eval('Game.WriteSave='+Game.WriteSave.toString().replace('Math.floor(wrinklers.number)', '0'));
		decay.removeAllWrinklers = function() {
			let wrinklers = Crumbs.getObjects('w');
			for (let i in wrinklers) {
				wrinklers[i].die();
			}
		}
		Game.registerHook('reset', decay.removeAllWrinklers);
		eval('Game.Ascend='+Game.Ascend.toString().replace('Game.Notify', 'decay.removeAllWrinklers(); Game.Notify'));
		Game.saveAllWrinklers = function() {
			let str = '';
			let wrinklers = Crumbs.getObjects('w');
			for (let i in wrinklers) {
				const me = wrinklers[i];
				let str2 = me.dist + '_' + me.rad + '_' + me.sucked.toFixed(8) + '_' + me.size + '_' + me.explosionProgress + '_' + me.speedMult + '_' + me.hp + '_';
				if (me.shiny) { str2 += 's'; }
				if (me.leading) { str2 += 'l'; }
				if (me.bomber) { str2 += 'b'; }
				if (me.armored) { str2 += 'a'; }
				if (me.phantom) { str2 += 'p'; }
				str += str2;
				str += ',';
			}
			if (str) { str = str.slice(0, str.length - 1); }
			return str;
		}
		Game.loadAllWrinklers = function(str) {
			if (!str) { return; }
			let arr = str.split(',');
			loop:
			for (let i in arr) {
				let param = arr[i].split('_');
				for (let ii = 0; ii < param.length - 1; ii++) {
					if (isv(param[ii])) { param[ii] = parseFloat(param[ii]); } else { continue loop; break; }
				}
				let obj = {
					dist: param[0],
					rad: param[1],
					sucked: param[2],
					size: param[3],
					explosionProgress: param[4],
					speedMult: param[5],
					hp: param[6]
				};
				if (param[7].includes('s')) { obj.shiny = true; }
				if (param[7].includes('l')) { obj.leading = true; }
				if (param[7].includes('b')) { obj.bomber = true; }
				if (param[7].includes('a')) { obj.armored = true; }
				if (param[7].includes('p')) { obj.phantom = true; }
				let me = decay.spawnWrinkler(obj);
			}
		}
		
		decay.getBuffLoss = function() {
			if (Game.auraMult('Epoch Manipulator')) {
				if (decay.gen > 1) {
					return 1 - Game.auraMult('Epoch Manipulator') * 0.5 * (2 - 1 / decay.gen);
				} else {
					return 1 / Math.pow(decay.gen, decay.buffDurPow);
				}
			} else {
				return 1 / Math.pow(Math.min(1, decay.gen), decay.buffDurPow);
			}
		}
		eval('Game.updateBuffs='+Game.updateBuffs.toString().replace('buff.time--;','if (!decay.exemptBuffs.includes(buff.type.name)) { buff.time -= decay.getBuffLoss(); } else { buff.time--; }'));

		//have to put this outside otherwise it doesnt work (??????????)
		decay.cpsPurityMults = function() {
			//all the upgrades that do "+X% Cps for every x2 CpS multiplier from your purity"
			if (decay.gen <= 1) { decay.extraPurityCps = 1; decay.hasExtraPurityCps = false; return 1; }
			const purityLog = Math.log2(decay.gen);
			const l5 = Math.pow(1.05, purityLog);
			const l10 = Math.pow(1.1, purityLog);
			const l15 = Math.pow(1.15, purityLog);
			var total = 1;
			if (Game.Has('Market manipulator')) { total *= l5; }
			if (decay.challengeStatus('halt1')) { total *= l10; }
			if (decay.challengeStatus('purity1')) { total *= l10; }
			if (decay.challengeStatus('reindeer')) { total *= l15; }
			if (decay.challengeStatus('rotated')) { total *= l10; }
			if (decay.challengeStatus('reversedAcc')) { total *= l15; }
			total *= Math.pow(1 + decay.challengeStatus('bakeR') * 0.05, purityLog);
			total *= Math.pow(1 + decay.challengeStatus('typingR') * 0.05, purityLog);
			total *= Math.pow(1 + decay.challengeStatus('allBuffStackR') * 0.05, purityLog);

			decay.extraPurityCps = total;
			if (total > 1) { decay.hasExtraPurityCps = true; } else { decay.hasExtraPurityCps = false; }
			return total;
		}

		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace('Game.globalCpsMult=mult;', 'Game.globalCpsMult*=mult;').replace(`if (Game.Has('Occult obstruction')) mult*=0;`, `if (Game.Has('Occult obstruction')) { mult*=0; } Game.globalCpsMult = 1;`));

		allValues('decay effects');

		/*=====================================================================================
        Purification
        =======================================================================================*/
		
		//ways to purify/refresh/stop decay
		eval('Game.shimmer.prototype.pop='+Game.shimmer.prototype.pop.toString().replace('Game.Click=0;', 'Game.Click=0; decay.purifyFromShimmer(this);'));
		decay.purifyFromShimmer = function(obj) {
			if (obj.type == 'reindeer') {
				if (decay.isConditional('reindeer')) { decay.amplifyAll(5, 20); } else if (obj.noPurity) { decay.amplifyAll(10, 0); Game.Notify('LOL', '', [12, 8]); } else { decay.purifyAll(2, 0.2, 2.5); decay.triggerNotif('reindeer'); }
				return;
			} 
			if (obj.type == 'a mistake') {
				decay.purifyAll(2, 0.5, 3.5);
				return;
			}
			var strength = 3;
			if (decay.challengeStatus('noGC1')) { strength *= 1.15; }
			if (obj.wrath && obj.wrathTrapBoosted) { strength *= 1.5; }
			if (obj.spawnLead) {
				decay.purifyAll(strength, 1 - Math.pow(0.7, strength), 5); decay.stop(1, 'wSoulShiny');
			} else if (obj.force == 'cookie storm drop') {
				decay.purifyAll(Math.pow(strength, 0.01), 0.0001, 2); decay.stop(0.6, 'wSoulShiny'); decay.triggerNotif('stormDrop');
			} else if (obj.force == '') {
				decay.purifyAll(strength, 1 - Math.pow(0.99, strength), 2); decay.triggerNotif("pesudonat");
			}
		}
		decay.clickBCStop = function() {
			let base = decay.clickHaltBaseTime;
			for (let i in decay.offBrandFingers) {
				if (decay.offBrandFingers[i].bought) { base *= 1.05; }
			}
			if (Game.Has('Touch of nature') && Math.random()<0.01) { decay.purifyAll(1.05, 0, 100); }
			base *= 1 + Math.log10(1 / Math.min((Game.cookiesEarned + 1) / 1e24, 1)) / 36;
			if (decay.exhaustion > 0) { base *= 1 - Math.min(decay.times.sinceLastExhaustion / (Game.fps * 5), 1); }
			if (decay.covenantStatus('click')) { base /= 2; }
			decay.stop(base, 'click');

			if (decay.exhaustion > 0) { return; }

			let workBase = decay.clickWork;
			if (decay.gen < 0.01) { workBase *= 0.31622776601683794; } //equivalent to the below expression evaluated at 0.01
			else if (decay.gen < 1) { workBase *= Math.pow(decay.gen, 0.25); }
			else {
				workBase *= Math.pow(decay.gen, 0.4);
			}
			workBase *= decay.workProgressMult;
			decay.work(workBase);
		}
		Game.registerHook('click', decay.clickBCStop);
		decay.onWrinklerIntercept = function(me) {
		}
		eval('Game.Logic='+Game.Logic.toString().replace(`//if (Game.BigCookieState==2 && !Game.promptOn && Game.Scroll!=0) Game.ClickCookie();`, `if (decay.prefs.scrollClick && Game.Scroll!=0 && Game.BigCookieState==2 && !Game.promptOn && Date.now()-Game.lastClick >= 105) { Game.ClickCookie(); }`).replace(`Beautify(Game.prestige)]);`, `Beautify(decay.getCpSBoostFromPrestige())]);`));
		eval('Game.UpdateWrinklers='+Game.UpdateWrinklers.toString().replace(`Game.wrinklersPopped++;`, `Game.wrinklersPopped++; decay.onWrinklerIntercept(me) `));
		decay.reincarnateBoost = function() {
			decay.unlocked = false;
			decay.momentumUnlocked = false;
			decay.bankedAcceleration = 0;
			decay.acceleration = 1;
			if (Game.ascensionMode == 42069) {
				decay.acceleration = decay.startingAcc;
			}
			if (Game.Has('Legacy')) { decay.triggerNotif('breakingPoint'); }
			decay.assignThreshold();
			decay.checkChallengeUnlocks();
			decay.multList = [];
			decay.wrinklerSpawnRate = decay.setWrinklerSpawnRate();

			for (let i in decay.seFrees) { decay.seFrees[i] = 0; } 
			
			decay.stop(5);
			decay.refreshAll(1);

			decay.recalcAccStats();

			decay.performConditionalInits();
		}
		Game.registerHook('reincarnate', decay.reincarnateBoost);
		Game.registerHook('reset', decay.reincarnateBoost);
		addLoc('Decay propagation rate -%1% for %2!');
		new Game.buffType('creation storm', function(time, pow) {
			return {
				name: 'Storm of creation',
				desc: loc('Decay propagation rate -%1% for %2!', [pow * 100, Game.sayTime(time*Game.fps,-1)]),
				icon: [30, 5],
				time: time*Game.fps,
				add: false,
				max: true,
				aura: 1
			}
		});

		//breaking point
		replaceDesc('Legacy', "This is the first heavenly upgrade; it unlocks the <b>Heavenly chips</b> system.<div class=\"line\"></div>Each time you ascend, the cookies you made in your past life are turned into <b>heavenly chips</b> and <b>prestige</b>.<div class=\"line\"></div><b>Heavenly chips</b> can be spent on a variety of permanent transcendental upgrades.<div class=\"line\"></div>Your <b>prestige level</b> also gives you a permanent <b>+1% CpS</b> per level.<div class=\"line\"></div>In exchange for unlocking the power of the heavenly chips, your decay will inherit some of its overflowing power, and will gain a <b>massive boost</b> with more than <b>-99.99%</b> decay.<div class=\"line\"></div>In addition, decay will require <b>2x</b> more halting power to be stopped completely upon reaching that breaking point, and accumulating decay past that point will further increase its power.<q>We've all been waiting for you. And some more.</q>");
		Game.Upgrades['Legacy'].icon = [7, 3, kaizoCookies.images.custImg];
		decay.minimumPrestigeAmountToAscend = 365;
		decay.eligibleForAscend = function() {
			if (Game.resets >= 1) { return true; }
			let chips = Math.pow(Game.cookiesEarned / Game.firstHC, Game.HCfactor);
			return (chips > decay.minimumPrestigeAmountToAscend);
		}
		addLoc('You cannot ascend right now, as you have not yet earned enough cookies. <br>Ascending for the first time requires a minimum of <b>%1</b> heavenly chips.');
		decay.cannotAscendPrompt = function() {
			Game.Prompt('<id Ascend><h3>'+loc("Ascend")+'</h3><div class="block">'+loc('You cannot ascend right now, as you have not yet earned enough cookies. <br>Ascending for the first time requires a minimum of <b>%1</b> heavenly chips.', decay.minimumPrestigeAmountToAscend)+'</div>',[[loc("Ok"),'Game.ClosePrompt();','']]);
		}
		decay.ascendIn = 0;
		addLoc('Ascending cancelled!');
		eval('Game.Ascend='+Game.Ascend.toString()
			 .replace('if', 'if (!decay.eligibleForAscend()) { decay.cannotAscendPrompt(); } else if')
			 .replace('Game.Notify', 'decay.ascendIn = 0; Game.Notify')
			);

		//purification: elder pledge & elder covenant
		this.changePledge = function () {
			Game.UpgradesById[64].basePrice /= 1000000;
			Game.UpgradesById[65].basePrice /= 1000000;
			Game.UpgradesById[66].basePrice /= (1000000 / 4);
			Game.UpgradesById[67].basePrice /= (1000000 / 16);
			Game.UpgradesById[68].basePrice /= (1000000 / 64);
			Game.UpgradesById[69].basePrice /= (1000000 / 256);
			Game.UpgradesById[70].basePrice /= (1000000 / 1024);
			Game.UpgradesById[71].basePrice /= (1000000 / 4096);
			Game.UpgradesById[72].basePrice /= (1000000 / 16384);
			Game.UpgradesById[73].basePrice /= (1000000 / 65536);
			Game.UpgradesById[87].basePrice *= 1000000;
			Game.registerHook('check', function () {
				if (Game.Objects['Grandma'].amount >= 25) { Game.Unlock('Bingo center/Research facility'); }
			});
			Game.elderWrath = 0;
			eval('Game.SetResearch=' + Game.SetResearch.toString().replace(`if (Game.Has('Persistent memory')) Game.researchT=Math.ceil(Game.baseResearchTime/10);`, `if (Game.Has('Persistent memory')) { Game.researchT=Math.ceil(Game.baseResearchTime/2); } if (decay.challengeStatus('pledge')) { Game.researchT /= 2; }`));
			replaceDesc('Persistent memory', 'Subsequent research will be <b>twice</b> as fast.<q>It\'s all making sense!<br>Again!</q>');
			replaceDesc('One mind', 'Each grandma gains <b>+0.0<span></span>2 base CpS per grandma</b>.<br>Also unlocks the <b>Elder Pledge</b>, which slowly purifies the decay for some cookies.<q>Repels the ancient evil with industrial magic.</q>');
			Game.Upgrades['One mind'].buyFunction = function () { Game.SetResearch('Exotic nuts'); Game.storeToRefresh = 1; }
			replaceDesc('Exotic nuts', 'Cookie production multiplier <b>+4%</b>, and reduces the Elder Pledge cooldown by <b>15 seconds</b>.<q>You\'ll go crazy over these!</q>');
			replaceDesc('Communal brainsweep', 'Each grandma gains another <b>+0.0<span></span>2 base CpS per grandma</b>, and makes the Elder Pledge purify for <b>10% as much time</b>.<q>Burns the corruption with the worker\'s might.</q>');
			Game.Upgrades['Communal brainsweep'].buyFunction = function () { Game.SetResearch('Arcane sugar'); Game.storeToRefresh = 1; }
			replaceDesc('Arcane sugar', 'Cookie production multiplier <b>+5%</b>, and reduces the Elder Pledge cooldown by <b>15 seconds</b>.<q>Tastes like insects, ligaments, and molasses.</q>');
			replaceDesc('Elder Pact', 'Each grandma gains <b>+0.0<span></span>5 base CpS per portal</b>, and makes the Elder Pledge <b>10%</b> more powerful.<q>Questionably unethical.</q>');
			Game.Upgrades['Elder Pact'].buyFunction = function () { decay.covenantModes.off.upgrade.bought = 0; Game.storeToRefresh = 1; }
			replaceDesc('Sacrificial rolling pins', 'The Elder Pledge is <b>10 times</b> cheaper.<q>As its name suggests, it suffers so that everyone can live tomorrow.</q>');
			Game.Upgrades['One mind'].clickFunction = function () { return true; };
			Game.Upgrades['Elder Pact'].clickFunction = function () { return true; };
			replaceDesc('Elder Pledge', 'Purifies the decay, at least for a short while.<br>Price also scales with highest raw CpS this ascend.<q>In exchange for a less sharp price scaling formula, it is now price-capped at 100 uses.</q>');
			decay.halts['pledge'] = new decay.haltChannel({
				keep: 10,
				overtimeLimit: 100,
				overtimeEfficiency: 0.05,
				power: 0.5,
			});
			Game.Upgrades['Elder Pledge'].buyFunction = function () {
				Game.pledges++;
				Game.pledgeT = Game.getPledgeDuration();
				decay.stop(3 + 6 * Game.Has('Uranium rolling pins'), 'pledge');
				Game.storeToRefresh = 1;
			}
			Game.Upgrades['Elder Pledge'].priceFunc = function () {
				return Game.cookiesPsRawHighest * 10 * Math.pow(Math.min(Game.pledges, 100), 3) * (Game.Has('Sacrificial rolling pins') ? 0.1 : 1);
			}
			Game.Upgrades['Elder Pledge'].icon.push('img/icons.png');
			Game.Upgrades['Elder Pledge'].displayFuncWhenOwned = function () {
				if (Game.pledgeT > 0) {
					return '<div style="text-align:center;">' + loc("Time remaining until pledge runs out:") + '<br><b>' + Game.sayTime(Game.pledgeT, -1) + '</b></div>';
				} else {
					return '<div style="text-align:center;">' + loc("Elder Pledge will be usable again in:") + '<br><b>' + Game.sayTime(Game.pledgeC, -1) + '</b></div>';
				}
			}
			Game.Upgrades['Elder Pledge'].timerDisplay = function () {
				if (!Game.Upgrades['Elder Pledge'].bought) {
					return -1;
				} else if (Game.pledgeT > 0) {
					return 1 - Game.pledgeT / Game.getPledgeDuration();
				} else {
					return 1 - Game.pledgeC / Game.getPledgeCooldown();
				}
			}
			Game.getPledgeDuration = function () {
				var dur = Game.fps * 30;
				if (Game.Has('Communal brainsweep')) {
					dur *= 1.1;
				}
				return dur;
			}
			Game.getPledgeStrength = function () {
				var str = 0.18;
				if (Game.Has('Elder Pact')) { str *= 1.1; }
				if (Game.Has('Unshackled Elder Pledge')) { str *= 1.25; }
				var cap = 9;
				if (Game.Has('Elder Pact')) { cap *= 1.1; }
				return [1 + (str / Game.fps), 0.5 / (Game.getPledgeDuration() * cap), cap];
			}
			Game.getPledgeCooldown = function () {
				var c = Game.fps * 5 * 60;
				if (Game.Has('Exotic nuts')) { c -= 15 * Game.fps; }
				if (Game.Has('Arcane sugar')) { c -= 15 * Game.fps; }

				if (Game.Has('Unshackled Elder Pledge')) { c *= 0.75; }
				return c;
			}
			Game.pledgeC = 0;
		};

		addLoc('Elder Covenant');
		decay.covenantModes = {};
		decay.covenantSwitchOrder = ['off', 'wrathBan', 'wrathTrap', 'click', 'aura', 'frenzyStack', 'dragonStack'];
		decay.covenantMode = function(name, dname, desc, unlockCondition) {
			addLoc(dname);
			addLoc(desc);
			this.name = name;
			this.dname = dname;
			this.upgrade = new Game.Upgrade('Elder Covenant'+' ['+name+']', desc, 0, [8, 9]);
			this.upgrade.order = 15001;
			this.upgrade.pool = 'toggle';
			this.upgrade.dname = loc('Elder Covenant') + ' [' + loc(dname) + ']';
			this.upgrade.buyFunction = function(n) { return function() { decay.chooseNextMode(n); } }(this.name); //wtf
			this.upgrade.bought = 1;
			this.upgrade.unlocked = 1;
			this.unlocked = false;
			this.unlockCondition = unlockCondition;

			decay.covenantModes[this.name] = this;
		}
		decay.nextMode = null;
		decay.chooseNextMode = function(currentMode) {
			let pos = decay.covenantSwitchOrder.indexOf(currentMode);
			while(true) {
				pos++;
				if (pos >= decay.covenantSwitchOrder.length) { pos = 0; }
				if (decay.covenantModes[decay.covenantSwitchOrder[pos]].unlocked) { decay.nextMode = decay.covenantSwitchOrder[pos]; break; }
			}
			decay.nextModeIn = decay.modeSwitchTime; 
			Game.Upgrades['Elder Covenant [switching]'].earn();
		}
		addLoc('Covenant mode switched!');
		addLoc('Your covenant mode is now: ');
		decay.updateCovenant = function() {
			if (decay.nextMode) {
				decay.nextModeIn--;
				if (decay.nextModeIn <= 0) { Game.Lock('Elder Covenant [switching]'); Game.Lock(decay.covenantModes[decay.nextMode].upgrade.name); Game.Unlock(decay.covenantModes[decay.nextMode].upgrade.name); Game.Notify(loc('Covenant mode switched!'), loc('Your covenant mode is now: ')+'<b>'+loc(decay.covenantModes[decay.nextMode].upgrade.dname)+'</b>', [8, 9]); decay.nextMode = null; } 
			}
		}
		decay.modeSwitchTime = 2 * Game.fps;
		decay.nextModeIn = 0;
		let switchingCovenant = new Game.Upgrade('Elder Covenant [switching]', 'The Elder Covenant is preparing to switch modes...', 0, [8, 9]);
		switchingCovenant.order = 15001;
		switchingCovenant.pool = 'toggle';
		switchingCovenant.timerDisplay = function() { return 1 - decay.nextModeIn/decay.modeSwitchTime; };
		addLoc('Time remaining until next mode:');
		switchingCovenant.displayFuncWhenOwned = function() { return '<div style="text-align:center;">'+loc("Time remaining until next mode:")+'<br><b>'+Game.sayTime(decay.nextModeIn,-1)+'</b></div>'; }
		decay.checkCovenantModeUnlocks = function() {
			for (let i in decay.covenantModes) {
				decay.covenantModes[i].unlocked = decay.covenantModes[i].unlockCondition();
			}
		}
		Game.registerHook('check', decay.checkCovenantModeUnlocks);
		Game.registerHook('reset', decay.checkCovenantModeUnlocks);
		decay.covenantStatus = function(mode) {
			return (!decay.covenantModes[mode].upgrade.bought);
		}
		decay.getCurrentCovenantMode = function() {
			for (let i in decay.covenantModes) {
				if (!decay.covenantModes[i].upgrade.bought) { return i; }
			}
			return 'NA'; //"N/A" breaks the save so we are getting rid of that slash
		} 
		decay.trueFunc = function() { return true; };
		decay.createCovenantModes = function() {
			new decay.covenantMode('off', 'off', 'Switches between different modes, each one giving an unique bonus with an unique drawback.', decay.trueFunc);
			new decay.covenantMode('wrathBan', 'calm', 'Wrath cookies no longer replace Golden cookies with decay, at the cost of the decay propagating <b>5%</b> faster.<q>Blocks an outlet for decay, which naturally, causes it to spread faster due to an increased concentration.</q>', decay.trueFunc);
			new decay.covenantMode('wrathTrap', 'pure anger', 'Wrath cookies always replace Golden cookies, lasts <b>2 seconds</b>, and give a strong negative effect on natural expiration, but wrath cookies purification is <b>50%</b> stronger.<q>Presenting itself as a helping hand to the force of decay, it wedges itself into the enraged antithesis to golden cookies and amplifies its ability to repel negativity.</q>', decay.trueFunc);
			eval('Game.shimmerTypes.golden.missFunc='+Game.shimmerTypes.golden.missFunc.toString().replace('Game.missedGoldenClicks++;', `{ Game.missedGoldenClicks++; } if (me.wrathTrapBoosted && me.wrath && me.force == "") { Game.gainBuff("smited", 44, 0.2); Game.Popup('<div style="font-size:80%;">'+loc('Wrath cookie disappeared, cookie smited!')+'</div>', me.x, me.y); }`));
			addLoc('Cookie production -%1 for %2!');
			addLoc('Wrath cookie disappeared, cookie smited!');
				new Game.buffType('smited', function(time, pow) {
				return {
					name: 'Smited',
					desc: loc('Cookie production -%1 for %2!', [((1 - pow) * 100)+'%', Game.sayTime(time, -1)]),
					icon: [15, 5],
					time: time * Game.fps,
					add: true,
					multCpS: pow,
					aura: 2
				}
			});
			//new decay.covenantMode('energyConservation', 'conservative', 'Fatigue buildup <b>-25%</b>, but decay halting from clicks lasts <b>half</b> as long.<q>Clicks softened with mattresses aplenty, it remedies fatigue at the cost of damaging its effectiveness.</q>', function() { return Game.cookiesEarned >= decay.featureUnlockThresholds.fatigue; });
			new decay.covenantMode('click', 'boosted clicks', 'Click power <b>+25%</b>, but decay halting from clicks lasts <b>half</b> as long.<q>Redirects your focus to the cookie-making ability of your clicks, with the side effect of decreasing its decay halting ability.</q>', decay.trueFunc);
			new decay.covenantMode('aura', 'draconic imbalance', 'The aura slot on the right is <b>50%</b> more powerful, but the aura slot on the left is <b>50%</b> less powerful.<q>As the prophecy foretold, one wing is always lighter than the other.</q>', function() { return (Game.dragonLevel >= 27); });
			Game.registerHook('cookiesPerClick', function(m) { if (decay.covenantStatus('click')) { m *= 1.25; } return m; });
			new decay.covenantMode('frenzyStack', 'frenzied', 'If a golden cookies spawned with this covenant mode gives Frenzy while a Frenzy is already ongoing, it will halves its duration and increase the strength of the ongoing Frenzy by <b>25%</b>, for up to <b>+400%</b> strength.<q>It\'s time to party!</q>', function() { return decay.challengeStatus('buffStack'); });
			new decay.covenantMode('dragonStack', 'plentiful harvests', 'If a golden cookies spawned with this covenant mode gives Dragon Harvest while a Dragon Harvest is already ongoing, it will halves its duration and increase the strength of the ongoing Dragon Harvest by <b>+150%</b>, for up to <b>+250%</b> strength.', function() { return decay.challengeStatus('combo6'); });
			addLoc('Frenzy strengthened!'); addLoc('Dragon Harvest strengthened!');
			addLoc('Frenzy strength maximum reached!'); addLoc('Dragon Harvest strength maximum reached!');
			addLoc('%1x CpS multiplier');
			addLoc('-%1 Frenzy duration!'); addLoc('-%1 Dragon Harvest duration!');
			eval('Game.shimmerTypes.golden.popFunc='+Game.shimmerTypes.golden.popFunc.toString()
				 .replace(`buff=Game.gainBuff('frenzy',Math.ceil(77*effectDurMod),7);`, `if (me.canBoostFrenzy && Game.hasBuff('Frenzy')) { let F = Game.hasBuff('Frenzy'); if (F.multCpS >= 7 * 10) { popup=loc('Frenzy strength maximum reached!'); } if (F.multCpS < 7 * 5) { popup=loc("Frenzy strengthened!")+'<br><small>'+loc("+%1!",loc("%1x CpS multiplier", Math.min(7 * 0.25, 7 * 5 - F.multCpS)))+'</small><br><small>'+loc("-%1 Frenzy duration!", Game.sayTime(F.time / 2, -1))+'</small>'; F.multCpS = Math.min(7 * 5, F.multCpS + 0.25 * 7); F.time /= 2; F.time = Math.floor(F.time); } } else { buff=Game.gainBuff('frenzy',Math.ceil(77*effectDurMod),7); }`)
				 .replace(`buff=Game.gainBuff('dragon harvest',Math.ceil(60*effectDurMod),15);`, `if (me.canBoostDH && Game.hasBuff('Dragon Harvest')) { let DH = Game.hasBuff('Dragon Harvest'); let DHBase = (Game.Has('Dragon Fang')?15:17); if (DH.multCpS >= DHBase * 3.5) { popup=loc('Dragon Harvest strength maximum reached!'); } if (DH.multCpS < DHBase * 3.5) { popup=loc("Dragon Harvest strengthened!")+'<br><small>'+loc("+%1!",loc("%1x CpS multiplier", Math.min(DHBase * 1.5, DHBase * 3.5 - DH.multCpS)))+'</small><br><small>'+loc("-%1 Dragon Harvest duration!", Game.sayTime(DH.time / 2, -1))+'</small>'; DH.multCpS = Math.min(DHBase * 3.5, DH.multCpS + DHBase * 1.5); DH.time /= 2; DH.time = Math.floor(DH.time); } } else { buff=Game.gainBuff('dragon harvest',Math.ceil(60*effectDurMod),15); }`)
			);
		}
		decay.createCovenantModes();

		decay.setupCovenant = function() {
			for (let i in decay.covenantModes) {
				decay.covenantModes[i].upgrade.bought = 1;
				decay.covenantModes[i].upgrade.unlocked = 1;
			}
		}
		decay.setupCovenant();
		Game.registerHook('reincarnate', decay.setupCovenant);

		Game.Lock('Elder Covenant');
		Game.Lock('Revoke Elder Covenant');
		
		addLoc('You also gained some extra purity!');
		addLoc('Purification complete!');
		eval('Game.UpdateGrandmapocalypse='+Game.UpdateGrandmapocalypse.toString()
			 .replace('Game.elderWrath=1;', 'if (decay.gen > 1) { Game.Notify(loc("Purification complete!"), loc("You also gained some extra purity!")); } else { Game.Notify(loc("Purification complete!"), ""); }')
			 .replace(`Game.Lock('Elder Pledge');`,'Game.pledgeC = Game.getPledgeCooldown(); Game.pledgeT = 0; Game.Upgrades["Elder Pledge"].icon[0] = 6; Game.Upgrades["Elder Pledge"].icon[1] = 3; Game.Upgrades["Elder Pledge"].icon[2] = kaizoCookies.images.custImg;') //truly a hack of all time
			 .replace(`Game.Unlock('Elder Pledge');`, 'decay.times.sincePledgeEnd = 0; Game.upgradesToRebuild = 1;')
			 .replace(`(Game.Has('Elder Pact') && Game.Upgrades['Elder Pledge'].unlocked==0)`, `(Game.Has('One mind') && Game.Upgrades['Elder Pledge'].unlocked==0)`)
			 .replace('Game.elderWrath=1;', '').replace('Game.elderWrath++;', '').replace(`Game.Has('Elder Pact') && Game.Upgrades['Elder Pledge'].unlocked==0`, 'false')
			 .replace(`Game.UpdateWrinklers();`, '')
			 .replace('if (Game.pledgeT==0)', 'if (Game.pledgeT<=0)')
			 .replace(`if (Game.Has('Elder Covenant') || Game.Objects['Grandma'].amount==0) Game.elderWrath=0;`, `if (false) { }`)
		);
			
		if (Game.ready) { this.changePledge(); } else { Game.registerHook('create', this.changePledge); }

		allValues('decay purification & halt');
		
		//decay halt: shimmering veil
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace(`Game.Has('Shimmering veil [off]')`, 'false'));
		Game.veilHP = 500;
		Game.veilCollapseAt = 0.1;
		Game.veilMaxHP = 0;
		Game.setVeilMaxHP = function() {
			var h = 500;
			if (Game.Has('Reinforced membrane')) { h *= 1.25; }
			if (decay.isConditional('veil')) { h *= 1000; }
			Game.veilMaxHP = h;
		}
		Game.registerHook('reincarnate', function() { if (Game.Has('Shimmering veil')) { Game.veilPreviouslyCollapsed = false; Game.setVeilMaxHP(); Game.veilHP = Game.veilMaxHP; if (decay.isConditional('veil')) { Game.Upgrades['Shimmering veil [on]'].bought = 0; Game.Upgrades['Shimmering veil [off]'].bought = 1; } else { Game.Upgrades['Shimmering veil [on]'].bought = 1; Game.Upgrades['Shimmering veil [off]'].bought = 0; Game.Upgrades['Shimmering veil [off]'].unlock(); } } });
		replaceDesc('Shimmering veil', 'Unlocks the <b>Shimmering veil</b>, which is a toggleable veil that <b>absorbs</b> your decay when on; however, if it absorbs too much, it may collapse and temporarily massively increase your rate of decay. The veil heals over time while off.<q>Stars contains purity, whose heat repels and destroys the decay. With this veil brings a galaxy of stars at your disposal; though they are merely an image of the real thing, their shine still significantly halts the ever-growing decay.</q>');
		Game.getVeilBoost = function() {
			//this time it is for the fraction of decay that the veil takes on
			var n = 0.5;
			if (Game.Has('Glittering edge')) { n += 0.2; }
			return n;
		}
		Game.getVeilCost = function(fromCollapse) {
			var n = 3;
			if (fromCollapse) {
				n *= 77777;
				if (Game.Has('Delicate touch')) { n /= 2; }
			}
			return n * Game.cookiesPsRawHighest;
		}
		Game.getVeilCooldown = function() {
			var c = Game.fps * 60 * 12;
			if (Game.Has('Delicate touch')) { c /= 2; }
			return c;
		}
		Game.getVeilReturn = function() {
			//the amount of decay that the veil returns on collapse
			var r = 2.89;
			if (Game.Has('Reinforced membrane')) { r *= 0.9; }
			if (Game.Has('Delicate touch')) { r *= 0.9; }
			if (Game.Has('Steadfast murmur')) { r *= 0.9; }
			if (Game.Has('Glittering edge')) { r *= 0.9; }
			if (Game.Has('Sparkling wonder')) { r *= 0.9; }
			return r;
		}
		Game.getVeilHeal = function(veilHPInput, veilMaxInput) {
			if (veilHPInput == veilMaxInput) { return veilMaxInput; }
			var hmult = 0.05 / Game.fps;
			var hadd = 0.5 / Game.fps;
			var hpow = 0.5;
			if (Game.Has('Steadfast murmur')) { hadd *= 2; hmult *= 2; }
			veilHPInput += hadd * Math.pow(veilHPInput / veilMaxInput, hpow);
			veilHPInput = Math.min((1 + hmult) * veilHPInput, veilHPInput + hmult * (veilMaxInput - veilHPInput))
			return Math.min(veilHPInput, veilMaxInput);
		}
		addLoc('This Shimmering Veil is currently taking on <b>%1%</b> of your decay. <br><br>If it collapses, turning it back on will require <b>%2x</b> more cookies than usual, and you must wait for at least <b>%3</b> before doing so. <br>In addition, it will return <b>%4%</b> of the decay it absorbed back onto you when it collapses.');
		Game.Upgrades['Shimmering veil [on]'].descFunc = function(){
			return (this.name=='Shimmering veil [on]'?'<div style="text-align:center;">'+loc("Active.")+'</div><div class="line"></div>':'')+loc('This Shimmering Veil is currently taking on <b>%1%</b> of your decay. <br><br>If it collapses, turning it back on will require <b>%2x</b> more cookies than usual, and you must wait for at least <b>%3</b> before doing so. <br>In addition, it will return <b>%4%</b> of the decay it absorbed back onto you when it collapses.',[Beautify(Game.getVeilBoost()*100), Beautify(Game.getVeilCost(true)/Game.getVeilCost(false), 2), Game.sayTime(Game.getVeilCooldown(),2), Beautify(Game.getVeilReturn() * 100, 2)]);
		}
		addLoc('This Shimmering Veil is slowly healing itself. If activated, this veil will take on <b>%1%</b> of your decay. <br><br>If it collapses, turning it back on will require <b>%2x</b> more cookies than usual, and you must wait for at least <b>%3</b> before doing so. <br>In addition, it will return <b>%4%</b> of the decay it absorbed back onto you when it collapses.');
		addLoc('Your veil has previously collapsed, so this activation will require <b>%1x</b> more cookies than usual.');
		Game.Upgrades['Shimmering veil [off]'].descFunc = function(){
			return (this.name=='Shimmering veil [on]'?'<div style="text-align:center;">'+loc("Active.")+'</div><div class="line"></div>':'')+loc('This Shimmering Veil is slowly healing itself. If activated, this veil will take on <b>%1%</b> of your decay. <br><br>If it collapses, turning it back on will require <b>%2x</b> more cookies than usual, and you must wait for at least <b>%3</b> before doing so. <br>In addition, it will return <b>%4%</b> of the decay it absorbed back onto you when it collapses.', [Beautify(Game.getVeilBoost()*100), Beautify(Game.getVeilCost(true)/Game.getVeilCost(false), 2), Game.sayTime(Game.getVeilCooldown(),2), Beautify(Game.getVeilReturn() * 100, 2)])+' '+(Game.veilPreviouslyCollapsed?('<div class="line"></div>'+loc('Your veil has previously collapsed, so this activation will require <b>%1x</b> more cookies than usual.', [Beautify(Game.getVeilCost(true)/Game.getVeilCost(false), 2)])):'');
		} 
		Game.Upgrades['Shimmering veil [off]'].priceFunc = function() {
			return Game.getVeilCost(Game.veilPreviouslyCollapsed);
		}
		Game.Upgrades['Shimmering veil [off]'].buyFunction = function() {
			Game.veilPreviouslyCollapsed = false;
			decay.triggerNotif('veil');
		}
		replaceDesc('Reinforced membrane', 'Increases the <b>Shimmering veil\'s</b> maximum health by <b>25%</b>.<q>A consistency between jellyfish and cling wrap.</q>');
		replaceDesc('Delicate touch', '<b>Halves</b> the Shimmering veil\'s cooldown and cost multiplier on collapse.<q>It breaks so easily.</q>');
		replaceDesc('Steadfast murmur', '<b>Shimmering Veil</b> heal <b>twice as fast</b> when turned off.<q>Lend an ear and listen.</q>');
		replaceDesc('Glittering edge', 'The <b>Shimmering Veil</b> takes on <b>20%</b> more decay.<q>Stare into it, and the cosmos will stare back.</q>');
		Game.Upgrades['Shimmering veil'].basePrice /= 1000;
		Game.Upgrades['Reinforced membrane'].basePrice /= 1000;
		Game.Upgrades['Delicate touch'].basePrice /= 100;
		Game.Upgrades['Steadfast murmur'].basePrice /= 100;
		Game.Upgrades['Glittering edge'].basePrice /= 100;
		var brokenVeil = new Game.Upgrade('Shimmering veil [broken]', '', 0, [9, 10]); brokenVeil.pool = ['toggle']; Game.UpgradesByPool['toggle'].push(brokenVeil); brokenVeil.order = 40005;
		addLoc('This Shimmering Veil has collapsed due to excess decay. Because of this, reactivating it again will take <b>%1x</b> more cookies than usual.');
		brokenVeil.descFunc = function() {
			return loc('This Shimmering Veil has collapsed due to excess decay. Because of this, reactivating it again will take <b>%1x</b> more cookies than usual.', [Beautify(Game.getVeilCost(true)/Game.getVeilCost(false))]);
		}
		addLoc('This Shimmering Veil will be restored in: ');
		brokenVeil.displayFuncWhenOwned = function() {
			return '<div style="text-align:center;">'+loc('This Shimmering Veil will be restored in: ')+'<br><b>'+Game.sayTime(Game.veilRestoreC,-1)+'</b></div>';
		}
		brokenVeil.timerDisplay = function() {
			if (!Game.Upgrades['Shimmering veil [broken]'].bought) { return -1; } else { return 1-Game.veilRestoreC/Game.getVeilCooldown(); }
		}
		Game.veilOn = function() {
			return (Game.Has('Shimmering veil [off]') && (!Game.Has('Shimmering veil [broken]')));
		}
		Game.veilOff = function() {
			return (Game.Has('Shimmering veil [on]') && (!Game.Has('Shimmering veil [broken]')));
		}
		Game.veilBroken = function() {
			return ((!Game.Has('Shimmering veil [off]')) && (!Game.Has('Shimmering veil [on]')));
		}
		eval('Game.Logic='+Game.Logic.toString().replace(`if (Game.Has('Shimmering veil') && !Game.Has('Shimmering veil [off]') && !Game.Has('Shimmering veil [on]'))`, `if (Game.Has('Shimmering veil') && !Game.veilOn() && !Game.veilOff() && !Game.veilBroken())`));
		eval('Game.DrawBackground='+Game.DrawBackground.toString().replace(`if (Game.Has('Shimmering veil [off]'))`, `if (Game.veilOn())`));
		Game.veilAbsorbFactor = 2; //the more it is, the longer lasting the veil will be against decay
		Game.updateVeil = function() {
			if (!Game.Has('Shimmering veil')) { return false; }
			
			if (Game.veilOn()) { 
				var share = Math.pow(Game.getVeilBoost(), Game.veilAbsorbFactor);
				if (!decay.isConditional('veil') || decay.gen < 1) { 
					Game.veilHP *= Math.pow(decay.update(20, share) / decay.get(20), 1 / Game.fps); //honestly idk what the difference is exactly between using pow and using division
					Game.veilHP -= (Game.veilMaxHP * Math.min(Math.sqrt(Game.veilMaxHP / Game.veilHP), 10)) / (500 * Game.fps);
				} else {
					Game.veilHP += (Game.veilMaxHP - Game.veilHP) * (1 - Math.pow(1 - (0.01 / Game.fps), decay.gen));
				}
				if (Game.veilHP < Game.veilCollapseAt) {
					Game.veilHP = Game.veilCollapseAt;
					Game.collapseVeil(); 
				}
				return true;
			} 
			if (Game.veilOff()) {
				Game.veilHP = Game.getVeilHeal(Game.veilHP, Game.veilMaxHP);
				if (decay.isConditional('veil') && Game.TCount > 5 * Game.fps) { decay.forceAscend(false); }
				return true;
			}
			if (Game.veilBroken()) {
				Game.veilRestoreC--;
				if (Game.veilRestoreC <= 0) {
					Game.veilRestoreC = 0;
					Game.veilHP = Game.veilMaxHP;
					Game.Lock('Shimmering veil [broken]');
					Game.Unlock('Shimmering veil [off]');
					Game.Unlock('Shimmering veil [on]');
					Game.Upgrades['Shimmering veil [on]'].earn();
					Game.Notify('Veil restored!', 'Your Shimmering Veil has recovered from the collapse, but your next activation will require more cookies.')
				}
				return true;
			}
		}
		Game.veilRestoreC = 0;
		Game.veilPreviouslyCollapsed = false;
		Game.collapseVeil = function() {
			if (Game.Has('Sparkling wonder') && Math.random() < 0.1) {
				Game.veilHP = Game.veilMaxHP;
				Game.Notify('Veil revived', 'Your Sparkling wonder saved your veil from collapse and healed it back to full health!', [23, 34]);
				Game.Win('Thick-skinned');
			} else {
				Game.Lock('Shimmering veil [on]');
				Game.Lock('Shimmering veil [off]');
				Game.Upgrades['Shimmering veil [broken]'].earn();
				Game.veilRestoreC = Game.getVeilCooldown();
				Game.veilPreviouslyCollapsed = true;
				//need to fix this at some point to make it actually reflect the amount of decay it absorbed
				decay.amplifyAll(Math.pow(Game.veilMaxHP / Game.veilHP, Game.veilAbsorbFactor * Game.getVeilReturn()), 0, 1);
				Game.Notify('Veil collapse!', 'Your Shimmering Veil collapsed.', [30, 5]);
				PlaySound('snd/spellFail.mp3',1);
				if (decay.isConditional('veil')) { decay.forceAscend(false); }
			}
		}
		replaceAchievDesc('Thick-skinned', 'Have your <b>Sparkling wonder</b> save your <b>Shimmering veil</b> from collapsing.');
		Game.loseShimmeringVeil = function(c) { } //prevent veil from being lost from traditional methods
		//veil graphics down below
		Game.veilOpacity = function() {
			return Math.pow(Game.veilHP / Game.veilMaxHP, 0.35)
		}
		Game.veilRevolveFactor = function(set) {
			return 0.01 * (1 + set * 0.6) * Math.pow(Game.veilHP / Game.veilMaxHP, 0.05);
		}
		Game.veilParticleSizeMax = function(set) {
			return 64 * Math.pow(0.8, set) * Math.pow((Game.veilHP / Game.veilMaxHP), 0.05);
		}
		Game.veilParticleSpeed = function(set) {
			return 32 * Math.pow(1.4, set) * Math.pow(Game.veilHP / Game.veilMaxHP, 0.05);
		}
		Game.veilParticleSpeedMax = function(set) {
			return 32 * (1 + set * 0.5);
		}
		Game.veilParticleQuantity = function(set) {
			return Math.round(9 * (set + 1));
		}
		Game.veilParticleSpawnBound = function(set) {
			return 155 - 30 * (1 - Math.pow(Game.veilHP / Game.veilMaxHP, 0.75));
		}
		/*btw, did you know that all the code related is made by "c u r s e d s  l i v e r"? Plus more!*/
		eval('Crumbs.objectBehaviors.veilMain.f='+Crumbs.objectBehaviors.veilMain.f.toString().replace('this.scaleY = scale;', 'this.scaleY = scale; this.alpha = Game.veilOpacity();'));
		Crumbs.findObject('bigCookie').findChild('veilMain').behaviors = [new Crumbs.behaviorInstance(Crumbs.objectBehaviors.veilMain)];
		Crumbs.veilGlintGenerator = function(m, ctx) {
			if (!Game.prefs.particles || !Game.Has('Shimmering veil [off]')) { return; }
			for (let set = 0; set < 4; set++) {
				for (let i = 0; i < Game.veilParticleQuantity(set); i++) {
					var t = Game.T+i*Math.round((90 / Game.veilParticleQuantity(set)));
					var r = (t%30)/30;
					var a = (Math.floor(t/30)*30*6-i*30)*Game.veilRevolveFactor(set);
					var size = Game.veilParticleSizeMax(set)*(1-Math.pow(r*2-1,2));
					var xx = Math.sin(a)*(Game.veilParticleSpawnBound(set) - Game.veilParticleSpeed(set) * Math.cos(r));
					var yy = Math.cos(a)*(Game.veilParticleSpawnBound(set) - Game.veilParticleSpeed(set) * Math.sin(r));
					ctx.drawImage(Pic('glint.png'),xx-size/2,yy-size/2,size,size);
				}	
			}
		}
		Crumbs.findObject('bigCookie').findChild('veilGlintGenerator').getComponent('canvasManipulator').function = Crumbs.veilGlintGenerator;
		allValues('veil');

		//other nerfs and buffs down below (unrelated but dont know where else to put them)
		
		//Shimmers
		eval('Game.shimmerTypes.golden.popFunc='+Game.shimmerTypes.golden.popFunc.toString().replace("if (me.wrath>0) list.push('clot','multiply cookies','ruin cookies');","if (me.wrath>0) list.push('clot','ruin cookies');")//Removing lucky from the wrath cookie pool
			.replace("if (Game.BuildingsOwned>=10 && Math.random()<0.25) list.push('building special');","if (Game.BuildingsOwned>=10 && me.wrath==0 && Math.random()<0.25) list.push('building special');")//Removing bulding special from the wrath cookie pool
			.replace(`Math.random()<0.1 && (Math.random()<0.05 || !Game.hasBuff('Dragonflight'))`, `Math.random()<0.1 && !Game.hasBuff('Dragonflight')`).replace(`if (me.force!='') {this.chain=0;choice=me.force;me.force='';}`, `if (me.force!='' && !(me.force=='click frenzy' && Game.hasBuff('Dragonflight'))) {this.chain=0;choice=me.force;me.force='';} else if (me.force=='click frenzy' && Game.hasBuff('Dragonflight')) { if (choice=='click frenzy') { Game.shimmerTypes['golden'].popFunc(me); return; /*I suppose you can get extra bs or ef here but the chance is so obscenely low I wouldnt bet on it*/ } }`).replace(`Game.killBuff('Click frenzy'); decay.triggerNotif('dragonflight');`).replace(`if (Game.canLumps() && Math.random()<0.0005) list.push('free sugar lump');`, `if (Game.canLumps() && Math.random()<0.0005) { list.push('free sugar lump'); } if (Math.random()<Game.auraMult('Dragonflight')) { for (let i = 0; i < Game.gcBuffCount(); i++) { if (Math.random()<0.25) { list.push('dragonflight'); } } }`).replace('if ((me.wrath==0 && Math.random()<0.15) || Math.random()<0.05)', 'if ((me.wrath==0 && Math.random()<0.3) || Math.random()<0.1)')
			); //dragonflight rework
		eval('Game.shimmerTypes.golden.getMaxTime='+Game.shimmerTypes.golden.getMaxTime.toString().replace('15', '10')); 
		eval('Game.shimmerTypes.golden.getTimeMod='+Game.shimmerTypes.golden.getTimeMod.toString().replace('m/=2', 'm*=0.6').replace('m/=2', 'm*=0.6')); //yes, the descriptions for lucky day and serendipity isnt overridden, and no thats not a mistake because get trolled 

		//making buildings start with level 1
		for (let i in Game.Objects) {
			Game.Objects[i].level = Math.max(1, Game.Objects[i].level);
		}
		Game.Objects['Wizard tower'].level = Math.max(2, Game.Objects['Wizard tower'].level);
		Game.LoadMinigames();

		eval('Game.ClickCookie='+Game.ClickCookie.toString().replace(`Game.Win('Uncanny clicker');`, `{ Game.Win('Uncanny clicker'); /*decay.triggerNotif('autoclicker');*/ }`).replace('Game.particleAdd();', 'if (Math.random() < decay.symptomsFromFatigue()) { Game.particleAdd(); }'));

		Game.baseResearchTime = 10 * 60 * Game.fps;
		
		decay.customShortcuts = function() {
			if (Game.keys[16] && Game.keys[69]) Game.ExportSave();
		}
		
		Game.registerHook('logic',decay.customShortcuts);

		/*=====================================================================================
        Script writer
        =======================================================================================*/
		decay.validCodeChars = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','arrowup', 'arrowdown', 'arrowleft', 'arrowright', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '(', ')', ' ', '#', '\'', '-'];
		decay.SWCodes = [];
		decay.SWCode = function(code, onActivation, obj) {
			//stands for script writer code
			if (obj) { 
				if (obj.req) { this.req = obj.req; }
				if (obj.spaceSensitive) { this.spaceSensitive = obj.spaceSensitive; }
			}
			if (Array.isArray(code)) { for (let i in code) { code[i] = code[i].toLowerCase(); } this.code = code; } else if (typeof code === 'function') { 
				this.code = code; 
			} else {
				code = code.toLowerCase();
				this.code = [];
				for (let i in code) {
					if (!(code[i] == ' ' && !this.spaceSensitive)) { this.code.push(code[i]); }
				} 
			}
			this.activate = onActivation;

			this.count = 0;
			this.timer = 0;
			this.content = [];
			this.stop = 0;
			decay.SWCodes.push(this);
		}
		decay.SWCode.prototype.check = function(event) {
			const keyPressed = event.key.toLowerCase();
			if (!keyPressed || (!this.spaceSensitive && keyPressed == ' ')) { return; }
			if (this.req && !this.req()) { return; }
			const char = ((typeof this.code == 'function')?this.code()[this.count]:this.code[this.count]);
		
			if (keyPressed === char) {
				this.count++;
		
				clearTimeout(this.timer);
		
				this.timer = setTimeout(function(me) {
					me.clear();
				}, 10000, this);
		
				if (this.count === this.code.length) {
					this.activate.call(this, this.content);
					this.clear();
				}
			} else if (char == '%') {
				const nextChar = ((typeof this.code == 'function')?this.code()[this.count+1]:this.code[this.count+1]);
				if (keyPressed == nextChar) { 
					this.count++; 
					this.stop++;
					this.check(event); 
				} else {
					if (!this.content[this.stop]) { this.content[this.stop] = []; }
					this.content[this.stop].push(keyPressed);
					if (!nextChar && this.content[0].length) { if (this.activate.call(this, this.content)) { this.clear(); } } //for case where % is at the very end
				}
			} else {
				this.clear();
			}
		}
		decay.SWCode.prototype.clear = function() {
			this.count = 0;
			this.stop = 0;
			clearTimeout(this.timer);
			this.content = [];
		}
		decay.checkSWCodes = function(event) {
			if (!Game.Has('Script writer') || !decay.validCodeChars.includes(event.key.toLowerCase()) || Game.keys[17] || Game.OnAscend) { return; }
			if (decay.prefs.typingDisplay) { decay.previousContent.push(new decay.char(event.key.toLowerCase())); }
			for (let i in decay.SWCodes) {
				decay.SWCodes[i].check(event);
			}
		}
		decay.resetSW = function() {
			for (let i in decay.SWCodes) { decay.SWCodes[i].clear(); }
			for (let i in decay.previousContent) { decay.previousContent[i].t = 0; }
		}
		decay.wipeSW = function() {
			decay.SWCodes = [];
		}

		injectCSS('.typingDisplayContainer { position: absolute; z-index: 1000; left: 50%; bottom: 10%; transform: translate(-50%, 0%); padding: 5px; border-radius: 5px; pointer-events: none; background: rgba(0, 0, 0, 0.25); }');
		injectCSS('.character { display: inline-block; margin: 1px; font-size: 15px; }');
		decay.createTypingDisplay = function() {
			var div = document.createElement('div');
			div.classList.add('typingDisplayContainer');
			div.id = 'typingDisplayContainer';
			decay.typingDisplayL = div;
			l('game').appendChild(div);
		}
		decay.createTypingDisplay();
		decay.previousContent = []; //queue
		decay.char = function(content) { 
			this.c = content;
			this.mt = 5 * Game.fps;
			this.t = this.mt;
			this.l = null;

			this.createL();
		}
		decay.char.prototype.createL = function() {
			var div = document.createElement('span');
			div.classList.add('character');
			div.innerText = this.c;
			this.l = div;

			decay.typingDisplayL.appendChild(this.l);
		}
		decay.char.prototype.removeL = function() {
			this.l.remove();
		}
		decay.char.prototype.scale = function() {
			return Math.min(this.t / (this.mt - 4.5 * Game.fps), 1)*100;
		}
		decay.updateTypingDisplay = function() {
			if (!decay.previousContent.length) { decay.typingDisplayL.style.backgroundColor = 'rgba(0,0,0,0)'; } else { decay.typingDisplayL.style.backgroundColor = ''; }
			for (let i = 0; i < decay.previousContent.length; i++) {
				var me = decay.previousContent[i];
				me.t--;
				if (me.t<=0) { me.removeL(); decay.previousContent.shift(); i--; continue; }
				me.l.style.transform = 'scaleX('+me.scale()+'%)';
			}
		}
	
		decay.createDefaultSWCodes = function() {
			new decay.SWCode(["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"], function() { Game.Notify(`You thought something will happen, didn't you?`, ``, [7, 1, kaizoCookies.images.custImg], 10, 1); });
			new decay.SWCode('omaruvu', function() { Game.Notify(`How can I help you, sir?`, choose(decay.helpDesc), [8, 1, kaizoCookies.images.custImg], 1000000000000000000000, 1); });
			new decay.SWCode('activatepartymode', function() { Game.PARTY = 1; });
			new decay.SWCode('opendebug', function() { Game.OpenSesame(); Game.Notify(`Debug tool activated!`,``, [10,6], 10, 1);});
			new decay.SWCode('limes', function() { window.open("https://cookieclicker.wiki.gg/wiki/Grimoire", "_blank"); });
			new decay.SWCode('summonreindeer', function() { var reindeer = new Game.shimmer('reindeer'); reindeer.noPurity = true; });
			new decay.SWCode('trufflz', function() { Game.registerHook('draw', () => {

						for (var i in Game.toys)
						{
							var ctx=Game.LeftBackground;
							var me=Game.toys[i];
							ctx.save();
							ctx.translate(me.x,me.y);
							ctx.rotate(me.r);
					  
							Game.toys[i].icon=[22,4]
						
							if (Game.toysType==1) ctx.drawImage(Pic('icons.png'),me.icon[0]*48,me.icon[1]*48,48,48,-me.s/2,-me.s/2,me.s,me.s);
							ctx.restore();
						}
					});
					Game.TOYS=1;
					Game.Notify(`Trufflz:`, `I love the way they cook linguini.`, [16, 0, kaizoCookies.images.custImg], 10, 1);});
			new decay.SWCode('ihatethisgame', function() { Game.HardReset(2); Game.Notify(`Hey, that's mean.`, ``, [29, 6], 10, 1); });
			new decay.SWCode(["i", "s", "u", "r", "e", "w", "o", "u", "l", "d", "l", "o", "v", "e", "i", "f", "y", "o", "u", "c", "a", "n", "s", "p", "a", "w", "n", "a", "g", "o", "l", "d", "e", "n", "c", "o", "o", "k", "i", "e", "a", "n", "d", "a", "r", "e", "i", "n", "d", "e", "e", "r", "a", "t", "t", "h", "e", "s", "a", "m", "e", "t", "i", "m", "e"], function() { var newShimmer=new Game.shimmer('a mistake'); decay.times.sinceSeason = 0; /* not really good coding design here but whatever*/ }, { req: function() { return (decay.times.sinceSeason >= 15 * 60 * Game.fps); }});
			new decay.SWCode('notify(%)', function(content) { var str = ''; for (let i in content[0]) { str += content[0][i]; } Game.Notify('Notified!', str); });

			decay.ifCursed = function() { return decay.challengeStatus('typing'); }
			new decay.SWCode('cursedsliver', function() { Game.Notify(loc('You seek more power, huh?'), choose(decay.extraHelpDesc), [26, 7]); }, { req: decay.ifCursed });
			decay.extraHelpDesc = [
				'more codes coming soon...',
				'something straightforward: the sentence "cast incantation called nuke wizard towers leveling to repent for your mistakes" is not an orteil tooltip moment, and also refunds all lumps used to upgrade it!'
			];
			new decay.SWCode('castincantationcallednukewizardtowerslevelingtorepentforyourmistakes', function() { if (Game.Objects['Wizard tower'].level < 1) { return; } let lumpCount = (Game.Objects['Wizard tower'].level ** 2 - Game.Objects['Wizard tower'].level) / 2; Game.lumps += lumpCount; Game.Objects['Wizard tower'].level = 1; Game.Notify('Wizard tower level reset!', 'Your wizard tower levels have been successfully reset, and refunding <b>'+Beautify(lumpCount)+'</b> sugar lumps.', [17, 21]); }, { req: decay.ifCursed });
		}
		decay.createDefaultSWCodes();
	
		decay.helpDesc = ['Typing "activatepartymode" will unlock party mode!', 'You know limes?', 'There is a code for summoning reindeer.', 'Have you tried debug mode yet?', 'Be careful, if you type "ihatethisgame" it will wipe your save.', 'Someone must have told you how to get here.', 'You should try typing the konami code, something interesting will happen!', 'Trufflz is the 9th best comp player.', 'You can spawn a hideous creature if you have met the conditions; 15 minutes needs to have passed, and you need to be on the Christmas season, then typing <br>"isurewouldloveifyoucanspawnagoldencookie<br>andareindeeratthesametime" will spawn it.', 'Not-historically, the garden of eden had at least one of every plant species in it.'];
		
		addEventListener("keydown", function(event) {
			decay.checkSWCodes(event);
			if (decay.isConditional('rotated') && event.ctrlKey && event.keyCode == 65) { decay.forceAscend(false); }
			if ((decay.isConditional('typing') || decay.isConditional('typingR')) && event.key == 'Enter') { decay.resetSW(); }
		}, false);

		eval('Game.UpdateMenu='+Game.UpdateMenu.toString().replace("(shortcut for import: ctrl+O)","(shortcut for export: shift+E) (shortcut for import: ctrl+O)"));

        new Game.buffType('trick or treat', function(time, pow) {
			return {
				name:'Trick or treat',
				desc:loc("Wrinklers appear 4 times as fast!", [pow, Game.sayTime(time * Game.fps, -1)]),
				icon:[19, 8],
				time:time * Game.fps,
				power:pow,
				aura:1
			};
		});

		eval('Game.UpdateWrinklers='+Game.UpdateWrinklers.toString().replace("if (Game.Has('Unholy bait')) chance*=5;","if (Game.Has('Unholy bait')) chance*=5; if (Game.hasBuff('Trick or treat')) chance*=4;"));

		eval('Game.shimmerTypes["golden"].popFunc='+Game.shimmerTypes['golden'].popFunc.toString().replace("if (me.wrath && Math.random()<0.1) list.push('cursed finger');","if (me.wrath && Math.random()<0.1) list.push('cursed finger'); if (me.wrath>0 && Math.random()<0.05 && Game.season=='halloween') list.push('trick or treat'); if (Math.random()<0.05 && Game.season=='valentines') list.push('lonely');"));

		decay.Surprise = 0;

		eval('Game.dropRateMult='+Game.dropRateMult.toString().replace("if (Game.Has('Santa\'s bottomless bag')) rate*=1.1;","if (Game.Has('Santa\'s bottomless bag')) rate*=1.1; if (decay.Surprise) rate*=1.1;"));
				
		var year=new Date().getFullYear();
		var leap=(((year%4==0)&&(year%100!=0))||(year%400==0))?1:0;
		var day=Math.floor((new Date()-new Date(year,0,0))/(1000*60*60*24));
		if (day >= 160 + leap && day < 161 + leap)  { decay.Surprise = 1; Game.Notify(`Suprise!`, `There is a rare creature called "reingold" that can only be found normally on this day, have fun hunting it!`, [22, 2, kaizoCookies.images.custImg],100,1); };

        addLoc("Reingold");

        Game.shimmerTypes["a mistake"] = { //what have i done
			reset: function () {
				this.hp = 0;
				this.last = '';
			},
			initFunc: function (me) {
				if (!this.spawned && Game.chimeType != 0 && Game.ascensionMode != 1) PlaySound('snd/jingle.mp3');
		
				me.spawnLead = 1 //all reingolds are nats (thanks cursed)
		
				me.x = -128;
				if (!Game.reingoldPosition) {
					Game.reingoldPosition = setInterval(function () { //reingold's position changes twice a second
						me.y = Math.floor(Math.random() * Math.max(0, Game.bounds.bottom - Game.bounds.top - 256) + Game.bounds.top + 128) - 128;
						me.x = Math.floor(Math.random() * Math.max(0, (Game.bounds.right - 300) - Game.bounds.left - 256) + Game.bounds.left + 128) - 128;
						if (!Game.reingoldPosition) { clearInterval(Game.reingoldPosition); Game.reingoldPosition = 0; return false; }
						//console.log("still running")
					}, 500);
				}
				me.l.style.width = '167px';
				me.l.style.height = '212px';
				if (Math.random() < 1 / 1000) me.l.style.backgroundImage = 'url(\'' + kaizoCookies.images.reingold + '\')'; //hehe
				else me.l.style.backgroundImage = 'url(\'' + 'img/betterReinGold.png' + '\')';
				me.l.style.opacity = '0';
				me.l.style.display = 'block';
				me.l.setAttribute('alt', loc("Reingold"));
		
				me.life = 1;
				me.dur = 4;
		
				var dur = 4;
				if (Game.Has('Weighted sleighs')) dur *= 2;
				dur *= Game.eff('reindeerDur');
				if (this.hp > 0) dur = Math.max(2, 10 / this.hp);
				me.dur = dur;
				me.life = Math.ceil(Game.fps * me.dur);
				me.sizeMult = 1;
			},
			updateFunc: function (me) {
				var curve = 1 - Math.pow((me.life / (Game.fps * me.dur)) * 2 - 1, 4);
				me.l.style.opacity = curve;
				me.l.style.transform = 'translate(' + (me.x + (Game.bounds.right - Game.bounds.left) * (1 - me.life / (Game.fps * me.dur))) + 'px,' + (me.y - Math.abs(Math.sin(me.life * 0.1)) * 128) + 'px) rotate(' + (Math.sin(me.life * 0.2 + 0.3) * 10) + 'deg) scale(' + (me.sizeMult * (1 + Math.sin(me.id * 0.53) * 0.1)) + ')';
				me.life--;
				if (me.life <= 0) { this.missFunc(me); me.die(); }
			},
			popFunc: function (me) {
				//get achievs and stats
				Game.reindeerClicked++;
				Game.goldenClicks++;
				Game.goldenClicksLocal++;

				//select an effect
				var list = [];
				list.push('frenzy', 'multiply cookies');
				if (Math.random() < 0.1 && (Math.random() < 0.05 || !Game.hasBuff('Dragonflight'))) list.push('click frenzy');
		
				if (this.last != '' && Math.random() < 0.8 && list.indexOf(this.last) != -1) list.splice(list.indexOf(this.last), 1);//80% chance to force a different one
				var choice = choose(list);
		
				if (me.force != '') { this.hp = 0; choice = me.force; me.force = ''; }
		
				this.last = choice;
		
				//create buff for effect
				//buff duration multiplier
				var effectDurMod = 1;
				if (Game.Has('Get lucky')) effectDurMod *= 2;
				if (Game.Has('Lasting fortune')) effectDurMod *= 1.1;
				if (Game.Has('Lucky digit')) effectDurMod *= 1.01;
				if (Game.Has('Lucky number')) effectDurMod *= 1.01;
				if (Game.Has('Green yeast digestives')) effectDurMod *= 1.01;
				if (Game.Has('Lucky payout')) effectDurMod *= 1.01;
				effectDurMod *= 1 + Game.auraMult('Epoch Manipulator') * 0.05;
		
				if (Game.hasGod) {
					var godLvl = Game.hasGod('decadence');
					if (godLvl == 1) effectDurMod *= 1.07;
					else if (godLvl == 2) effectDurMod *= 1.05;
					else if (godLvl == 3) effectDurMod *= 1.02;
				}
		
				//effect multiplier (from lucky etc)
				var mult = 1;
				if (Game.Has('Green yeast digestives')) mult *= 1.01;
				if (Game.Has('Dragon fang')) mult *= 1.03;
				if (!me.wrath) mult *= Game.eff('goldenCookieGain');
				else mult *= Game.eff('wrathCookieGain');

				var popup = '';
				var buff = 0;

				if (choice == 'frenzy') {
					buff = Game.gainBuff('frenzy', Math.ceil(77 * effectDurMod), 7);
				}
				else if (choice == 'multiply cookies') {
					var val = Game.cookiesPs * 60;
					if (Game.hasBuff('Elder frenzy')) val *= 0.5;
					if (Game.hasBuff('Frenzy')) val *= 0.75;
					var moni = mult * Math.max(25, val);
					if (Game.Has('Ho ho ho-flavored frosting')) moni *= 2;
					moni *= Game.eff('reindeerGain');
					Game.Earn(moni);
		
					popup = '<div style="font-size:80%;">' + loc("+%1!", loc("%1 cookie", LBeautify(moni))) + '</div>';
				}
				else if (choice == 'click frenzy') {
					buff = Game.gainBuff('click frenzy', Math.ceil(13 * effectDurMod), 777);
				}
		
				decay.purifyFromShimmer(me);
		
				var cookie = '';
				var failRate = 0.8;
				if (Game.HasAchiev('Let it snow')) failRate = 0.6;
				failRate *= 1 / Game.dropRateMult();
				if (Game.Has('Starsnow')) failRate *= 0.95;
				if (Game.hasGod) {
					var godLvl = Game.hasGod('seasons');
					if (godLvl == 1) failRate *= 0.9;
					else if (godLvl == 2) failRate *= 0.95;
					else if (godLvl == 3) failRate *= 0.97;
				}
				if (Math.random() > failRate) {
					cookie = choose(['Christmas tree biscuits', 'Snowflake biscuits', 'Snowman biscuits', 'Holly biscuits', 'Candy cane biscuits', 'Bell biscuits', 'Present biscuits']);
					if (!Game.HasUnlocked(cookie) && !Game.Has(cookie)) {
						Game.Unlock(cookie);
					}
					else cookie = '';
				}
		
				if (popup == '' && buff && buff.name && buff.desc) popup = buff.dname + '<div style="font-size:65%;">' + buff.desc + '</div>';
				if (popup != '') Game.Popup(popup, me.x + me.l.offsetWidth / 2, me.y);
		
				Game.Notify(loc('You found %1!', choose(loc("Reindeer names"))), cookie == '' ? '' : '<br>You are rewarded with ' + Game.Upgrades[cookie].dname + '!', [12, 9], 6);
		
				this.hp += 0.35;
		
				if (Math.random() < this.hp) {
					this.hp = 0;
				}
		
				//console.log(this.hp)
		
				//sparkle and kill the shimmer
				Game.SparkleAt(Game.mouseX, Game.mouseY);
				PlaySound('snd/jingleClick.mp3');
				me.die();
				Game.reingoldPosition = 0;
			},
			missFunc: function (me) {
				if (this.hp > 0) {
					this.hp = 0;
				}
				Game.reingoldPosition = 0;
			},
			spawnsOnTimer: true,
			spawnConditions: function () {
				if (decay.Surprise == 1) return true; 
				else return false;
			},
			spawned: 0,
			time: 0,
			minTime: 0,
			maxTime: 0,
			getTimeMod: function (me, m) {
				if (Game.Has('Reindeer baking grounds')) m /= 2;
				if (Game.Has('Starsnow')) m *= 0.95;
				if (Game.hasGod) {
					var godLvl = Game.hasGod('seasons');
					if (godLvl == 1) m *= 0.9;
					else if (godLvl == 2) m *= 0.95;
					else if (godLvl == 3) m *= 0.97;
				}
				m *= 1 / Game.eff('reindeerFreq');
				if (Game.Has('Reindeer season')) m = 0.01;
				if (this.hp > 0) m = 0.0;
				return Math.ceil(Game.fps * 60 * m);
			},
			getMinTime: function (me) {
				var m = 4;
				return this.getTimeMod(me, m);
			},
			getMaxTime: function (me) {
				var m = 7;
				return this.getTimeMod(me, m);
			},
			last: ""
		};
		
		allValues('spells; decay complete');

		/*=====================================================================================
        Credits
        =======================================================================================*/
		Game.updateLog= //declaring a new log text
		'<div class="selectable">'+
		'<div class="section">'+loc("Info")+'</div>'+
		'<div class="subsection">'+
		'<div class="section">'+loc("Mod Credits")+'</div>'+
		'<div class="subsection">'+
		'<div class="title">Programmers</div>'+
		'<div class="listing">CursedSliver</div>'+'<div style="display:blockvertical-align:middle;position:relative;left:97px;top:-18px;width:48px;height:48px;background:url(\''+kaizoCookies.images.cursed+'\');margin:-16px;transform:scale(0.5);"></div> - made 80% of the mod'+
		'<div class="listing">Omar uvu</div>'+tinyIcon([8,1,"https://raw.githack.com/CursedSliver/asdoindwalk/main/modicons.png"],"position:relative;left:80px;top:-20px;")+' - made 20% of the mod';

        '<div class="subsection">'+
		'<div class="title">Playtesters/QA</div>'+
		'<div class="listing">Cookiemains</div>'+
		'<div class="listing">Fififoop</div>'+
		'<div class="listing">Charlie</div>'+
		'<div class="listing">Trufflz</div>'+
		'<div class="listing">Fishman</div>'+
		'<div class="listing">Johnny Cena</div>'+
		'<div class="listing">Samyli "rip his hands"</div>'+


        '<div class="subsection">'+
		'<div class="title">Artwork</div>'+
		'<div class="listing">Omar uvu</div>'+
		'<div class="listing">CursedSliver</div>'+
		'<div class="listing">Whisp</div>'+

		'<div class="subsection">'+
		'<div class="title">Special Thanks</div>'+
		'<div class="listing">Fillex (P for Pause)</div>'+
		'<div class="listing">Helloperson (buffTimer)</div>'+
		'<div class="listing">Retropaint</div>'+ //he will never be forgotten
		'<div class="listing">Rubik</div>'+ 
		'<div class="listing">Lookas</div>'+ 
		'<div class="listing">Yeetdragon</div>'+Game.updateLog;   

		/*=====================================================================================
        Minigames 
        =======================================================================================*/
		eval('Game.Object='+Game.Object.toString().replace(`me.level+1,loc("level up your %1",me.plural)`, `me.level,loc("level up your %1",me.plural)`).replace(`LBeautify(me.level+1)`, `LBeautify(me.level)`));
		for (let i in Game.Objects) {
			eval('Game.Objects["'+i+'"].levelTooltip='+Game.Objects[i].levelTooltip.toString().replace(`LBeautify(me.level+1)`, `LBeautify(me.level)`).replace(`me.level+1?''`, `me.level?''`));
			Game.Objects[i].levelUp = function(me){
				return function(free){ if (decay.gameCan.levelUpBuildings) Game.spendLump(me.level,loc("level up your %1",me.plural),function()
				{
					me.level+=1;
					if (me.level>=10 && me.levelAchiev10) Game.Win(me.levelAchiev10.name);
					if (!free) PlaySound('snd/upgrade.mp3',0.6);
					Game.LoadMinigames();
					me.refresh();
					if (l('productLevel'+me.id)){var rect=l('productLevel'+me.id).getBounds();Game.SparkleAt((rect.left+rect.right)/2,(rect.top+rect.bottom)/2-24+32-TopBarOffset);}
					if (me.minigame && me.minigame.onLevel) me.minigame.onLevel(me.level);
				},free)();};
			}(Game.Objects[i]);
		}
		eval('Game.doLumps='+Game.doLumps.toString().replace('var phase=Math.min(6,Math.floor((age/Game.lumpOverripeAge)*7));', `var phase=0; if (age<Game.lumpRipeAge) { phase = Math.min(6,Math.floor((age/Game.lumpRipeAge)*7)); } else { phase = 6; } `).replace('var phase2=Math.min(6,Math.floor((age/Game.lumpOverripeAge)*7)+1);', `var phase2 = 0; if (age<Game.lumpRipeAge) { phase2 = Math.min(6,Math.floor((age/Game.lumpRipeAge)*7)+1); } else { phase2 = 6; }`));
		
        eval('Game.modifyBuildingPrice='+Game.modifyBuildingPrice.toString().replace("if (Game.hasBuff('Crafty pixies')) price*=0.98;","if (Game.hasBuff('Crafty pixies')) price*=0.90;"))//Buffing the crafty pixies effect from 2% to 10%

		decay.getCFChance = function() { 
			let chance = 0.25;
			if (decay.challengeStatus('combo1')) { chance += 0.05; }
			if (decay.challengeStatus('combo4')) { chance += 0.05; }

			let pow = 1;
			pow += decay.challengeStatus('allBuffStackR') * 0.01;
			if (decay.isConditional('dualcast')) { pow += 2; }
			return 1 - Math.pow(1 - chance, pow); 
		}
		//SPELLS
		decay.seFrees = [];
		for (let i in Game.Objects) { decay.seFrees.push(0); }
		this.reworkGrimoire = function() {
			if (!Game.Objects['Wizard tower'].minigameLoaded || grimoireUpdated || l('grimoireInfo') === null) { return; } 
			
			gp = Game.Objects['Wizard tower'].minigame;
			Game.minigames.push(gp);
			if (typeof gp === 'undefined') { console.log('grimoire1 failed. gp: '+gp); return false; }
			if (l('grimoireInfo') === null) { console.log('grimoire2 failed. grimoireInfo:'+l('grimoireInfo')); return false; } 
			if (typeof gp.spells === 'undefined') { console.log('grimoire3 failed. gp.spells: '+gp.spells); return false; }
			var M = gp;
			try {
				decay.addSpells();
				Game.rebuildGrimoire();
			} catch(err) {
				Game.Notify('adding spells failed!', 'uh oh', 0, 1e21, false, true);
			}
			eval('gp.logic='+gp.logic.toString().replace('M.magicPS=Math.max(0.002,Math.pow(M.magic/Math.max(M.magicM,100),0.5))*0.002;', 'M.magicPS = Math.pow(Math.min(2, decay.gen), 0.3) * Math.max(0.002,Math.pow(M.magic/Math.max(M.magicM,100),0.5))*0.006;'));
			eval('gp.logic='+replaceAll('M.','gp.',gp.logic.toString()));
			eval("gp.spells['spontaneous edifice'].win=" + Game.Objects['Wizard tower'].minigame.spells['spontaneous edifice'].win.toString().replace("{if ((Game.Objects[i].amount<max || n==1) && Game.Objects[i].getPrice()<=Game.cookies*2 && Game.Objects[i].amount<400) buildings.push(Game.Objects[i]);}", "{if (Game.Objects[i].amount>0 && decay.seFrees[Game.Objects[i].id] < 20) buildings.push(Game.Objects[i]);}").replace('building.buyFree(1);', 'decay.seFrees[building.id]++; building.getFree(1);'));
			gp.spells['spontaneous edifice'].fail = function() {
				for (let i in Game.Objects) {
					Game.Objects[i].sacrifice(1);
				}
				Game.Popup('<div style="font-size:80%;">'+loc("Backfire!")+'<br>'+loc("One of every single one of your buildings disappear in a puff of smoke!")+'</div>',Game.mouseX,Game.mouseY);
			}
			addLoc('The spell picks a random building that you have at least 1 of, and gives you one for free that also doesn\'t affect its current price.');
			addLoc('Can give up to %1 free buildings for each building type.');
			addLoc('Lose one of every building.');
			addLoc('One of every single one of your buildings disappear in a puff of smoke!');
			gp.spells['spontaneous edifice'].desc = loc('The spell picks a random building that you have at least 1 of, and gives you one for free that also doesn\'t affect its current price.')+'<br>'+loc('Can give up to %1 free buildings for each building type.', Beautify(20));
			gp.spells['spontaneous edifice'].failDesc = loc("Lose one of every building.");
			addLoc('Spells cast: %1 (total: %2; cross-legacies total: %3)');
			decay.spellsCastTotalNGM = gp.spellsCastTotal;
			eval('gp.castSpell='+gp.castSpell.toString().replace('.spellsCastTotal++;', '.spellsCastTotal++; decay.spellsCastTotalNGM++;'));
			eval('gp.draw='+gp.draw.toString().replace(`Math.min(Math.floor(M.magicM),Beautify(M.magic))+'/'+Beautify(Math.floor(M.magicM))+(M.magic<M.magicM?(' ('+loc("+%1/s",Beautify((M.magicPS||0)*Game.fps,2))+')'):'')`,
													 `Math.min(Math.floor(M.magicM),Beautify(M.magic))+'/'+Beautify(Math.floor(M.magicM))+(M.magic<M.magicM?(' ('+loc("+%1/min",Beautify((M.magicPS||0)*Game.fps*60,3))+')'):'')`)
				.replace(`loc("Spells cast: %1 (total: %2)",[Beautify(M.spellsCast),Beautify(M.spellsCastTotal)]);`,
					 `loc(((decay.spellsCastTotalNGM==M.spellsCastTotal)?"Spells cast: %1 (total: %2)":"Spells cast: %1 (total: %2; cross-legacies total: %3)"),[Beautify(M.spellsCast),Beautify(M.spellsCastTotal),Beautify(decay.spellsCastTotalNGM)]); M.infoL.innerHTML+="; Magic regen multiplier from "+decay.term(decay.gen)+": "+decay.effectStrs([function(n, i) { return Math.pow(Math.min(2, n), 0.3)}]); `));
			eval('gp.draw='+replaceAll('M.','gp.',gp.draw.toString()));		
			eval('gp.spells["hand of fate"].win='+gp.spells["hand of fate"].win.toString().replace(`if (Game.BuildingsOwned>=10 && Math.random()<0.25) choices.push('building special');`, 'decay.triggerNotif("fthof");').replace(`if (!Game.hasBuff('Dragonflight')) choices.push('click frenzy');`, '').replace(`if (Math.random()<0.15) choices=['cookie storm drop'];`, `if (Math.random()<decay.getCFChance()) choices=['click frenzy'];`));
			eval('gp.spells["hand of fate"].fail='+gp.spells["hand of fate"].fail.toString().replace(`if (Math.random()<0.1) choices.push('cursed finger','blood frenzy');`, `if (Math.random()<0.1) choices.push('cursed finger'); decay.triggerNotif("fthof");`));
			/*makes it so that the tooltips can support custom icons*/eval('gp.spellTooltip='+replaceAll('M.', 'gp.', gp.spellTooltip.toString()));
			eval('gp.spellTooltip='+gp.spellTooltip.toString().replace(`background-position:'+(-me.icon[0]*48)+'px '+(-me.icon[1]*48)+'px;`, `'+writeIcon(me.icon)+'`));
            gp.spells['hand of fate'].failFunc=function(fail){return fail+0.3*Game.shimmerTypes['golden'].n; };
			gp.spells['hand of fate'].desc=loc("Summon a random golden cookie. Each existing golden cookie makes this spell +%1% more likely to backfire.",30);
			addLoc('Continuously attracts every present power orb to your mouse for the next %1 seconds.');
			addLoc('Continuously heals and speeds up every present power orb for the next %1 seconds.');
			addLoc('Come, power orbs! Come!');
			addLoc('Better luck next time...');
			addLoc('Bending Power orbs to your will.');
			addLoc('Those Power orbs are quite a headache...');
			gp.spells['haggler\'s charm'].desc = loc('Continuously attracts every present power orb to your mouse for the next %1 seconds.', 10);
			gp.spells['haggler\'s charm'].failDesc = loc('Continuously heals and speeds up every present power orb for the next %1 seconds.', 20);
			eval(`gp.spells["haggler's charm"].win=`+gp.spells['haggler\'s charm'].win.toString().replace('loc("Upgrades are cheaper!")', 'loc("Come, power orbs! Come!")').replace("('haggler luck',60,2);", '("haggler luck",10,2);'));
			eval(`gp.spells["haggler's charm"].fail=`+gp.spells['haggler\'s charm'].fail.toString().replace('loc("Upgrades are pricier!")', 'loc("Better luck next time...")').replace('60*60,2);', '20,2);'));
			eval(`Game.buffTypesByName['haggler luck'].func=`+Game.buffTypesByName['haggler luck'].func.toString().replace(`loc("All upgrades are %1% cheaper for %2!",[pow,Game.sayTime(time*Game.fps,-1)])`, `loc("Bending Power orbs to your will.")`));
			eval(`Game.buffTypesByName['haggler misery'].func=`+Game.buffTypesByName['haggler misery'].func.toString().replace('loc("All upgrades are %1% pricier for %2!",[pow,Game.sayTime(time*Game.fps,-1)])', 'loc("Those Power orbs are quite a headache...")'));
			//CBG win effect
			eval("Game.Objects['Wizard tower'].minigame.spells['conjure baked goods'].win="+Game.Objects['Wizard tower'].minigame.spells['conjure baked goods'].win.toString().replace('Game.Earn(val);', "var buff = Game.gainBuff('haggler dream', 60, 2);"));
	        eval("Game.Objects['Wizard tower'].minigame.spells['conjure baked goods'].win="+Game.Objects['Wizard tower'].minigame.spells['conjure baked goods'].win.toString().replace(`Game.Popup('<div style="font-size:80%;">'+loc("+%1!",loc("%1 cookie",LBeautify(val)))+'</div>',Game.mouseX,Game.mouseY);`, `Game.Popup('<div style="font-size:80%;">'+loc("Heavenly chips are stronger!")+'</div>',Game.mouseX,Game.mouseY);`));
	        eval("Game.Objects['Wizard tower'].minigame.spells['conjure baked goods'].win="+Game.Objects['Wizard tower'].minigame.spells['conjure baked goods'].win.toString().replace(`Game.Notify(loc("Conjure Baked Goods")+(EN?'!':''),loc("You magic <b>%1</b> out of thin air.",loc("%1 cookie",LBeautify(val))),[21,11],6);`, `Game.Notify(loc("Conjure Baked Goods")+(EN?'!':''),loc("Your heavenly chips are stronger.",loc("")),[21,11],6);`));
			//CBG fail effect
			eval("Game.Objects['Wizard tower'].minigame.spells['conjure baked goods'].fail="+Game.Objects['Wizard tower'].minigame.spells['conjure baked goods'].fail.toString().replace(`var val=Math.min(Game.cookies*0.15,Game.cookiesPs*60*15)+13;`,`var val=Math.min(Game.cookies*0.5)+13;`).replace(`var buff=Game.gainBuff('clot',60*15,0.5);`, `var buff=Game.gainBuff('coagulated',3*60,0.5);`));
			//desc
			addLoc('+%1% prestige level effect on CpS for 60 seconds.');
			addLoc('Trigger a %1-minute coagulation and lose %2% of your cookies owned.');
			Game.Objects['Wizard tower'].minigame.spells['conjure baked goods'].desc=loc("+%1% prestige level effect on CpS for 60 seconds.", 100);
			Game.Objects['Wizard tower'].minigame.spells['conjure baked goods'].failDesc=loc("Trigger a %1-minute coagulation and lose %2% of your cookies owned.", [3, 50]);
			addLoc('Holify Abomination');
			addLoc('Obliterate the most powerful wrinkler without losing any cookies.');
			addLoc('Summons a shiny wrinkler.');
			addLoc('Wrinkler obliteration in progress...');
			addLoc('But the shiny wrinkler couldn\'t fit.');
			addLoc('Beware of the beast!');
			gp.spells['resurrect abomination'].name = loc('Holify Abomination');
			gp.spells['resurrect abomination'].desc = loc('Obliterate the most powerful wrinkler without losing any cookies.');
			gp.spells['resurrect abomination'].failDesc = loc('Summons a shiny wrinkler.');
			gp.spells['resurrect abomination'].win = function() {
				Game.Popup('<div style="font-size:80%;">'+loc("Wrinkler obliteration in progress...")+'</div>',Game.mouseX,Game.mouseY);
				if (decay.wrinklersN == 0) { return; }
				let wrinklers = Crumbs.getObjects('w');
				let largest = wrinklers[0];
				const specialAttributes = ['shiny', 'leading', 'phantom', 'bomber', 'armored'];
				for (let i in wrinklers) {
					if (wrinklers[i].size > largest.size) { largest = wrinklers[i]; continue; }
					if (wrinklers[i].size >= largest.size) {
						for (let i in specialAttributes) {
							if (wrinklers[i][specialAttributes[i]] && !largest[specialAttributes[i]]) { largest = wrinklers[i]; break; }
						}
					}
				}
				largest.sucked = 0;
				largest.size -= 10000;
				decay.wrinklerDeath.call(largest);
			}
			gp.spells['resurrect abomination'].fail = function() {
				var r = decay.spawnWrinklerLead();
				r.shiny = true;
				if (r) {
					r.type = 1;
					Game.Popup('<div style="font-size:80%;">'+loc("Backfire!")+'<br>'+loc("Beware of the beast!")+'</div>',Game.mouseX,Game.mouseY);
				} else {
					Game.Popup('<div style="font-size:80%;">'+loc("Backfire!")+'<br>'+loc("But the shiny wrinkler couldn\'t fit.")+'</div>',Game.mouseX,Game.mouseY);
					return -1;
				}
			}
			gp.spells['resurrect abomination'].costMin = 12;
			gp.spells['resurrect abomination'].costPercent = 0.06;
			eval('Game.SpawnWrinkler='+Game.SpawnWrinkler.toString().replace(' && Game.elderWrath>0', ''));

			addLoc('The current ongoing challenge forbids you from using this spell!');
			eval('gp.spells["gambler\'s fever dream"].win='+gp.spells['gambler\'s fever dream'].win.toString().replaceAll('M.', 'gp.').replace('var spells=[];', `if (decay.isConditional("dualcast")) { Game.Popup('<div style="font-size:80%;">'+loc("The current ongoing challenge forbids you from using this spell!")+'</div>',Game.mouseX,Game.mouseY); return -1; } var spells=[];`));
			
			addLoc('Summons a crafty pixie to predict good luck on your next cast, then refunds all magic used. Will guarantee success as long as the next cast casts a spell with the same backfire chance as this one, and that the next spell is casted in the same ascension.<br>A successful prediction cannot be changed without casting another spell or ascending.');
			addLoc('Uses up the magic spent without predicting anything.');
			addLoc('Great news! Next spell will not backfire!');
			addLoc('Summoning failed!');
			gp.spells['summon crafty pixies'].desc = loc('Summons a crafty pixie to predict good luck on your next cast, then refunds all magic used. Will guarantee success as long as the next cast casts a spell with the same backfire chance as this one, and that the next spell is casted in the same ascension.<br>A successful prediction cannot be changed without casting another spell or ascending.');
			gp.spells['summon crafty pixies'].failDesc = loc('Uses up the magic spent without predicting anything.');
			gp.spells['summon crafty pixies'].costMin = 15;
			gp.spells['summon crafty pixies'].costPercent = 0.05;
			gp.spells['summon crafty pixies'].win = function() { 
				Game.Popup('<div style="font-size:80%;">'+loc("Great news! Next spell will not backfire!")+'</div>',Game.mouseX,Game.mouseY);
				return -1;
			}
			gp.spells['summon crafty pixies'].fail = function() {
				Game.Popup('<div style="font-size:80%;">'+loc("Backfire!")+'<br>'+loc("Summoning failed!")+'</div>',Game.mouseX,Game.mouseY);
			}

			for (let i in gp.spells) {
				Game.spellsProperNameToCode[gp.spells[i].name.toLowerCase()] = i;
			}
			eval('gp.castSpell='+gp.castSpell.toString().replace('var obj=obj||{};', 'if (!decay.gameCan.castSpells) { return; } var obj=obj||{};'));
			
			grimoireUpdated = true; //no more unnecessary replacing 
			allValues('spells activated');
		};
		decay.addSpells = function() {
			addLoc('Liquify politician');
			addLoc('Purifies a lot of decay with a very high purity limit, but the purity limit is halved for every golden cookie effect active.');
			addLoc('Amplifies your decay.');
			addLoc('Corruption cleared!');
			addLoc('Backfire! Corruption intensified!');
			addLoc('Manifest spring');
			addLoc('Decay propagation is %1% slower for the next %2 minutes.<br>(this stacks with itself multiplicatively)');
			addLoc('Decay propagation is %1% faster for the next %2 minutes.');
			addLoc('The water shall flow!');
			addLoc('Oops! Pipes broken!');
			addLoc('Unending flow');
			addLoc('Stagnant body');
			addLoc('Decay propagation rate +%1% for %2!');
			gp.spells['liquify politician'] = {
				name: loc('Liquify politician'),
				desc: loc('Purifies a lot of decay with a very high purity limit, but the purity limit is halved for every golden cookie effect active.'),
				failDesc: loc('Amplifies your decay.'),
				icon: [5, 0, kaizoCookies.images.custImg],
				costMin: 6,
				costPercent: 0.45,
				id: 9,
				win: function() {
					const prev = decay.pastCapPow;
					decay.pastCapPow = 0.4;
					decay.purifyAll(50, 0.25, 1 + 49 * Math.pow(0.5, Game.gcBuffCount()));
					decay.pastCapPow = prev;
					Game.Popup('<div style="font-size:80%;">'+loc("Corruption cleared!")+'</div>',Game.mouseX,Game.mouseY);
				},
				fail: function() {
					decay.amplifyAll(10, 0.5);
					Game.Popup('<div style="font-size:80%;">'+loc("Backfire! Corruption intensified!")+'</div>',Game.mouseX,Game.mouseY);
				}
			}
			gp.spellsById.push(gp.spells['liquify politician']);
			gp.spells['manifest spring'] = {
				name: loc('Manifest spring'),
				desc: loc('Decay propagation is %1% slower for the next %2 minutes.<br>(this stacks with itself multiplicatively)', [25, 2]),
				failDesc: loc('Decay propagation is %1% faster for the next %2 minutes.', [50, 2]),
				icon: [6, 0, kaizoCookies.images.custImg],
				costMin: 10,
				costPercent: 0.15,
				id: 10,
				win: function() {
					if (!Game.hasBuff('Unending flow')) {
						Game.gainBuff('unending flow', 120, 0.25);
					} else {
						Game.hasBuff('Unending flow').arg1 = Game.hasBuff('Unending flow').arg1 + (0.25 * (1 - Game.hasBuff('Unending flow').arg1));
					}
					Game.Popup('<div style="font-size:80%;">'+loc("The water shall flow!")+'</div>',Game.mouseX,Game.mouseY);
				},
				fail: function() {
					Game.gainBuff('stagnant body', 120, 0.5);
					Game.Popup('<div style="font-size:80%;">'+loc("Oops! Pipes broken!")+'</div>',Game.mouseX,Game.mouseY);
				}
			}
			gp.spellsById.push(gp.spells['manifest spring']);
			
			new Game.buffType('unending flow', function(time, pow) {
			return {
					name: loc('Unending flow'),
					desc: loc('Decay propagation rate -%1% for %2!', [pow * 100, Game.sayTime(time*Game.fps,-1)]),
					icon: [6, 0, kaizoCookies.images.custImg],
					time: time*Game.fps,
					add: false,
					max: false,
					aura: 0
				}
			});
			
			new Game.buffType('stagnant body', function(time, pow) {
			return {
					name: loc('Stagnant body'),
					desc: loc('Decay propagation rate +%1% for %2!', [pow * 100, Game.sayTime(time*Game.fps,-1)]),
					icon: [30, 3],
					time: time*Game.fps,
					add: false,
					max: false,
					aura: 0
				}
			});
		}

		Game.rebuildGrimoire = function() {
			if (typeof gp === 'undefined') { return false; }
			let M = gp;
			var str='';
			str+='<style>'+
			'#grimoireBG{background:url('+Game.resPath+'img/shadedBorders.png),url('+Game.resPath+'img/BGgrimoire.jpg);background-size:100% 100%,auto;position:absolute;left:0px;right:0px;top:0px;bottom:16px;}'+
			'#grimoireContent{position:relative;box-sizing:border-box;padding:4px 24px;}'+
			'#grimoireBar{max-width:95%;margin:4px auto;height:16px;}'+
			'#grimoireBarFull{transform:scale(1,2);transform-origin:50% 0;height:50%;}'+
			'#grimoireBarText{transform:scale(1,0.8);width:100%;position:absolute;left:0px;top:0px;text-align:center;color:#fff;text-shadow:-1px 1px #000,0px 0px 4px #000,0px 0px 6px #000;margin-top:2px;}'+
			'#grimoireSpells{text-align:center;width:100%;padding:8px;box-sizing:border-box;}'+
			'.grimoireIcon{pointer-events:none;margin:2px 6px 0px 6px;width:48px;height:48px;opacity:0.8;position:relative;}'+
			'.grimoirePrice{pointer-events:none;}'+
			'.grimoireSpell{box-shadow:4px 4px 4px #000;cursor:pointer;position:relative;color:#f33;opacity:0.8;text-shadow:0px 0px 4px #000,0px 0px 6px #000;font-weight:bold;font-size:12px;display:inline-block;width:60px;height:74px;background:url('+Game.resPath+'img/spellBG.png);}'+
			'.grimoireSpell.ready{color:rgba(255,255,255,0.8);opacity:1;}'+
			'.grimoireSpell.ready:hover{color:#fff;}'+
			'.grimoireSpell:hover{box-shadow:6px 6px 6px 2px #000;z-index:1000000001;top:-1px;}'+
			'.grimoireSpell:active{top:1px;}'+
			'.grimoireSpell.ready .grimoireIcon{opacity:1;}'+
			'.grimoireSpell:hover{background-position:0px -74px;} .grimoireSpell:active{background-position:0px 74px;}'+
			'.grimoireSpell:nth-child(4n+1){background-position:-60px 0px;} .grimoireSpell:nth-child(4n+1):hover{background-position:-60px -74px;} .grimoireSpell:nth-child(4n+1):active{background-position:-60px 74px;}'+
			'.grimoireSpell:nth-child(4n+2){background-position:-120px 0px;} .grimoireSpell:nth-child(4n+2):hover{background-position:-120px -74px;} .grimoireSpell:nth-child(4n+2):active{background-position:-120px 74px;}'+
			'.grimoireSpell:nth-child(4n+3){background-position:-180px 0px;} .grimoireSpell:nth-child(4n+3):hover{background-position:-180px -74px;} .grimoireSpell:nth-child(4n+3):active{background-position:-180px 74px;}'+
			
			'.grimoireSpell:hover .grimoireIcon{top:-1px;}'+
			'.grimoireSpell.ready:hover .grimoireIcon{animation-name:bounce;animation-iteration-count:infinite;animation-duration:0.8s;}'+
			'.noFancy .grimoireSpell.ready:hover .grimoireIcon{animation:none;}'+
			
			'#grimoireInfo{text-align:center;font-size:11px;margin-top:12px;color:rgba(255,255,255,0.75);text-shadow:-1px 1px 0px #000;}'+
			'</style>';
			str+='<div id="grimoireBG"></div>';
			str+='<div id="grimoireContent">';
				str+='<div id="grimoireSpells">';//did you know adding class="shadowFilter" to this cancels the "z-index:1000000001" that displays the selected spell above the tooltip? stacking orders are silly https://philipwalton.com/articles/what-no-one-told-you-about-z-index/
				for (var i in M.spells)
				{
					var me=M.spells[i];
					var icon=me.icon||[28,12];
					str+='<div class="grimoireSpell titleFont" id="grimoireSpell'+me.id+'" '+Game.getDynamicTooltip('Game.ObjectsById['+M.parent.id+'].minigame.spellTooltip('+me.id+')','this')+'><div class="usesIcon shadowFilter grimoireIcon" style="'+writeIcon(icon)+'"></div><div class="grimoirePrice" id="grimoirePrice'+me.id+'">-</div></div>';
				}
				str+='</div>';
				var icon=[29,14];
				str+='<div id="grimoireBar" class="smallFramed meterContainer" style="width:1px;"><div '+Game.getDynamicTooltip('Game.ObjectsById['+M.parent.id+'].minigame.refillTooltip','this')+' id="grimoireLumpRefill" class="usesIcon shadowFilter lumpRefill" style="left:-40px;top:-17px;background-position:'+(-icon[0]*48)+'px '+(-icon[1]*48)+'px;"></div><div id="grimoireBarFull" class="meter filling" style="width:1px;"></div><div id="grimoireBarText" class="titleFont"></div><div '+Game.getTooltip('<div style="padding:8px;width:300px;font-size:11px;text-align:center;">'+loc("This is your magic meter. Each spell costs magic to use.<div class=\"line\"></div>Your maximum amount of magic varies depending on your amount of <b>Wizard towers</b>, and their level.<div class=\"line\"></div>Magic refills over time. The lower your magic meter, the slower it refills.")+'</div>')+' style="position:absolute;left:0px;top:0px;right:0px;bottom:0px;"></div></div>';
				str+='<div id="grimoireInfo"></div>';
			str+='</div>';
			l('rowSpecial7').innerHTML=str;
			M.magicBarL=l('grimoireBar');
			M.magicBarFullL=l('grimoireBarFull');
			M.magicBarTextL=l('grimoireBarText');
			M.lumpRefill=l('grimoireLumpRefill');
			M.infoL=l('grimoireInfo');
			for (var i in M.spells)
			{
				var me=M.spells[i];
				AddEvent(l('grimoireSpell'+me.id),'click',function(spell){return function(){PlaySound('snd/tick.mp3');M.castSpell(spell);}}(me));
			}
			AddEvent(M.lumpRefill,'click',function(){
				if (M.magic<M.magicM)
				{Game.refillLump(1,function(){
					M.magic+=100;
					M.magic=Math.min(M.magic,M.magicM);
					PlaySound('snd/pop'+Math.floor(Math.random()*3+1)+'.mp3',0.75);
				});}
			});
		}

        //Garden changes
		this.reworkGarden = function() {
			if (!Game.Objects['Farm'].minigameLoaded || gardenUpdated) { return; }
			
		    M=Game.Objects['Farm'].minigame//Declaring M.soilsById so computeEffs works (this took hours to figure out)
			gap = M;
			Game.minigames.push(gap);
			if (l('gardenStats') === null) { return false; }
			M.soilsById.soilsById = [];
		    var n = 0;
		    for (var i in M.soils) {
		    	M.soils[i].id = n;
		    	M.soils[i].key = i;
		   		M.soilsById[n] = M.soils[i];
		        n++;
		    } 

		    M.harvestAll=function(type,mature,mortal)//Declaring harvestAll so M.convert works
		    {
			    var harvested=0;
			    for (var i=0;i<2;i++) {
				    for (var y=0;y<6;y++) {
					    for (var x=0;x<6;x++) {
						    if (M.plot[y][x][0]>=1) {
							    var doIt=true;
							    var tile=M.plot[y][x];
							    var me=M.plantsById[tile[0]-1];
							    if (type && me!=type) doIt=false;
							    if (mortal && me.immortal) doIt=false;
							    if (mature && tile[1]<me.mature) doIt=false;
							
							    if (doIt) harvested+=M.harvest(x,y)?1:0;
						    }
					    }
				    }
			    }
			    if (harvested>0) setTimeout(function(){PlaySound('snd/harvest1.mp3',1,0.2);},50);
			    if (harvested>2) setTimeout(function(){PlaySound('snd/harvest2.mp3',1,0.2);},150);
			    if (harvested>6) setTimeout(function(){PlaySound('snd/harvest3.mp3',1,0.2);},250);
		    }
			M.unlockProtectedSeeds = function() {
				M.unlockSeed(M.plants['bakerWheat']);
				if (decay.challengeStatus('combo4')) { M.unlockSeed(M.plants['thumbcorn']); }
				if (decay.challengeStatus('combo5')) { M.unlockSeed(M.plants['goldenClover']); M.unlockSeed(M.plants['nursetulip']); }
			}

			eval('M.clickTile='+M.clickTile.toString().replace('//if (M.freeze) return false;', 'if (!decay.gameCan.plant) { return false; }'));
			eval('M.isTileUnlocked='+M.isTileUnlocked.toString().replace('var level=M.parent.level;', 'var level=10;'));
			addLoc('Mature plants harvested: %1 (total: %2 (%3))');
			decay.harvestsTotalNGM = M.harvestsTotal;
			eval('gp.harvest='+M.harvest.toString().replace('.harvestsTotal++;', '.harvestsTotal++; decay.harvestsTotalNGM++;'));
			eval('M.draw='+M.draw.toString().replace('M.parent.level', '10').replace('M.parent.level', '10').replace(`l('gardenStats').innerHTML=loc("Mature plants harvested: %1 (total: %2)",[Beautify(M.harvests),Beautify(M.harvestsTotal)]);`, `l('gardenStats').innerHTML=loc((decay.harvestsTotalNGM==M.harvestsTotal?"Mature plants harvested: %1 (total: %2)":"Mature plants harvested: %1 (total: %2 (%3))"),[Beautify(M.harvests),Beautify(M.harvestsTotal),Beautify(decay.harvestsTotalNGM)]);`));
			M.selectedTile = [-1, -1];
			eval('M.buildPlot='+M.buildPlot.toString().replace(`if (plants>=6*6) Game.Win('In the garden of Eden (baby)');`, `M.checkGardenOfEden();`).replace(`'this')`, `'this').replace('.wobble();', '.wobble(); gap.selectedTile = ['+x+','+y+'];').replace('shouldHide=1;', 'shouldHide=1; gap.selectedTile = [-1, -1];')`).replace(`l('gardenPlot').innerHTML=str;`, `l('gardenPlot').innerHTML=str;`));
			M.checkGardenOfEden = function() {
				var plants = {};
				for (let i in M.plantsById) {
					plants[parseInt(i)+1] = false;
				}
				for (let i in M.plot) {
					for (let ii in M.plot[i]) {
						if (M.plot[i][ii][0]) {
							plants[M.plot[i][ii][0]] = true;
						}
					}
				}
				for (let i in plants) {
					if (!plants[i]) { return false; }
				}
				Game.Win('In the garden of Eden (baby)');
			}
			l('gardenPlot').innerHTML = ''; //nukes all plants, gotta get them back up somehow
			M.buildPlot();
			replaceAchievDesc('In the garden of Eden (baby)', 'Have at least <b>one</b> copy of every species of plant (of any growth stage) in your garden simultaneously, then let a tick pass.<q>Isn\'t tending to those precious little plants just so rock and/or roll?</q>');
			
			const chanceChanges=[[0.07, 0.12], [0.06, 0.11], [0.05, 0.1], [0.04, 0.08], [0.03, 0.06], [0.02, 0.04], [0.01, 0.03], [0.005, 0.2], [0.002, 0.01], [0.001, 0.008], [0.0007, 0.007], [0.0001, 0.002]];
			var changeStr = M.getMuts.toString();
			for (let i in chanceChanges) {
				changeStr = replaceAll(chanceChanges[i][0].toString(), chanceChanges[i][1].toString(), changeStr);
			}
			eval('M.getMuts='+changeStr);

			const ageChange = function(name, newTick, newTickR) {
				gap.plants[name].ageTick = newTick;
				gap.plants[name].ageTickR = newTickR;
			}

			ageChange('elderwort', 2, 2); ageChange('drowsyfern', 1, 1.5); ageChange('queenbeet', 2.5, 2.5); ageChange('bakeberry', 2.5, 1); ageChange('queenbeetLump', 0.4, 0.4);
			ageChange('duketater', 0.05, 2.2); ageChange('doughshroom', 2, 2.5); ageChange('tidygrass', 1, 2); ageChange('everdaisy', 1.75, 0); ageChange('nursetulip', 2, 4); ageChange('cronerice', 0.8, 3); ageChange('clover', 2, 3); ageChange('whiskerbloom', 4, 3); ageChange('wrinklegill', 4, 4);
				
			//Nerfing some plants effects
			eval("M.computeEffs="+M.computeEffs.toString().replace("effs.cursorCps+=0.01*mult","effs.cursorCps+=0.005*mult"));
			eval("M.computeEffs="+M.computeEffs.toString().replace("else if (name=='whiskerbloom') effs.milk+=0.002*mult;","else if (name=='whiskerbloom') effs.milk+=0.001*mult;"));
			eval("M.computeEffs="+M.computeEffs.toString().replace("goldenClover') effs.goldenCookieFreq+=0.03*mult;","goldenClover') { effs.goldenCookieFreq+=0.03*mult; effs.goldenCookieEffDur*=1-0.015; effs.goldenCookieGain+=1.5; }"));
				
			eval("M.convert="+M.convert.toString().replace("Game.gainLumps(10);","Game.gainLumps(30);").replace(`M.unlockSeed(M.plants['bakerWheat']);`, `M.unlockProtectedSeeds();`));

		    //Desc   	 
			M.plants['bakerWheat'].children=['bakerWheat','thumbcorn','cronerice','gildmillet','bakeberry','clover','goldenClover','chocoroot','tidygrass'];
			M.plants['thumbcorn'].children=['bakerWheat','thumbcorn','gildmillet','glovemorel'];
			M.plants['wrinklegill'].children=['cronerice','elderwort','shriekbulb'];

	        //Effect desc
			M.plants['whiskerbloom'].effsStr='<div class="green">&bull;'+loc("milk effects")+' +0.05%</div>';
			M.plants['glovemorel'].effsStr='<div class="green">&bull;'+loc("cookies/click")+' +4%</div><div class="green">&bull; '+loc("%1 CpS",Game.Objects['Cursor'].single)+' +0.5%</div><div class="red">&bull; '+loc("CpS")+' -1%</div>';
			M.plants['goldenClover'].effsStr='<div class="green">&bull; '+loc("golden cookie frequency")+' +3%</div><div class="green">&bull; '+loc("golden cookie gains")+' +150%</div><div class="red">&bull; '+loc('golden cookie effect duration')+' -1.5%</div>';

			M.soils.dirt.tick = 2; M.soils.fertilizer.tick = 1; M.soils.clay.tick = 5; M.soils.pebbles.tick = 2; M.soils.woodchips.tick = 2;
			M.soils.dirt.effsStr = '<div class="gray">&bull; '+loc("tick every %1",'<b>'+Game.sayTime(2*60*Game.fps)+'</b>')+'</div>';
			M.soils.fertilizer.effsStr = '<div class="gray">&bull; '+loc("tick every %1",'<b>'+Game.sayTime(1*60*Game.fps)+'</b>')+'</div><div class="red">&bull; '+loc("passive plant effects")+' <b>-25%</b></div><div class="red">&bull; '+loc("weed growth")+' <b>+20%</b></div>';
			M.soils.clay.effsStr = '<div class="gray">&bull; '+loc("tick every %1",'<b>'+Game.sayTime(5*60*Game.fps)+'</b>')+'</div><div class="green">&bull; '+loc("passive plant effects")+' <b>+25%</b></div>';
			M.soils.pebbles.effsStr = '<div class="gray">&bull; '+loc("tick every %1",'<b>'+Game.sayTime(2*60*Game.fps)+'</b>')+'</div><div class="red">&bull; '+loc("passive plant effects")+' <b>-75%</b></div><div class="green">&bull; '+loc("<b>%1% chance</b> of collecting seeds automatically when plants expire",35)+'</div><div class="green">&bull; '+loc("weed growth")+' <b>-90%</b></div>';
			M.soils.woodchips.effsStr = '<div class="gray">&bull; '+loc("tick every %1",'<b>'+Game.sayTime(2*60*Game.fps)+'</b>')+'</div><div class="red">&bull; '+loc("passive plant effects")+' <b>-75%</b></div><div class="green">&bull; '+loc("plants spread and mutate <b>%1 times more</b>",3)+'</div><div class="green">&bull; '+loc("weed growth")+' <b>-90%</b></div>';

			M.forceMuts = false;
			//I absolutely hate modifying event listeners that orteil made
			eval('Game.refillLump='+Game.refillLump.toString().replace('func();', 'func(); if (gap.loopsMult == 3) { gap.forceMuts = true; }'));

			var gardenMutsStr = selectStatement(M.logic.toString(), M.logic.toString().indexOf('for (var loop=0;loop<loops;loop++)'), 0); 
			var gardenMutsStrNew = gardenMutsStr.replace('var muts=M.getMuts(neighs,neighsM);', 'var muts=M.getMuts(neighs,neighsM); if (M.forceMuts && muts.length > 0) { loop--; } else if (M.forceMuts) { break; }').replace('if (list.length>0) M.plot[y][x]=[M.plants[choose(list)].id+1,0];', 'if (list.length>0) { M.plot[y][x]=[M.plants[choose(list)].id+1,0]; break; }');
			gardenMutsStrNew = gardenMutsStrNew.replace('var chance=0.002*weedMult*M.plotBoost[y][x][2];', 'var chance=0.002*weedMult*M.plotBoost[y][x][2]; if (M.forceMuts) { chance = 1; }'); 
			eval('M.logic='+M.logic.toString().replace(gardenMutsStr, gardenMutsStrNew).replace('M.toCompute=true;', 'M.toCompute=true; M.forceMuts = false;'));
			addLoc('Click to refill your soil timer and trigger <b>1</b> plant growth tick with a <b>guaranteed mutation</b> on <b>every</b> tile that can have a mutation, for the price of %1.');
			eval('M.refillTooltip='+M.refillTooltip.toString().replace(`with <b>x%1</b> spread and mutation rate for %2.",[3,'<span class="price lump">'+loc("%1 sugar lump",LBeautify(1))+'</span>']`, `with a <b>guaranteed mutation</b> on <b>every</b> tile that can have a mutation, for the price of %1.",['<span class="price lump">'+loc("%1 sugar lump",LBeautify(1))+'</span>']`));

			eval('M.buildPanel='+M.buildPanel.toString().replace('1000*60*10', '1000*60*3').replace('if (/* !M.freeze && */Game.keys[16] && Game.keys[17])', 'if (!decay.gameCan.selectSeeds) { return false; } if (Game.keys[16] && Game.keys[17])'));

			eval('M.tools.harvestAll.func='+M.tools.harvestAll.func.toString().replace(`PlaySound('snd/toneTick.mp3');`, `if (!decay.gameCan.useGardenTools) { return; } PlaySound('snd/toneTick.mp3');`));
			eval('M.tools.freeze.func='+M.tools.freeze.func.toString().replace(`PlaySound('snd/toneTick.mp3');`, `if (!decay.gameCan.useGardenTools) { return; } PlaySound('snd/toneTick.mp3');`).replace('this', `l('gardenTool-2')`).replace('this', `l('gardenTool-2')`));
			eval('M.tools.convert.func='+M.tools.convert.func.toString().replace(`PlaySound('snd/toneTick.mp3');`, `if (!decay.gameCan.useGardenTools) { return; } PlaySound('snd/toneTick.mp3');`));

			M.buildPanel();

            //Sac desc
			M.tools['convert'].desc=loc("A swarm of sugar hornets comes down on your garden, <span class=\"red\">destroying every plant as well as every seed you've unlocked</span> - leaving only a %1 seed.<br>In exchange, they will grant you <span class=\"green\">%2</span>.<br>This action is only available with a complete seed log.",[loc("Baker's wheat"),loc("%1 sugar lump",LBeautify(30))]);
			eval("M.askConvert="+M.askConvert.toString().replace("10","30"));
			eval("M.convert="+M.convert.toString().replace("10","30"));

			eval('M.unlockSeed='+M.unlockSeed.toString().replace('me.unlocked=1;', 'me.unlocked=1; decay.triggerNotif("garden"); '));

			eval('M.computeEffs='+M.computeEffs.toString().replace('buildingCost:1,', 'buildingCost:1, wrinklerApproach:1, wrathReplace:1, haltPower:1, decayRate:1, decayMomentum:1').replace(`else if (name=='wardlichen') {effs.wrinklerSpawn*=1-0.15*mult;effs.wrathCookieFreq*=1-0.02*mult;}`, `else if (name=='wardlichen') {effs.haltPower+=0.02*mult; effs.wrathReplace*=1-0.02*mult;}`).replace(`else if (name=='wrinklegill') {effs.wrinklerSpawn+=0.02*mult;effs.wrinklerEat+=0.01*mult;}`,`else if (name=='wrinklegill') {effs.wrinklerApproach*=1-0.05*mult;}`).replace(`effs.wrathCookieGain+=0.01*mult;effs.wrathCookieFreq+=0.01*mult;`,`effs.wrinklerApproach*=1-0.02*mult; effs.haltPower+=0.01*mult;`).replace(`effs.goldenCookieGain+=0.01*mult;effs.goldenCookieFreq+=0.01*mult;effs.itemDrops+=0.01*mult;`, `effs.decayRate *= 1 - 0.02*mult; effs.decayMomentum *= 1 - 0.02*mult;`).replace(`effs.goldenCookieGain+=0.01*mult;effs.goldenCookieEffDur+=0.001*mult;`, `effs.goldenCookieGain+=3.89*mult;effs.goldenCookieEffDur+=0.001*mult;`).replace(`'shriekbulb') {effs.cps*=1-0.02*mult;}`, `'shriekbulb') {effs.cps*=1-0.02*mult;} else if (name=='tidygrass') { effs.decayMomentum *= 1 - 0.05*mult; } else if (name=='everdaisy') { effs.decayRate *= 1 - 0.03*mult; }`).replace(`else if (name=='whiteChocoroot') effs.goldenCookieGain+=0.01*mult;`, `else if (name=='whiteChocoroot') effs.goldenCookieGain+=1.88*mult;`));
			addLoc('all decay-halting sources\' effect');
			addLoc('wrath cookies replacement');
			addLoc('wrinklers approach speed');
			addLoc('decay-halting power');
			addLoc('decay rates');
			addLoc('decay momentum');
			addLoc('decay propagation');
			M.plants['wardlichen'].effsStr='<div class="green">&bull; '+loc("all decay-halting sources' effect")+' +2%</div><div class="gray">&bull; '+loc("wrath cookies replacement")+' -2%</div>';
			M.plants['wrinklegill'].effsStr='<div class="green">&bull; '+loc("wrinklers approach speed")+' -5%</div>';
			M.plants['elderwort'].effsStr='<div class="green">&bull; '+loc("wrinklers approach speed")+' -2%</div><div class="green">&bull; '+loc("all decay-halting source' effect")+' +1%</div><div class="green">&bull; '+loc("%1 CpS",Game.Objects['Grandma'].single)+' +1%</div><div class="green">&bull; '+loc("immortal")+'</div><div class="gray">&bull; '+loc("surrounding plants (%1x%1) age %2% faster",[3,3])+'</div>';
			M.plants['shimmerlily'].effsStr='<div class="green">&bull; '+loc('decay propagation')+' -2%</div>';
			M.plants['gildmillet'].effsStr='<div class="green">&bull; '+loc("golden cookie gains")+' +389%</div><div class="green">&bull; '+loc("golden cookie effect duration")+' +0.1%</div>';
			M.plants['tidygrass'].effsStr='<div class="green">&bull; '+loc("surrounding tiles (%1x%1) develop no weeds or fungus",5)+'</div><div class="green">&bull; '+loc('decay momentum')+' -5%</div>';
			M.plants['everdaisy'].effsStr='<div class="green">&bull; '+loc("surrounding tiles (%1x%1) develop no weeds or fungus",3)+'</div><div class="green">&bull; '+loc("decay rates")+' -3%</div><div class="green">&bull; '+loc('immortal')+'</div>';
			M.plants['whiteChocoroot'].effsStr='<div class="green">&bull; '+loc("golden cookie gains")+' +188%</div><div class="green">&bull; '+loc("harvest when mature for +%1 of CpS (max. %2% of bank)",[Game.sayTime(3*60*Game.fps),3])+'</div><div class="green">&bull; '+loc("predictable growth")+'</div>'
			eval("M.tools['info'].descFunc="+M.tools['info'].descFunc.toString().replace(`buildingCost:{n:'building costs',rev:true},`, `buildingCost:{n:'building costs',rev:true}, wrinklerApproach:{n:'wrinklers approach speed',rev:true}, wrathReplace:{n:'wrath cookies replacement',rev:true}, haltPower:{n:'decay-halting power'}, decayRate:{n:'decay rates',rev:true}, decayMomentum:{n:'decay momentum',rev:true}`));

			M.computeStepT();
			M.computeEffs();
			gardenUpdated = true; 
		};

		this.reworkStock = function() {
			if (!Game.Objects['Bank'].minigameLoaded || stockUpdated) { return; }
			
			sp = Game.Objects['Bank'].minigame;
			Game.minigames.push(sp);
			
			sp.secondsPerTick=60;
			l('bankNextTick').insertAdjacentHTML('afterend', '<div style="display:inline-block;"><div id="banktickedit" style="display:none;" class="bankButton bankButtonSell"'+'>'+loc("change tick speed"));
			Game.stockMaximumSpeed = 10;
			addLoc('Input to modify the tick speed.');
			addLoc('(Minimum: <b>%1</b> per tick)');
			sp.changeTickspeed = function() {
				if (decay.gameCan.changeTickspeed) { Game.Prompt('<h3>Change tick speed</h3>'+'<div class="line"></div>'+loc("Input to modify the tick speed.")+'<br>'+loc('(Minimum: <b>%1</b> per tick)', Game.sayTime(Game.stockMaximumSpeed * Game.fps))+'<div class="line"></div>'+'<input type="text" id="valuePrompt" style="text-align:center;/></div>',[[("Commit"),'Game.ClosePrompt(); if (Number((l(\'valuePrompt\').value)) >= Game.stockMaximumSpeed) { Game.Objects[`Bank`].minigame.secondsPerTick=Number((l(\'valuePrompt\').value)); } else if (Number((l(\'valuePrompt\').value)) < Game.stockMaximumSpeed) { Game.Objects[`Bank`].minigame.secondsPerTick=Game.stockMaximumSpeed; } '],("Cancel")]); }
			}
			AddEvent(l('banktickedit'),'click',function(e){
				sp.changeTickspeed(); 
			});

			eval('sp.buyGood='+sp.buyGood.toString().replace('var me=M.goodsById[id];', 'if (!decay.gameCan.buyGoods) { return; } var M = sp; var me=M.goodsById[id];'));
			eval('sp.sellGood='+sp.sellGood.toString().replace('var me=M.goodsById[id];', 'if (!decay.gameCan.sellGoods) { return; } var M = sp; var me=M.goodsById[id];'));
			eval('sp.takeLoan='+sp.takeLoan.toString().replace('var loan=M.loanTypes[id-1];', 'if (!decay.gameCan.takeLoans) { return; } var loan=sp.loanTypes[id-1];'));

			sp.offices[0].cost[1] = 1;
			sp.offices[1].cost[1] = 1;
			sp.offices[2].cost[1] = 2;
			sp.offices[3].cost[1] = 2;
			sp.offices[4].cost[1] = 3;
			sp.offices[5].cost[1] = 3;

        	l('banktickedit').style.removeProperty('display');

			stockUpdated = true;
	    };

		//Buffing Muridal
		eval('Game.mouseCps='+Game.mouseCps.toString().replace("if (godLvl==1) mult*=1.15;","if (godLvl==1) mult*=1.25;"))
		eval('Game.mouseCps='+Game.mouseCps.toString().replace("else if (godLvl==2) mult*=1.20;","else if (godLvl==2) mult*=1.20;"))
		eval('Game.mouseCps='+Game.mouseCps.toString().replace("else if (godLvl==3) mult*=1.1;","else if (godLvl==3) mult*=1.15;"))

        //Nerfing Mokalsium
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("if (godLvl==1) milkMult*=1.1;","if (godLvl==1) milkMult*=1.08;"))
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("else if (godLvl==2) milkMult*=1.05;","else if (godLvl==2) milkMult*=1.04;"))
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("else if (godLvl==3) milkMult*=1.03;","else if (godLvl==3) milkMult*=1.02;"))

        //Buffing Mokalsium negative effect
		eval('Game.shimmerTypes["golden"].getTimeMod='+Game.shimmerTypes['golden'].getTimeMod.toString().replace("if (godLvl==1) m*=1.15;","if (godLvl==1) m*=1.20;"));
		eval('Game.shimmerTypes["golden"].getTimeMod='+Game.shimmerTypes['golden'].getTimeMod.toString().replace("else if (godLvl==2) m*=1.1;","else if (godLvl==2) m*=1.15;"));
		eval('Game.shimmerTypes["golden"].getTimeMod='+Game.shimmerTypes['golden'].getTimeMod.toString().replace("else if (godLvl==3) m*=1.05;","else if (godLvl==3) m*=1.1;"));

        //Buffing Jeremy
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("if (godLvl==1) buildMult*=1.1;","if (godLvl==1) buildMult*=1.2;"))
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("else if (godLvl==2) buildMult*=1.06;","else if (godLvl==2) buildMult*=1.14;"))
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("else if (godLvl==3) buildMult*=1.03;","else if (godLvl==3) buildMult*=1.08;"))
		eval('Game.shimmerTypes["golden"].getTimeMod='+Game.shimmerTypes["golden"].getTimeMod.toString().replace('if (godLvl==1) m*=1.1;', 'if (godLvl==1) m*=1.06;').replace('else if (godLvl==2) m*=1.06;', 'else if (godLvl==2) m*=1.04;').replace('else if (godLvl==3) m*=1.03;', 'else if (godLvl==3) m*=1.02;'))

        //Nerfing? Cyclius
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("if (godLvl==1) mult*=0.15*Math.sin((Date.now()/1000/(60*60*3))*Math.PI*2);","if (godLvl==1) mult*=1+0.15*Math.sin((Date.now()/1000/(60*60*12))*Math.PI*2);"));
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("else if (godLvl==2) mult*=1+0.15*Math.sin((Date.now()/1000/(60*60*12))*Math.PI*2);","else if (godLvl==2) mult*=1+0.15*Math.sin((Date.now()/1000/(60*60*24))*Math.PI*2);"));
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("else if (godLvl==3) mult*=1+0.15*Math.sin((Date.now()/1000/(60*60*24))*Math.PI*2);","else if (godLvl==3) mult*=1+0.15*Math.sin((Date.now()/1000/(60*60*48))*Math.PI*2);"));

		//buffing vomitrax
		eval('Game.shimmerTypes["golden"].popFunc='+Game.shimmerTypes["golden"].popFunc.toString().replace(`if (Game.Has('Dragon fang')) mult*=1.03;`, `if (Game.Has('Dragon fang')) { mult*=1.03; } if (Game.hasGod) { const lvl = Game.hasGod('decadence'); if (lvl==1) { mult*=7.77; } else if (lvl==2) { mult*=5.55; } else if (lvl==3) { mult*=3.33; } }`));

		//removes skruuia other functions
		eval('Game.shimmerTypes["golden"].initFunc='+Game.shimmerTypes["golden"].initFunc.toString().replace("(Game.hasGod && Game.hasGod('scorn'))", 'false'));

		//dotjeiess original functions removal
		eval('Game.GetHeavenlyMultiplier='+Game.GetHeavenlyMultiplier.toString().replace('Game.hasGod', 'false'));
		eval('Game.modifyBuildingPrice='+Game.modifyBuildingPrice.toString().replace('Game.hasGod','false'));

		//godzamok + earth shatterer + dragon orbs
		decay.halts['earthShatterer'] = new decay.haltChannel({
			keep: 0.1,
			decMult: 0.5,
			factor: 1,
			power: 0.6,
			tickspeedPow: 1
		});
		for (let i in Game.Objects) {
			eval('Game.Objects["'+i+'"].sell='+Game.Objects[i].sell.toString().replace(`if (godLvl==1) Game.gainBuff('devastation',10,1+sold*0.01);`, `if (godLvl==1) Game.gainBuff('devastation',10,1+sold*0.01,1+sold*0.01);`)
				 .replace(`else if (godLvl==2) Game.gainBuff('devastation',10,1+sold*0.005);`, `else if (godLvl==2) Game.gainBuff('devastation',10,1+sold*0.005,1+sold*0.004);`)
				 .replace(`else if (godLvl==3) Game.gainBuff('devastation',10,1+sold*0.0025);`,`else if (godLvl==3) Game.gainBuff('devastation',10,1+sold*0.0025,1+sold*0.0015); if (Game.hasBuff('Devastation')) { decay.triggerNotif('godzamok'); }`)
				 .replace('if (success && Game.hasGod)', 'if (success && (Game.auraMult("Earth Shatterer") || (decay.challengeStatus("dualcast") && this.name == "Wizard tower"))) { decay.stop(Math.pow(sold, 1 / 3) * (Game.auraMult("Earth Shatterer")?Game.auraMult("Earth Shatterer"):0.1) * 1, "earthShatterer"); } if (success && Game.hasGod)')
				 .replace('if (godLvl==1) { old.multClick+=sold*0.01; old.arg2+=sold*0.01; }').replace('else if (godLvl==2) old.multClick+=sold*0.005;', 'else if (godLvl==2) { old.multClick+=sold*0.005; old.arg2+=sold*0.004; }')
				 .replace('else if (godLvl==3) old.multClick+=sold*0.0025;', 'else if (godLvl==3) { old.multClick+=sold*0.0025; old.arg2+=sold*0.0015; }')
				 .replace(`Game.auraMult('Dragon Orbs')*0.1`, `Game.auraMult('Dragon Orbs')*(decay.challengeStatus('comboOrbs')?0.25:0.1)`)
				 .replace('if (buffsN==0)', 'if (buffsN<=(decay.challengeStatus("allBuffStack")?1:0))')
				);
		}
		
		addLoc('Buff boosts clicks by +%1% for every building sold for %2 seconds, ');
		addLoc('but also temporarily increases decay momentum by %1% with every building sold.');
		Game.getSwapTooltip = function() {
			var mult = 1;
			if (decay.challengeStatus('godz')) { mult *= 0.8; }
			return '<div style="padding:8px;width:350px;font-size:11px;text-align:center;">'+loc("Each time you slot a spirit, you use up one worship swap.<div class=\"line\"></div>If you have 2 swaps left, the next one will refill after %1.<br>If you have 1 swap left, the next one will refill after %2.<br>If you have 0 swaps left, you will get one after %3.<div class=\"line\"></div>Unslotting a spirit costs no swaps.",[Game.sayTime(60*5*Game.fps*mult, -1),Game.sayTime(60*20*Game.fps*mult, -1),Game.sayTime(60*60*Game.fps*mult, -1)])+'</div>';
		}
		this.reworkPantheon = function() {
			if (!Game.Objects['Temple'].minigameLoaded || pantheonUpdated) { return; }
			
			//Changing the desc
			var temp = Game.Objects['Temple'].minigame;
			Game.minigames.push(temp);
			if (l('templeInfo') === null) { return false; }
			decay.triggerNotif('boost');
			if (!decay.prefs.preventNotifs['momentum']) { if (!decay.momentumUnlocked) { decay.triggerNotif('momentumUnlock'); } }
			pp = temp;

			eval('pp.logic='+replaceAll('M.', 'pp.', pp.logic.toString()));
			eval('pp.logic='+pp.logic.toString().replace('t=1000*60*60', 't=1000*5*60').replace('t=1000*60*60*16', 't=1000*60*60').replace('t=1000*60*60*4;', '{ t=1000*60*20; } if (decay.challengeStatus("godz")) { t /= 5; }'));
			eval('pp.draw='+replaceAll('M.', 'pp.', pp.draw.toString()));
			eval('pp.draw='+pp.draw.toString().replace('t=1000*60*60', 't=1000*5*60').replace('t=1000*60*60*16', 't=1000*60*60').replace('t=1000*60*60*4', '{ t=1000*60*20; } if (decay.challengeStatus("godz")) { t /= 5; }'));

			l('templeInfo').innerHTML = '<div '+Game.getDynamicTooltip('Game.ObjectsById['+pp.parent.id+'].minigame.refillTooltip','this')+' id="templeLumpRefill" class="usesIcon shadowFilter lumpRefill" style="left:-6px;top:-10px;background-position:'+(-29*48)+'px '+(-14*48)+'px;"></div><div id="templeSwaps" '+Game.getDynamicTooltip('Game.getSwapTooltip')+'>-</div>'; pp.swapsL = l('templeSwaps');
			
			temp.gods['ruin'].desc1='<span class="green">'+ loc("Buff boosts clicks by +%1% for every building sold for %2 seconds, ", [1, 10])+'</span> <span class="red">'+loc("but also temporarily increases decay momentum by %1% with every building sold.",[1])+'</span>';
			temp.gods['ruin'].desc2='<span class="green">'+ loc("Buff boosts clicks by +%1% for every building sold for %2 seconds, ", [0.5, 10])+'</span> <span class="red">'+loc("but also temporarily increases decay momentum by %1% with every building sold.",[0.4])+'</span>';
			temp.gods['ruin'].desc3='<span class="green">'+ loc("Buff boosts clicks by +%1% for every building sold for %2 seconds, ", [0.25, 10])+'</span> <span class="red">'+loc("but also temporarily increases decay momentum by %1% with every building sold.",[0.15])+'</span>';
			
			temp.gods['mother'].desc1='<span class="green">'+loc("Milk is <b>%1% more powerful</b>.",8)+'</span> <span class="red">'+loc("Golden and wrath cookies appear %1% less.",20)+'</span>';
			temp.gods['mother'].desc2='<span class="green">'+loc("Milk is <b>%1% more powerful</b>.",4)+'</span> <span class="red">'+loc("Golden and wrath cookies appear %1% less.",15)+'</span>';
			temp.gods['mother'].desc3='<span class="green">'+loc("Milk is <b>%1% more powerful</b>.",2)+'</span> <span class="red">'+loc("Golden and wrath cookies appear %1% less.",10)+'</span>';

			temp.gods['labor'].desc1='<span class="green">'+loc("Clicking is <b>%1%</b> more powerful.",25)+'</span> <span class="red">'+loc("Buildings produce %1% less.",3)+'</span>';
			temp.gods['labor'].desc2='<span class="green">'+loc("Clicking is <b>%1%</b> more powerful.",20)+'</span> <span class="red">'+loc("Buildings produce %1% less.",2)+'</span>';
			temp.gods['labor'].desc3='<span class="green">'+loc("Clicking is <b>%1%</b> more powerful.",15)+'</span> <span class="red">'+loc("Buildings produce %1% less.",1)+'</span>';

			temp.gods['ages'].desc1=loc("Effect cycles over %1 hours.",12);
			temp.gods['ages'].desc2=loc("Effect cycles over %1 hours.",24);
			temp.gods['ages'].desc3=loc("Effect cycles over %1 hours.",48);

			temp.gods['industry'].desc1='<span class="green">'+loc("Buildings produce %1% more.",20)+'</span> <span class="red">'+loc("Golden and wrath cookies appear %1% less.",6)+'</span>';
			temp.gods['industry'].desc2='<span class="green">'+loc("Buildings produce %1% more.",14)+'</span> <span class="red">'+loc("Golden and wrath cookies appear %1% less.",4)+'</span>';
			temp.gods['industry'].desc3='<span class="green">'+loc("Buildings produce %1% more.",8)+'</span> <span class="red">'+loc("Golden and wrath cookies appear %1% less.",2)+'</span>';

			addLoc('Wrinkler approach speed <b>-%1%</b>.');
			addLoc('Wrath cookies replaces Golden cookies with %1% less decay.');
			temp.gods['scorn'].desc1='<span class="green">'+loc('Wrinkler approach speed <b>-%1%</b>.', 45)+'</span> <span class="red">'+loc('Wrath cookies replaces Golden cookies with %1% less decay.', 50);
			temp.gods['scorn'].desc2='<span class="green">'+loc('Wrinkler approach speed <b>-%1%</b>.', 30)+'</span> <span class="red">'+loc('Wrath cookies replaces Golden cookies with %1% less decay.', 33);
			temp.gods['scorn'].desc3='<span class="green">'+loc('Wrinkler approach speed <b>-%1%</b>.', 15)+'</span> <span class="red">'+loc('Wrath cookies replaces Golden cookies with %1% less decay.', 20);
			delete temp.gods['scorn'].descBefore;

			addLoc('Purifying decay grants a buff.');
			addLoc('-%1% decay for %2 seconds.');
			addLoc('Purifying decay grants a buff that weakens decay propagation.');
			temp.gods['creation'].descBefore='<span class="green">'+loc('Purifying decay grants a buff that weakens decay propagation.')+'</span>';
			temp.gods['creation'].desc1='<span class="green">'+loc('-%1% decay for %2 seconds.', [48, 4])+'</span>';
			temp.gods['creation'].desc2='<span class="green">'+loc('-%1% decay for %2 seconds.', [24, 16])+'</span>';
			temp.gods['creation'].desc3='<span class="green">'+loc('-%1% decay for %2 seconds.', [12, 64])+'</span>';

			addLoc('Decay propagation rate -%1%.');
			temp.gods['asceticism'].desc1='<span class="green">'+loc("+%1% base CpS.",15)+' '+loc('Decay propagation rate -%1%.', 30)+'</span>';
			temp.gods['asceticism'].desc2='<span class="green">'+loc("+%1% base CpS.",10)+' '+loc('Decay propagation rate -%1%.', 20)+'</span>';
			temp.gods['asceticism'].desc3='<span class="green">'+loc("+%1% base CpS.",5)+' '+loc('Decay propagation rate -%1%.', 10)+'</span>';

            //Making Cyclius display the nerf?
			eval("temp.gods['ages'].activeDescFunc="+Game.Objects['Temple'].minigame.gods['ages'].activeDescFunc.toString().replace("if (godLvl==1) mult*=0.15*Math.sin((Date.now()/1000/(60*60*3))*Math.PI*2);","if (godLvl==1) mult*=0.15*Math.sin((Date.now()/1000/(60*60*12))*Math.PI*2);"));
			eval("temp.gods['ages'].activeDescFunc="+Game.Objects['Temple'].minigame.gods['ages'].activeDescFunc.toString().replace("else if (godLvl==2) mult*=0.15*Math.sin((Date.now()/1000/(60*60*12))*Math.PI*2);","else if (godLvl==2) mult*=0.15*Math.sin((Date.now()/1000/(60*60*24))*Math.PI*2);"));
        	eval("temp.gods['ages'].activeDescFunc="+Game.Objects['Temple'].minigame.gods['ages'].activeDescFunc.toString().replace("else if (godLvl==3) mult*=0.15*Math.sin((Date.now()/1000/(60*60*24))*Math.PI*2);","else if (godLvl==3) mult*=0.15*Math.sin((Date.now()/1000/(60*60*48))*Math.PI*2);"));

			addLoc('Golden and wrath cookie gain +%1%.');
			temp.gods['decadence'].desc1='<span class="green">'+loc("Golden and wrath cookie effect duration +%1%.",7)+' '+loc('Golden and wrath cookie gain +%1%.',777)+'</span> <span class="red">'+loc("Buildings grant -%1% CpS.",7)+'</span>';
			temp.gods['decadence'].desc2='<span class="green">'+loc("Golden and wrath cookie effect duration +%1%.",5)+' '+loc('Golden and wrath cookie gain +%1%.',555)+'</span> <span class="red">'+loc("Buildings grant -%1% CpS.",5)+'</span>';
			temp.gods['decadence'].desc3='<span class="green">'+loc("Golden and wrath cookie effect duration +%1%.",2)+' '+loc('Golden and wrath cookie gain +%1%.',333)+'</span> <span class="red">'+loc("Buildings grant -%1% CpS.",2)+'</span>';

			eval("temp.slotGod="+replaceAll('M', 'pp', temp.slotGod.toString()));
			eval("temp.slotGod="+temp.slotGod.toString().replace('Game.recalculateGains=true;', 'Game.recalculateGains=true; decay.setRates();').replace('if (slot==god.slot)', 'if (slot==god.slot || !decay.gameCan.slotGods)'));
			eval("temp.dropGod="+replaceAll('M', 'pp', temp.dropGod.toString()));
			eval('temp.dropGod='+temp.dropGod.toString().replace('if (!pp.dragging)', 'if (!pp.dragging || !decay.gameCan.slotGods)'));
			eval("temp.dragGod="+replaceAll('M', 'pp', temp.dragGod.toString()));
			eval('temp.dragGod='+temp.dragGod.toString().replace('pp.dragging=what;', 'if (!decay.gameCan.slotGods) { return; } pp.dragging=what;'));
				
			eval('temp.useSwap='+replaceAll('M', 'pp', temp.useSwap.toString()));
			temp.cancelSwapUseChance = function() {
				if (decay.challengeStatus('combo3')) { return 0.1; }
				return 0;
			}
			eval('temp.useSwap='+temp.useSwap.toString().replace('M.swapT=Date.now();', 'if (Math.random() < temp.cancelSwapUseChance()) { return; } M.swapT=Date.now();'))

			for (let i in pp.gods) {
				Game.godsPrimaryNameToCode[pp.gods[i].name.split(',')[0].toLowerCase()] = i;
			}
			pantheonUpdated = true;
		};

	
		//CBG buff
		addLoc('+%1 prestige level effect on CpS for %2!');
		new Game.buffType('haggler dream', function(time, pow) {
			return {
				name:'Haggler\'s dream',
				desc:loc("+%1 prestige level effect on CpS for %2!", [(pow - 1) * 100 + '%', Game.sayTime(time * Game.fps, -1)]),
				icon:[19, 7],
				time:time * Game.fps,
				power:pow,
				aura:1
			};
		});

        //Adding the custom buff to the code
		eval('Game.GetHeavenlyMultiplier='+Game.GetHeavenlyMultiplier.toString().replace("if (Game.Has('Lucky payout')) heavenlyMult*=1.01;", "if (Game.Has('Lucky payout')) heavenlyMult*=1.01; if (Game.hasBuff('haggler dream')) heavenlyMult*=Game.hasBuff('haggler dream').power;"));

		allValues('minigames');
		
		/*=====================================================================================
        Upgrades
        =======================================================================================*/

		decay.changeUpgradeDescs = function() {
			for (var i in Game.Objects) {//This is used so we can change the message that appears on all tired upgrades when a unshackled buiding is bought
            	for (var ii in Game.Objects[i].tieredUpgrades) {
            	    var me=Game.Objects[i].tieredUpgrades[ii];
            	    if (!(ii=='fortune')&&me.descFunc){eval('me.descFunc='+me.descFunc.toString().replace('this.buildingTie.id==1?0.5:(20-this.buildingTie.id)*0.1)*100','this.buildingTie.id==1?0.45:(20-this.buildingTie.id)*0.09)*100'));}
            	}
        	}  

	        for (var i in Game.Objects) {//This is used so we can change the desc of all unshackled upgrades
	            var s=Game.Upgrades['Unshackled '+Game.Objects[i].plural];
	            var id=Game.Objects[i].id;
	            if (!(i=='Cursor')) {s.baseDesc=s.baseDesc.replace(s.baseDesc.slice(0,s.baseDesc.indexOf('<q>')),'Tiered upgrades for <b>'+i+'</b> provide an extra <b>'+(id==1?'45':(20-id)*9)+'%</b> production.<br>Only works with unshackled upgrade tiers.');}
	        }

			eval('Game.mouseCps='+Game.mouseCps.toString().replace("if (Game.Has('Unshackled cursors')) add*=	25;","if (Game.Has('Unshackled cursors')) add*=	20;"))//Changing how much unshackled cursors give
			eval("Game.Objects['Cursor'].cps="+Game.Objects['Cursor'].cps.toString().replace("if (Game.Has('Unshackled cursors')) add*=	25;","if (Game.Has('Unshackled cursors')) add*=	20;"))//changing how much unshackled cursors buffs cursors
	
			var getStrThousandFingersGain=function(x)//Variable for the desc of unshackled cursor 
			{return loc("Multiplies the gain from %1 by <b>%2</b>.",[getUpgradeName("Thousand fingers"),x]);}
			Game.Upgrades['Unshackled cursors'].baseDesc=getStrThousandFingersGain(20)+'<q>These hands tell a story.</q>';//Changing the desc to reflect all the changes
	
			eval('Game.GetTieredCpsMult='+Game.GetTieredCpsMult.toString().replace("tierMult+=me.id==1?0.5:(20-me.id)*0.1;","tierMult+=me.id==1?0.45:(20-me.id)*0.09;"))//All unshackled upgrades produce 10% less

			Game.Upgrades['Wrinkly cookies'].power=15;
			Game.Upgrades['Wrinkly cookies'].baseDesc=loc("Cookie production multiplier <b>+%1% permanently</b>.",15)+'<q>The result of regular cookies left to age out for countless eons in a place where time and space are meaningless.</q>';
		}

		Game.registerHook('check', function() {
			if (Game.goldenClicksLocal>=1) { Game.Unlock('Lucky day'); }
			if (Game.goldenClicksLocal>=3) { Game.Unlock('Serendipity'); }
			if (Game.goldenClicksLocal>=7) { Game.Unlock('Get lucky'); }
		});

        Game.Upgrades['Pure heart biscuits'].basePrice *=    1;
		cookieChange('Pure heart biscuits', 4);
        Game.Upgrades['Ardent heart biscuits'].basePrice *=  100000000;
		cookieChange('Ardent heart biscuits', 5);
        Game.Upgrades['Sour heart biscuits'].basePrice *=    10000000000000000;
		cookieChange('Sour heart biscuits', 6);
        Game.Upgrades['Weeping heart biscuits'].basePrice *= 1000000000000000000000000;
		cookieChange('Weeping heart biscuits', 7);
        Game.Upgrades['Golden heart biscuits'].basePrice *=  100000000000000000000000000000000;
		cookieChange('Golden heart biscuits', 8);
		Game.Upgrades['Eternal heart biscuits'].basePrice *= 10000000000000000000000000000000000000000;
		cookieChange('Eternal heart biscuits', 9);
		Game.Upgrades['Prism heart biscuits'].basePrice *=   1000000000000000000000000000000000000000000000000;
		cookieChange('Prism heart biscuits', 10);

		const christmasDropStr = selectStatement(Game.shimmerTypes.reindeer.popFunc.toString(), Game.shimmerTypes.reindeer.popFunc.toString().indexOf('if (Math.random()>failRate)'));
		const replacedChristmasDropStr = `if (Math.random()>failRate)
					{
	 const arr = ['Christmas tree biscuits','Snowflake biscuits','Snowman biscuits','Holly biscuits','Candy cane biscuits','Bell biscuits','Present biscuits'];
						cookie=choose(arr);
	  for (let i = 0; i < 4; i++) { if (!Game.HasUnlocked(cookie) && !Game.Has(cookie)) { Game.Unlock(cookie); break; } else { cookie = choose(arr); if (i == 3) { cookie = ''; } } }
					}`
		eval('Game.shimmerTypes.reindeer.popFunc='+Game.shimmerTypes.reindeer.popFunc.toString().replace(christmasDropStr, replacedChristmasDropStr));

		Game.recalcAchievCount = function() {
			var counter = 0;
			for (let i in Game.Achievements) {
				if (Game.Achievements[i].won && Game.CountsAsAchievementOwned(Game.Achievements[i].pool)) { counter++; }
			}
			Game.AchievementsOwned = counter;
			return counter;
		}

		eval('Game.UpgradeSanta='+Game.UpgradeSanta.toString().replace('var moni=Math.pow(Game.santaLevel+1,Game.santaLevel+1);', 'var moni=Math.pow(Game.santaLevel*2,Game.santaLevel*2);'));
		eval('Game.ToggleSpecialMenu='+Game.ToggleSpecialMenu.toString().replace('var moni=Math.pow(Game.santaLevel+1,Game.santaLevel+1);', 'var moni=Math.pow(Game.santaLevel*2,Game.santaLevel*2);').replace('Math.pow(Game.santaLevel+1,Game.santaLevel+1)', 'Math.pow(Game.santaLevel*2,Game.santaLevel*2)'));
		Game.santaUpgradesBought = 0;
		Game.recalcSantaUpgradesBought = function() {
			let count = 0;
			for (let i in Game.santaDrops) {
				if (Game.Has(Game.santaDrops[i])) { count++; }
			}
			Game.santaUpgradesBought = count;
		}
		Game.recalcSantaUpgradesBought();
		Game.registerHook('check', Game.recalcSantaUpgradesBought);
		for (let i in Game.santaDrops) {
			Game.Upgrades[Game.santaDrops[i]].priceFunc=function(){return Math.pow(2525,Game.santaUpgradesBought)*2525;}
			Game.Upgrades[Game.santaDrops[i]].buyFunction=Game.recalcSantaUpgradesBought;
		}
		Game.Upgrades['Santa\'s dominion'].cost = Math.pow(28, 28);

		Game.synergyPriceFunc = function() { return (this.buildingTie1.basePrice*this.buildingTie2.basePrice)*Game.Tiers[this.tier].price*(Game.Has('Chimera')?0.98:1); }
		Game.Tiers.synergy1.price = 200;
		Game.Tiers.synergy2.price = 2000000000;
		for (let i in Game.Upgrades) {
			if (Game.Upgrades[i].tier == 'synergy1') {
				Game.Upgrades[i].basePrice = Game.Upgrades[i].buildingTie1.basePrice * Game.Upgrades[i].buildingTie2.basePrice * Game.Tiers['synergy1'].price;
                Game.Upgrades[i].priceFunc = Game.synergyPriceFunc;
			}
			if (Game.Upgrades[i].tier == 'synergy2') {
				Game.Upgrades[i].basePrice = Game.Upgrades[i].buildingTie1.basePrice * Game.Upgrades[i].buildingTie2.basePrice * Game.Tiers['synergy2'].price;
                Game.Upgrades[i].priceFunc = Game.synergyPriceFunc;
			}
		}

		for (let i in Game.Objects) {
			Game.Upgrades[Game.Objects[i].unshackleUpgrade].basePrice = Math.pow(Game.Objects[i].id + 1, 5.5)*30000000;
		}
		for (let i in Game.Tiers) {
			if (Game.Tiers[i].special) { continue; }
			Game.Upgrades[Game.Tiers[i].unshackleUpgrade].basePrice = Math.pow(parseFloat(i), 6)*20000000;
		}

		/*=====================================================================================
        Dragon auras
        =======================================================================================*/
		Game.getAuraUnlockCost = function(building) {
			let amount = 100;
			if (Game.ascensionMode == 42069 && decay.challengeStatus('easterTutorial')) { amount -= 20; }
			if (decay.challengeStatus('comboDragonCursor')) { amount /= 2; }
			if (decay.isConditional('comboOrbs')) { return 2; }
			if (decay.isConditional('easterTutorial')) { return 5; }

			return Math.floor(amount);
		}
		Game.getBakeDragonCookieCost = function() {
			let amount = 50;
			if (Game.ascensionMode == 42069 && decay.challengeStatus('dualcast')) { amount /= 2; }
			return amount;
		}
		Game.getDualwieldAuraCost = function() {
			let amount = 200;
			if (Game.ascensionMode == 42069 && decay.challengeStatus('dualcast')) { amount /= 2; }
			return amount;
		}
		Game.rebuildAuraCosts = function() {
			for (var i=0;i<Game.dragonLevels.length;i++) {
				var it=Game.dragonLevels[i];
				it.name=loc(it.name);
				if (i>=4 && i<Game.dragonLevels.length-3) {
					if (!EN) it.action=loc("Train %1",Game.dragonAuras[i-3].dname)+'<br><small>'+loc("Aura: %1",Game.dragonAuras[i-3].desc)+'</small>';
					if (i>=5) {
						it.costStr=function(building){return function(){return loc("%1 "+building.bsingle,LBeautify(Game.getAuraUnlockCost(building)));}}(Game.ObjectsById[i-5]);
						it.cost=function(building){return function(){return building.amount>=Game.getAuraUnlockCost(building);}}(Game.ObjectsById[i-5]);
						it.buy=function(building){return function(){building.sacrifice(Game.getAuraUnlockCost(building));}}(Game.ObjectsById[i-5]);
					}
				}
			}
			Game.dragonLevels[Game.dragonLevels.length-3].cost = function(){var fail=0;for (var i in Game.Objects){if (Game.Objects[i].amount<Game.getBakeDragonCookieCost()) fail=1;}return (fail==0);}
			Game.dragonLevels[Game.dragonLevels.length-3].buy = function(){for (var i in Game.Objects){Game.Objects[i].sacrifice(Game.getBakeDragonCookieCost());}Game.Unlock('Dragon cookie');}
			Game.dragonLevels[Game.dragonLevels.length-3].costStr = function(){return loc("%1 of every building",Game.getBakeDragonCookieCost());}
			Game.dragonLevels[Game.dragonLevels.length-2].cost = function(){var fail=0;for (var i in Game.Objects){if (Game.Objects[i].amount<Game.getDualwieldAuraCost()) fail=1;}return (fail==0);}
			Game.dragonLevels[Game.dragonLevels.length-2].buy = function(){for (var i in Game.Objects){Game.Objects[i].sacrifice(Game.getDualwieldAuraCost());}}
			Game.dragonLevels[Game.dragonLevels.length-2].costStr = function(){return loc("%1 of every building",Game.getDualwieldAuraCost());}
		}

		Game.auraMult = function(what) {
			let n = 0;
			let a = decay.covenantStatus('aura');
			if (Game.dragonAuras[Game.dragonAura].name==what) { n += (a?1.5:1); } 
			else if (Game.dragonAuras[Game.dragonAura2].name==what) { n += (a?0.5:1); }
			if (Game.dragonAuras[Game.dragonAura].name=="Reality Bending") { n += (a?0.15:0.1); }
			else if (Game.dragonAuras[Game.dragonAura2].name=="Reality Bending") { n += (a?0.05:0.1); }
			return n;
		}
        eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("milkMult*=1+Game.auraMult('Breath of Milk')*0.05;","milkMult*=1+Game.auraMult('Breath of Milk')*0.025;"));//Changing BOM from 5% to 2.5%

		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("mult*=1+Game.auraMult('Radiant Appetite');","mult*=1+Game.auraMult('Radiant Appetite')*0.5;"));//Changing RA from 2.0 to 1.5

		eval('Game.Upgrade.prototype.getPrice='+Game.Upgrade.prototype.getPrice.toString().replace("price*=1-Game.auraMult('Master of the Armory')*0.02;","price*=1-Game.auraMult('Master of the Armory')*0.10;").replace(`Game.Has('Divine bakeries')) price/=5;`, `Game.Has('Divine bakeries')) { price/=5; } if (this.pool == 'cookie' && decay.challengeStatus('hc')) { price /= 2; }`));

		eval('Game.modifyBuildingPrice='+Game.modifyBuildingPrice.toString().replace("price*=1-Game.auraMult('Fierce Hoarder')*0.02;","price*=1-Game.auraMult('Fierce Hoarder')*0.05;"));

        //Dragon Cursor making all clicking buffs 50% stronger
		eval(`Game.shimmerTypes['golden'].popFunc=`+Game.shimmerTypes['golden'].popFunc.toString().replace(`buff=Game.gainBuff('click frenzy',Math.ceil(13*effectDurMod),777);`,`buff=Game.gainBuff('click frenzy',Math.ceil(13*effectDurMod),777*(1+(Game.auraMult('Dragon Cursor')*0.5)));`));//Dragon Cursor making CF stronger by 50%
		eval(`Game.shimmerTypes['golden'].popFunc=`+Game.shimmerTypes['golden'].popFunc.toString().replace(`buff=Game.gainBuff('dragonflight',Math.ceil(10*effectDurMod),1111);`,`buff=Game.gainBuff('dragonflight',Math.ceil(10*effectDurMod),1111*(1+(Game.auraMult('Dragon Cursor')*0.5)));`));//Dragon Cursor making DF stronger by 50%

		eval(`Game.shimmerTypes['golden'].popFunc=`+Game.shimmerTypes['golden'].popFunc.toString().replace(`list.push('blood frenzy','chain cookie','cookie storm');`,`{ list.push('blood frenzy','chain cookie','cookie storm'); for (let i = 0; i < randomFloor(Game.auraMult('Unholy Dominion') * 4); i++) { list.push('blood frenzy'); } }`));//Unholy Dominion pushes another EF to the pool making to so they are twice as common

		eval('Game.GetHeavenlyMultiplier='+Game.GetHeavenlyMultiplier.toString().replace("heavenlyMult*=1+Game.auraMult('Dragon God')*0.05;","heavenlyMult*=1+Game.auraMult('Dragon God')*0.20;"));

		eval(`Game.shimmerTypes['golden'].popFunc=`+Game.shimmerTypes['golden'].popFunc.toString().replace(`if (Math.random()<Game.auraMult('Dragonflight')) list.push('dragonflight');`,`if (Math.random()<Game.auraMult('Dragonflight')) list.push('dragonflight'); if (Math.random()<Game.auraMult('Ancestral Metamorphosis')) { for (let i = 0; i < 10; i++) { list.push('Ancestral Metamorphosis'); } }`));//Adding custom effect for Ancestral Metamorphosis 

		addLoc('You discovered a'); addLoc('Dragon\'s hoard!'); addLoc('Collecting treasures...');
        eval(`Game.shimmerTypes['golden'].popFunc=`+Game.shimmerTypes['golden'].popFunc.toString().replace(`else if (choice=='blood frenzy')`,`else if (choice=='Ancestral Metamorphosis')
        {
			popup='<small>'+loc('You discovered a')+'</small><br>'+loc("Dragon\'s hoard!")+'<br><small>'+loc('Collecting treasures...')+'</small>';
   			decay.hoardT += decay.hoardTMax + 0.5 * Game.fps;
        }
		else if (choice=='trick or treat')
		{
		    buff=Game.gainBuff('trick or treat',Math.ceil(100*effectDurMod),4);
		}
		else if (choice=='lonely')
	    {
			if (Game.ObjectsById['1'].amount>0) { Game.ObjectsById['1'].sell(-1); popup=loc("Lonely.")+'<br><small>'+loc("All your grandmas left you!",loc("%1 All your grandmas and clones left you",))+'</small>'; }
			if (Game.ObjectsById['19'].amount>0) { Game.ObjectsById['19'].sell(-1); popup=loc("Lonely.")+'<br><small>'+loc("All your clones left you!",loc("%1 All your grandmas and clones left you",))+'</small>'; }
			if (Game.ObjectsById['1'].amount>0 && Game.ObjectsById['19'].amount>0) { Game.ObjectsById['19'].sell(-1); Game.ObjectsById['1'].sell(-1); popup=loc("Lonely.")+'<br><small>'+loc("All your grandmas and clones left you!",loc("%1 All your grandmas and clones left you",))+'</small>'; }

		}else if (choice=='blood frenzy')`));//When Ancestral Metamorphosis is selected it pushes a effect called Dragon's hoard that gives some amount of cookies in terms of cps
		Game.goldenCookieChoices.push('Dragon\'s hoard'); Game.goldenCookieChoices.push('Ancestral Metamorphosis');
		decay.hoardT = 0;
		decay.hoardTMax = 8 * Game.fps;
		decay.hoardTreasures = {
			t1: [
				'A batch of cookies!',
				'A batch of biscuits!',
				'A mound of chocolate!',
				'A handful of cookie dough!',
				'A bag of silver!',
				'A chest of bronze!',
				'A pit of dragon scales!',
				'A shiny stone!'
			],
			t2: [
				'A chest of gold!',
				'A well of silver!',
				'A pack of platinum!',
				'A bakery\'s worth of cookies!',
				'A bakery\'s worth of biscuit!',
				'A mountain of pure dark chocolate!',
				'A canyon of pure white chocolate!',
				'A mound of cookie dough!',
				'A dragon\'s blessing!',
				'A spring of fresh water!'
			],
			t3: [
				'Iridescent opal!',
				'Exquisite amber!',
				'Flawless ruby!',
				'Intricate jade!',
				'Vivid amethyst!',
				'Lustrous emerald!',
				'Brilliant sapphire!',
				'Gleaming golden pearl!',
				'A whole room of gold!',
				'A whole pool of platinum!',
				'A wedding ring!'
			],
			t4: [
				'A perfectly baked cookie!',
				'A perfect diamond!',
				'A key to a mysterious vault!',
				'A map of other treasures!',
				'A magnificant palace!'
			]
		};
		for (let i in decay.hoardTreasures) {
			for (let ii in decay.hoardTreasures[i]) {
				addLoc(decay.hoardTreasures[i][ii]);
				decay.hoardTreasures[i][ii] = loc(decay.hoardTreasures[i][ii]);
			}
		}
		decay.treasureChance = function(frac) {
			//chance that a treasure appears on any given tick
			return Math.max(0, (Math.sin(4 * frac)) - Math.cos(3 * frac) + frac / 10) / 5;
		}
		decay.checkHoard = function() {
			if (!decay.hoardT) { return; }
			decay.hoardT--;
			const mult = (Game.Has('Dragon fang')?1.1:1);
			if (Math.random() < decay.treasureChance(Math.min(decay.hoardT / decay.hoardTMax, 1))) {
				//summons a hoard treasure
				const n = Math.random();
				var str = '';
				var val = 0;
				var offsetX = 0;
				var offsetY = 0;
				if (n < 0.75) {
					val = Math.min(Game.cookiesPs * 60 * (5 + Math.random() * 15), Game.cookies * 0.1) * mult * Game.eff('goldenCookieGain');
					str = choose(decay.hoardTreasures.t1);
					offsetX = (Math.random() - 0.5) * 150;
					offsetY = (Math.random() - 0.5) * 150 + 75;
				} else if (n < 0.925) {
					val = Math.min(Game.cookiesPs * 60 * (30 + Math.random() * 60), Game.cookies * 0.25) * mult * Game.eff('goldenCookieGain');
					str = choose(decay.hoardTreasures.t2);
					offsetX = (Math.random() - 0.5) * 300;
					offsetY = (Math.random() - 0.5) * 300 + 75;
				} else {
					val = Math.min(Game.cookiesPs * 60 * 60 * (4 + Math.random() * 2), Game.cookies * 0.5) * mult * Game.eff('goldenCookieGain');
					str = choose(decay.hoardTreasures.t3);
					offsetX = (Math.random() - 0.5) * 400;
					offsetY = (Math.random() - 0.5) * 400 + 75;
				}
				Game.Popup(str+'<br><small>'+loc("+%1!",loc("%1 cookie",LBeautify(val)))+'</small>', Game.mouseX+offsetX, Game.mouseY+offsetY);
				Game.Earn(val);
			}
			if (decay.hoardT == 0) {
				const val = Math.min(Game.cookiesPs * 60 * 60 * 12 * mult * Game.eff('goldenCookieGain'), Game.cookies * 1.5);
				Game.Popup('<small>'+loc('At last, you find:')+'</small><br>'+choose(decay.hoardTreasures.t4)+'<br><small>'+loc("+%1!",loc("%1 cookie",LBeautify(val)))+'</small>', Game.mouseX, Game.mouseY);
				Game.Earn(val);
			}
		}
		Game.registerHook('logic', decay.checkHoard);
		if (l('devConsoleContent')) {
			var hoardDiv = document.createElement('a');
			hoardDiv.classList.add('option');
			hoardDiv.classList.add('neato');
			AddEvent(hoardDiv, 'click', function() { var newShimmer=new Game.shimmer('golden');newShimmer.force='Ancestral Metamorphosis'; });
			hoardDiv.innerHTML = 'Dragon\'s hoard';
			l('devConsoleContent').appendChild(hoardDiv);
		}
		addLoc(`Dragon harvest, Dragonflight, and Dragon's hoard are <b>%1% stronger</b>.`);
		replaceDesc('Dragon fang', loc("Golden cookies give <b>%1%</b> more cookies.",3)+'<br>'+loc("Dragon harvest, Dragonflight, and Dragon's hoard are <b>%1% stronger</b>.",10)+'<br>'+loc("Cost scales with CpS, but %1 times cheaper with a fully-trained dragon.",10)+'<q>Just a fallen baby tooth your dragon wanted you to have, as a gift.<br>It might be smaller than an adult tooth, but it\'s still frighteningly sharp - and displays some awe-inspiring cavities, which you might expect from a creature made out of sweets.</q>');
        
		
		eval('Game.shimmerTypes["golden"].getTimeMod='+Game.shimmerTypes['golden'].getTimeMod.toString().replace(`m*=1-Game.auraMult('Arcane Aura')*0.05;`, `m*=((1 + Game.auraMult('Arcane Aura') * 1.25) - Game.auraMult('Arcane Aura') * 1.25 * Math.pow(0.975, Math.log2(1 / Math.min(1, decay.gen))));`));
		eval('Game.shimmerTypes["golden"].getTimeMod='+Game.shimmerTypes['golden'].getTimeMod.toString().replace(`if (Game.hasBuff('Sugar blessing')) m*=0.9;`, `if (Game.hasBuff('Sugar blessing')) { m*=0.9; } m*=((1 + Game.auraMult('Master of the Armory') * 0.6) - Game.auraMult('Master of the Armory') * 0.6 * Math.pow(0.99, Math.log(Math.max(1, decay.gen)) / Math.log(1.02)));`));
		eval('Game.SelectDragonAura='+Game.SelectDragonAura.toString().replace(`Game.ToggleSpecialMenu(1);`, `if (!decay.gameCan.interactDragon) { decay.gameCan.interactDragon = true; Game.ToggleSpecialMenu(1); decay.gameCan.interactDragon = false; } else { Game.ToggleSpecialMenu(1); } decay.setRates();`).replace('="Game.UpgradeDragon();"', '="if (!decay.gameCan.interactDragon) { decay.gameCan.interactDragon = true; Game.UpgradeDragon(); decay.gameCan.interactDragon = false; } else { Game.UpgradeDragon(); }"'));
		
		auraDesc(1, "Kittens are <b>2.5%</b> more effective.", 'Aura: kittens are 2.5% more effective');
        auraDesc(2, "Clicking is <b>5%</b> more powerful."+'<br>'+"Click frenzy and Dragonflight is <b>50%</b> more powerful.", 'Aura: greatly boosted Click frenzy & Dragonflight');
		auraDesc(5, "Buildings sell back for <b>50%</b> instead of 25% of their cost. <br>Selling buildings partially <b>halts decay</b> based on the cube root of the amount of buildings sold.", 'Aura: selling buildings halt decay');
		auraDesc(6, "Get <b>1%</b> (multiplicative) closer to <b>+60%</b> golden cookie frequency for each <b>x1.02</b> CpS multiplier from your purity.<br>(Note: this effect reduces the initial amount of time on Golden cookie click)", 'Aura: golden cookie frequency buff based on decay');
		auraDesc(7, "While not purifying decay, you accumulate <b>purification power</b> that will be spent in the next purification; the banked purification power is kept even when this aura is off.", 'Aura: accumulate purification power to boost the next purification');
        auraDesc(8, "<b>+20%</b> prestige level effect on CpS."+'<br>'+"Wrinklers approach the big cookie <b>3 times</b> slower.", 'Aura: wrinklers approach 3 times slower');
		auraDesc(9, "Get <b>2.5%</b> (multiplicative) closer to <b>+125%</b> Golden cookie frequency for each <b>x0.5</b> CpS multiplier from your decay.<br>(Note: this effect reduces the initial amount of time on Golden cookie click)", 'Aura: great golden cookie frequency buff based on purity');
        auraDesc(11, "Golden cookies give <b>10%</b> more cookies."+'<br>'+"Golden cookies may trigger a <b>Dragon\'s hoard</b>.", 'Aura: golden cookies may trigger a Dragon\'s hoard.');
		auraDesc(12, "Wrath cookies give <b>10%</b> more cookies."+'<br>'+"Elder frenzy from Wrath cookies appear <b>4x as often</b>.", 'Aura: 4x Elder frenzy chance from Wrath cookies');
		auraDesc(13, "Having purity now makes positive buffs run out slower, for up to <b>-50%</b> buff duration decrease rate. Decay is less effective against buff duration.", 'Aura: purity decreases buff duration decrease rate');
        auraDesc(15, "All cookie production <b>multiplied by 1.5</b>.", 'Aura: all cookie production multiplied by 1.5');
		auraDesc(21, "Wrinklers no longer wither any CpS and no longer amplify decay. <br>Prevents wrinklers from losing cookies on pop, to some extent.", 'Aura: wrinklers no longer wither CpS or amplify decay');
		
		allValues('auras');
		
		Game.cookieClicksGlobal = 0;
		Game.registerHook('click', function() { Game.cookieClicksGlobal++; });
		addLoc('total: ');
		eval('Game.UpdateMenu='+Game.UpdateMenu.toString().replace(`'<div class="listing"><b>'+loc("Cookie clicks:")+'</b> '+Beautify(Game.cookieClicks)+'</div>'+`, `'<div class="listing"><b>'+loc("Cookie clicks:")+'</b> '+Beautify(Game.cookieClicks)+' <small>('+loc('total: ')+Beautify(Game.cookieClicksGlobal)+(decay.cookieClicksTotalNGM==Game.cookieClicksGlobal?'':('; '+loc('cross-legacies total: ')+Beautify(decay.cookieClicksTotalNGM)))+')</small></div>'+`));

		eval(`Game.shimmerTypes['golden'].popFunc=`+Game.shimmerTypes['golden'].popFunc.toString().replace(`if (Math.random()<0.8) Game.killBuff('Click frenzy');`,`Game.killBuff('Click frenzy');`));

		eval(`Game.shimmerTypes['golden'].popFunc=`+Game.shimmerTypes['golden'].popFunc.toString().replace(`Game.ObjectsById[obj].amount/10+1;`,`Game.ObjectsById[obj].amount/(Game.resets?10:1);`));

        //Buffing biscuit prices
		var butterBiscuitMult=100000000;

        Game.Upgrades['Milk chocolate butter biscuit'].basePrice=999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Dark chocolate butter biscuit'].basePrice=999999999999999999999999999999*butterBiscuitMult
        Game.Upgrades['White chocolate butter biscuit'].basePrice=999999999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Ruby chocolate butter biscuit'].basePrice=999999999999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Lavender chocolate butter biscuit'].basePrice=999999999999999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Synthetic chocolate green honey butter biscuit'].basePrice=999999999999999999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Royal raspberry chocolate butter biscuit'].basePrice=999999999999999999999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Ultra-concentrated high-energy chocolate butter biscuit'].basePrice=999999999999999999999999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Pure pitch-black chocolate butter biscuit'].basePrice=999999999999999999999999999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Cosmic chocolate butter biscuit'].basePrice=999999999999999999999999999999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Butter biscuit (with butter)'].basePrice=999999999999999999999999999999999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Everybutter biscuit'].basePrice=999999999999999999999999999999999999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Personal biscuit'].basePrice=999999999999999999999999999999999999999999999999999999999999999*butterBiscuitMult

		allValues('upgrades rework');

		/*=====================================================================================
        News ticker
        =======================================================================================*/
		decay.getNews = function() {
			var newList = [];
			var name = Game.bakeryName;
			//add your new messages here

			if (!EN) { return []; }

			if (decay.incMult > 0.05) {
                newList = newList.concat([
                    'News: Decay rates spreading linked to global warming, says expert.'
                ]);
            }


			if (Game.Objects['Cursor'].amount>25) { newList = newList.concat([
				'News: Why are the cursors getting so big? What is the meaning of this?'
			]); }
			if (Game.Objects['Cursor'].amount>50) { newList = newList.concat([
				'News: what if, instead of having more fingers, we just made them click harder?',
				'News: cookies and cursors-storing warehouses found to be made of 99.8% fingers and 0.2% cookies, causing massive riots.'
			]); }
			if (Game.Objects['Cursor'].amount>100) { newList = newList.concat([
				'News: new "Million fingered" variety Cursors found to be the cause of death for several infants!',
				'News: finger-cutting jobs open for hire! Starting rate at fingers per hour!'
			]); }

			var grand = Game.Objects['Grandma'].amount;
			if (Game.Objects['Grandma'].amount>25) { newList = newList.concat([
				'News: analysis shows a possible type of grandmas opposite to that of normal grandmas, just like antimatter. Experts have coined it "grandpas".',
				'News: analysis shows that every year, on average, each grandma is getting '+Beautify(1 + Math.pow(grand, 2) * Game.Has('One mind') + Math.pow(grand, 4) * Game.Has('Communal brainsweep') + Math.pow(grand, 7) * Game.Has('Elder Pact'))+'% bigger.'
			]); }
			if (Game.Objects['Grandma'].amount>50) { newList = newList.concat([
				'AMBER ALERT: GRANDMA GONE MISSING. REPORT ANY POSSIBLE SIGHTINGS OF GRANDMA "'+choose(Game.grandmaNames).toUpperCase()+'" TO THE LOCAL AUTHORITY.',
				'SCIENTIFIC BREAKTHROUGH! Our top scientists just discovered that each grandma ages 1 year per year!',
				'News: the elders are rioting and are destroying a nearby factory!'
			]); }
			if (Game.Objects['Grandma'].amount>100) { newList = newList.concat([
				'<i>"No."</i><sig>grandma</sig>',
				'<i>"It is not our fault."</i><sig>grandma</sig>',
			]); }

			if (Game.Objects['Farm'].amount>0) newList = newList.concat([
				'News: local cookie manufacturer grows "Mother of beets"; Farmers outraged by root entanglement strategy.',
				'News: Maniac spurts about "Pizza": locals confused, it sounds like a giant red cookie.'
			]);
			if (Game.Objects['Farm'].amount>25) { newList = newList.concat([
				'News: a new law has been introduced that limited the stem length of all cookie plants to a maximum of 1 Ãƒâ€šÃ‚Âµm.',
				'News: local cookie manufacturer have started using the sun to grow cookie plants.'
			]); }
			if (Game.Objects['Farm'].amount>50) { newList = newList.concat([
				'News: storage out of control! Cookie plants are dying after a recent invasion of cookies that broke through the greenhouse roof; officials blame the warehouse construction company.'
			]); }
			if (Game.Objects['Farm'].amount>100) { newList = newList.concat([
				'News: experts suggest that cookies from cookie plants are unsafe to eat if not heated to at least 6,000,000 celsius.',
				'News: farmers report difficulty distinguishing between the cookies on the cookie plants and all the cookies around them.',
				'News: another farmer dies from suffocation.'
			]); }

			if (Game.Objects['Mine'].amount>25) { newList = newList.concat([
				'News: interdimensional portals within cookie mineshafts have been discovered that leads to "Earth". The mineshaft is now permanently closed.'
			]); }
			if (Game.Objects['Mine'].amount>50) { newList = newList.concat([
				'News: cookie mineshafts are closing up in order to become storage for the ever-growing pile of cookies.'
			]); }
			if (Game.Objects['Mine'].amount>100) { newList = newList.concat([
				'News: I\'m not sure what\'s in those underground tunnels, it\'s not like those tunnels are mine.'
			]); }

			if (Game.Objects['Factory'].amount>25) { newList = newList.concat([
				'News: your Factories are now producing as much as cookies as before.',
				'News: competitor involved in destroying equipment scandal.'
			]); }
			if (Game.Objects['Factory'].amount>50) { newList = newList.concat([
				'News: Factories going awry after the mechanical failure of the cookie output, factory now filled with cookies & possibly will become a cookie volcano in the next hour!'
			]); }
			if (Game.Objects['Factory'].amount>100) { newList = newList.concat([
				'News: new legislation suggests that all cookie-producing Factories be repurposed to '+(Game.Objects['Factory'].amount>250?'planet':'warehouse')+'-producing factories.'
			]); }

			if (Game.Objects['Bank'].amount>25) { newList = newList.concat([
				'News: economists worldwide predict imminent economic collapse, saying that "if cookie prices ever drop below 1e-'+Math.floor(Math.max(Game.log10Cookies - 2, 0))+'..."'
			]); }
			if (Game.Objects['Bank'].amount>50) { newList = newList.concat([
				'News: it currently costs 10 cookies to store 3 cookies. Because of this, your banks are closing up.',
				'News: man invades bank, finds gold. We still have hope.'
			]); }
			if (Game.Objects['Bank'].amount>100) { newList = newList.concat([
				'News: IN THIS ECONOMY??',
				'News: stock prices reach record highs after the destruction of the Great Space Cookie Patch! Traders hail in delight!'
			]); }

			if (Game.Objects['Temple'].amount>25) { newList = newList.concat([
				'News: are cookies real for gods? We sure hope not.',
				'News: local temple swamped after recent cookie containment breach! Airstrikes currently being called in.'
			]); }
			if (Game.Objects['Temple'].amount>50) { newList = newList.concat([
				'News: if cookies are not real for gods, then who are we praying to?'
			]); }
			if (Game.Objects['Temple'].amount>100) { newList = newList.concat([
				'News: construction company founded to be "insane" after the construction of the 5899th statue of a wrinkled isosceles triangle!'
			]); }

			if (Game.Objects['Wizard tower'].amount>25) { newList = newList.concat([
				'News: thermodynamics-adhering houses found to be the cause of the recent decay decrease!'
			]); }
			if (Game.Objects['Wizard tower'].amount>50) { newList = newList.concat([
				'News: spell "stretch time" forbidden after recent causality-breaking event!',
				'News: do you like magic? If yes, we advise that you turn yourself in immediately.'
			]); }
			if (Game.Objects['Wizard tower'].amount>100) { newList = newList.concat([
				'News: seems like we are out of magic. Experts advise removing wizard towers, but we suspect ulterior motivations.'
			]); }

			if (Game.Objects['Shipment'].amount>25) { newList = newList.concat([
				'News: spaceship implodes, evidence suggest that cookies are at fault! Investigation is currently being terminated and amnesticized.'
			]); }
			if (Game.Objects['Shipment'].amount>50) { newList = newList.concat([
				'News: your shipment #'+Math.floor(Math.random() * 1234565+2)+' has just discovered yet another star burning on cookie fusion!'
			]); }
			if (Game.Objects['Shipment'].amount>100) { newList = newList.concat([
				'News: the cookie transportation company is working hard to bring your cookies as far away as possible.'
			]); }

			if (Game.Objects['Alchemy lab'].amount>25) { newList = newList.concat([
				'News: cookie-friendly metal such as Einsteinium and Technetium found to be 100% more efficient at cookie-metal conversion!'
			]); }
			if (Game.Objects['Alchemy lab'].amount>50) { newList = newList.concat([
				'News: alchemy lab awarded the Nobel Peace Prize after being found to convert cookies back into gold!'
			]); }
			if (Game.Objects['Alchemy lab'].amount>100) { newList = newList.concat([
				'News: price of gold drops by 90% after the cookie-inflation catastrophe!'
			]); }

			if (Game.Objects['Portal'].amount>25) { newList = newList.concat([
				'News: today we bring you an Elderspeak podcast about cookie pollution.'
			]); }
			if (Game.Objects['Portal'].amount>50) { newList = newList.concat([
				'News: your portals are brimming with ungodly energy far better than anything your cookies could smell like!',
				'News: experts debate about sending cookies through portals, concludes that "the cookies will just return stronger than before."'
			]); }
			if (Game.Objects['Portal'].amount>100) { newList = newList.concat([
				'News: closing portals require matter, but why should that matter?'
			]); }

			if (Game.Objects['Time machine'].amount>25) { newList = newList.concat([
				'News: is it possible to send cookies to the future? Experts debate about the potential risks carried by time-centralized cookie storage.'
			]); }
			if (Game.Objects['Time machine'].amount>50) { newList = newList.concat([
				'News: cookies from the past "20% more edible and 50% less prone to spontaneous rebellion", claims world-renowned cookie manufacturer.'
			]); }
			if (Game.Objects['Time machine'].amount>100) { newList = newList.concat([
				'News: statistical analysis of cookies shows that "cookies sent to the future tend to be 1% less powerful"!'
			]); }

			if (Game.Objects['Antimatter condenser'].amount>25) { newList = newList.concat([
				'News: As it turns out, there is 1e200,405,192,204 times more antimatter than matter. Expert found cause to be "dimensions", whatever that means.',
				'News: Experts advise against turning antimatter to cookies, reason being "there is already way too much cookies, and antimatter can help clear out some cookies"'
			]); }
			if (Game.Objects['Antimatter condenser'].amount>50) { newList = newList.concat([
				'News: if there is so much cookies, why are there so few anticookies?'
			]); }
			if (Game.Objects['Antimatter condenser'].amount>100) { newList = newList.concat([
				'[news destroyed by antimatter]',
				'?secnetnesitna eht era erehw ,secnetnes hcum os si ereht fi :sewN'
			]); }

			if (Game.Objects['Prism'].amount>25) { newList = newList.concat([
				'News: Prisms are starting to exclusively use gamma rays to produce the smallest cookies possible.'
			]); }
			if (Game.Objects['Prism'].amount>50) { newList = newList.concat([
				'News: Prisms encounter issues outputting light, found cause to be cookies blocking the window! Officials will drop the next nuke tomorrow at 5:30, hopefully that\'ll clear it up a bit more.'
			]); }
			if (Game.Objects['Prism'].amount>100) { newList = newList.concat([
				'News: new evidence suggesting the origins of the universe turns out to be false, muddled by the complete lack of light which had all been converted to cookies!'
			]); }

			if (Game.Objects['Chancemaker'].amount>25) { newList = newList.concat([
				'News: it is considered lucky if the Chancemakers don\'t produce any cookies.'
			]); }
			if (Game.Objects['Chancemaker'].amount>50) { newList = newList.concat([
				'News: experts are considering the "quantom dislocation" optimization, wonders if the Chancemakers are powerful enough to dislocate a mass of cookies of 1,123,901,284 light years cubed.'
			]); }
			if (Game.Objects['Chancemaker'].amount>100) { newList = newList.concat([
				'News: you will see this news because RNG said yes.',
				'News: are the decorative eyeballs really necessary? Experts consider removing one eyeball from each Chancemaker to save space to store more cookies.'
			]); }

			if (Game.Objects['Fractal engine'].amount>25) { newList = newList.concat([
				'News: Fractal engines are now forbidden to replicate into an exact copy of itself. '
			]); }
			if (Game.Objects['Fractal engine'].amount>50) { newList = newList.concat([
				'News: Fractal engines are now forbidden to replicate into an exact copy of itself. News: Fractal engines are now forbidden to replicate into an exact copy of itself. ',
				'News: Fractal engines are encountering difficulty replicating. Experts are working hard to figure out where they are amongst the mass of cookies.'
			]); }
			if (Game.Objects['Fractal engine'].amount>100) { newList = newList.concat([
				'News: Fractal engines are now forbidden to replicate into an exact copy of itself. News: Fractal engines are now forbidden to replicate into an exact copy of itself. News: Fractal engines are now forbidden to replicate into an exact copy of itself. News: Fractal engines are now forbidden to replicate into an exact copy of itself. Wait, we also can\'t?',
				'News: No, Fractal engines can\'t replicate into a larger copy of itself, either.'
			]); }

			var characters = ['q','w','e','r','t','y','u','i','o','p','a','s','d','f','g','h','j','k','l','z','x','c','v','b','n','m','1','2','3','4','5','6','7','8','9','0','Q','W','E','R','T','Y','U','I','O','P','A','S','D','F','G','H','J','K','L','Z','X','C','V','B','N','M'];
			var r = function(num) {
				var str = '';
				for (let i = 0; i < num; i++) {
					str += choose(characters);
				}
				return str;
			}

			if (Game.Objects['Javascript console'].amount>25) { newList = newList.concat([
				'News: if (me.when == "change code") { console.log(NaN); }',
				'News: programmers complain that they "can\'t see a thing" after using the new "all-natural sunlight" displays.'
			]); }
			if (Game.Objects['Javascript console'].amount>50) { newList = newList.concat([
				'News: this code is too unsightreadable.',
				'undefined',
				'News: '+r(Math.floor(Math.random() * 70) + 1)
			]); }
			if (Game.Objects['Javascript console'].amount>100 && Game.Objects['Time machine'].amount > 0) { newList = newList.concat([
				'News: price of LED skyrockets with the introduction of 1e18 x 1.8e18 wide screens.',
				'News: is it really necessary to write code with indent size 8?',
				'News: the source of the Great Cookie Space Patch has been attributed to the overuse of Javascript Consoles that take up too much space.'
			]); }

			if (Game.Objects['Idleverse'].amount>25) { newList = newList.concat([
				'News: experts question the appropriateness of the name "Idleverse", suggesting that they should be renamed to "Activeverse".'
			]); }
			if (Game.Objects['Idleverse'].amount>50) { newList = newList.concat([
				'News: Idleverses are being employed as bowling bulbs in recreational facilities. "Where else would you put them?" rhetorically-questions officials.'
			]); }
			if (Game.Objects['Idleverse'].amount>100 && Game.Objects['Time machine'].amount > 0) { newList = newList.concat([
				'News: experts suggest removing at least '+Math.floor(Game.Objects['Idleverse'].amount / 2)+' Idleverses after a catastrophic Idleverse Chained XK-Collapse scenario. '+name+', being the great baker, simply reverses time. "This will only happen again," warn experts from across universes.',
				'News: are Idleverses even worth keeping? Or should we remove some, so we can have more space to store cookies?',
				'News: scientists within Idleverses predict a Big Crunch to their universes. '
			]); }

		    if (Game.Objects['Cortex baker'].amount>0) { newList = newList.concat([
				'News: Cortex baker implodes, unknown plant puzzles blamed.',
				'News: it was discovered that thoughts can have thoughts and conclude "that is a tought thing to think"'
			]); }
			if (Game.Objects['Cortex baker'].amount>25) { newList = newList.concat([
				'News: You have a big brain.'
			]); }
			if (Game.Objects['Cortex baker'].amount>50) { newList = newList.concat([
				'News: "Cortex baker galaxy" can be seen during astronomical twilight.',
				'News: ordinary people found to have seizures after being in the presence of Cortex bakers for more than 1.5 microseconds. Due to space being clogged with wrinkly cookies, officials have no choice but to let them remain near people.'
			]); }

			if (Game.Objects['Cortex baker'].amount>100) { newList = newList.concat([
				'News: "The mass" Cortex baker cluster 3d9cjk reaches a record high of 1,204,589 congealed Cortex bakers! Experts suggest separating each Cortex Baker by at least 1 more kilometer; officials won\'t budge.',
				'News: Cortex bakers question the morality of thinking cookies into other Cortex bakers; advised to "keep working" even if there is nowhere else to put the cookies.'
			]); }

			if (Game.Objects['You'].amount>25) { newList = newList.concat([
				'News: local baker "'+name+'" and clones found to be the cause of at least 52,603 human rights violations; 99% of which are due to poor ventilation and overcrowding.',
				'News: '+name+'\'s clones are found to be harmful to philosophy.'
			]); }
			if (Game.Objects['You'].amount>50) { newList = newList.concat([
				'News: Who am I? Where did I come from? Where will I go?',
				'News: man founded to be "insane" after claiming that he likes cookies! We hope that this man gets at least a death sentence.'
			]); }
			if (Game.Objects['You'].amount>100) { newList = newList.concat([
				'News: '+name+'\'s clones are beginning to shrink. Experts expect nuclear fusion to occur in the next 4 hours.'
			]); }

			if (Game.Objects['Wizard tower'].level>10) newList.push(choose([
				'News: local baker levels wizard towers past level 10, disowned by family.'
			]));
			if (Game.Objects['Wizard tower'].level>15) newList.push(choose([
				'News: legendary baker levels wizard towers past level 15, left on the streets.'
			]));

			var buildNewList = [];

			if (Math.random() < 0.4) { buildNewList = buildNewList.concat(newList); }

			newList = [];
			var specials = [
				'News: can we unclick the cookie? Please?',
				'News: can we unbake the cookies? Please?',
				'News: can we bury all the cookies? Please?',
				'News: can we re-fossilize the cookies? Please?',
				'News: can we recycle the cookies? Please?',
				'News: can we pop the cookie bubble? Please?',
				'News: can we stop believing in cookies? Please?',
				'News: can we vanquish the cookies in magic? Please?',
				'News: can we return the cookies back to where they were? Please?',
				'News: can we turn the cookies back into gold? Please?',
				'News: can we throw all the cookies back into portals? Please?',
				'News: can we dispose the cookies into the future? Please?',
				'News: can we turn the cookies back into antimatter? Please?',
				'News: can we turn the cookies back into light? Please?',
				'News: can we chancemaker-ourselves a lack of cookies? Please?',
				'News: can we fractalize the cookies into infinitely many pieces? Please?',
				'News: can we remove the "cookies" feature? Please?',
				'News: can we stuff all our cookies back into the parallel universes? Please?',
				'News: can we render all our cookies into philosophy? Please?',
				'News: can we trace all our cookies back into a single owner? I think we can.'
			];
			if (Math.random() < 0.15) { for (let i in Game.Objects) {
				if (Game.Objects[i].amount > 500 - Game.Objects[i].id * 25) { newList.push(specials[Game.Objects[i].id]); }
			} }

			if (Math.random() < 0.1) { buildNewList = buildNewList.concat(newList); }

			if (Math.random()<0.001)
            {
                newList.push('<q>'+"JS is the best coding language."+'</q><sig>'+"no one"+'</sig>');
				newList.push('News: aleph reference REAL!');
				newList.push('News: "Say NO to ecm!" said protester.');
				newList.push('News: person called "rice" fails to execute a "combo", whatever that is.');
				newList.push('News: ticker broken, please insert another click.');
            }
            if (Math.random()<0.01 && decay.unlocked)
            {  
                newList.push('News: ascend at 365.');
				newList.push('News: Gone too far, or not enough? Protests rising against "intense competition for seemingly boring stuff."');
				newList.push('News: it was discovered that the '+name+' is actually a-');
				newList.push('News: Cookie Hermits think of new recipes, locals are shocked: "Taste like grass."');
				newList.push('News: crazed citizen quits job and leaves family to "grind ascends."');
				if (Game.Has('Cookie egg')) newList.push('<q>'+"Give me food master."+'</q><sig>'+"krumblor"+'</sig>');
				newList.push('News: ancient hieroglyphs deciphered to resemble 365 cookies of a heavenly origin. "We\'re not sure what that means," ponder scientists.');
				newList.push('News: local news stations overrun by suggestions: "Didnt know modding was this annoying."');
                newList.push('News: you should grail.');
				newList.push('News: encyclopaedia\'s head editor denies allegations that he is a ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œdaddyÃƒÂ¢Ã¢â€šÂ¬Ã‚Â, says to the public ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œstop calling me thatÃƒÂ¢Ã¢â€šÂ¬Ã‚Â.');
				newList.push('News: hybrid human still keeps to the tradition of calling the head editor "daddy", refuses to take bribes.');
				newList.push('News: time manipulation growing old for the fiercely competitive baker industry, researchers pursue ways of the future by predicting ahead. "Everything is pre-determined, if you think about it."');
				if ((Game.AchievementsOwned==622)) newList.push('News: you did it, you can go outside now.');
				newList.push('News: "check the pins" crowned the phrase of the year!');
				newList.push('nEWS: aLL CAPITAL LETTERS REVERSED IN FREAK MAGIC ACCIDENT!');
				newList.push('News: Modders make "custom news tickers", public baffled at thought of corruption in the news.');
				newList.push('News: News: Words Words doubled doubled after after player player purchases purchases a a tiered tiered upgrade upgrade');
				newList.push('News: 8 disappearances reported in the past minute, officials blame mysterious "white vans" besides "empty fields with weird plants".');
				newList.push('News: vote for Green Yeast Digestives!');
				newList.push('News: vote for Hardtack!');
				if (Game.season == 'fools') { newList.push('Do not use business day. It has a chance to give a useless buff from all golden cookies, which makes stacking more than one buff naturally worse than it would be for any other non-christmas non-valentines season. Don\'t use business day.'); }
				if (Game.season == 'fools') { newList.push('News: A season is active. But what could it possibly be?'); }
				newList.push('News: spell "stretch time" forbidden after recent leaderboard-breaking event!');
				newList.push('News: are cookie quantum? World-leading baker '+name+' will bring you a possible explanation in this episode of...');
				newList.push('News: it\'s said that the same news ticker message won\'t strike the same place twice. Or will it?');
				newList.push('News: apologies, it appears that the last news had a typo. Here\'s the correct version: "'+replaceAll('"', "'", Game.addTypo(Game.lastTicker))+'"');
				newList.push('FIFI FOR MOD!!!!!');
				newList.push('News: "Tesseract" commits shadow-deletion wave after banning influential posters!');
				newList.push('The becoming of a grandmaster garden puzzler is a treacherous journey. First, one must prove themselves by completing many puzzles in the document leading up to the Grandmaster section. Then, they must take a test - consisting of 3 sections, which requires advanced speed solving, grandmaster solving, and puzzle creation, respectively. In the advanced speed solving section, one must solve all kinds of varieties of puzzles in as little as 30 minutes, from supermassives, to exploding portals, to proofs, and any combination thereof. In the grandmaster solve section, one must solve two very difficult puzzles in 2 hours - typically unknown plants, which is the undisputably most difficult variety by far, requiring one to find identities instead of solutions. Lastly, one must create 3 puzzles according to a theme, then be scored by the existing grandmasters. Only then will they realize the true meaning behind being a grandmaster.');
				newList.push('Hi Lookas, I\'m Lookas! Nice to meet my alt today!');
            }
			newList = newList.concat(buildNewList);
			return newList;
		}
		Game.registerHook('ticker', decay.getNews);
		Game.addTypo = function(m) {
			var i = Math.floor(Math.random() * m.length);
			if (!['q','w','e','r','t','y','u','i','o','p','a','s','d','f','g','h','j','k','l','z','x','c','v','b','n','m','Q','W','E','R','T','Y','U','I','O','P','A','S','D','F','G','H','J','K','L','Z','X','C','V','B','N','M'].includes(m[i])) { return m.slice(0, i)+'#'+m.slice(i+1, m.length); }
			m = m.slice(0, i)+transmuteChar(m[i])+m.slice(i+1, m.length);
			return m;
		}

		Game.changeNews = function(message, newMessage) {
			eval('Game.getNewTicker='+Game.getNewTicker.toString().replace(message, newMessage));
		}
		Game.removeNews = function(message, noComma) {
			var comma = ','; if (noComma) { comma = ''; }
			eval('Game.getNewTicker='+Game.getNewTicker.toString().replace("'"+message+"'"+comma,""));
		}

		decay.changeNews = function() {
			Game.removeNews('News : defective alchemy lab shut down, found to convert cookies to useless gold.');
			Game.removeNews('News : cookies slowly creeping up their way as a competitor to traditional currency!');
			Game.removeNews('News : cookie economy now strong enough to allow for massive vaults doubling as swimming pools!');
			Game.removeNews('News : space tourism booming as distant planets attract more bored millionaires!');
			Game.removeNews('News : defective alchemy lab shut down, found to convert cookies to useless gold.');
			Game.changeNews('News : first antimatter condenser successfully turned on, doesn\'t rip apart reality!', 'News: first antimatter condenser unsuccessfully turned on, ripped apart reality into a million pieces!');
			Game.changeNews('News : researchers conclude that what the cookie industry needs, first and foremost, is "more magnets".', 'News: researchers conclude that what the cookie industry needs, first and foremost, is "more suffering and agony".');
			Game.removeNews('News : cookies now being baked at the literal speed of light thanks to new prismatic contraptions.');
			Game.changeNews('News : all scratching tickets printed as winners, prompting national economy to crash and, against all odds, recover overnight.', 'News: all scratching tickets printed as winners, prompting the national economy to crash!');
			Game.removeNews('News: incredibly rare albino wrinkler on the brink of extinction poached by cookie-crazed pastry magnate!', true);
		}
		if (Game.ready) { decay.changeNews(); } else { Game.registerHook('create', decay.changeNews); }
		Game.overrideNews = function() {
			//returns news messages that will always override the intended output if the returned value isnt an empty array
			var list = [];
			if (Game.lastTicker == 'News: it\'s said that the same news ticker message won\'t strike the same place twice. Or will it?' && Math.random() < 0.5) { list.push('News: it\'s said that the same news ticker message won\'t strike the same place twice. Or will it?'); }
			return list; 
		}
		Game.lastTicker = '';
		eval('Game.getNewTicker='+Game.getNewTicker.toString().replace(/News :/g, "News:").replace("Neeeeews :", "Neeeeews:").replace("Nws :", "Nws:").replace('Game.TickerEffect=0;', 'var ov = Game.overrideNews(); if (ov.length) { list = choose(ov); } Game.TickerEffect=0;').replace('Game.Ticker=choose(list);', 'Game.Ticker=choose(list); Game.lastTicker = Game.Ticker;'));

		allValues('news');

        /*=====================================================================================
        Power clicks
        =======================================================================================*/

		addLoc('Cookie production x%1 and decay propagation %2 for %3!');
		new Game.buffType('powerClick', function(time, pow, stack) {
			//pow here is a straight multiplier to cps and the inverse of which is the multiplier to decay propagation
			return {
				name:'Power poked',
				desc:loc('Cookie production x%1 and decay propagation %2 for %3!', [Beautify(pow), '-'+Beautify(100 * (1 - (1 / pow)))+'%', Game.sayTime(time, -1)]),
				icon:[19, 7],
				time:time,
				power:1 / pow,
				multCpS:pow,
				aura:1
			};
		});
		new Game.buffType('powerSurge', function(time) {
			return {
				name: 'Power surge',
				desc:loc('Your clicks become empowered by your power gauge!'),
				icon: [19, 7],
				time: time,
				aura: 0,
				max: true
			}
		});

		decay.power = 0;
		decay.firstPowerClickReq = 100;
		decay.powerClickScaling = 2;
		decay.powerClickReqs = [];
		decay.powerSurgeTime = 5 * Game.fps;
		decay.absPCMaxCapacity = 6;
		decay.PCCapacity = 2; //power click capacity
		decay.PCOnGCDuration = 1.5; //the effect of power clicks on golden cookie effect duration (multiplier)
		decay.PCMultOnClick = 10; //the multiplier to cookie gain on power click
		decay.powerLossLimit = 120 * Game.fps; //amount of frames before power loss starts to happen
		decay.powerLossFactor = 0.33; //pow factor; the more this is the faster power loss happens
		decay.currentPC = 0; //updated every frame before draw, represents the amount of power clicks available
		decay.powerToNext = 0; //updated every frame before draw, represents the amount of remaining power required to get the next power click
		decay.totalPowerLimit = 0; //updated every frame before draw, represents the total amount of power it can hold
		decay.buildPowerClickReqs = function() {
			decay.powerClickReqs = [];
			var total = 0;
			var num = decay.firstPowerClickReq;
			for (let i = 0; i < decay.absPCMaxCapacity; i++) {
				total += num; 
				decay.powerClickReqs.push(total);
				num *= decay.powerClickScaling;
			}
			decay.totalPowerLimit = decay.powerClickReqs[decay.powerClickReqs.length - 1];
		}
		decay.PCCapacityIncreasers = [Game.Upgrades['Angels'], Game.Upgrades['Virtues'], Game.Upgrades['Cherubim'], Game.Upgrades['God']];
		decay.PCBuffIncreasers = [Game.Upgrades['Belphegor'], Game.Upgrades['Mammon'], Game.Upgrades['Abaddon'], Game.Upgrades['Satan'], Game.Upgrades['Asmodeus'], Game.Upgrades['Beelzebub'], Game.Upgrades['Lucifer']];
		decay.POBoosters = [Game.Upgrades['Archangels'], Game.Upgrades['Dominions'], Game.Upgrades['Seraphim']];
		decay.recalcPCCapacity = function() {
			var base = 2;
			for (let i in decay.PCCapacityIncreasers) {
				if (decay.PCCapacityIncreasers[i].bought) { base++; }
			}
			return base;
		}
		decay.loadPowerClicks = function() {
			//contains all the functions to call right after loading in 
			decay.buildPowerClickReqs();
			decay.PCCapacity = decay.recalcPCCapacity();
		} 
		Game.registerHook('check', decay.loadPowerClicks);
		decay.spendPowerClick = function() {
			//decreases power as if a power click is used
			decay.tryUpdateTable = true;
			if (decay.power < decay.powerClickReqs[0]) { return false; }
			if (decay.power < decay.powerClickReqs[1]) { decay.power = 0; return true; }
			decay.times.sincePowerClick = 0; //so that gc clicks also work
			for (let i in decay.powerClickReqs) {
				if (decay.powerClickReqs[i] > decay.power) { decay.power = decay.powerClickReqs[i - 2]; return true; } 
				else if (decay.powerClickReqs[i] == decay.power) { decay.power = decay.powerClickReqs[i - 1]; return true; }
			}
			decay.power = decay.totalPowerLimit; return true;
		}
		decay.getPowerPokedDuration = function() {
			var base = 15;
			if (Game.Has('Chimera')) { base *= 1.5; }
			if (decay.challengeStatus('power')) { base *= 1.5; }
			if (Game.Has('Ichor syrup')) { base *= 1.07; }
			if (Game.Has('Fern tea')) { base *= 1.03; }
			if (Game.Has('Fortune #102')) { base *= 1.1; }
			
			return base * Game.fps;
		}
		decay.getPowerSurgeDur = function() {
			var base = 5;
			if (decay.isConditional('power')) { base /= decay.acceleration; }
			if (Game.Has('Ichor syrup')) { base *= 1.07; }
			if (Game.Has('Fern tea')) { base *= 1.03; }
			if (Game.Has('Fortune #102')) { base *= 1.1; }

			return base * Game.fps;
		}
		addLoc('The duration of Power poked and Power surge <b>+%1%</b>');
		replaceDesc('Ichor syrup', loc('The duration of Power poked and Power surge <b>+%1%</b>.', 7)+'<br>'+loc("Sugar lumps mature <b>%1</b> sooner.",Game.sayTime(7*60*Game.fps))+'<br>'+loc("Dropped by %1 plants.",loc("Ichorpuff").toLowerCase())+'<q>Tastes like candy. The smell is another story.</q>');
		replaceDesc('Fern tea', loc('The duration of Power poked and Power surge <b>+%1%</b>.', 3)+'<br>'+loc("Dropped by %1 plants.",loc("Drowsyfern").toLowerCase())+'<q>A chemically complex natural beverage, this soothing concoction has been used by mathematicians to solve equations in their sleep.</q>');
		replaceDesc('Fortune #102', loc('The duration of Power poked and Power surge <b>+%1%</b>.', 10)+'<br>'+'<q>Help, I\'m trapped in a '+(App?'computer':'browser')+' game!</q>');
		decay.halts['powerClick'] = new decay.haltChannelGroup();
		decay.powerClickHaltParameters = {
			autoExpire: true,
			halt: 2,
			power: 2.2,
			decMult: 0.25
		}
		decay.performPowerClick = function() {
			//function is specifically for activating on clicking big cookie, not anything else
			var power = 1.06;
			for (let i in decay.PCBuffIncreasers) {
				if (decay.PCBuffIncreasers[i].bought) { power += 0.02; }
			}
			var dur = decay.getPowerPokedDuration();
			if (Game.hasBuff('Power poked')) {
				var buff = Game.hasBuff('Power poked');
				buff.time = dur;
				buff.power *= (1 / power);
				buff.multCpS *= power;
				buff.arg1 *= power;
				if (buff.arg2 >= 2) { decay.purifyAll(0.5 + buff.arg2 * 0.5, 1 - Math.pow(0.7, buff.arg2), 100); }
				buff.arg2 += 1;
			} else { 
				Game.gainBuff('powerClick', dur, power, 1); 
			}
			Game.gainBuff('powerSurge', decay.getPowerSurgeDur());
			var halt = 2;
			if (Game.Has('Chimera') && decay.gen < 1) { halt *= 1 / Math.pow(decay.gen, 0.1); halt = Math.min(halt, 10); }
			let channel = new decay.haltChannel(decay.powerClickHaltParameters);
			channel.halt = halt;
			decay.halts.powerClick.addChannel(channel);
		}
		decay.PCOnBigCookie = function() {
			if (Game.hasBuff('Power surge') && decay.spendPowerClick()) { decay.performPowerClick(); return 10; }
			return 1;
		}
		eval('Game.ClickCookie='+Game.ClickCookie.toString().replace(`var amount=amount?amount:Game.computedMouseCps;`, `var amount=amount?amount:Game.computedMouseCps; amount *= decay.PCOnBigCookie();`).replace(`(Game.OnAscend || Game.AscendTimer>0 || Game.T<3 || now-Game.lastClick<1000/((e?e.detail:1)===0?3:50))`, `(Game.OnAscend || Game.AscendTimer>0 || Game.T<3 || now-Game.lastClick<1000/((e?e.detail:1)===0?3:50) || !decay.gameCan.click)`));
		Game.rebuildBigCookieButton = function() {
			l('bigCookie').remove();
			var bigCookie = document.createElement('button');
			bigCookie.id = 'bigCookie';
			l('cookieAnchor').appendChild(bigCookie);
			if (Game.touchEvents) {
				AddEvent(bigCookie,'touchend',Game.ClickCookie);
				AddEvent(bigCookie,'touchstart',function(event){if (decay.gameCan.click) { Game.BigCookieState=1; }if (event) event.preventDefault();});
				AddEvent(bigCookie,'touchend',function(event){if (decay.gameCan.click) { Game.BigCookieState=0; }if (event) event.preventDefault();});
			} else {
				AddEvent(bigCookie,'click',Game.ClickCookie);
				AddEvent(bigCookie,'mousedown',function(event){if (decay.gameCan.click) { Game.BigCookieState=1; }if (Game.prefs.cookiesound) {Game.playCookieClickSound();}if (event) event.preventDefault();});
				AddEvent(bigCookie,'mouseup',function(event){if (decay.gameCan.click) { Game.BigCookieState=2; }if (event) event.preventDefault();});
				AddEvent(bigCookie,'mouseout',function(event){if (decay.gameCan.click) { Game.BigCookieState=0; }});
				AddEvent(bigCookie,'mouseover',function(event){if (decay.gameCan.click) { Game.BigCookieState=2; }});
			}
		}
		
		decay.hasPowerClicks = function() {
			return (decay.power >= decay.powerClickReqs[0]);
		}
		decay.powerClicksOn = function() {
			return Game.hasBuff('powerSurge');
		}
		//no decay.powerClick here for simplicity
		decay.tryUpdateTable = true;
		decay.updatePower = function() {
			var p = decay.power;
			var r = 0;
			for (let i in decay.powerClickReqs) {
				if (p < decay.powerClickReqs[i]) { r = i; break; }
			}
			if (p == decay.powerClickReqs[decay.powerClickReqs.length - 1]) { r = decay.powerClickReqs.length; }
			decay.currentPC = r;
			if (decay.powerClickReqs[r]) { decay.powerToNext = decay.powerClickReqs[r] - p; } else { decay.powerToNext = 1; }
			if (decay.tryUpdateTable) { decay.onPCChange(); decay.tryUpdateTable = false; }
			if (Game.hasBuff('Power poked')) { return; }
			if (decay.isConditional('power')) {
				var toGain = 2 + Math.sqrt(decay.currentPC + 1) * decay.acceleration * Math.pow(Math.max(decay.times.sincePowerClick / Game.fps - (20 / decay.acceleration), 1), 0.4) / Game.fps;
				if (decay.power != 0 && decay.powerToNext <= 0) { decay.tryUpdateTable = true; }
				decay.power += toGain;
				if (decay.power >= decay.totalPowerLimit) { decay.power = decay.totalPowerLimit; decay.forceAscend(false); }
				decay.power = Math.max(0, decay.power);
				return;
			}
			if (decay.times.sincePowerGain < decay.powerLossLimit) { return; }
			var toLose = Math.pow(Math.max(Math.min(decay.times.sincePowerGain, decay.times.sinceOrbClick, decay.times.sincePowerClick) - decay.powerLossLimit, 0), decay.powerLossFactor) / Game.fps;
			if (decay.power != 0 && decay.powerToNext + toLose > decay.powerClickReqs[decay.currentPC]) { decay.tryUpdateTable = true; }
			decay.power -= toLose;
			decay.power = Math.max(0, decay.power);
		}
		decay.powerUnlocked = function() {
			return Game.Has('Twin Gates of Transcendence');
		}
		decay.gainPower = function(amount) {
			if (Game.hasBuff('Power poked') || !decay.powerUnlocked()) { return; }
			decay.power = Math.min(decay.power + amount, decay.totalPowerLimit);
			decay.times.sincePowerGain = 0;
			if (decay.powerToNext - amount < 0) { decay.onPCChange(); }
		}
		
		eval('Game.shimmerTypes["golden"].popFunc='+Game.shimmerTypes['golden'].popFunc.toString().replace("this.last=choice;","this.last=choice; var powerClick=false; if (decay.powerClicksOn() && decay.hasPowerClicks()) { decay.spendPowerClick(); powerClick=true; PlaySound('snd/powerShimmer.mp3',0.4); PlaySound('snd/powerClick'+choose([1,2,3])+'b.mp3',0.7-Math.random()*0.3); }"));

		eval('Game.shimmerTypes["golden"].popFunc='+Game.shimmerTypes['golden'].popFunc.toString().replace("else mult*=Game.eff('wrathCookieGain');","else mult*=Game.eff('wrathCookieGain'); if (powerClick) { effectDurMod*=decay.PCOnGCDuration; mult*=decay.PCOnGCDuration*50; } "));

		Game.Upgrades["Twin Gates of Transcendence"].dname="Power clicks";
		
	
		replaceDesc('Twin Gates of Transcendence', 'Unlocks <b>power clicks</b>. You now <b>build up power</b> by purifying decay or popping wrinklers, which condense into power clicks. Each stored power click makes the next one take <b>2x</b> more power. You start with a maximum storage capacity of <b>2</b> power clicks.<line></line><br>&bull; to make power clicks, break open power orbs that occasionally fall from the sky to enable power clicks for 5 seconds. Making successful power clicks refresh that buff, and power orbs fall when you click with some power stored. <br>&bull; accumulated power naturally degrades over time, which can eventually result in losing your stored power clicks. <br>&bull; each power click produces <b>10 times</b> as much as normal clips, stop decay for an extended period of time, creates a buff that boost all cookie production by <b>+6%</b> for <b>15 seconds</b> (strength stacks) and multiplicatively decreases decay propagation for <b>an equivalent amount</b>. (e.g. +6% production equals -6% decay propagation)<br>&bull; while the buff is active, you cannot gain or lose power. <br>&bull; in addition, using power clicks on golden cookies make their buff duration <b>+50%</b> longer. <br>&bull; increase the strength of the buff enough in order to enable power clicks to purify decay!<q>There\'s plenty of knowledgeable people up here, and you\'ve been given some excellent pointers.</q>');
		replaceDesc('Angels', 'Maximum power click capacity increased to <b>3</b>.<q>Lowest-ranking at the first sphere of pastry heaven, angels are tasked with delivering new recipes to the mortals they deem worthy.</q>');
		replaceDesc('Archangels', 'Power orbs appear <b>20%</b> more often, and power orbs has <b>15%</b> less health.<q>Members of the first sphere of pastry heaven, archangels are responsible for the smooth functioning of the world\'s largest bakeries.</q>');
		replaceDesc('Virtues', 'Maximum power click capacity increased to <b>4</b>.<q>Found at the second sphere of pastry heaven, virtues make use of their heavenly strength to push and drag the stars of the cosmos.</q>');
		replaceDesc('Dominions', 'Power orbs appear <b>20%</b> more often, and power orbs has <b>15%</b> less health.<q>Ruling over the second sphere of pastry heaven, dominions hold a managerial position and are in charge of accounting and regulating schedules.</q>');
		replaceDesc('Cherubim', 'Maximum power click capacity increased to <b>5</b>.<q>Sieging at the first sphere of pastry heaven, the four-faced cherubim serve as heavenly bouncers and bodyguards.</q>');
		replaceDesc('Seraphim', 'Power orbs appear <b>20%</b> more often, and power orbs has <b>15%</b> less health.<q>Leading the first sphere of pastry heaven, seraphim possess ultimate knowledge of everything pertaining to baking.</q>');
		replaceDesc('God', 'Maximum power click capacity increased to <b>6</b>.<q>Like Santa, but less fun.</q>');
		replaceDesc('Belphegor', 'Power click buff increased to <b>+8%</b> cookie production and an equivalent amount of decay propagation decrease.<q>A demon of shortcuts and laziness, Belphegor commands machines to do work in his stead.</q>');
		replaceDesc('Mammon', 'Power click buff increased to <b>+10%</b> cookie production and an equivalent amount of decay propagation decrease.<q>The demonic embodiment of wealth, Mammon requests a tithe of blood and gold from all his worshippers.</q>');
        replaceDesc('Abaddon', 'Power click buff increased to <b>+12%</b> cookie production and an equivalent amount of decay propagation decrease.<q>Master of overindulgence, Abaddon governs the wrinkler brood and inspires their insatiability.</q>');
		replaceDesc('Satan', 'Power click buff increased to <b>+14%</b> cookie production and an equivalent amount of decay propagation decrease.<q>The counterpoint to everything righteous, this demon represents the nefarious influence of deceit and temptation.</q>');
		replaceDesc('Asmodeus', 'Power click buff increased to <b>+16%</b> cookie production and an equivalent amount of decay propagation decrease.<q>This demon with three monstrous heads draws his power from the all-consuming desire for cookies and all things sweet.</q>');
		replaceDesc('Beelzebub', 'Power click buff increased to <b>+18%</b> cookie production and an equivalent amount of decay propagation decrease.<q>The festering incarnation of blight and disease, Beelzebub rules over the vast armies of pastry inferno.</q>');
		replaceDesc('Lucifer', 'Power click buff increased to <b>+20%</b> cookie production and an equivalent amount of decay propagation decrease.<q>Also known as the Lightbringer, this infernal prince\'s tremendous ego caused him to be cast down from pastry heaven.</q>');
		replaceDesc('Chimera', 'Decay halting duration from power clicks disproportionally scales with current decay; the more decay you have, the longer it halts decay for.<br>Power poked buff duration <b>+50%</b>.<q>More than the sum of its parts.</q>');

		injectCSS('.verticalMeterContainer { background: rgba(0, 0, 0, 0.25); border-radius: 2px; position: absolute; right: 0px; bottom: -96px; right: -30px; margin-left: -10px; border-image:url(img/frameBorder.png) 3 round; border-style: solid; border-width: 10px; z-index: 10; width: 100px; height: 350px; transform: scale(0.3); }');
		injectCSS('.verticalMeter { width: 100%; position: absolute; bottom: 0px; background: url("'+kaizoCookies.images.powerGradientBlue+'");}');
		injectCSS('.powerTableContainer { width: 100%; height: 100%; z-index: 5; position: absolute; }');
		injectCSS('.powerGlow { text-shadow:0px -4px 8px rgba(240, 156, 255, 0.75),0px 3px 6px rgba(88, 185, 255, 0.8),0px 0px 3px rgba(255, 255, 255, 0.2); font-weight: bold; color: #fff; z-index: 2; position: absolute; top: 50%; left: 50%; font-size: 72px; transform: translate(-50%, -50%); }');
		injectCSS('.powerTable { width: 100%; height: 100%; }');
		injectCSS('.ptcell { border: 4px solid rgb(64, 64, 64);  }');
		injectCSS('.ptcol { width: 100%; }');
		decay.createPowerGauge = function() {
			var PGDiv = document.createElement('div');
			PGDiv.classList.add('verticalMeterContainer');
			PGDiv.id = 'powerGauge';
			PGDiv.style.display = 'none';
			var fill = document.createElement('div');
			fill.classList.add('verticalMeter');
			fill.id = 'powerFill';
			var tableContainer = document.createElement('div');
			tableContainer.classList.add('powerTableContainer');
			var table = document.createElement('table');
			table.id = 'powerTable';
			table.classList.add('powerTable');
			tableContainer.appendChild(table);
			var num = document.createElement('div');
			num.id = 'powerNum';
			num.classList.add('powerGlow');
			PGDiv.appendChild(num);
			PGDiv.appendChild(fill);
			PGDiv.appendChild(tableContainer);
			l('sectionLeft').appendChild(PGDiv);
			
			decay.powerGaugeEle = l('powerGauge');
			decay.powerFillEle = l('powerFill');
			decay.powerNumEle = l('powerNum');
			decay.powerTableEle = l('powerTable');
			Game.rebuildBigCookieButton();
		}
		decay.setGaugeColor = function(imageRef) {
			decay.powerFillEle.style.background = 'url("'+kaizoCookies.images[imageRef]+'")';
		} 
		if (Game.ready) { decay.createPowerGauge(); decay.setGaugeColor('powerGradientBlue'); } else { Game.registerHook('create', decay.createPowerGauge); }
		decay.updatePowerGauge = function() { 
			if (!decay.powerUnlocked() || !decay.unlocked) { decay.powerGaugeEle.style.display = 'none'; return; }
			decay.powerGaugeEle.style.display = '';
			var total = decay.powerClickReqs[decay.currentPC];
			if (decay.currentPC > 0) { total -= decay.powerClickReqs[decay.currentPC - 1]; }
			decay.powerFillEle.style.height = (100 * ((total - decay.powerToNext) / total)) + '%';
			decay.powerNumEle.innerHTML = decay.currentPC.toString(); 
		}
		eval('Game.ToggleSpecialMenu='+Game.ToggleSpecialMenu.toString().replace(`l('specialPopup').innerHTML=str;`, `l('specialPopup').innerHTML=str; l('specialPopup').style.width = (decay.powerUnlocked()?320:350)+'px';`));
		if (Game.ready && Game.specialTab) { var st = Game.specialTab; Game.ToggleSpecialMenu(false); Game.specialTab = st; Game.ToggleSpecialMenu(true); }
		decay.onPCChange = function() {
			var str = '';
			var total = decay.powerClickReqs[decay.currentPC];
			if (decay.currentPC > 0) { total -= decay.powerClickReqs[decay.currentPC - 1]; }
			var repeats = total / decay.powerClickReqs[0];
			for (let i = 1; i <= repeats; i++) {
				str += '<tr class="ptcell"><td class="ptcol"></td></tr>';
			}
			var remains = repeats - Math.floor(repeats);
			str = '<tr class="ptcell" style="height:'+((1 - (1 / repeats) * Math.floor(repeats)) * 100)+'%;"><td class="ptcol"></td></tr>' + str;
			decay.powerTableEle.innerHTML = str;
		}
		Game.registerHook('check', decay.onPCChange);

		decay.powerOrbEle = document.createElement('div');
		decay.powerOrbEle.id = 'powerOrbs';
		injectCSS('#powerOrbs { position: absolute; left; 0px; top: 0px; z-index:1000000000; }');
		l('game').appendChild(decay.powerOrbEle);
		injectCSS('.powerOrb { cursor: pointer; position: absolute; display: block; background: url("'+kaizoCookies.images.powerOrb+'"); }');
		decay.getPowerOrbHP = function() {
			var base = 110;
			for (let i in decay.POBoosters) {
				if (decay.POBoosters[i].bought) { base *= (1 - 0.15); }
			}
			if (decay.isConditional('power')) { base *= 1.5; }
			return base;
		}
		decay.vector = function(x, y) {
			this.x = x||0;
			this.y = y||0;
		}
		decay.vector.prototype.magnitude = function(mult) {
			if (typeof mult !== 'undefined') {
				this.x *= mult;
				this.y *= mult;
			}
			return Math.sqrt(this.x*this.x, this.y*this.y);
		}
		decay.vector.prototype.multiply = function(mult) {
			this.x *= mult;
			this.y *= mult;
			return this;
		}
		decay.vectorAdd = function(v1, v2) {
			return new decay.vector(v1.x+v2.x, v1.y+v2.y);
		}
		decay.vector.prototype.add = function(v) {
			this.x += v.x;
			this.y += v.y;
		}
		decay.vector.prototype.copy = function() {
			return new decay.vector(this.x, this.y);
		}
		decay.vector.prototype.toPolar = function() {
			return [this.magnitude(), Math.atan2(-this.y, this.x)];
		}
		decay.vector.prototype.setPolar = function(input) {
			this.x = Math.cos(input[1]) * input[0];
			this.y = -Math.sin(input[1]) * input[0];
		}
		decay.vector.prototype.addPolar = function(input) {
			var v = new decay.vector();
			v.setPolar(input);
			return this.add(v);
		}
		decay.polar = function(mag, rad) {
			//NOT a replacement for vector, just a convenient tool to get a vector from polar
			var v = new decay.vector();
			v.setPolar([mag, rad]);
			return v;
		}
		decay.powerOrbs = [];
		decay.powerOrbsN = 0;
		decay.powerOrb = function(mirage) {
			this.hp = decay.getPowerOrbHP();
			this.hpMax = this.hp;
			this.x = Math.random() * l('game').offsetWidth;
			this.y = 0;
			this.size = 32; //px
			this.scale = 1; //mult
			this.scaleMult = 1; //mult to scale
			this.r = 0; //deg
			this.velocity = new decay.vector(0, 5);
			this.velToAdd = new decay.vector(0, 0);
			this.static = new decay.vector(); //not subject to friction and is reset to 0 every frame
			this.mode = '';
			/* possible modes: floating, jumpy, daring, teleporting, crazy */
			/* 
   			Floating: floats left and right, avoids cursor
   			Jumpy: occasionally gives velocity boost in a random direction (prefers left and right), jumps faster and stronger if cursor is near
	  		Daring: launches itself toward cursor, but also avoids cursor with a much stronger scaling as its distance closes; only available above half health
	  		Teleporting: very small movements but teleports to another position when cursor gets near; only available below half health
	 		Crazy: lasts very little time, but it just flings itself across the screen randomly with high bounce loss
	  		*/
			this.mirage = mirage ?? null; //how real it is
			/* if it is, replace with an object describing the mirage. If an orb is a mirage, it is unaffected by mode and instead takes on custom behavior indicated by the update property (function that takes in itself every frame)*/
			/* parameters: 
   			init: on instantiation
   			update: every frame
	  		die: on death
	 		onClick: on click
	  		*/
			if (this.mirage && this.mirage.init) { this.mirage.init(this); }

			this.fleeIn = 450 * Game.fps;

			this.simulating = true;
			this.bounceMode = 1; //0 is no bounce checking, 1 is normal bounce, 2 is wraparound (unimplemented)
			this.bounceLoss = 1;
			this.g = l('game');
			this.t = 0;
			this.t2 = 0;
			this.mouseDist2 = 0;
			this.mouseVector = new decay.vector(0, 0);
			this.times = {
				sinceLastClick: 0,
				sinceLastModeChange: 0,
				sinceLastJump: 0,
				sinceLastBounce: 0,
				sinceLastTeleport: 0
			};
			this.selected = false;
			this.nextModeIn = 0;
			this.frictionX = 1;
			this.frictionY = 1;
			if (!this.mirage) { this.changeMode('floating'); }
			
			this.l = document.createElement('div');
			this.l.classList.add('powerOrb');
			this.l.style.left = this.x + 'px';
			this.l.style.top = this.y + 'px';
			if (!Game.touchEvents) {AddEvent(this.l,'mousedown',function(what){return function(event){what.clickHandler(event);};}(this));}
			else {AddEvent(this.l,'touchend',function(what){return function(event){what.clickHandler(event);};}(this));}//plagerism!!!
			if (!Game.touchEvents) {AddEvent(this.l,'mouseover',function(what){return function(event){what.selected = true;};}(this));}
			else {AddEvent(this.l,'touchstart',function(what){return function(event){what.selected = true;};}(this));}
			if (!Game.touchEvents) {AddEvent(this.l,'mouseout',function(what){return function(event){what.selected = false;};}(this));}
			else {AddEvent(this.l,'touchend',function(what){return function(event){what.selected = false;};}(this));}
			//dont think touch events ever get used ever so like really cant be bothered to fix the not working code
			decay.powerOrbEle.appendChild(this.l);
			decay.powerOrbs.push(this);
			decay.powerOrbsN++;
		}

		decay.halts['powerOrb'] = new decay.haltChannel({
			keep: 1,
			decMult: 0.5,
			tickspeedPow: 0.1,
			overtimeEfficiency: 0.5,
			overtimeLimit: 5,
			power: 0.5
		});
		decay.powerOrb.prototype.die = function() {
			if (decay.powerOrbs.indexOf(this)!=-1) { decay.powerOrbs.splice(decay.powerOrbs.indexOf(this), 1); }
			this.l.remove();
			decay.powerOrbsN--;
			if (this.mirage) {
				if (this.mirage.die) { this.mirage.die(this); }
				return;
			}
			Game.gainBuff('powerSurge', decay.getPowerSurgeDur());
			decay.stop(4, 'powerOrb');
			decay.purifyAll(2, 0.5, 10);
		}
		decay.powerOrb.prototype.expire = function() {
			if (decay.powerOrbs.indexOf(this)!=-1) { decay.powerOrbs.splice(decay.powerOrbs.indexOf(this), 1); }
			this.l.remove();
			decay.powerOrbsN--;
		}
		decay.powerOrb.prototype.update = function() {
			//every non-draw frame because more consistency even tho realistically it makes 0 difference
			if (this.hp <= 0) {
				this.die();
			}
			
			var aX = this.x + this.size/2;
			var aY = this.y + this.size/2;
			this.static.multiply(0);
			
			this.t++; 
			this.mouseDist2 = Math.pow(Game.mouseX - aX, 2) + Math.pow(Game.mouseY - aY, 2);
			this.t2 += 1 + 5 / (1 + this.mouseDist2);
			this.mouseVector = new decay.vector(Game.mouseX - aX, Game.mouseY - aY);

			for (let i in this.times) { this.times[i]++; }
			this.fleeIn = Math.max(0, this.fleeIn - 1);
			if (this.fleeIn == 0 && this.y > this.g.offsetHeight / 2 && this.mode != 'fleeing') {
				this.changeMode('fleeing');
			}

			if (this.mirage) {
				if (this.mirage.update) { this.mirage.update(this); }
				return;
			}

			if (this.nextModeIn <= 0) {
				this.changeMode(this.selectMode());
			} 
			this.nextModeIn--; 
			this.regenerate();
			this.move(aX, aY);
			if (this.simulating) { this.simulate(); }
		}
		decay.powerOrb.prototype.regenerate = function() {
			//this.hp += (Math.min(Math.sqrt(Math.max(0, this.times.sinceLastClick - 12 * Game.fps)), 50) / 10) / Game.fps;
			if (Game.hasBuff('Haggler\'s misery')) { this.hp += 2.5 / Game.fps; }
			
			this.hp = Math.min(this.hp, this.hpMax);
		}
		decay.powerOrb.prototype.simulate = function() {
			this.velToAdd.multiply(Math.min(Game.deltaTime / (1000 / Game.fps), 3)); //latency compensator, which is actually quite important 
			this.velocity.add(this.velToAdd);
			this.velToAdd.multiply(0);
			
			//bouncing
			const size = this.size * this.scale * this.scaleMult;
			if (this.bounceMode == 1) {
				if (this.x + size + this.velocity.x >= this.g.offsetWidth) { this.onBounce(); this.velocity.x *= -this.bounceLoss; this.x = this.g.offsetWidth -= size; } 
				if (this.x + this.velocity.x <= 0) { this.onBounce(); this.velocity.x *= -this.bounceLoss; this.x = 0; }
				if (this.y + size + this.velocity.y >= this.g.offsetHeight) { this.onBounce(); this.velocity.y *= -this.bounceLoss; this.y = this.g.offsetHeight -= size; } //not gonna really bother with much here but ig it could be better
				if (this.y + this.velocity.y <= 0) { this.onBounce(); this.velocity.y *= -this.bounceLoss; this.y = 0; }
			}

			//friction
			if (this.times.sinceLastModeChange <= 5 * Game.fps) {
				const additionalFriction = (1 - 0.05 * (1 / Math.pow(this.times.sinceLastModeChange + 75, 0.25)));
				this.velocity.x *= additionalFriction;
				this.velocity.y *= additionalFriction;
			}
			this.velocity.x *= this.frictionX;
			this.velocity.y *= this.frictionY;

			//scaling
			this.scale = 1 + 0.5 * (1 - this.hp / this.hpMax);
			if (decay.isConditional('typing') || decay.isConditional('typingR')) { this.scale *= 3; }
			if (decay.isConditional('power')) { this.scale *= 0.7; }

			//hagglers charm effect
			if (Game.hasBuff('Haggler\'s luck')) {
				let newVector = this.mouseVector.copy().toPolar();
				newVector[0] = Math.pow(newVector[0], 0.15);
				this.velocity.addPolar(newVector);
			}
			if (Game.hasBuff('Haggler\'s misery')) {
				this.velocity.multiply(3);
			}
			
			this.x += this.velocity.x + this.static.x;
			this.y += this.velocity.y + this.static.y;
		}
		decay.powerOrb.prototype.keepInBound = function() {
			this.x = Math.min(this.x, this.g.offsetWidth - this.size * this.scale * this.scaleMult); 
			this.x = Math.max(this.x, 0);
			this.y = Math.min(this.y, this.g.offsetHeight - this.size * this.scale * this.scaleMult); 
			this.y = Math.max(this.y, 0);
		}
		Game.sign = function(num) {
			if (num < 0) { return -1; } else if (num > 0) { return 1; } else { return 0; } //probably a better way to do this 
		}
		decay.powerOrb.prototype.move = function(aX, aY) {
			var vel = new decay.vector();
			const yFrac = 1 - this.y / this.g.offsetHeight;

			switch (this.mode) {
				case 'floating': 
					vel.setPolar([(Math.cos(this.t2 / 11)*2+4)/(3 * Math.log(this.mouseDist2 + 3)), (Math.sin(this.t2 / (25))+1)*Math.PI/2]);
					if (this.mouseVector.magnitude() <= 120) {
						var newVector = this.mouseVector.copy().toPolar();
						newVector[0] = 1 / (1 + Math.sqrt(newVector[0]));
						newVector[0] *= -1 - 5 * Math.pow(1 / (this.times.sinceLastClick / Game.fps + 1), 0.5);
						vel.addPolar(newVector);
					}

					vel.add(new decay.vector(0, 0.02+yFrac*0.04)); //gravity
					break;
				case 'jumpy':
					var dist = this.times.sinceLastJump * (1 / (1 + Math.pow(this.mouseDist2, 0.15)));
					if (dist >= 10 && Math.random() < Math.pow(0.5, 6 / dist)) {
						this.times.sinceLastJump = 0;
						//jumps away from cursor
						var newVector = this.mouseVector.copy().toPolar();
						newVector[0] = -5 - (Math.random() * 8);
						vel.addPolar(newVector);
						vel.addPolar([3, (Math.random() - 0.5) * Math.PI * 2]);
					}

					vel.add(new decay.vector(0, 0.02+yFrac*0.02)); //gravity
					break;
				case 'daring':
					var dist = this.times.sinceLastJump * (1 + Math.pow(this.mouseDist2, 0.1));
					if (dist >= 400 && Math.random() < Math.pow(0.5, 4000 / dist)) {
						this.times.sinceLastJump = 0;
						//jumps toward cursor
						var newVector = this.mouseVector.copy().toPolar();
						newVector[0] = 8 + (Math.random() * 6) + 12 * (1 - 1 / (this.times.sinceLastClick / Game.fps + 1));
						vel.addPolar(newVector);
						vel.addPolar([3, (Math.random() - 0.5) * Math.PI * 2]);
					}
					if (this.mouseVector.magnitude() <= 180) {
						var newVector = this.mouseVector.copy().toPolar();
						newVector[0] = 1 / (1 + Math.pow(newVector[0], 0.5));
						newVector[0] *= (1 / Math.pow(this.times.sinceLastJump + 1, 0.5)) * (-12 - 20 * Math.pow(1 / (this.times.sinceLastClick / Game.fps + 1), 0.5));
						vel.addPolar(newVector);
					}

					vel.add(new decay.vector(0, 0.04+yFrac*0.03)); //gravity
					break;
				case 'teleporting':
					if (this.times.sinceLastClick > 1 * Game.fps) { this.simulating = (this.times.sinceLastTeleport > 0.5 * Game.fps); } else { this.simulating = true; }
					this.scaleMult = Math.min(1, (this.times.sinceLastTeleport + 1) / (0.25 * Game.fps));

					if (this.times.sinceLastTeleport < 0.1 * Game.fps) { break; }
					var dist = Math.pow(this.mouseDist2, 0.5);
					if (dist >= 25 && dist < 150) {
						if (Math.random() < (dist - 25) / 150) { 
							decay.spawnTeleportMirage(this); 
							var nVel = new decay.vector();
							nVel.addPolar([300, Game.randomRad()]);
							var newVector = new decay.vector((this.g.offsetWidth / 2) - aX, (this.g.offsetHeight / 2) - aY);
							newVector = newVector.toPolar();
							newVector[0] = 75 + 50 * Math.random();
							nVel.addPolar(newVector);
							newVector = this.mouseVector.copy().toPolar();
							newVector[0] = -25 - (Math.random() * 20);
							nVel.addPolar(newVector);
	
							this.x += nVel.x;
							this.y += nVel.y;
							this.keepInBound();
							this.times.sinceLastTeleport = 0;
						}
					} else if (dist < 25) {
						decay.spawnTeleportMirage(this);
						var nVel = new decay.vector();
						nVel.addPolar([100, Game.randomRad()]);
						var newVector = new decay.vector((this.g.offsetWidth / 2) - aX, (this.g.offsetHeight / 2) - aY);
						newVector = newVector.toPolar();
						newVector[0] = 25 + 25 * Math.random();
						nVel.addPolar(newVector);
						newVector = this.mouseVector.copy().toPolar();
						newVector[0] = -15 - (Math.random() * 10);
						nVel.addPolar(newVector);

						this.x += nVel.x;
						this.y += nVel.y;
						this.keepInBound();
						this.times.sinceLastTeleport = 0;
					}
					break;
				case 'crazy':
					vel.setPolar([Math.cos(this.t / 7) * 4 + 5, Math.sin(this.t / 11) * Math.PI]);
					break;
				case 'fleeing':
					vel.add(new decay.vector(0, -this.times.sinceLastModeChange / 60));
					if (this.y < 0 - 2 * aY) {
						this.expire();
					}
					break;
			}

			vel.multiply(Math.min(1, 1.5 - Math.pow(this.hp / this.hpMax, 2))); //decreased momentum if above some health
			this.velToAdd.add(vel);
		}
		Game.randomRad = function() {
			return Math.PI * 2 * (Math.random() - 0.5);
		}
		decay.spawnTeleportMirage = function(it) {
			var m = new decay.powerOrb({
				update: function(me) {
					me.scale -= 2 / Game.fps;
					if (me.scale <= 0) { me.die(); }
				},
				onClick: function(me) {
					if (me.origin) {
						me.origin.onClick(me.origin);
						me.die();
					}
				}
			});
			m.x = it.x;
			m.y = it.y;
			m.scale = it.scale;
			m.origin = it;
		}

		decay.powerOrb.prototype.selectMode = function(bans) {
			var pool = ['floating', 'jumpy'];
			if (this.hp > this.hpMax / 2) { pool.push('daring'); } else { pool.push('teleporting'); }
			if (this.hp < this.hpMax / 5) { pool.push('crazy'); pool.push('crazy'); }
			
			if (Math.random() < 0.8 && pool.indexOf(this.mode) != -1) { pool.splice(pool.indexOf(this.mode), 1); }
			for (let i in bans) {
				if (pool.indexOf(bans[i]) != -1) { pool.splice(pool.indexOf(bans[i]), 1); }
			}
			if (pool.length) { return choose(pool); } else { return this.selectMode(); }
		}
		decay.powerOrb.prototype.changeMode = function(mode) {
			if (this.mode == 'teleporting') {
				this.simulating = true;
				this.scaleMult = 1;
			}
			if (this.mode == 'fleeing') {
				this.bounceMode = 1;
			}
				
			var timeUntilNext = 0;
			this.mode = mode;
			this.times.sinceLastModeChange = 0;
			switch (mode) {
				case 'floating':
					this.frictionX = 0.98;
					this.frictionY = 0.99;
					this.bounceLoss = 0.98;
					timeUntilNext = Game.fps * (20 + 40 * Math.random());
					break;
				case 'jumpy':
					this.frictionX = 0.998;
					this.frictionY = 0.985;
					this.bounceLoss = 0.8;
					this.times.sinceLastJump = 0;
					timeUntilNext = Game.fps * (10 + 30 * Math.random());
					break;
				case 'daring':
					this.frictionX = 0.995;
					this.frictionY = 0.995;
					this.bounceLoss = 0.9;
					this.times.sinceLastJump = 0;
					timeUntilNext = Game.fps * (30 + 10 * Math.random());
					break;
				case 'teleporting':
					this.frictionX = 0.95;
					this.frictionY = 0.95;
					this.bounceLoss = 1;
					timeUntilNext = Game.fps * (10 + 20 * Math.random());
					break;
				case 'crazy':
					this.frictionX = 0.995;
					this.frictionY = 0.995;
					this.bounceLoss = 0.6;
					timeUntilNext = Game.fps * (2 + 2 * Math.random());
					break;
				case 'fleeing':
					this.frictionX = 0.975;
					this.frictionY = 0.99;
					this.bounceLoss = 1;
					timeUntilNext = 100000000000000;
					this.bounceMode = 0;
					break;
			}
			this.nextModeIn = timeUntilNext;
		}
  
		decay.powerOrb.prototype.clickHandler = function(event) {
			decay.times.sinceOrbClick = 0;
			if (event) { event.preventDefault(); }
			this.onClick(this);
		}
		decay.powerOrb.prototype.onClick = function(me) {
			if (!decay.gameCan.clickPowerOrbs) { return; }
			if (this.mirage) {
				if (this.mirage.onClick) { this.mirage.onClick(me); }
				return;
			}
			Game.Notify('Orb clicked!', '', 0, 2);
			decay.triggerNotif('powerOrb');
			
			me.velocity.add(decay.polar(Math.random() * 20 + 30, 2 * Math.PI * (Math.random() - 0.5)));
			me.times.sinceLastClick = 0;
			me.fleeIn += 20 * Game.fps;
			decay.gainPower(20);
			if (this.mode == 'teleporting' || this.mode == 'fleeing') {
				this.changeMode(this.selectMode(['teleporting']));
			}
			me.nextModeIn /= 4; me.nextModeIn = Math.floor(me.nextModeIn);
			
			me.hp -= 5;
			me.hp *= 0.9;
			decay.stop(2.5, 'powerOrb');
		}
		decay.powerOrb.prototype.onBounce = function() {
			this.times.sinceLastBounce = 0;
		}
		decay.powerOrb.prototype.draw = function() {
			//updates associated html element
			this.l.style.left = this.x + 'px';
			this.l.style.top = this.y + 'px';
			this.l.style.width = this.size + 'px';
			this.l.style.height = this.size + 'px';
			this.l.style.transform = 'rotate('+this.r+') scale('+(this.scale*this.scaleMult)+')';
		}
		decay.updatePowerOrbs = function() {
			for (let i in decay.powerOrbs) {
				decay.powerOrbs[i].draw();
				decay.powerOrbs[i].update();
			}
		}

		decay.killAllPowerOrbs = function() {
			for (let i = decay.powerOrbs.length-1; i >= 0; i--) {
				decay.powerOrbs[i].expire();
			}
		}
		decay.resetPower = function() {
			decay.power = 0;
			decay.times.sincePowerClick = 0;
		}
		Game.registerHook('reset', function() { decay.killAllPowerOrbs(); decay.resetPower(); });
		eval('Game.Ascend='+Game.Ascend.toString().replace('Game.killShimmers();', 'Game.killShimmers(); decay.killAllPowerOrbs(); kaizoCookies.unpauseGame();'));
		decay.spawnPowerOrbs = function() {
			if (decay.powerOrbsN > (Game.cookiesEarned>1e40?1:0) || decay.power == 0 || !decay.powerUnlocked()) { return; }

			var inverseChance = 0.995;
			for (let i in decay.POBoosters) {
				if (decay.POBoosters[i].bought) { inverseChance = Math.pow(inverseChance, 1.2); }
			}
			if (decay.isConditional('typing') || decay.isConditional('typingR') || decay.isConditional('power')) { inverseChance = Math.pow(inverseChance, 5); }
			if (Math.random() < (1 - inverseChance)) {
				new decay.powerOrb();
			}
		}
		Game.registerHook('click', decay.spawnPowerOrbs);
  
		

		/*=====================================================================================
        Challenge mode
        =======================================================================================*/

		Game.ascensionModes[42069] = {name:'Unshackled decay',dname:loc("Unshackled decay"),desc:loc("Decay gains \"Acceleration\", which is an boost to decay propagation with no way to decrease, increasing faster with existing decay and slower with existing purity. <br>Forced ascension always happen on infinite decay. Decay and momentum unlock much earlier than normal. Prestige and normal permanent upgrade slots are disabled (heavenly upgrades still work).<div class=\"line\"></div>Survive and make cookies in order to unlock certain upgrades. The more cookies you make, the more upgrades you unlock. Additional information and sub-challenges are available during the challenge mode in the Stats menu."),icon:[23,13,kaizoCookies.images.custImg]};

		eval('Game.PickAscensionMode='+Game.PickAscensionMode.toString().replace(`background-position:'+(-icon[0]*48)+'px '+(-icon[1]*48)+'px;`, `'+writeIcon(icon)+'`));

        eval('Game.CalculateGains='+Game.CalculateGains.toString().replace('if (Game.ascensionMode!=1) mult+=parseFloat(Game.prestige)*0.01*Game.heavenlyPower*Game.GetHeavenlyMultiplier();', 'if (Game.ascensionMode!=1 && Game.ascensionMode!=42069) { mult += decay.getCpSBoostFromPrestige() * 0.01; }'));

		eval('Game.Logic='+Game.Logic.toString().replace("if (Game.Has('Legacy') && Game.ascensionMode!=1)", "if (Game.Has('Legacy') && Game.ascensionMode!=1 && Game.ascensionMode!=42069)"));
		eval('Game.Logic='+Game.Logic.toString().replace("if (timePlayed<=1000*60*35) Game.Win('Speed baking I');", "//if (timePlayed<=1000*60*35) Game.Win('Speed baking I');"));
		eval('Game.Logic='+Game.Logic.toString().replace("if (timePlayed<=1000*60*25) Game.Win('Speed baking II');", "//if (timePlayed<=1000*60*25) Game.Win('Speed baking II');"));
		eval('Game.Logic='+Game.Logic.toString().replace("if (timePlayed<=1000*60*15) Game.Win('Speed baking III');", "//if (timePlayed<=1000*60*35) Game.Win('Speed baking I');"));

		eval('Game.Reset='+Game.Reset.toString().replace('if (Game.permanentUpgrades[i]!=-1)', 'if (Game.permanentUpgrades[i]!=-1 && Game.ascensionMode!=42069)'));

		injectCSS(`.singleChallenge { margin-top: 5px; margin-bottom: 5px; display:flex; justify-content:center; align-items: center; padding: 3px 5px; border-radius: 8px; }`);
		injectCSS(`.nameSection { display: inline-block; width: 32px; font-size: 0.9em; padding: 2px; position:relative; float: left; align-items: center; text-align: center; }`);
		injectCSS(`.nameSeparator { display: inline-block; position:relative; width: 1px; height: 24px; background-color: rgba(255,255,255,0.2); margin-left: 2px; margin-right: 3px; }`);
		injectCSS(`.taskSection { display: inline-block; width: 50%; padding: 2px; position:relative; align-items: center; text-align: left; }`);
		injectCSS(`.rewardSection { display: inline-block; width: 50%; padding: 2px; position:relative; text-align: right; vertical-align: center; align-items: center; }`);
		//injectCSS(`.rewardSection::before { content: ""; display: inline-block; vertical-align: middle; height: 100%; }`);
		//injectCSS(`.rewardSection span { display: inline-block; vertical-align: middle; }`)
		injectCSS(`.challengeNotice { font-style: italic; text-align: center; margin: auto; padding-top: 8px; padding-bottom: 1px; }`);
		injectCSS(`.prereqNotice { font-style: italic; font-size: 0.75em; text-align: center; margin: auto; padding-bottom: 8px; padding-top: 1px; }`);
		injectCSS(`.cannotCompleteWarning { font-style: italic; font-size: 0.9em; text-align: center; margin: auto; padding-bottom: 8px; padding-top: 1px; }`);
		injectCSS(`.conditionalNotice { font-style: italic; font-size: 0.75em; text-align: center; margin: auto; padding-bottom: 8px; padding-top: 1px; }`);
		injectCSS(`.repeatableNotice { font-style: italic; font-size: 0.75em; text-align: center; margin: auto; padding-bottom: 8px; padding-top: 1px; }`);
		injectCSS(`.singleChallenge .canSelect { border-width: 5px; }`);
		injectCSS(`.cannotComplete { background: linear-gradient(to right, #eb4034, transparent 35%, transparent 65%, #eb4034); }`);
		injectCSS(`.singleChallenge .cannotComplete { background: linear-gradient(to right, #eb4034, transparent 35%, transparent 65%, #eb4034); }`);
		injectCSS(`.circleDisplay { display: inline-block; width: 7px; height: 7px; margin: 0px 2px 0px 2px; border: 2px solid #808080; border-radius: 50%; }`);
		decay.challenges = {};
		decay.conditionalChallenges = {};
		decay.repeatableChallenges = {};
		decay.challengeCategories = {
			vial: [],
			box: [],
			truck: []
		}
		decay.categoryToPrefixMap = {
			null: 'M',
			vial: 'V',
			box: 'B',
			truck: 'T'
		}
		//if a certain challenge is done it will be set to true, used for unlocking stuff
		decay.challenge = function(key, desc, check, rewardDesc, unlockCondition, misc) {
			//onCompletion is a function, rewardDesc is a function or string, desc can be a string or function, check is logic for checking if the current game state satisfies the challenge (will have timePlayed passed into it)
			this.key = key;
			this.id = Object.keys(decay.challenges).length;
			this.desc = desc;
			this.checkVar = check;
			if (typeof this.checkVar === 'object') { this.checkVar.challengeObj = this; }
			this.rewardDesc = rewardDesc;
			this.complete = 0; //using numbers instead of actual booleans for easy multi completion support
			this.unlockCondition = unlockCondition;
			this.eleid = -1;
			this.cannotComplete = false;
			misc = misc||{};
			if (misc.onCompletion) {
				this.onCompletion = misc.onCompletion;
			}
			if (misc.completedColor) {
				this.completedColor = misc.completedColor;
			} else { this.completedColor = 'rgba(103, 255, 106, 0.4)'; }
			if (misc.icon) {
				this.icon = misc.icon;
			}
			if (misc.prereq) { 
				this.prereq = [].concat(misc.prereq);
			}
			this.isPrereq = false;
			if (misc.order) {
				this.order = misc.order;
			} else { this.order = this.id; }
			if (misc.conditional) {
				this.conditional = misc.conditional;
				if (this.conditional) { decay.conditionalChallenges[key] = this; }
				if (misc.init) { this.init = misc.init; }
				if (misc.reset) { this.reset = misc.reset; }
				if (misc.update) { this.update = misc.update; }
			} else { this.conditional = false; }
			if (misc.repeatable) {
				this.repeatable = misc.repeatable;
				if (this.repeatable) { decay.repeatableChallenges[key] = this; }
			} else { this.repeatable = false; }
			this.unlocked = this.checkUnlock();

			decay.challenges[key] = this;
			decay.totalChallenges++;
			
			if (misc.category) { this.category = misc.category; }
			else if (unlockCondition==decay.challengeUnlockModules.vial) { this.category = 'vial'; } 
			else if (unlockCondition==decay.challengeUnlockModules.box) { this.category = 'box'; } 
			else if (unlockCondition==decay.challengeUnlockModules.truck) { this.category = 'truck'; }  
			else { this.category = null; }
			if (this.category) { decay.challengeCategories[this.category].push(this); }
			if (misc.name) {
				this.name = misc.name;
			} else {
				this.name = decay.categoryToPrefixMap[this.category] + this.id;
			}
		}
		decay.challenge.prototype.getDesc = function() {
			if (typeof this.desc === 'function') { return this.desc(this.complete); } else { return this.desc; }
		}
		decay.challenge.prototype.getRewards = function(hideDetails) {
			if (typeof this.rewardDesc === 'function') { return this.rewardDesc(hideDetails); } else { return this.rewardDesc; }
		}
		decay.challenge.prototype.check = function() {
			if (this.cannotComplete) { return false; }
			if (this.checkVar.o) { return this.checkVar.check(this.checkVar, this.complete); } 
			else { return this.checkVar(this); }
		}
		addLoc('Challenge complete!');
		addLoc('You completed challenge <b>%1</b>!');
		decay.challenge.prototype.finish = function(silent) {
			if (this.repeatable) { this.complete++; } else { this.complete = 1; }
			decay.getCompletionCount();
			if (!silent) { 
				Game.Notify(loc('Challenge complete!'), loc('You completed challenge <b>%1</b>!', this.name), this.icon, 20, false, true);
			}
			if (this.onCompletion) { this.onCompletion(); }
			kaizoCookies.checkChallengeAchievs();
			decay.checkChallengeUnlocks();
			Game.UpdateMenu();
		}
		decay.challenge.prototype.checkUnlock = function() {
			if (!this.unlockCondition()) { return false; }
			for (let i in this.prereq) {
				if (!decay.challengeStatus(this.prereq[i])) { return false; }
			}
			return true;
		}
		decay.challenge.prototype.checkPrereq = function() {
			if (!this.prereq) { return true; }
			for (let i in this.prereq) {
				if (!decay.challengeStatus(this.prereq[i])) { return false; }
			}
			return true;
		}
		decay.challenge.prototype.save = function() {
			var str = this.complete.toString();
			if (this.checkVar.o) { str += '^'+'c'+this.checkVar.save(this.checkVar); }
			return str;
		}
		decay.challenge.prototype.load = function(str) {
			str = str.split('^'); 
			if (isv(str[0])) { this.complete = parseInt(str[0]); }
			if (str.length == 1) { return; }
			str = str.slice(1, str.length);

			for (let i in str) {
				if (str[i][0]=='c') { this.checkVar.load(this.checkVar, str[i].slice(1, str[i].length)); }
			}
		}
		decay.challenge.prototype.wipe = function() {
			this.complete = 0;
			this.unlocked = false;
		}
		decay.totalChallenges = 0;
		decay.challengesCompleted = 0;
		decay.getCompletionCount = function() {
			var n = 0;
			for (let i in decay.challenges) {
				if (decay.challenges[i].complete) { n++; } 
			}
			decay.challengesCompleted = n;
			return n;
		}
		decay.conditionalColor = 'rgba(255, 190, 0, 0.25)';
		decay.repeatableColor = 'rgba(115, 234, 255, 0.2)';
		decay.repeatableConditionalColor = 'rgba(102, 255, 232, 0.2)';
		decay.challengeDisplay = function() {
			//returns html for the challenges
			if (Game.ascensionMode != 42069 && !decay.challengesCompleted) { return ''; }
			let str = '<div class="subsection"><div class="title" style="position:relative;">Challenges</div>';
			str += '<div class="listing"><b>Challenges completed:</b> '+decay.getCompletionCount()+'/'+decay.totalChallenges+'</div><br>';
			str += '<div class="framed" id="challengeBox" style="margin: auto; width: 92%; padding: 0px 4px;">'; //height: 600px; overflow-y: scroll;
			if (Game.ascensionMode != 42069) {
				str += '<div class="challengeNotice">Because you are not in the <b>Unshackled decay</b> challenge mode, you cannot complete any challenges. However, you can still view any unlocked challenges, and the rewards still work.</div>'
				str += '<div class="line"></div>';
			}
			let str2 = '';
			let hasPrereq = false;
			let hasConditional = false;
			let hasRepeatable = false;
			let cannotCompleteWarning = false;
			let ch = decay.sortChallenges();
			for (let i in ch) {
				if (!ch[i].unlocked) { continue; }
				str2 += '<div class="singleChallenge'
				if (ch[i].cannotComplete) { cannotCompleteWarning = true; str2 += ' cannotComplete'; } str2 += '"';
				if (decay.isConditional(ch[i].key)) {
					str2 += ' id="activeConditional"';
				} else {
					if (ch[i].repeatable) {
						str2 += ' style="background-color:'+(ch[i].conditional?decay.repeatableConditionalColor:decay.repeatableColor)+';"';
						hasRepeatable = true;
					} else if (ch[i].complete) {
						str2 += ' style="background-color:'+ch[i].completedColor+';"';
					} else if (ch[i].conditional) {
						str2 += ' style="background-color:'+decay.conditionalColor+';"';
						hasConditional = true;
					}
				}
				str2 += '>';
				str2 += '<div class="nameSection"><b>'+ch[i].name+'</b></div><div class="nameSeparator"></div>';
				str2 += '<div class="taskSection">'+ch[i].getDesc()+'</div>';
				if (ch[i].isPrereq) { 
					str2 += '<div class="circleDisplay"></div>'; 
					hasPrereq = true;
				}
				str2 += '<div class="rewardSection">'+ch[i].getRewards()+'</div>';
				str2 += '</div>';
			}
			if (hasPrereq) {
				str2 += '<div class="line"></div>';
				str2 += '<div class="prereqNotice"'+((hasConditional || hasRepeatable)?('style="padding-bottom: 1px;"'):'')+'>Challenges with a circle in the middle indicates that it is a prerequisite to unlocking another challenge.</div>';
			}
			if (cannotCompleteWarning) {
				str2 += '<div class="line"></div>';
				str2 += '<div class="cannotCompleteWarning">'+'Normal challenges marked with <span class="cannotComplete">red on the edges</span> cannot be (or can no longer be) completed in this ascension due to the challenge\'s requirements.'+'</div>';
			}
			if (hasConditional) {
				str2 += '<div class="line"></div>';
				str2 += '<div class="conditionalNotice"'+(hasRepeatable?('style="padding-bottom: 1px;"'):'')+'>Challenges that are not completed and <span style="background-color:'+decay.conditionalColor+';">highlighted with this color</span> requires you to enable it at the beginning of the ascension. While one is active, no other challenges can be obtained.</div>';
			}
			if (hasRepeatable) {
				str2 += '<div class="line"></div>';
				str2 += '<div class="repeatableNotice">Challenges highlighted with <span style="background-color:'+decay.repeatableColor+';">this color</span> (and <span style="background-color:'+decay.repeatableConditionalColor+';">with this color</span> for challenges that require <span style="background-color:'+decay.conditionalColor+';">enabling when ascending</span>) can be completed repeatedly; each completion gives you the reward stacking with previous completions, and simultaneously raises the requirement.</div>';
			}
			
			return str+str2+'</div></div>';
		}
		eval('Game.Reincarnate='+Game.Reincarnate.toString().replace('Game.Reincarnate(1);', 'if (Game.nextAscensionMode != 42069) { Game.Reincarnate(1); } else { decay.checkChallengeUnlocks(); decay.chooseConditionalPrompt(); }'));
		addLoc('Choose a challenge to start your ascension with, or skip. If a challenge is chosen, you cannot complete any other challenges in the same ascension. To obtain ether blessings or complete the challenges not shown here, click skip. The chosen challenge will be highlighted red in stats.');
		addLoc('Skip');
		decay.findEleidByKey = function(key) {
			for (let i in decay.conditionalChallenges) {
				if (decay.conditionalChallenges[i].key == key) { return decay.conditionalChallenges[i].eleid; }
			}
			return -1;
		}
		decay.selectedChallenge = null;
		decay.getChBGWhenSelecting = function(ch) {
			if (ch.repeatable) { return decay.repeatableColor; } 
			if (ch.complete) { return ch.completedColor; }
			return '';
		}
		decay.chooseConditionalPrompt = function() {
			var checker = false;
			for (let i in decay.conditionalChallenges) {
				checker = (checker || decay.conditionalChallenges[i].unlocked);
			}
			if (!checker) { Game.Reincarnate(1); return; }
			var str = ''; //put the challenges in here
			var availableList = [];
			var completedList = [];
			var list = decay.sortChallenges();
			for (let i in list) {
				if (!list[i].conditional || !list[i].unlocked) { continue; }
				if (list[i].complete) { completedList.push(list[i]); } else { availableList.push(list[i]); }
			}
			var counter = 0;
			const selectedBorderColor = 'rgba(255, 255, 255, 0.15)'; //border-color doesnt work somehow so its for background color instead
			for (let i in availableList) {
				str += '<div id="ch'+counter+'" class="singleChallenge canSelect" '+(availableList[i].repeatable?'style="background-color: '+decay.repeatableColor+';"':'')+'onclick="if (decay.selectedChallenge==\''+availableList[i].key+'\') { decay.selectedChallenge = null; l(\'ch'+counter+'\').style.backgroundColor=decay.getChBGWhenSelecting(decay.challenges[\''+i+'\']); } else { l(\'ch'+counter+'\').style.backgroundColor=\''+selectedBorderColor+'\'; if (decay.selectedChallenge) { l(\'ch\'+decay.findEleidByKey(decay.selectedChallenge)).style.backgroundColor=decay.getChBGWhenSelecting(decay.challenges[decay.selectedChallenge]); } decay.selectedChallenge = \''+availableList[i].key+'\'; }"><div class="taskSection">'+availableList[i].getDesc()+'</div>'+(availableList[i].isPrereq?'<div class="verticalLine"></div>':'')+'<div class="rewardSection">'+availableList[i].getRewards(true)+'</div></div>';
				availableList[i].eleid = counter;
				counter++;
			}
			for (let i in completedList) {
				str += '<div id="ch'+counter+'" class="singleChallenge canSelect" style="background-color:'+completedList[i].completedColor+';" onclick="if (decay.selectedChallenge==\''+completedList[i].key+'\') { decay.selectedChallenge = null; l(\'ch'+counter+'\').style.backgroundColor=\''+completedList[i].completedColor+'\'; } else { l(\'ch'+counter+'\').style.backgroundColor=\''+selectedBorderColor+'\'; if (decay.selectedChallenge) { l(\'ch\'+decay.findEleidByKey(decay.selectedChallenge)).style.backgroundColor=decay.getChBGWhenSelecting(decay.challenges[decay.selectedChallenge]); } decay.selectedChallenge = \''+completedList[i].key+'\'; }"><div class="taskSection">'+completedList[i].getDesc()+'</div>'+(availableList[i].isPrereq?'<div class="verticalLine"></div>':'')+'<div class="rewardSection">'+completedList[i].getRewards(true)+'</div></div>';
				completedList[i].eleid = counter;
				counter++;
			}
			Game.Prompt('<id choosingConditional><h3>Initiate challenge</h3><div class="block">'+loc('Choose a challenge to start your ascension with, or skip. If a challenge is chosen, you cannot complete any other challenges in the same ascension. To obtain ether blessings or complete the challenges not shown here, click skip. The chosen challenge will be highlighted red in stats.')+'</div><div class="block" style="overflow-y: auto; height: 440px; ">'+str+'</div>', [[loc('Confirm'), 'Game.Reincarnate(1); Game.ClosePrompt();'], [loc('Skip'), 'decay.selectedChallenge = null; Game.Reincarnate(1); Game.ClosePrompt();']], function() { l('prompt').style.width = '750px'; l('prompt').style.transform = 'translate(-33%, 0%)'; }, ''); //truly some extreme levels of wack
		}
		eval('Game.ClosePrompt='+Game.ClosePrompt.toString().replace('Game.promptNoClose=false;', 'Game.promptNoClose=false; Game.resetPromptWidth();'));
		decay.setConditionalFromSelected = function(hard) { if (decay.selectedChallenge && !hard) { decay.currentConditional = decay.selectedChallenge; } else { decay.currentConditional = null; } decay.selectedChallenge = null; };
		eval('Game.Reset='+Game.Reset.toString().replace(`Game.T=0;`, `Game.T=0; decay.setConditionalFromSelected(hard);`));
		Game.resetPromptWidth = function() {
			l('prompt').style.width = ''; l('prompt').style.transform = '';
		}
		decay.clearConditional = function() { decay.performConditionalResets(); decay.currentConditional = null; decay.checkRotation(); }
		eval('Game.Ascend='+Game.Ascend.toString().replace('Game.killShimmers();', 'Game.killShimmers(); decay.clearConditional();'));
		eval('Game.UpdateMenu='+Game.UpdateMenu.toString().replace(`'</div><div class="subsection">'+`, `'</div>'+decay.challengeDisplay()+'<div class="subsection">'+`));
		decay.checkChallengeUnlocks = function() {
			for (let i in decay.challenges) {
				decay.challenges[i].unlocked = decay.challenges[i].checkUnlock();
			}
		}
        decay.checkChallenges = function(){
			if (Game.ascensionMode !== 42069) { return; }
			if (decay.currentConditional) {
				if ((!decay.challenges[decay.currentConditional].complete || decay.challenges[decay.currentConditional].repeatable) && decay.challenges[decay.currentConditional].check()) { decay.challenges[decay.currentConditional].finish(false); }
				return;
			}
			if (Game.T%15===0) {
				var challenges = decay.challenges;
				for (let i in challenges) {
					if (challenges[i].unlocked && !challenges[i].conditional && (!challenges[i].complete || challenges[i].repeatable) && challenges[i].check() && !challenges[i].cannotComplete) { challenges[i].finish(false); }
				}
			}

			if (Game.T%1000===0) {
				decay.checkChallengeUnlocks();
			}
		}
		decay.sortChallenges = function() {
			//ik this sort is awful but it only gets called once per 5 seconds with less than a hundred elements and only if the stats is open so who cares
			var arr = [];
			for (let i in decay.challenges) {
				var done = false;
				for (let j in arr) {
					if (arr[j].order > decay.challenges[i].order) {
						arr.splice(j, 0, decay.challenges[i]);
						done = true;
						break;
					}
				}
				if (!done) {
					arr.push(decay.challenges[i]);
				}
			}
			return arr;
		}
		Game.registerHook('logic', decay.checkChallenges);
		decay.markPrereqs = function() {
			for (let i in decay.challenges) {
				let ch = decay.challenges[i];
				ch.isPrereq = false;
				for (let ii in decay.challenges) {
					if (decay.challenges[ii].prereq && decay.challenges[ii].prereq.includes(ch.key)) { ch.isPrereq = true; break; }
				}
			}
		}
		decay.challengeStatus = function(key) {
			return decay.challenges[key]?.complete;
		}
		decay.currentConditional = null; //put the key here or null for no conditional
		decay.isConditional = function(key) {
			return (decay.currentConditional == key);
		}
		decay.performConditionalInits = function() {
			if (decay.currentConditional) { if (decay.challenges[decay.currentConditional].init) { decay.challenges[decay.currentConditional].init(); } }
		}
		decay.performConditionalResets = function() {
			if (decay.currentConditional) { if (decay.challenges[decay.currentConditional].reset) { decay.challenges[decay.currentConditional].reset(); } }
		}

		//Game.T except that it doesnt reset on load
		//counts independently with Game.T but resets on ascension and reincarnation
		Game.TCount = 0;
		Game.resetTCount = function() { Game.TCount = 0; }
		Game.registerHook('reincarnate', Game.resetTCount);
		Game.registerHook('reset', Game.resetTCount);
		addLoc('Bake <b>%1</b> cookies this ascension.');
		addLoc('Survive for <b>%1</b>.');
		addLoc('Bake <b>%1</b> cookies this ascension, then survive for <b>%2</b>.');
		decay.challengeDescModules = {
			//mostly utility
			//all the "time" here are in seconds
			bakeCookies: function(amount) {
				return loc('Bake <b>%1</b> cookies this ascension.', Beautify(amount));
			},
			survive: function(time) {
				return loc('Survive for <b>%1</b>.', Game.sayTime(time * Game.fps, -1));
			},
			bakeAndKeep: function(amount, time) {
				return loc('Bake <b>%1</b> cookies this ascension, then survive for <b>%2</b>.', [Beautify(amount), Game.sayTime(time * Game.fps, -1)]);
			},
			bakeFast: function(amount, time) {
				return loc("Get to <b>%1</b> baked in <b>%2</b>.",[loc("%1 cookie",LBeautify(amount)),Game.sayTime(time * Game.fps, -1)]);
			},
		}
		decay.challengeUnlockModules = {
			//utility
			always: function() {
				return true;
			},
			vial: function() {
				return Game.Has('Vial of challenges');
			},
			box: function() {
				return Game.Has('Box of challenges');
			},
			truck: function() {
				return Game.Has('Truck of challenges');
			}
		} 
		//for convenience
		//the first three are functions with the checker object passed into them, but load with an extra str argument
		//init is an object where everything except for the reserved keys ('o', 'check', 'save', 'load') are copied into the object
		decay.challengeChecker = function(check, save, load, init) {
			for (let i in init) {
				this[i] = init[i];
			}

			this.o = true;
			this.check = check;
			this.save = save;
			this.load = load;
		}
		//contains modules to put into challengeChecker
		//put the raw reference into the first three arguments, then the return value of init into the init argument
		decay.checkerBundles = {
			bakeAndKeep: {
				check: function(t) {
					if (!t.passed && Game.cookiesEarned >= t.threshold) { t.passed = true; t.passedAt = Game.TCount; }
					return Boolean(Game.cookiesEarned >= t.amount && Game.TCount > t.passedAt + t.time);
				},
				save: function(t) {
					return t.passedAt+'-'+(t.passed?1:0);
				},
				load: function(t, str) {
					str = str.split('-');
					t.passedAt = parseFloat(str[0]);
					t.passed = Boolean(parseFloat(str[1]));
				},
				init: function(amount, time, threshold) {
					return {
						amount: amount,
						threshold: (threshold?threshold:amount),
						time: time,
						passedAt: 0,
						passed: false
					};
				}
			},
			keepHalt: {
				check: function(t) {
					const h = (decay.effectiveHalt >= 1);
					if (!t.active && h) { t.active = true; t.activeAt = Game.TCount; } 
					else if (!h) { t.active = false; }
					return Boolean(decay.acceleration >= t.acc && h && Game.TCount - t.activeAt >= t.time);
				},
				save: function(t) {
					return t.activeAt+'-'+(t.active?1:0);
				},
				load: function(t, str) {
					str = str.split('-');
					t.activeAt = parseFloat(str[0]);
					t.passed = Boolean(parseFloat(str[1]));
				},
				init: function(time, acc) {
					return {
						time: time,
						acc: acc,
						active: false,
						activeAt: 0
					};
				} 
			}
		}
		decay.quickCheck = function(obj, init) {
			if (typeof init === 'function') {
				return new decay.challengeChecker(obj.check, obj.save, obj.load, init());
			} else {
				return new decay.challengeChecker(obj.check, obj.save, obj.load, init);
			}
		}
		
		//key, desc, check, onCompletion, rewardDesc, unlockCondition
		//DO NOT ADD CHALLENGES IN BETWEEN. Affix them at the end only and use the order argument (in the obj argument); if not, the save breaks
		new decay.challenge('sb1', decay.challengeDescModules.bakeFast(1e6, 35*60), function(c) { if (Game.TCount >= 35 * 60 * Game.fps) { c.cannotComplete = true; } return (Game.cookiesEarned >= 1e6); }, 'Speed baking I', decay.challengeUnlockModules.always, { onCompletion: function() { Game.Win('Speed baking I'); }, order: -1 });
		new decay.challenge('sb2', decay.challengeDescModules.bakeFast(1e6, 25*60), function(c) { if (Game.TCount >= 25 * 60 * Game.fps) { c.cannotComplete = true; } return (Game.cookiesEarned >= 1e6); }, 'Speed baking II', decay.challengeUnlockModules.always, { onCompletion: function() { Game.Win('Speed baking II'); }, prereq: 'sb1', order: -1 });
		new decay.challenge('sb3', decay.challengeDescModules.bakeFast(1e6, 15*60), function(c) { if (Game.TCount >= 15 * 60 * Game.fps) { c.cannotComplete = true; } return (Game.cookiesEarned >= 1e6); }, 'Speed baking III', decay.challengeUnlockModules.always, { onCompletion: function() { Game.Win('Speed baking III'); }, prereq: 'sb2', order: -1 });
		
		addLoc('(Heavenly) Enchanted permaslot I');
		new decay.challenge(1, decay.challengeDescModules.bakeAndKeep(1e9, 60), decay.quickCheck(decay.checkerBundles.bakeAndKeep, decay.checkerBundles.bakeAndKeep.init(1e9, 60 * Game.fps)), loc('(Heavenly) Enchanted permaslot I'), decay.challengeUnlockModules.vial); addLoc('(Heavenly) Enchanted permaslot II');
		new decay.challenge(2, decay.challengeDescModules.bakeAndKeep(1e12, 70), decay.quickCheck(decay.checkerBundles.bakeAndKeep, decay.checkerBundles.bakeAndKeep.init(1e12, 70 * Game.fps)), loc('(Heavenly) Enchanted permaslot II'), decay.challengeUnlockModules.vial, { prereq: 1 }); addLoc('(Heavenly) Enchanted permaslot III');
		new decay.challenge(3, decay.challengeDescModules.bakeAndKeep(1e17, 75), decay.quickCheck(decay.checkerBundles.bakeAndKeep, decay.checkerBundles.bakeAndKeep.init(1e17, 70 * Game.fps)), loc('(Heavenly) Enchanted permaslot III'), decay.challengeUnlockModules.box, { prereq: 2 }); addLoc('(Heavenly) Enchanted permaslot IV');
		new decay.challenge(4, decay.challengeDescModules.bakeAndKeep(1e19, 75), decay.quickCheck(decay.checkerBundles.bakeAndKeep, decay.checkerBundles.bakeAndKeep.init(1e19, 75 * Game.fps)), loc('(Heavenly) Enchanted permaslot IV'), decay.challengeUnlockModules.box, { prereq: 3 }); addLoc('(Heavenly) Enchanted permaslot V');
		new decay.challenge(5, decay.challengeDescModules.bakeAndKeep(1e27, 30), decay.quickCheck(decay.checkerBundles.bakeAndKeep, decay.checkerBundles.bakeAndKeep.init(1e27, 30 * Game.fps)), loc('(Heavenly) Enchanted permaslot V'), decay.challengeUnlockModules.truck, { prereq: 4 });
		
		addLoc('Bake <b>%1</b> with <b>no</b> normal upgrades except for the upgrades in the enchanted permanent upgrade slots.');
		addLoc('<b>Halved</b> flavored cookie cost');
		new decay.challenge('hc', loc('Bake <b>%1</b> with <b>no</b> normal upgrades except for the upgrades in the enchanted permanent upgrade slots.', Beautify(1e6)+loc(' cookies')), function() { var h = 0; for (let i in Game.EnchantedPermanentUpgradeSlots) { if (Game.EnchantedPermanentUpgradeSlots != -1) { h++; } } return Boolean(Game.cookiesEarned >= 1e6) && !Math.max(0, Game.UpgradesOwned - h); }, loc('<b>Halved</b> flavored cookie cost')+'<br>'+loc('Hardcore'), decay.challengeUnlockModules.vial, { prereq: 'combo1', onCompletion: function() { Game.Win('Hardcore'); } });
		
		addLoc('Use the Elder Pledge <b>3 times</b>.');
		new decay.challenge('pledge', loc('Use the Elder Pledge <b>3 times</b>.'), function() { return Game.pledges>=3; }, 'Research is <b>twice</b> as fast', decay.challengeUnlockModules.vial, { prereq: 'combo1' });
		
		addLoc('Reach a CpS multiplier from purity of at least <b>%1</b>.');
		addLoc('CpS multiplier <b>x%1</b> for each <b>x2</b> CpS multiplier from your purity');
		new decay.challenge('purity1', loc('Reach a CpS multiplier from purity of at least <b>%1</b>.', '+400%'), function() { return decay.gen>=5; }, loc('CpS multiplier <b>x%1</b> for each <b>x2</b> CpS multiplier from your purity', '1.1'), decay.challengeUnlockModules.vial, { prereq: 'pledge' });
		
		addLoc('Prevent decay from increasing for <b>%1</b> continuously under an acceleration of at least <b>%2</b>.');
		new decay.challenge('halt1', loc('Prevent decay from increasing for <b>%1</b> continuously under an acceleration of at least <b>%2</b>.', [Game.sayTime(15 * Game.fps, -1), 'x3']), decay.quickCheck(decay.checkerBundles.keepHalt, decay.checkerBundles.keepHalt.init(15 * Game.fps, 3)), loc('CpS multiplier <b>x%1</b> for each <b>x2</b> CpS multiplier from your purity', '1.1'), decay.challengeUnlockModules.vial, { prereq: 'halt1' });
		
		addLoc('Wrinklers approach the big cookie <b>%1</b> slower')
		new decay.challenge('live1', decay.challengeDescModules.bakeAndKeep(1e9, 15*60), decay.quickCheck(decay.checkerBundles.bakeAndKeep, decay.checkerBundles.bakeAndKeep.init(1e9, 15 * 60 * Game.fps)), loc('Wrinklers approach the big cookie <b>%1</b> slower', '20%'), decay.challengeUnlockModules.vial, { prereq: 'hc', order: decay.challenges.hc.order + 0.5 });
		//live2 after the implementation of time stop (at 25 min, still vial)
		//lazy to do the shiny challenge
		addLoc('Bake <b>%1</b> without popping any wrinklers.');
		addLoc('Your clicks are <b>%1</b> more effective against wrinklers');
		new decay.challenge('wrinkler1', loc('Bake <b>%1</b> without popping any wrinklers.', Beautify(1e14)), function() { return (Game.cookiesEarned >= 1e14 && Game.wrinklersPopped); }, loc('Your clicks are <b>%1</b> more effective against wrinklers', '10%'), decay.challengeUnlockModules.vial, { prereq: ['nc', 'combo1'] });

		addLoc('Bake <b>%1</b> without clicking any golden cookies.');
		addLoc('Golden cookies are <b>%1</b> more effective in purifying decay');
		new decay.challenge('noGC1', loc('Bake <b>%1</b> without clicking any golden cookies.', Beautify(1e15) + loc(' cookie')), function() { return (Game.cookiesEarned >= 1e14 && !Game.goldenClicksLocal); }, loc('Golden cookies are <b>%1</b> more effective in purifying decay', '15%'), decay.challengeUnlockModules.box, { prereq: 'combo2' });
		
		addLoc('You gain <b>%1</b> click power but also gains <b>%2</b> decay momentum for each building you own. Godzamok\'s negative effect is removed.');
		addLoc('Bake <b>%1</b> cookies.');
		addLoc('You regenerate worship swaps <b>%1</b> times faster.');
		new decay.challenge('godz', loc('You gain <b>%1</b> click power but also gains <b>%2</b> decay momentum for each building you own. Godzamok\'s negative effect is removed.', ['+1%', '+1%'])+'<br>'+loc('Bake <b>%1</b> cookies.', Beautify(5e14)), function() { return Game.cookiesEarned>=5e14; }, loc('You regenerate worship swaps <b>%1</b> times faster.', 1.25), decay.challengeUnlockModules.box, { prereq: 'combo3', conditional: true });
		Game.registerHook('cookiesPerClick', function(input) { if (decay.isConditional('godz')) { return input * (1 + Game.BuildingsOwned * 0.01); } return input; });
		
		addLoc('You start with the Shimmering veil turned on, but if the Shimmering veil collapses, force ascend. Having purity heals the veil, and the veil gets a significant increase in health to compensate.');
		addLoc('The Shimmering Veil also affects acceleration.');
		new decay.challenge('veil', loc('You start with the Shimmering veil turned on, but if the Shimmering veil collapses, force ascend. Having purity heals the veil, and the veil gets a significant increase in health to compensate.')+'<br>'+loc('Bake <b>%1</b> cookies.', Beautify(2e15)), function() { return Game.cookiesEarned>=2e15; }, loc('The Shimmering Veil also affects acceleration.'), decay.challengeUnlockModules.box, { prereq: 'combo4', conditional: true });
		
		addLoc('Reindeers spawn constantly, regardless of season, and massively amplify decay when clicked.');
		new decay.challenge('reindeer', loc('Reindeers spawn constantly, regardless of season, and massively amplify decay when clicked.')+'<br>'+loc('Bake <b>%1</b> cookies.', Beautify(5e17)), function() { return Game.cookiesEarned>=5e17; }, loc('CpS multiplier <b>x%1</b> for each <b>x2</b> CpS multiplier from your purity', '1.15'), decay.challengeUnlockModules.box, { prereq: 'combo1', conditional: true });
		eval('Game.shimmerTypes.reindeer.getTimeMod='+Game.shimmerTypes.reindeer.getTimeMod.toString().replace(`if (Game.Has('Reindeer season')) m=0.01;`, `if (Game.Has('Reindeer season')) { m=0.01; } else if (decay.isConditional('reindeer')) { m = 10000000000; }`)); //disables natural spawns
		eval('Game.shimmerTypes.reindeer.spawnConditions='+Game.shimmerTypes.reindeer.spawnConditions.toString().replace(`if (Game.season=='christmas')`, `if (Game.season=='christmas'||decay.isConditional('reindeer'))`));
		eval('Game.shimmerTypes.reindeer.initFunc='+Game.shimmerTypes.reindeer.initFunc.toString().replace('var dur=4;', 'var dur=4; if (decay.isConditional("reindeer")) { dur *= Math.random() * 1.5 + 0.4; }').replace(`if (Game.Has('Weighted sleighs')) dur*=2;`, `if (Game.Has('Weighted sleighs') && !decay.isConditional('reindeer')) dur*=2;`).replace('me.sizeMult=1;', 'me.sizeMult=1; if (decay.isConditional("reindeer")) { me.sizeMult *= Math.random() + 0.33; }'));
		decay.reindeerObj = {
			timer: 0,
			update: function() {
				this.timer -= 1 / Game.fps;
				if (this.timer <= 0) {
					new Game.shimmer('reindeer');
					this.timer = Math.min(0.75, 1 / decay.gen);
				}
			}
		};
		Game.registerHook('logic', function() { if (decay.isConditional('reindeer')) { decay.reindeerObj.update(); } });
		
		new decay.challenge('nc', loc("Make <b>%1</b> with <b>no</b> cookie clicks.",[loc("%1 cookie",LBeautify(1e4)),15]), function() { return (Game.cookieClicks<=15 && Game.cookiesEarned >= 10000)}, loc('Neverclick'), decay.challengeUnlockModules.always, { order: -1, prereq: 'combo1', onCompletion: function() { Game.Win('Neverclick'); } });
		
		addLoc('Make <b>%1</b> with <b>no</b> cookie clicks or wrinkler pops.');
		new decay.challenge('tnc', loc("Make <b>%1</b> with <b>no</b> cookie clicks or wrinkler pops.",loc("%1 cookie",LBeautify(1e6))), function() { return (Game.cookieClicks==0 && Game.cookiesEarned >= 1000000 && Game.wrinklersPopped==0)}, loc('True neverclick'), decay.challengeUnlockModules.always, { order: -1, prereq: 'nc', onCompletion: function() { Game.Win('True neverclick'); } });
		
		addLoc('Bake <b>%1</b>, but the game is rotated 180 degrees clockwise. Some things may stop working. You can ascend by hitting ctrl+A in this mode.');
		new decay.challenge('rotated', loc('Bake <b>%1</b>, but the game is rotated 180 degrees clockwise. Some things may stop working. You can ascend by hitting ctrl+A in this mode.', Beautify(1e13)), function() { return (Game.cookiesEarned >= 1e13); }, loc('CpS multiplier <b>x%1</b> for each <b>x2</b> CpS multiplier from your purity', '1.1'), decay.challengeUnlockModules.box, { prereq: 'combo1', conditional: true });
		decay.checkRotation = function() {
			if (decay.isConditional('rotated')) { l('game').style.transform = 'rotate(180deg)'; } else { l('game').style.transform = ''; }
		}
		Game.registerHook('check', decay.checkRotation); //checkrotation is called with clearConditional to prevent wacks
		eval('Game.GetMouseCoords='+Game.GetMouseCoords.toString().replace('Game.mouseX=(posx-x)/Game.scale;', 'Game.mouseX=(posx-x)/Game.scale; if (decay.isConditional(\'rotated\')) { Game.mouseX = l(\'game\').offsetWidth - Game.mouseX; }').replace('Game.mouseY=(posy-y)/Game.scale;', 'Game.mouseY=(posy-y)/Game.scale; if (decay.isConditional(\'rotated\')) { Game.mouseY = l(\'game\').offsetHeight - Game.mouseY; }'));
		//the part where ctrl+A is put in the same section as script writer
		addLoc('Bake <b>%1</b>, but acceleration starts high and decreases with time. When acceleration reaches <b>x1</b>, force ascend.');
		new decay.challenge('reversedAcc', loc('Bake <b>%1</b>, but acceleration starts high and decreases with time. When acceleration reaches <b>x1</b>, force ascend.', Beautify(1e18)), function() { if (decay.acceleration <= 1) { decay.forceAscend(false); } return (Game.cookiesEarned >= 1e18); }, loc('CpS multiplier <b>x%1</b> for each <b>x2</b> CpS multiplier from your purity', '1.15'), decay.challengeUnlockModules.box, { conditional: true, prereq: 'combo4', init: function() { decay.acceleration = 30; } });
		addLoc('Bake <b>%1</b>, but typing stuff is required to do most things. Type "help" to view the available actions. To compensate, decay is massively nerfed.');
		addLoc('Unlocks more codes in the Script writer, accessible by typing the name of the leading programmer.');
		new decay.challenge('typing', loc('Bake <b>%1</b>, but typing stuff is required to do most things. Type "help" to view the available actions. To compensate, decay is massively nerfed.', Beautify(1e16)), function() { return (Game.cookiesEarned >= 1e16) }, loc('Unlocks more codes in the Script writer, accessible by typing the name of the leading programmer.'), function() { return (decay.challengeUnlockModules.truck() && Game.Has('Script writer')); }, { conditional: true, category: 'truck', prereq: 5, init: function() { for (let i in decay.typingActions) { decay.typingActions[i].activate(); } for (let i in decay.gameCan) { decay.gameCan[i] = false; } }, reset: function() { for (let i in decay.typingActions) { decay.typingActions[i].deactivate(); } for (let i in decay.gameCan) { decay.gameCan[i] = true; } } });
		eval('Game.Prompt='+Game.Prompt.toString().replace(`if (str.indexOf('<noClose>')!=-1)`, `if (str.indexOf('<noClose>')!=-1 || decay.isConditional('typing') || decay.isConditional('typingR'))`));
		decay.gameCan = {
			click: true, //good
			popWrinklers: true, //good
			buyBuildings: true, //good
			sellBuildings: true, //good
			buyUpgrades: true, //good
			buyAllUpgrades: true, //good
			toggleUpgrades: true, //good
			scrollNews: true, //good
			interactSanta: true, //good
			interactDragon: true, //good
			popReindeer: true, //good
			popGC: true, //good
			slotAuras: true, //good
			closeNotifs: true, //good
			clickPowerOrbs: true, //good
			levelUpBuildings: true, //good
			openStats: true, //good
			viewMinigames: true, //good
			closeMinigames: true, //good
			castSpells: true, //good
			slotGods: true, //good
			plant: true, //good
			selectSeeds: true, //good
			useGardenTools: true, //good
			buyGoods: true, //good
			sellGoods: true, //good
			upgradeOffice: true, //doesnt work but its a pain to implement so whatever
			buyBrokers: true, //doesnt work but its a pain to implement so whatever
			takeLoans: true, //good
			changeTickspeed: true, //good
			refillMinigames: true //good
		}
		decay.copyGameCan = function() { 
			for (let i in decay.gameCan) {
				kaizoCookies.prepauseAllowanceSettings[i] = decay.gameCan[i];
			} 
		}
		decay.copyGameCan();
		for (let i in Game.Objects) {
			eval('Game.Objects["'+i+'"].buy='+Game.Objects[i].buy.toString().replace('var success=0;', 'var success=0; if (!decay.gameCan.buyBuildings) { return 0; }'));
			eval('Game.Objects["'+i+'"].sell='+Game.Objects[i].sell.toString().replace('var success=0;', 'var success=0; if (!decay.gameCan.sellBuildings) { return 0; }'));
			eval('Game.Objects["'+i+'"].switchMinigame='+Game.Objects[i].switchMinigame.toString().replace('if (!Game.isMinigameReady(this)) on=false;', 'if ((on && !decay.gameCan.viewMinigames) || (!on && !decay.gameCan.closeMinigames)) { return; } if (!Game.isMinigameReady(this)) on=false;'));
		}
		eval('Game.Upgrade.prototype.buy='+Game.Upgrade.prototype.buy.toString().replace('var cancelPurchase=0;', 'var cancelPurchase=0; if ((!decay.gameCan.buyUpgrades && this.pool != "toggle") || ((!decay.gameCan.toggleUpgrades && this.pool == "toggle"))) { return 0; }'));
		eval('Game.storeBuyAll='+Game.storeBuyAll.toString().replace(`if (!Game.Has('Inspired checklist'))`, `if (!Game.Has('Inspired checklist') || !decay.gameCan.buyAllUpgrades)`));
		Game.rebuildNews = function() {
			l('commentsText1').remove();
			var ele = document.createElement('div');
			ele.id = 'commentsText1';
			ele.classList.add('commentsText');
			ele.classList.add('risingUp');
			l('commentsText2').insertAdjacentElement('beforebegin', ele);
			AddEvent(l('commentsText1'), 'click', function() { Game.clickNewsTicker(true); });
			Game.tickerL = l('commentsText1');
		}
		Game.rebuildNews();
		eval('Game.CloseNotes='+Game.CloseNotes.toString().replace('Game.Notes=[];', 'if (!decay.gameCan.closeNotifs) { return; } Game.Notes=[];'));
		eval('Game.CloseNote='+Game.CloseNote.toString().replace('var me=Game.NotesById[id];', 'var me=Game.NotesById[id]; if (!decay.gameCan.closeNotifs && me.life) { return; }'));
		eval('Game.ClickSpecialPic='+Game.ClickSpecialPic.toString().replace(`(Game.specialTab=='dragon' && Game.dragonLevel>=4 && Game.Has('Pet the dragon') && l('specialPic'))`, `(Game.specialTab=='dragon' && Game.dragonLevel>=4 && Game.Has('Pet the dragon') && l('specialPic') && decay.gameCan.interactDragon)`));
		eval('Game.ToggleSpecialMenu='+Game.ToggleSpecialMenu.toString().replace(`if (on)`, `if (on && !(!decay.gameCan.interactDragon && Game.specialTab=='dragon') && !(!decay.gameCan.interactSanta && Game.specialTab=='santa'))`).replace(`if (Game.specialTab!='')`, `if (Game.specialTab!='' && !(!decay.gameCan.interactDragon && Game.specialTab=='dragon') && !(!decay.gameCan.interactSanta && Game.specialTab=='santa'))`));
		eval('Game.UpgradeDragon='+Game.UpgradeDragon.toString().replace('Game.dragonLevel<Game.dragonLevels.length-1 && Game.dragonLevels[Game.dragonLevel].cost()', 'Game.dragonLevel<Game.dragonLevels.length-1 && Game.dragonLevels[Game.dragonLevel].cost() && decay.gameCan.interactDragon'));
		eval('Game.UpgradeSanta='+Game.UpgradeSanta.toString().replace('Game.cookies>moni && Game.santaLevel<14', 'Game.cookies>moni && Game.santaLevel<14 && decay.gameCan.interactSanta'));
		eval('Game.SelectDragonAura='+Game.SelectDragonAura.toString().replace('var currentAura=0;', 'if (!decay.gameCan.interactDragon) { return; } var currentAura=0;'));
		eval('Game.SetDragonAura='+Game.SetDragonAura.toString().replace('Game.SelectingDragonAura=aura;', 'if (!decay.gameCan.slotAuras) { return; } Game.SelectingDragonAura=aura;'));
		eval('Game.UpdateSpecial='+Game.UpdateSpecial.toString().replace(`if (Game.Click && Game.lastClickedEl==l('backgroundLeftCanvas'))`, `if (Game.Click && Game.lastClickedEl==l('backgroundLeftCanvas') && ((decay.gameCan.interactDragon && Game.specialTabs[i]=='dragon') || (decay.gameCan.interactSanta && Game.specialTabs[i]=='santa')))`));
		eval('Game.shimmer.prototype.pop='+Game.shimmer.prototype.pop.toString().replace('Game.loseShimmeringVeil', 'if ((this.type=="golden" && !decay.gameCan.popGC) || (this.type=="reindeer" && !decay.gameCan.popReindeer)) { return; } Game.loseShimmeringVeil'));
		eval('Game.UpdateWrinklers='+Game.UpdateWrinklers.toString().replace(`if (Game.Click && Game.lastClickedEl==l('backgroundLeftCanvas'))`, `if (Game.Click && Game.lastClickedEl==l('backgroundLeftCanvas') && decay.gameCan.popWrinklers)`));
		eval('Game.ShowMenu='+Game.ShowMenu.toString().replace(`if (!what || what=='') what=Game.onMenu;`, `if (what=='stats' && !decay.gameCan.openStats) { return; } if (!what || what=='') what=Game.onMenu;`));
		eval('Game.refillLump='+Game.refillLump.toString().replace('if (Game.lumps>=n && Game.canRefillLump())', 'if (Game.lumps>=n && Game.canRefillLump() && decay.gameCan.refillMinigames)'));
		
		decay.typingActions = [];
		decay.typingAction = function(keyword, action, actionStr, keywordStr, spaceSensitive, enabled) {
			this.keyword = keyword;
			this.action = action;
			addLoc(actionStr);
			this.actionStr = loc(actionStr);
			if (keywordStr) { addLoc(keywordStr); this.keywordStr = loc(keywordStr); } else { addLoc(keyword); this.keywordStr = loc(keyword); }
			if (enabled) { this.enabled = enabled; } else { this.enabled = true; }
			if (spaceSensitive) { this.spaceSensitive = spaceSensitive; } else { this.spaceSensitive = false; }
			this.SW = null;

			decay.typingActions.push(this);
		}
		decay.typingAction.prototype.activate = function() {
			if (this.enabled) { this.SW = new decay.SWCode(this.keyword, this.action, { spaceSensitive: this.spaceSensitive }); }
		}
		decay.typingAction.prototype.deactivate = function() {
			if (this.SW) {
				decay.SWCodes.splice(decay.SWCodes.indexOf(this.SW), 1);
			}
		}
		addLoc('View keywords');
		addLoc('You can delete everything you\'ve typed using the enter key.');
		decay.getTypingPrompt = function() {
			var str = '<id availableActions><noClose><h3 id="viewActionsHeader">'+loc('View keywords')+'</h3><div class="line"></div>'+loc('You can delete everything you\'ve typed using the enter key.')+'<div class="line"></div><div class="block" style="height: 500px; overflow-y: scroll;">';
			for (let i in decay.typingActions) {
				if (!decay.typingActions[i].enabled) { continue; }
				str += '<div class="singleChallenge">';
				str += '<div class="taskSection" style="width: 35%;"><b>' + decay.typingActions[i].keywordStr + '</b></div>';
				str += '<div class="rewardSection" style="width: 65%;">' + decay.typingActions[i].actionStr + '</div></div>';
			}
			str += '</div>';
			
			Game.Prompt(str, [], function() { l('prompt').style.width = '750px'; l('prompt').style.transform = 'translate(-33%, 0%)'; });
		}
		new decay.typingAction('help', decay.getTypingPrompt, 'Opens the help menu');
		new decay.typingAction('exit', Game.ClosePrompt, 'Closes the menu');
		addLoc('Clicked!');
		new decay.typingAction('click', function() { if (this.timer2) { clearTimeout(this.timer2); } if (this.timer3) { clearTimeout(this.timer3); } Game.BigCookieState = 1; decay.gameCan.click = true; Game.ClickCookie(); decay.gameCan.click = false; Game.Notify(loc('Clicked!'), '', 0, 0.5); this.timer2 = setTimeout(function() { Game.BigCookieState = 2; }, 20 + Math.random() * 25); this.timer3 = setTimeout(function() { Game.BigCookieState = 0; }, 60); }, 'Clicks the big cookie');
		new decay.typingAction('% a %', function(c) { var s = c[0].join(''); if (s=='buy') { var s = true; } else if (s=='sell') { var s = false; } else { return true; } c[1][0] = c[1][0].toUpperCase(); const a = c[1].join(''); if (Game.Objects[a]) { if (s) { decay.gameCan.buyBuildings = true; Game.Objects[a].buy(1); decay.gameCan.buyBuildings = false; } else { decay.gameCan.sellBuildings = true; Game.Objects[a].sell(1); decay.gameCan.sellBuildings = false; } return true; } else if (a.length > 25) { return true; } else { return false; }}, 'Buys or sells 1 of the corresponding building', '[buy/sell] a [building name]', true);
		//bit of a problem with memory potentially as the content gets inflated beyond measure
		//ah well
		Game.ObjectsByPlural = {};
		for (let i in Game.Objects) {
			Game.ObjectsByPlural[Game.Objects[i].plural] = Game.Objects[i];
		}
		Game.UpgradesLowercase = {};
		new decay.typingAction('% 10 %', function(c) { var s = c[0].join(''); if (s=='buy') { var s = true; } else if (s=='sell') { var s = false; } else { return true; } const a = c[1].join(''); if (Game.ObjectsByPlural[a]) { if (s) { decay.gameCan.buyBuildings = true; Game.ObjectsByPlural[a].buy(10); decay.gameCan.buyBuildings = false; } else { decay.gameCan.sellBuildings = true; Game.ObjectsByPlural[a].sell(10); decay.gameCan.sellBuildings = false; } return true; } else if (a.length > 25) { return true; } else { return false; }}, 'Buy or sell 10 of the corresponding building', '[buy/sell] 10 [building name plural]', true);
		new decay.typingAction('% 100 %', function(c) { var s = c[0].join(''); if (s=='buy') { var s = true; } else if (s=='sell') { var s = false; } else { return true; } const a = c[1].join(''); if (Game.ObjectsByPlural[a]) { if (s) { decay.gameCan.buyBuildings = true; Game.ObjectsByPlural[a].buy(100); decay.gameCan.buyBuildings = false; } else { decay.gameCan.sellBuildings = true; Game.ObjectsByPlural[a].sell(100); decay.gameCan.sellBuildings = false; } return true; } else if (a.length > 25) { return true; } else { return false; }}, 'Buy or sell 100 of the corresponding building', '[buy/sell] 100 [building name plural]', true);
		Game.compileLowerCasedUpgrades = function() {
			//supposed to be only called once
			for (let i in Game.Upgrades) {
				Game.UpgradesLowercase[i.toLowerCase()] = Game.Upgrades[i];
			}	
			//eval('Game.Upgrade='+Game.Upgrade.toString().replace(`Game.Upgrades[this.name]=this;`, `Game.Upgrades[this.name]=this; Game.UpgradesLowercase[this.name.toLowerCase()] = this;`));
		}
		//function call put at the very end of the init
		addLoc('Couldn\'t buy upgrade');
		decay.unskippableUpgrades = [];
		decay.createUnskippables = function() {
			decay.unskippableUpgrades = decay.unskippableUpgrades.concat([Game.Upgrades['Wheat slims'], Game.Upgrades['Elderwort biscuits'], Game.Upgrades['Bakeberry cookies'], Game.Upgrades['Ichor syrup'], Game.Upgrades['Fern tea']]);
			decay.unskippableUpgrades = decay.unskippableUpgrades.concat([Game.Upgrades['Milk chocolate butter biscuit'], Game.Upgrades['Dark chocolate butter biscuit'], Game.Upgrades['White chocolate butter biscuit'], Game.Upgrades['Ruby chocolate butter biscuit'], Game.Upgrades['Lavender chocolate butter biscuit'], Game.Upgrades['Synthetic chocolate green honey butter biscuit'], Game.Upgrades['Royal raspberry chocolate butter biscuit'], Game.Upgrades['Ultra-concentrated high-energy chocolate butter biscuit'], Game.Upgrades['Pure pitch-black chocolate butter biscuit'], Game.Upgrades['Cosmic chocolate butter biscuit'], Game.Upgrades['Butter biscuit (with butter)'], Game.Upgrades['Everybutter biscuit'], Game.Upgrades['Personal biscuit']]);
		}
		new decay.typingAction('purchase %', function(c) { const a = c[0].join(''); const u = Game.UpgradesLowercase[a]; if (u && u.pool != 'toggle' && u.pool != 'prestige' && u.pool != 'debug' && !(u.pool == 'tech' && !u.unlocked) && !(decay.unskippableUpgrades.indexOf(u) != -1 && !u.unlocked)) { decay.gameCan.buyUpgrades = true; if (!Game.UpgradesLowercase[a].buy()) { Game.Notify(loc('Couldn\'t buy upgrade'), '', 0, 2); } decay.gameCan.buyUpgrades = false; return true; } else if (a.length > 60) { return true; } else { return false; }}, 'Buy the upgrade', 'purchase [upgrade name]', true);
		new decay.typingAction('buy all upgrades', function() { decay.gameCan.buyAllUpgrades = true; decay.gameCan.buyUpgrades = true; Game.storeBuyAll(); decay.gameCan.buyAllUpgrades = false; decay.gameCan.buyUpgrades = false; }, 'Buy all upgrades');
		decay.toggleUpgradesMap = [];
		decay.createToggleMap = function() { decay.toggleUpgradesMap = decay.toggleUpgradesMap.concat([{name: 'shimmering veil', upgradeOn: Game.Upgrades['Shimmering veil [off]'], upgradeOff: Game.Upgrades['Shimmering veil [on]']},
								   {name: 'golden switch', upgradeOn: Game.Upgrades['Golden switch [off]'], upgradeOff: Game.Upgrades['Golden switch [on]']},
								   {name: 'sugar frenzy', upgradeOn: Game.Upgrades['Sugar frenzy'], upgradeOff: Game.Upgrades['Sugar frenzy']},
								   {name: 'festive biscuit', upgradeOn: Game.Upgrades['Festive biscuit'], upgradeOff: Game.Upgrades['Festive biscuit']},
								   {name: 'ghostly biscuit', upgradeOn: Game.Upgrades['Ghostly biscuit'], upgradeOff: Game.Upgrades['Ghostly biscuit']},
								   {name: 'lovesick biscuit', upgradeOn: Game.Upgrades['Lovesick biscuit'], upgradeOff: Game.Upgrades['Lovesick biscuit']},
								   {name: 'fool\'s biscuit', upgradeOn: Game.Upgrades['Fool\'s biscuit'], upgradeOff: Game.Upgrades['Fool\'s biscuit']},
								   {name: 'bunny biscuit', upgradeOn: Game.Upgrades['Bunny biscuit'], upgradeOff: Game.Upgrades['Bunny biscuit']},
								   {name: 'golden cookie sound selector', choice: true, upgrade: Game.Upgrades['Golden cookie sound selector']},
								   {name: 'jukebox', choice: true, upgrade: Game.Upgrades['Jukebox']},
								   {name: 'milk selector', choice: true, upgrade: Game.Upgrades['Milk selector']},
								   {name: 'background selector', choice: true, upgrade: Game.Upgrades['Background selector']},
								   {name: 'elder pledge', upgradeOn: Game.Upgrades['Elder Pledge'], upgradeOff: Game.Upgrades['Elder Pledge']},
								   {name: 'elder covenant', upgradeOn: Game.Upgrades['Elder Covenant'], upgradeOff: Game.Upgrades['Elder Covenant']}]); }
		if (Game.ready) { decay.createToggleMap(); decay.createUnskippables(); } else { Game.registerHook('create', function() { decay.createToggleMap(); decay.createUnskippables(); })}
		addLoc('Couldn\'t toggle switch');
		decay.toggleUpgradeFromType = function(c) {
			if (c.length > 25) { return true; }
			var obj = null;
			for (let i in decay.toggleUpgradesMap) {
				if (decay.toggleUpgradesMap[i].name == c) { obj = decay.toggleUpgradesMap[i]; }
			}
			if (!obj) { return false; }
			decay.gameCan.toggleUpgrades = true; decay.gameCan.buyUpgrades = true;
			if (obj.choice) {
				if (!obj.upgrade.unlocked) { decay.gameCan.toggleUpgrades = false; decay.gameCan.buyUpgrades = false; return true; }
				if (!obj.upgrade.buy()) { }
			} else {
				if (obj.upgradeOn.unlocked) { 
					if (!obj.upgradeOn.buy()) { if (obj.upgradeOff.unlocked) { obj.upgradeOff.buy(); } } 
				} else if (obj.upgradeOff.unlocked) {
					if (!obj.upgradeOff.buy()) { } 
				}
			}
			decay.gameCan.toggleUpgrades = false; decay.gameCan.buyUpgrades = false;
			return true; 
		}
		new decay.typingAction('toggle %', function(c) { return decay.toggleUpgradeFromType(c[0].join('')); }, 'Toggles the switch', 'toggle [switch name]', true);
		Game.clickNewsTicker = function() {
			if (!decay.gameCan.scrollNews) { return false; }
			
			Game.TickerClicks++;
			if (Game.windowW<Game.tickerTooNarrow) {Game.Win('Stifling the press');}
			else if (Game.TickerClicks>=50) {Game.Win('Tabloid addiction');}
			
			if (Game.TickerEffect && Game.TickerEffect.type=='fortune')
			{
				PlaySound('snd/fortune.mp3',1);
				Game.SparkleAt(Game.mouseX,Game.mouseY);
				var effect=Game.TickerEffect.sub;
				if (effect=='fortuneGC')
				{
					Game.Notify(loc("Fortune!"),loc("A golden cookie has appeared."),[10,32]);
					Game.fortuneGC=1;
					var newShimmer=new Game.shimmer('golden',{noWrath:true});
				}
				else if (effect=='fortuneCPS')
				{
					Game.Notify(loc("Fortune!"),loc("You gain <b>one hour</b> of your CpS (capped at double your bank)."),[10,32]);
					Game.fortuneCPS=1;
					Game.Earn(Math.min(Game.cookiesPs*60*60,Game.cookies));
				}
				else
				{
					Game.Notify(effect.dname,loc("You've unlocked a new upgrade."),effect.icon);
					effect.unlock();
				}
			}
			
			Game.TickerEffect=0;
			Game.getNewTicker(true);
		}
		new decay.typingAction('flip to next page', function() { decay.gameCan.scrollNews = true; Game.clickNewsTicker(true); decay.gameCan.scrollNews = false; }, 'Scrolls the news ticker');
		new decay.typingAction('open stats', function() { decay.gameCan.openStats = true; Game.ShowMenu('stats'); decay.gameCan.openStats = false; }, 'Opens/closes the stats menu<br>(typing is not required to open any other menus)');
		new decay.typingAction('confirm ascend', function() { decay.forceAscend(false); }, 'Ascends');
		new decay.typingAction('ding ding reindeer begone', function() { for (let i in Game.shimmers) { if (Game.shimmers[i].type=='reindeer') { decay.gameCan.popReindeer = true; Game.shimmers[i].pop(); decay.gameCan.popReindeer = false; break; }}}, 'Pops a reindeer');
		new decay.typingAction('pop % cookie at % section of screen', function(c) { const type = c[0].join(''); if (type != 'golden' && type != 'wrath') { return true; } const a = c[1].join(''); var b = 0; var c = 0; if (a=='left') { b=0;c=1/3; } else if (a=='middle') { b=1/3;c=2/3; } else if (a=='right') { b=2/3;c=1; } else { return; } const length = l('game').offsetWidth; for (let i in Game.shimmers) { if (Game.shimmers[i].x>b*length && Game.shimmers[i].x<c*length && ((!Game.shimmers[i].wrath && type=='golden') || (Game.shimmers[i].wrath && type=='wrath'))) { decay.gameCan.popGC = true; Game.shimmers[i].pop(); decay.gameCan.popGC = false; return; } }}, 'Clicks a golden or wrath cookie at that one third of the screen', 'pop [golden/wrath] cookie at [left/middle/right] section of screen');
		new decay.typingAction('open santa', function() { if (!Game.Has('A festive hat')) { return; } decay.gameCan.interactSanta = true; Game.specialTab = 'santa'; Game.ClickSpecialPic(); Game.ToggleSpecialMenu(true); decay.gameCan.interactSanta = false; }, 'opens Santa, if available');
		new decay.typingAction('close santa', function() { if (Game.specialTab=='santa') { decay.gameCan.interactSanta = true; Game.ToggleSpecialMenu(false); decay.gameCan.interactSanta = false; } }, 'closes Santa');
		new decay.typingAction('open krumblor', function() { if (!Game.Has('A crumbly egg')) { return; } decay.gameCan.interactDragon = true; Game.specialTab = 'dragon'; Game.ClickSpecialPic(); Game.ToggleSpecialMenu(true); decay.gameCan.interactDragon = false; }, 'opens Krumblor, cookie dragon, if available');
		new decay.typingAction('close krumblor', function() { if (Game.specialTab=='dragon') { decay.gameCan.interactDragon = true; Game.ToggleSpecialMenu(false); decay.gameCan.interactDragon = false; } }, 'closes Krumblor, cookie dragon');
		addLoc('Santa leveling...');
		new decay.typingAction('level up santa', function() { Game.Notify('Santa leveling...', '', 0, 2); if (Game.specialTab=='santa') { decay.gameCan.interactSanta = true; Game.UpgradeSanta(); decay.gameCan.interactSanta = false; } }, 'if Santa is open, level up the santa');
		addLoc('Krumblor evolving...');
		new decay.typingAction('evolve krumblor', function() { Game.Notify('Krumblor evolving...', '', 0, 2); if (Game.specialTab=='dragon') { decay.gameCan.interactDragon = true; Game.UpgradeDragon(); decay.gameCan.interactDragon = false; } }, 'if Krumblor, cookie dragon is open, evolve it');
		new decay.typingAction('open first aura for selection', function() { if (Game.dragonLevel <= 4) { return; } decay.gameCan.interactDragon = true; Game.SelectDragonAura(0); decay.gameCan.interactDragon = false; }, 'if possible, prompt to select first aura');
		new decay.typingAction('open second aura for selection', function() { if (!Game.dragonLevel <= 26) { return; } decay.gameCan.interactDragon = true; Game.SelectDragonAura(1); decay.gameCan.interactDragon = false; }, 'if possible, prompt to select second aura');
		eval('Game.SelectDragonAura='+Game.SelectDragonAura.toString().replace(`'<div style="text-align:center;">'`, `'<div style="text-align:center;" id="dragonAurasMenu'+slot+'">'`));
		Game.dragonAurasBNLowercase = {};
		Game.compiledLowercasedDragonAuras = function() {
			for (let i in Game.dragonAurasBN) {
				Game.dragonAurasBNLowercase[i.toLowerCase()] = Game.dragonAurasBN[i];
			}
		}
		new decay.typingAction('slot %', function(c) { if (l('dragonAurasMenu0') || l('dragonAurasMenu1')) { var slot = 0; if (l('dragonAurasMenu1')) { slot = 1; } const auraCount = l('dragonAurasMenu'+slot).childNodes.length; const a = c[0].join(''); if (Game.dragonAurasBNLowercase[a]) { if (auraCount<Game.dragonAurasBNLowercase[a].id) { return true; } else { decay.gameCan.slotAuras = true; Game.SetDragonAura(Game.dragonAurasBNLowercase[a].id, slot); decay.gameCan.slotAuras = false; l('promptOption0').click(); return true; } } else if (a.length>=30) { return true; } else { return false; } } }, 'if on aura selection prompt, selects and confirms the aura', 'slot [dragon aura name]', true);
		new decay.typingAction('close all notifications', function() { decay.gameCan.closeNotifs = true; Game.CloseNotes(); decay.gameCan.closeNotifs = false; }, 'Closes all active notifications');
		new decay.typingAction('using lumps level up %', function(c) { const a = c[0].join(''); if (Game.ObjectsByPlural[a]) { decay.gameCan.levelUpBuildings = true; Game.ObjectsByPlural[a].levelUp(); decay.gameCan.levelUpBuildings = false; } else if (a.length >= 20) { return true; } else { return false; } }, 'levels up the building', 'using lumps level up [building name plural]', true);
		new decay.typingAction('pop', function() { for (let i in Game.wrinklers) { if (Game.wrinklers[i].selected) { Game.wrinklers[i].hp -= decay.wrinklerResistance * 7; Game.wrinklers[i].hurt = 4 * (Math.random() - 0.5); break; } } }, 'seven clicks on currently selected wrinkler');
		new decay.typingAction('pow', function() { decay.gameCan.clickPowerOrbs = true; for (let i in decay.powerOrbs) { if (decay.powerOrbs[i].selected) { decay.powerOrbs[i].onClick(decay.powerOrbs[i]); decay.times.sinceOrbClick = 0; break; } } decay.gameCan.clickPowerOrbs = false; }, 'clicks on currently hovered over power orb');
		Game.minigames = []; //minigame objects pushed into it on minigame changes hooks
		new decay.typingAction('view %', function(c) { const a = c[0].join(''); for (let i in Game.minigames) { if (a==Game.minigames[i].name.toLowerCase()) { decay.gameCan.viewMinigames = true; Game.minigames[i].parent.switchMinigame(true); decay.gameCan.viewMinigames = false; } } if (a.length>12) { return true; } else { return false; }}, 'opens the minigame', 'view [minigame name]', true);
		new decay.typingAction('close %', function(c) { const a = c[0].join(''); for (let i in Game.minigames) { if (a==Game.minigames[i].name.toLowerCase()) { decay.gameCan.closeMinigames = true; Game.minigames[i].parent.switchMinigame(false); decay.gameCan.closeMinigames = false; } } if (a.length>12 || a=='krumblor' || a=='santa') { return true; } else { return false; }}, 'closes the minigame', 'close [minigame name]', true);
		Game.spellsProperNameToCode = {}; //properly set in the grimoire hooks
		new decay.typingAction('cast %', function(c) { if (!gp) { return; } const a = c[0].join(''); if (Game.spellsProperNameToCode[a]) { decay.gameCan.castSpells = true; gp.castSpell(gp.spells[Game.spellsProperNameToCode[a]]); decay.gameCan.castSpells = false; } if (a.length>=30) { return true; } else { return false; }}, 'casts the spell in the Grimoire', 'cast [spell name]', true);
		Game.godsPrimaryNameToCode = {}; //once again set in the pantheon hook
		new decay.typingAction('slot % into % position', function(c) { if (!pp) { return; } const a = c[0].join(''); const b = c[1].join(''); var d = -1; if (b=='diamond') { d = 0; } else if (b=='ruby') { d = 1; } else if (b=='jade') { d = 2; } else if (b=='roster') { d = -1; } else { return true; } if (Game.godsPrimaryNameToCode[a]) { decay.gameCan.slotGods = true; pp.dragging = pp.gods[Game.godsPrimaryNameToCode[a]]; pp.slotHovered = d; pp.dropGod(); pp.slotHovered = -1; decay.gameCan.slotGods = false; } }, 'slots the corresponding god into the corresponding slot, or puts it back into the roster', 'slot [god primary name] to [diamond/ruby/jade/roster] slot<br>(primary name excludes the title, e.g. "Mokalsium, Mother Spirit" to "mokalsium")', true);
		new decay.typingAction('take loan %', function(c) { if (!sp) { return; } if (c[0].length > 1) { return true; } const a = parseInt(c[0][0]); var sp = Game.Objects.Bank.minigame; if (a>3 || a<1) { return true; /*no checks for loan unlocks here for funny*/} decay.gameCan.takeLoans = true; sp.takeLoan(a); decay.gameCan.takeLoans = false; }, 'takes the loan in the Stock market, if available', 'take loan [loan number]', true);
		new decay.typingAction('hire a broker', function() { if (!sp) { return; } decay.gameCan.buyBrokers = true; l('bankBrokersBuy').click(); decay.gameCan.buyBrokers = false; }, 'hires a broker in the Stock market');
		Game.manipGoods = function(action, amount, name) {
			if (!Game.Objects.Bank.minigameLoaded) { return true; }
			if (!(action=='buy' || action=='sell')) { return true; }
			if (amount=='all' || amount=='max') { amount = '10000'; } 
			amount = parseFloat(amount); //ahah funny
			var sp = Game.Objects.Bank.minigame;
			for (let i in sp.goods) {
				if (sp.goods[i].name.toLowerCase() == name) {
					if (action=='buy') {
						if (sp.buyGood(sp.goods[i].id, amount)) { Game.SparkleOn(sp.goods[i].stockBoxL); }
					} else if (action=='sell') {
						if (sp.sellGood(sp.goods[i].id, amount)) { Game.SparkleOn(sp.goods[i].stockBoxL); }
					}
					return true;
				}
			}
			return false;
		}
		new decay.typingAction('stock % % of %', function(c) { if (!sp) { return; } const x = c[0].join(''); const y = c[1].join(''); const z = c[2].join(''); if (z.length>20) { return true; } decay.gameCan.buyGoods = true; decay.gameCan.sellGoods = true; const toReturn = Game.manipGoods(x, y, z); decay.gameCan.buyGoods = false; decay.gameCan.sellGoods = false; return toReturn; }, 'buys or sells that quantity of a goods in the Stock market', 'stock [buy/sell] [1/10/100/max/all] of [the goods\' proper name]', true);
		new decay.typingAction('upgrade your office', function() { if (!sp) { return; } decay.gameCan.upgradeOffice = true; l('bankOfficeUpgrade').click(); decay.gameCan.upgradeOffice = false; }, 'upgrades the office in the Stock market');
		new decay.typingAction('change tickspeed', function() { if (!sp) { return; } decay.gameCan.changeTickspeed = true; sp.changeTickspeed(); decay.gameCan.changeTickspeed = false; }, 'changes the tickspeed in the Stock market');
		new decay.typingAction('refill magic', function() { if (!gp) { return; } decay.gameCan.refillMinigames = true; l('grimoireLumpRefill').click(); decay.gameCan.refillMinigames = false; }, 'refills magic in the Grimoire using a sugar lump');
		new decay.typingAction('refill worship swaps', function() { if (!pp) { return; } decay.gameCan.refillMinigames = true; l('templeLumpRefill').click(); decay.gameCan.refillMinigames = false; }, 'refills worship swaps in the Pantheon using a sugar lump');
		new decay.typingAction('supercharge garden', function() { if (!gap) { return; } decay.gameCan.refillMinigames = true; l('gardenLumpRefill').click(); decay.gameCan.refillMinigames = false; }, 'activates the sugar lump ability (not sacrifice garden) in the Garden');
		new decay.typingAction('garden use %', function(c) { if (!gap) { return; } const a = c[0].join(''); decay.gameCan.useGardenTools = true; var tr = false; if (a=='harvest all') { gap.tools.harvestAll.func(); tr = true; } else if (a=='freeze') { gap.tools.freeze.func(); tr = true; } else if (a=='sacrifice garden') { gap.tools.convert.func(); tr = true; } else if (a.length>15) { tr = true; } decay.gameCan.useGardenTools = false; return tr; }, 'uses the garden tool as if clicking on it', 'garden use [garden tool name]', true);
		new decay.typingAction('select %', function(c) { c[0][0] = c[0][0].toUpperCase(); const a = c[0].join(''); for (let i in gap.plants) { if (gap.plants[i].name == a && gap.plants[i].unlocked) { decay.gameCan.selectSeeds = true; l('gardenSeed-'+gap.plants[i].id).click(); decay.gameCan.selectSeeds = false; return true; } } if (a.length>15) { return true; } else { return false; } }, 'selects or unselects the seed corresponding to the plant, if possible', 'select [garden plant name]', true);
		new decay.typingAction('plant', function() { if (gap.selectedTile[0] == -1 || gap.seedSelected == -1 || !gap.plot[gap.selectedTile[1]][gap.selectedTile[0]][0]) { return; } decay.gameCan.plant = true; gap.clickTile(gap.selectedTile[0], gap.selectedTile[1]); if (!M.canPlant(gap.plantsById[gap.seedSelected])) { Game.Notify('Seed is too expensive!', '', 0, 2.5); } decay.gameCan.plant = false; }, 'plants the currently selected seed on currently hovered over tile');
		new decay.typingAction('uproot', function() { if (gap.selectedTile[0] == -1 || gap.plot[gap.selectedTile[1]][gap.selectedTile[0]][0]) { return; } decay.gameCan.plant = true; gap.clickTile(gap.selectedTile[0], gap.selectedTile[1]); decay.gameCan.plant = false; }, 'uproots the currently hovered over plant');

		addLoc('Bake <b>%1</b>, but power passively accumulates with speed scaling with current acceleration. In addition, the duration of Power surge buff decreases with acceleration. Upon reaching maximum power click capacity, force ascend.');
		addLoc('Power poked duration <b>+%1%</b>.');
		new decay.challenge('power', loc('Bake <b>%1</b>, but power passively accumulates with speed scaling with current acceleration. In addition, the duration of Power surge buff decreases with acceleration. Upon reaching maximum power click capacity, force ascend.', Beautify(1e16)), function() { return (Game.cookiesEarned >= 1e16) }, loc('Power poked duration <b>+%1%</b>.', '50'), decay.challengeUnlockModules.box, {conditional: true, prereq: 'gswitch', init: function() { decay.setGaugeColor('powerGradientRed'); }, reset: function() { decay.setGaugeColor('powerGradientBlue');} });
		
		addLoc('Bake <b>%1</b>.');
		new decay.challenge('bakeR', function(c) { return loc('Bake <b>%1</b>.', Beautify(1e12 * Math.pow(100, c)))+(c?'<br>'+loc('Completions: ')+'<b>'+Beautify(c)+'</b>':''); }, function(c) { return (Game.cookiesEarned >= 1e12 * Math.pow(100, c.complete)); }, loc('CpS multiplier <b>x%1</b> for each <b>x2</b> CpS multiplier from your purity', '1.05'), decay.challengeUnlockModules.truck, { order: 1000, prereq: 5, repeatable: true });
		
		addLoc('Fortunes appear <b>%1</b> more often.');
		addLoc('Bake <b>%1</b>, but typing stuff is required to do most things. Type "help" to view the available actions.');
		new decay.challenge('typingR', function(c) { return loc('Bake <b>%1</b>, but typing stuff is required to do most things. Type "help" to view the available actions.', Beautify(1e11 * Math.pow(100, c)))+(c?'<br>'+loc('Completions: ')+'<b>'+Beautify(c)+'</b>':''); }, function(c) { return (Game.cookiesEarned >= 1e11 * Math.pow(100, c.complete)); }, loc('CpS multiplier <b>x%1</b> for each <b>x2</b> CpS multiplier from your purity', '1.05') + '<br>' + loc('Fortunes appear <b>%1</b> more often.', '20%'), function() { return (decay.challengeUnlockModules.truck() && Game.Has('Script writer')); }, { order: 1001, prereq: 'typing', repeatable: true, conditional: true, category: 'truck', init: function() { for (let i in decay.typingActions) { decay.typingActions[i].activate(); } for (let i in decay.gameCan) { decay.gameCan[i] = false; } }, reset: function() { for (let i in decay.typingActions) { decay.typingActions[i].deactivate(); } for (let i in decay.gameCan) { decay.gameCan[i] = true; } } });
		
		eval('Game.getNewTicker='+Game.getNewTicker.toString().replace(`(Game.HasAchiev('O Fortuna')?0.04:0.02)`, `((Game.HasAchiev('O Fortuna')?0.06:0.04)*(1 + 0.2 * decay.challengeStatus('typingR')))`)); //incredible gaming, just need to make sure no one gets the challenge done 96 times lol lmao
		//comboing tutorial
		addLoc('Get a <b>Click frenzy</b> in the first <b>%1</b> of the run.');
		addLoc('Click frenzy from Force the Hand of Fate chance <b>%1</b> --> <b>%2</b>');
		addLoc('A <b>%1</b> %2 multiplier that gradually decreases with your current progress in a run');
		new decay.challenge('combo1', loc('Get a <b>Click frenzy</b> in the first <b>%1</b> of the run.', Game.sayTime(10 * 60 * Game.fps)), function(c) { if (Game.TCount >= 600 * Game.fps) { c.cannotComplete = true; } return Game.hasBuff('Click frenzy'); }, function(hide) { return loc('Click frenzy from Force the Hand of Fate chance <b>%1</b> --> <b>%2</b>', ['25%', '30%']) + '<br>' + loc('A <b>%1</b> %2 multiplier that gradually decreases with your current progress in a run', ['+' + Beautify(909) + '%', 'CpS']) + (hide?'':(' ' + loc('(Currently: <b>%1</b>)', '+'+Beautify(909 / (Math.max(Game.log10Cookies - 15, 0) / 4 + 1))+'%'))); }, decay.challengeUnlockModules.vial);
		
		addLoc('Get a <b>Click frenzy</b> and a <b>Frenzy</b> active simultaneously in the first <b>%1</b> of the run.');
		addLoc('(does not contribute to future click power multiplier checks)');
		addLoc('While not in a permanent upgrade slot, Get lucky has a <b>%1%</b> chance to be kept from the last ascension');
		addLoc('(Currently: <b>%1</b>)');
		new decay.challenge('combo2', loc('Get a <b>Click frenzy</b> and a <b>Frenzy</b> active simultaneously in the first <b>%1</b> of the run.', Game.sayTime(6 * 60 * Game.fps)), function(c) { if (Game.TCount >= 360 * Game.fps) { c.cannotComplete = true; } return (Game.hasBuff('Click frenzy') && Game.hasBuff('Frenzy')); }, function(hide) { return loc('While not in a permanent upgrade slot, Get lucky has a <b>%1%</b> chance to be kept from the last ascension', Beautify(25)) + '<br>' + loc('A <b>%1</b> %2 multiplier that gradually decreases with your current progress in a run', ['+' + Beautify(1818) + '%', 'click power']) + ' ' + loc('(does not contribute to future click power multiplier checks)') + (hide?'':(' '+loc('(Currently: <b>%1</b>)', '+'+Beautify(1818 / (Math.max(Game.log10Cookies - 12, 0) / 5 + 1))+'%'))) }, decay.challengeUnlockModules.vial, { prereq: 'combo1' });
		Game.registerHook('cookiesPerClick', function(out) { if (decay.challengeStatus('combo2')) { return out * (1 + 18.18 / (Math.max(Game.log10Cookies - 12, 0) / 5 + 1)); } return out; });
		
		addLoc('Get a click power multiplier of at least <b>x%1</b> in the first <b>%2</b> of the run.');
		addLoc('Slotting gods in the Pantheon has a <b>%1%</b> chance to not use any worship swaps');
		new decay.challenge('combo3', loc('Get a click power multiplier of at least <b>x%1</b> in the first <b>%2</b> of the run.', [Beautify(2500), Game.sayTime(5 * 60 * Game.fps)]), function(c) { if (Game.TCount >= 300 * Game.fps) { c.cannotComplete = true; } return (Game.clickMult >= 2500); }, function(hide) { return loc('Slotting gods in the Pantheon has a <b>%1%</b> chance to not use any worship swaps', 10) + '<br>' + loc('A <b>%1</b> %2 multiplier that gradually decreases with your current progress in a run', ['+' + Beautify(2727) + '%', 'golden cookie gains']) + (hide?'':(' '+loc('(Currently: <b>%1</b>)', '+'+Beautify(2727 / (Math.max(Game.log10Cookies - 9, 0) / 6 + 1))+'%'))); }, decay.challengeUnlockModules.vial, { prereq: 'combo2' });
		eval('Game.shimmerTypes.golden.popFunc='+Game.shimmerTypes.golden.popFunc.toString().replace(`if (Game.Has('Dragon fang')) mult*=1.03;`, `if (Game.Has('Dragon fang')) mult*=1.03; if (decay.challengeStatus('combo3')) { mult *= (1 + 27.27 / (Math.max(Game.log10Cookies - 9, 0) / 6 + 1)); }`));
		Game.clickMult = 1;
		eval('Game.mouseCps='+Game.mouseCps.toString().replace('var out=mult*Game.ComputeCps', 'Game.clickMult = mult; var out=mult*Game.ComputeCps'));
		eval('Game.Reset='+Game.Reset.toString().replace(`Game.gainedPrestige=0;`, `Game.gainedPrestige=0; var hasLucky = false; if (Game.Has('Get lucky')) { hasLucky = true; }`).replace(`BeautifyAll();`, `if (!hard && decay.challengeStatus('combo2') && Math.random() < 0.25) { Game.Upgrades['Get lucky'].earn(); } BeautifyAll();`));
		
		addLoc('(note: there is no way to stack Click frenzy and Dragonflight in this mod)');
		addLoc('Sacrificing the garden leaves the %1 seed in addition to Baker\'s Wheat.');
		addLoc('All dragon auras cost <b>half</b> as much buildings to unlock');
		new decay.challenge('combo4', loc('Get a click power multiplier of at least <b>x%1</b> in the first <b>%2</b> of the run.', [Beautify(50000), Game.sayTime(10 * 60 * Game.fps)]) + '<br>' + loc('(note: there is no way to stack Click frenzy and Dragonflight in this mod)'), function(c) { if (Game.TCount >= 600 * Game.fps) { c.cannotComplete = true; } return (Game.clickMult >= 50000); }, loc('Sacrificing the garden leaves the %1 seed in addition to Baker\'s Wheat.', 'Thumbcorn') + '<br>' + loc('Click frenzy from Force the Hand of Fate chance <b>%1</b> --> <b>%2</b>', ['30%', '35%']), decay.challengeUnlockModules.vial, { prereq: 'combo3' });
		addLoc('Get a click power multiplier of at least <b>x%1</b> with only one buff active. Then, obtain a Dragon harvest while Dragonflight is not active.');
		new decay.challenge('comboDragonCursor', loc('Get a click power multiplier of at least <b>x%1</b> with only one buff active. Then, obtain a Dragon harvest while Dragonflight is not active.', [Beautify(1282)]), new decay.challengeChecker(function(t) { if (t.cpcValid && Game.hasBuff('Dragon Harvest')) { t.cpcValid = false; return true; } if (Game.clickMult >= 1282 && !Game.hasBuff('Dragonflight') && Game.buffCount() <= 1) { t.cpcValid = true; } else { t.cpcValid = false; } return false; }, function() { return ''; }, function() { }, { cpcValid: false }), loc('All dragon auras cost <b>half</b> as much buildings to unlock'), decay.challengeUnlockModules.vial, { prereq: 'combo3' });
		
		addLoc('Obtain a click power multiplier of at least <b>x%1</b> during a Frenzy in the first <b>%2</b> of the run, without casting more than one spell, and with the Golden switch turned on.');
		addLoc('The Golden switch is <b>%1%</b> cheaper.');
		new decay.challenge('comboGSwitch', loc('Obtain a click power multiplier of at least <b>x%1</b> during a Frenzy in the first <b>%2</b> of the run, without casting more than one spell, and with the Golden switch turned on.', [Beautify(1000), Game.sayTime(5 * 60 * Game.fps)]), function(c) { if (Game.TCount >= 300 * Game.fps) { c.cannotComplete = true; } return (gp.spellsCast <= 1 && Game.clickMult >= 1000 && Game.Has('Golden switch [off]')); }, loc('The Golden switch is <b>%1%</b> cheaper.', 25) + '<br>' + loc('Cookie production multiplier <b>+%1%</b>.', 10), function() { return (decay.challengeUnlockModules.box() && Game.Has('Golden switch')); }, { category: 'box', prereq: 'combo2' });
		Game.Upgrades['Golden switch [off]'].priceFunc = function() {return Game.cookiesPs*60*60*(decay.challengeStatus('comboGSwitch')?0.75:1);}
		Game.Upgrades['Golden switch [on]'].priceFunc = function() {return Game.cookiesPs*60*60*(decay.challengeStatus('comboGSwitch')?0.75:1);}
		
		addLoc('Each dragon aura only takes <b>%1</b> buildings each to unlock.');
		addLoc('Get at least <b>%1</b> Golden cookie effects active at the same time in the first <b>%2</b> of the run.');
		addLoc('Chance to spawn a Golden cookie when selling with Dragon Orbs <b>%1%</b> --> <b>%2%</b>');
		addLoc('three');
		new decay.challenge('comboOrbs', loc('Each dragon aura only takes <b>%1</b> buildings each to unlock.', 2) + '<br>' + loc('Get at least <b>%1</b> Golden cookie effects active at the same time in the first <b>%2</b> of the run.', [loc('three'), Game.sayTime(10 * 60 * Game.fps)]), function() { if (Game.TCount >= 10 * 60 * Game.fps) { decay.forceAscend(); } return (Game.gcBuffCount() >= 3)}, loc('Chance to spawn a Golden cookie when selling with Dragon Orbs <b>%1%</b> --> <b>%2%</b>', [10, 25]), decay.challengeUnlockModules.box, { conditional: true, prereq: 'combo2' });
		
		addLoc('Keepsake is disabled, and Easter eggs drop as if you always have the Hide & seek champion achievement.');
		addLoc('Get at least <b>%1</b> Easter eggs in the first <b>%2</b> of the run.');
		addLoc('While in Unshackled decay, all dragon auras require <b>half</b> as much buildings to unlock');
		addLoc('While in Unshackled decay, all dragon auras require <b>%1</b> less buildings to unlock');
		addLoc('Script writer code to bolster the chance of Cookie storms and Cookie chains from Golden cookies to be the same as Wrath cookies');
		new decay.challenge('easterTutorial', loc('Keepsake is disabled, and Easter eggs drop as if you always have the Hide & seek champion achievement.') + ' ' + loc('Each dragon aura only takes <b>%1</b> buildings each to unlock.', 5) + '<br>' + loc('Get at least <b>%1</b> Easter eggs in the first <b>%2</b> of the run.', [19, Game.sayTime(10 * 60 * Game.fps)]), function() { if (Game.TCount >= 600 * Game.fps) { decay.forceAscend(); } let has = 0; for (let i of Game.easterEggs) { if (Game.Has(i)) { has++; } } return (has >= 19); }, loc('While in Unshackled decay, all dragon auras require <b>%1</b> less buildings to unlock', 20) + '<br>' + loc('Script writer code to bolster the chance of Cookie storms and Cookie chains from Golden cookies to be the same as Wrath cookies'), decay.challengeUnlockModules.box, { conditional: true, prereq: 'comboOrbs' });
		eval('Game.DropEgg='+Game.DropEgg.toString().replace(`Game.HasAchiev('Hide & seek champion')`, `Game.HasAchiev('Hide & seek champion') || decay.isConditional('easterTutorial')`));
		eval('Game.Reset='+Game.Reset.toString().replace(`Game.Has('Keepsakes')`, `Game.Has('Keepsakes') && !decay.isConditional('easterTutorial')`));

		addLoc('Get a CpS multiplier from buffs of at least <b>x%1</b> and a click power multiplier of at least <b>x%2</b> simultaneously, in the first <b>%3</b> of the run');
		new decay.challenge('godzSwap', loc('Get a CpS multiplier from buffs of at least <b>x%1</b> and a click power multiplier of at least <b>x%2</b> simultaneously, in the first <b>%3</b> of the run', [100, 5000, Game.sayTime(6 * 60 * Game.fps)]), function() { if (Game.TCount >= 360 * Game.fps) { decay.forceAscend(); } return (Game.buffCpsMult >= 100 && Game.clickMult >= 5000); }, loc('Script writer code to ascend and keep the current Pantheon setup'), decay.challengeUnlockModules.box, { order: 15.5, prereq: 'godz' });
		Game.buffsCpsMult = 1;
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace('Game.globalCpsMult*=mult;', 'Game.buffsCpsMult = (mult * Game.cookiesPs) / Game.unbuffedCps; Game.globalCpsMult*=mult;'));
		
		addLoc('%1 and %2');
		addLoc('Get <b>%1</b> distinct Golden cookie effects active at once');
		addLoc('Script writer code to purify decay by an especially large amount');
		new decay.challenge('combo5', loc('Get <b>%1</b> distinct Golden cookie effects active at once', 4), function() { return (Game.gcBuffCount() >= 4); }, loc('Sacrificing the garden leaves the %1 seed in addition to Baker\'s Wheat.', loc('%1 and %2', ['Golden clover', 'Nursetulip'])) + '<br>' + loc('Script writer code to purify decay by an especially large amount'), decay.challengeUnlockModules.truck, { prereq: 'combo2' });

		addLoc('Unlocks a Elder Covenant mode to allow the strength stacking of Frenzy.');
		addLoc('Get any golden cookie buff to be at least <b>%1</b> long.');
		new decay.challenge('buffStack', loc('Get any golden cookie buff to be at least <b>%1</b> long.', Game.sayTime(10 * 60 * Game.fps)), function() { for (let i in Game.buffs) { if (decay.gcBuffs.includes(Game.buffs[i].type.name) && Game.buffs[i].time > 600 * Game.fps) { return true; } } return false; }, loc('Unlocks a Elder Covenant mode to allow the strength stacking of Frenzy.'), decay.challengeUnlockModules.truck, { prereq: 'combo2' });

		addLoc('Get <b>%1</b> of any buffs active simultaneously.');
		addLoc('Dragon Orbs can ignore up to <b>1</b> buff when attempting to spawn a Golden cookie.');
		new decay.challenge('allBuffStack', loc('Get <b>%1</b> of any buffs active simultaneously.', Beautify(12)), function() { return (Object.keys(Game.buffs).length >= 12); }, loc('Dragon Orbs can ignore up to <b>1</b> buff when attempting to spawn a Golden cookie.'), decay.challengeUnlockModules.truck, { prereq: ['buffStack', 'combo5'] });

		addLoc('Click frenzy from Force the Hand of Fate chance <b>+%1</b>');
		new decay.challenge('allBuffStackR', function(c) { return loc('Get <b>%1</b> of any buffs active simultaneously.', Beautify(15 + c * 3))+(c?'<br>'+loc('Completions: ')+'<b>'+Beautify(c)+'</b>':''); }, function(c) { return (Object.keys(Game.buffs).length >= (15 + c.complete * 3)); }, loc('CpS multiplier <b>x%1</b> for each <b>x2</b> CpS multiplier from your purity', '1.05') + '<br>' + loc('Click frenzy from Force the Hand of Fate chance <b>+%1</b>', 1+'%'), decay.challengeUnlockModules.truck, { order: 1002, repeatable: true, prereq: 'allBuffStack' });

		addLoc('Get a Click Frenzy of at least <b>%1</b> long.');
		addLoc('You can only get Click Frenzy from Force the Hand of Fate with an increased chance. You start with <b>4x</b> acceleration. Gambler\'s Fever dream cannot be used. You cannot refill minigames with sugar lumps.');
		addLoc('Selling wizard towers halts decay as if Reality Bending (Earth Shatterer effect by extension) is always equipped.');
		addLoc('In Unshackled decay, baking the dragon cookie and dual wielding auras require <b>half</b> as much buildings.');
		new decay.challenge('dualcast', loc('You can only get Click Frenzy from Force the Hand of Fate with an increased chance. You start with <b>4x</b> acceleration. Gambler\'s Fever dream cannot be used. You cannot refill minigames with sugar lumps.')+'<br>'+loc('Get a Click Frenzy of at least <b>%1</b> long.', Game.sayTime(60 * Game.fps)), function() { return (Game.hasBuff('Click frenzy') && Game.hasBuff('Click frenzy').time >= 60 * Game.fps); }, loc('Selling wizard towers halts decay as if Reality Bending (Earth Shatterer effect by extension) is always equipped.')+'<br>'+loc('In Unshackled decay, baking the dragon cookie and dual wielding auras require <b>half</b> as much buildings.'), decay.challengeUnlockModules.truck, { prereq: 'buffStack', conditional: true, init: function() { decay.gameCan.refillMinigames = false; }, reset: function() { decay.gameCan.refillMinigames = true; } });
		eval('Game.shimmerTypes.golden.popFunc='+Game.shimmerTypes.golden.popFunc.toString().replace(`!Game.hasBuff('Dragonflight')`, `(!Game.hasBuff('Dragonflight') && !decay.isConditional('dualcast'))`));

		addLoc('You start with an acceleration of <b>x%1</b>.');
		addLoc('Stack a Frenzy, Dragon Harvest, and a Click frenzy, then gain at least <b>+200%</b> purity and at least <b>%1</b> cookies.');
		addLoc('Unlocks a Elder Covenant mode to allow the strength stacking of Dragon Harvest.');
		new decay.challenge('combo6', loc('You start with an acceleration of <b>x%1</b>.', 2)+'<br>'+loc('Stack a Frenzy, Dragon Harvest, and a Click frenzy, then gain at least <b>+200%</b> purity and at least <b>%1</b> cookies.', Beautify(1e27)), function() { return (Game.hasBuff('Frenzy') && Game.hasBuff('Dragon Harvest') && Game.hasBuff('Click frenzy') && decay.gen >= 3 && Game.cookiesEarned >= 1e27); }, loc('Unlocks a Elder Covenant mode to allow the strength stacking of Dragon Harvest.'), decay.challengeUnlockModules.truck, { prereq: ['dualcast', 'allBuffStack'], conditional: true });

		addLoc('Each research upgrade gives <b>+%1%</b> CpS.');
		addLoc('With less than <b>%1x</b> acceleration, increase decay by <b>%2</b> times over the course of an Elder Pledge purification');
		let researchCheckObj = {
			check: function(t) {
				if (decay.acceleration <= 2) { t.challengeObj.cannotComplete = true; return; }
				if (Game.pledgeT > 0) { t.mostDecay = Math.max(decay.gen, t.mostDecay); } else { t.mostDecay = 0; }
				if (decay.gen / t.mostDecay <= 1/10000) { return true; }
			},
			save: function(t) { return t.mostDecay },
			load: function(t, str) { if (isv(str)) { t.mostDecay = parseFloat(str); } },
			init: {
				mostDecay: 0
			}
		}
		new decay.challenge('research', loc('With less than <b>%1x</b> acceleration, increase decay by <b>%2</b> times over the course of an Elder Pledge purification', [2, Beautify(10000)]), decay.quickCheck(researchCheckObj, researchCheckObj.init), loc('Each research upgrade gives <b>+%1%</b> CpS.', Beautify(2)), decay.challengeUnlockModules.vial, { prereq: ['wrinkler1', 'purity1'] });
		addLoc('With <b>Challenge %1</b> completed: <b>+%2%</b> CpS');
		for (let i in Game.UpgradesByPool['tech']) {
			Game.UpgradesByPool['tech'][i].descFunc = function() {
				if (decay.challengeStatus('research')) { return '<div style="text-align:center;">'+loc('With <b>Challenge %1</b> completed: <b>+%2%</b> CpS', [decay.challenges.research.name, 2])+'</div><div class="line"></div>'+Game.UpgradesByPool['tech'][i].desc; }
				return Game.UpgradesByPool['tech'][i].desc;
			}
		}
		
		//acceleration
		decay.startingAcc = 1.2;
		decay.accInc = 0; //general increase per second (divided by Game.fps) without accounting for decay; set with function
		decay.accSmoothBuffer = 0.15; //smaller it is, the slower acceleration picks up
		decay.accSmoothFactor = 3.5; //bigger it is, the slower acceleration picks 
		decay.accIncPowOnPurity = 2; //more it is, the more acceleration gets slowed down with increasing purity
		decay.accIncLogOnDecay = 1698; //more it is, the slower acceleration increases with increasing decay
		decay.accBuffAsymptoteOnDecay = 4; //asymptomatic multiplier to acceleration with decay
		decay.accBuffAsymptotePow = 0.025; //closer this is to 0 (always positive), the slower the asymptomatic multiplier picks up
		decay.accBuffAsymptoteThreshold = 0; //when decay is below this point, stop calculating the asymptomatic multiplier and assume the full multiplier, switching to the log method for increasing the speed
		decay.updateAcc = function() {
			const amount = decay.accInc * Math.log2(Math.log2(decay.acceleration + decay.accSmoothBuffer) + 1) * Math.pow((1 - 1 / (decay.acceleration + decay.accSmoothBuffer)), decay.accSmoothFactor) * decay.getAccTickspeed() * (decay.isConditional('reversedAcc')?-1:1) + (decay.isConditional('reversedAcc')?(0.001 / Game.fps):0);
			if (decay.gen >= 1) {
				return amount * Math.pow(1 / decay.gen, decay.accIncPowOnPurity);
			} else {
				if (decay.gen > decay.accBuffAsymptoteThreshold) {
					return amount * decay.accBuffAsymptoteOnDecay * ((1 - Math.pow(2, -decay.accBuffAsymptotePow * (1 / decay.gen))) + 1);
				} else {
					return amount * (decay.accBuffAsymptoteOnDecay + 1) * Math.log(1 / decay.gen + decay.accIncLogOnDecay - 1) / Math.log(decay.accIncLogOnDecay);
				}
			} 
		}
		decay.getAccTickspeed = function() {
			var tickSpeed = 1;
			if (decay.challengeStatus('veil') && Game.veilOn()) { tickSpeed *= 1 - Game.getVeilBoost(); }
			if (decay.isConditional('typing') || decay.isConditional('typingR')) { tickSpeed *= 0.4; }
			return tickSpeed;
		}
		decay.recalcAccStats = function() {
			decay.accInc = 0.02 / Game.fps;
			decay.accBuffAsymptoteThreshold = decay.accBuffAsymptotePow / 6;
			decay.startingAcc = 1.2;
			if (Game.Has('Enchanted Permanent upgrade slot I')) { decay.startingAcc -= 0.02; }
			if (Game.Has('Enchanted Permanent upgrade slot II')) { decay.startingAcc -= 0.02; }
			if (Game.Has('Enchanted Permanent upgrade slot III')) { decay.startingAcc -= 0.02; }
			if (Game.Has('Enchanted Permanent upgrade slot IV')) { decay.startingAcc -= 0.02; }
			if (Game.Has('Enchanted Permanent upgrade slot V')) { decay.startingAcc -= 0.02; }

			if (decay.isConditional('dualcast')) { decay.startingAcc = 4; }
			else if (decay.isConditional('combo6')) { decay.startingAcc = 2; }
		}
		Game.registerHook('check', decay.recalcAccStats);

		allValues('challenges');

		/*=====================================================================================
        Custom upgrades & achievements
        =======================================================================================*/

		window.strCookieProductionMultiplierPlus=loc("Cookie production multiplier <b>+%1%</b>.",'[x]');
		window.getStrCookieProductionMultiplierPlus=function(x)
		{return strCookieProductionMultiplierPlus.replace('[x]',x);}

		this.createAchievements=function(){//Adding the custom upgrades
			this.achievements = []
			this.achievements.push(new Game.Upgrade('Golden sugar',("Sugar lumps ripen <b>8 hours</b> sooner.")+'<q>Made from the highest quality sugar!</q>',1000000000,[28,16]))
			this.achievements.push(new Game.Upgrade('Cursedor',("Unlocks <b>cursedor</b>, which concentrates and converts your cookies clicked amount this ascension into a golden cookie; the more you clicked, the better effects the golden cookie will yield.")+'<q>Like Russian roulette, but for cookies.</q>',11111111111111111,[0,1,kaizoCookies.images.custImg])); Game.last.pool='prestige';
			Game.Upgrades['Cursedor'].parents=[Game.Upgrades['Luminous gloves']]
			Game.PrestigeUpgrades.push(Game.Upgrades['Cursedor'])
			Game.last.posY=-760,Game.last.posX=-150;
			
		    this.achievements.push(new Game.Upgrade('Cursedor [inactive]',("Activating this will spawn a golden cookie based on the amount of times you clicked the big cookie this ascension when you click the big cookie. Upon use, your cookies clicked stat will be reset and the golden cookie spawned yields effects based on the amount it consumed."),0,[0,1,kaizoCookies.images.custImg]));
			Game.last.pool='toggle';Game.last.toggleInto='Cursedor [active]';

			this.achievements.push(new Game.Upgrade('Cursedor [active]',("The Cursor is currently active, and clicking the big cookie will reset your big cookies clicked amount and spawn a golden cookie. <br>Turning it off will revert those effects.</b>"),0,[0,1,kaizoCookies.images.custImg]));
		    Game.last.pool='toggle';Game.last.toggleInto='Cursedor [inactive]';Game.last.timerDisplay=function(){if (!Game.Upgrades['Cursedor [inactive]'].bought) return -1; else return 1-Game.fps*60*60*60*60*60*60;};
			decay.toggleUpgradesMap.push({name: 'cursedor', upgradeOn: Game.Upgrades['Cursedor [inactive]'], upgradeOff: Game.Upgrades['Cursedor [active]']});

			this.achievements.push(Game.NewUpgradeCookie({name:'The ultimate cookie',desc:'These were made with the purest and highest quality ingredients, legend says: "whom has the cookie they shall become the most powerful baker." No, this isn\'t just a normal cookie.',icon:[10,0],power:		100,	price:	999999999999999999999999999999999999999999999999999999999999999999999999999}));
			Game.cookieUpgrades.push(Game.last);
			decay.unskippableUpgrades.push(Game.last);
			this.achievements.push(new Game.Upgrade('Purity vaccines', '<b>Stops all decay.</b><q>Developed for the time of need.</q>', 7, [20, 6])); Game.last.pool='debug'; Game.UpgradesByPool['debug'].push(Game.last);

			this.achievements.push(new Game.Upgrade('Unshackled Purity',("Purification is <b>no longer limited by caps</b>; however, increasing purity past the cap will require an increased amount of purification power. <br>The decay rate increase from purity increase <b>-25%</b>.")+'<q>One of the strongest antidotes that has been found; it can cure all known diseases.</q>',250000000000000,[4,1,kaizoCookies.images.custImg])); Game.last.pool='prestige';
			Game.Upgrades['Unshackled Purity'].parents=[Game.Upgrades['Unshackled flavor'],Game.Upgrades['Unshackled berrylium'],Game.Upgrades['Unshackled blueberrylium'],Game.Upgrades['Unshackled chalcedhoney'],Game.Upgrades['Unshackled buttergold'],Game.Upgrades['Unshackled sugarmuck'],Game.Upgrades['Unshackled jetmint'],Game.Upgrades['Unshackled cherrysilver'],Game.Upgrades['Unshackled hazelrald'],Game.Upgrades['Unshackled mooncandy'],Game.Upgrades['Unshackled astrofudge'],Game.Upgrades['Unshackled alabascream'],Game.Upgrades['Unshackled iridyum'],Game.Upgrades['Unshackled glucosmium'],Game.Upgrades['Unshackled glimmeringue']]
			Game.PrestigeUpgrades.push(Game.Upgrades['Unshackled Purity'])
			Game.last.posY=195,Game.last.posX=750

			this.achievements.push(new Game.Upgrade('Unshackled Elder Pledge',("Makes Elder Pledge's purification <b>25%</b> stronger, and reduces the cooldown by <b>25%</b>.")+'<q>Your pledge to the grandmas is stronger than ever before.</q>',2560000000000000,[1,1,kaizoCookies.images.custImg])); Game.last.pool='prestige';
			Game.Upgrades['Unshackled Elder Pledge'].parents=[Game.Upgrades['Unshackled grandmas']]
			Game.PrestigeUpgrades.push(Game.Upgrades['Unshackled Elder Pledge'])
			Game.last.posY=-361; Game.last.posX=516;
			
			this.achievements.push(new Game.Upgrade('Uranium rolling pins', ('The Elder Pledge halts decay for <b>3</b> times longer on use.')+('<q>Radiation, my superpower!</q>'), 90000000000000, [5, 1, kaizoCookies.images.custImg])); Game.last.pool='prestige'; 
			Game.Upgrades['Uranium rolling pins'].parents=[Game.Upgrades['Cat ladies']];
			Game.PrestigeUpgrades.push(Game.Upgrades['Uranium rolling pins']);
			Game.last.posY=-740; Game.last.posX=800;

			this.achievements.push(new Game.Upgrade('Sparkling wonder', ('The <b>Shimmering Veil</b> has a <b>10%</b> chance to be revived to full health on collapse.')+('<q>Just within reach, yet at what cost?</q>'), 1500000000000000, [23, 34])); Game.last.pool='prestige'; 
			Game.Upgrades['Sparkling wonder'].parents=[Game.Upgrades['Glittering edge']];
			Game.PrestigeUpgrades.push(Game.Upgrades['Sparkling wonder']);
			Game.last.posY=662; Game.last.posX=-622;
			
			this.achievements.push(new Game.Upgrade('Withering prices', 'Your upgrades are <b>0.1%</b> cheaper for every <b>x0.5</b> CpS multiplier from your decay.', 666, [3, 3, kaizoCookies.images.custImg])); Game.last.pool = 'prestige';
   			Game.Upgrades['Withering prices'].parents = [Game.Upgrades['Starter kit']];
	  		Game.PrestigeUpgrades.push(Game.Upgrades['Withering prices']);
	 		Game.last.posY = -300; Game.last.posX = -390;

			this.achievements.push(new Game.Upgrade('Caramelized luxury', 'Sugar lumps ripen <b>4 hours</b> sooner.<q>The caramelization process causes the sugar molecules to change states, giving it a strong, deep aroma.</q>', 1000000000000000, [28, 27]));
			this.achievements.push(new Game.Upgrade('Meaty disgust', 'Sugar lumps ripen <b>2 hours</b> sooner.<q>The presence of decay causes the sugar molecules growing within to fold in on itself, creating an entangled conglomeration that breeds agony.</q>', 1000000000000000000000000000, [28, 17]));
			this.achievements.push(new Game.Upgrade('High-fructose sugar lumps', 'Sugar lumps ripen <b>1 hour</b> sooner.<q>Despite how obviously unhealthy, it is undoubtly, very delicious.</q>', 1000000000000000000000000000000000000000000000, [28, 14]));
			this.achievements.push(new Game.Upgrade('Rainy day lumps', 'Mature sugar lumps are <b>5 times</b> less likely to botch.<q>Just in case of hunger.</q>', 1000000000000000000000000000000000000000000000000000000000000000, [29, 15]));
			
			eval('Game.clickLump='+Game.clickLump.toString().replace('var amount=choose([0,1]);', 'var amount=randomFloor(0.5 + Game.Has("Rainy day lumps") * 0.4);'));
			addLoc("This sugar lump is mature and will be ripe in <b>%1</b>.<br>You may <b>click it to harvest it now</b>, but there is a <b>%2% chance you won't get anything</b>.");
			eval('Game.lumpTooltip='+Game.lumpTooltip.toString().replace(`loc("This sugar lump is mature and will be ripe in <b>%1</b>.<br>You may <b>click it to harvest it now</b>, but there is a <b>50% chance you won't get anything</b>.",Game.sayTime(((Game.lumpRipeAge-age)/1000+1)*Game.fps,-1));`, `loc("This sugar lump is mature and will be ripe in <b>%1</b>.<br>You may <b>click it to harvest it now</b>, but there is a <b>%2% chance you won't get anything</b>.",[Game.sayTime(((Game.lumpRipeAge-age)/1000+1)*Game.fps,-1), 50 - Game.Has('Rainy day lumps') * 40]);`));

			eval('Game.Upgrade.prototype.getPrice='+Game.Upgrade.prototype.getPrice.toString().replace('price*=0.95', '{ price*=0.95; } if (Game.Has("Withering prices") && !Game.OnAscend) { price *= Math.pow(0.999, Math.log2(Math.max(1 / decay.gen, 1))); } if (Game.Has("Wrinkler ambergris")) { price *=0.99; }'));
			
			Game.Upgrades['Golden sugar'].order=350045;
			Game.Upgrades['Cursedor'].order=253.004200000;
			Game.Upgrades['Cursedor [inactive]'].order=30000;
			Game.Upgrades['Cursedor [active]'].order=30000;
			Game.Upgrades['The ultimate cookie'].order=9999999999;
			Game.Upgrades['Purity vaccines'].order=1;
			Game.Upgrades['Unshackled Purity'].order=770;
			Game.Upgrades['Unshackled Elder Pledge'].order=771;
			Game.Upgrades['Uranium rolling pins'].order=275;
			Game.Upgrades['Sparkling wonder'].order = 283;
			Game.Upgrades['Withering prices'].order = 287;
			Game.Upgrades['Caramelized luxury'].order=350045;
			Game.Upgrades['Meaty disgust'].order=350045;
			Game.Upgrades['High-fructose sugar lumps'].order=350045;
			Game.Upgrades['Rainy day lumps'].order=350045;
			

			this.achievements.push(new Game.Upgrade('Purification domes', 'Lets you unlock a set of <b>new tiered</b> upgrades at 600 of each building, which make individual buildings accumulate decay slower. <br>All other decay-related calculations uses the combined impact of all buildings. <q>Within it is the incredible power of the belief in our ability to change.</q>', 5e14, [22, 3, kaizoCookies.images.custImg])); Game.last.pool = 'prestige';
			Game.last.parents = [Game.Upgrades['Unshackled Purity']];
			Game.PrestigeUpgrades.push(Game.last);
			Game.last.posY = 195; Game.last.posX = 615;
			Game.Tiers['purity'] = {name:'Marbledpuree', unlock: -1, iconRow: 0, color: '#9ae726', special: 1, req: 'Purification domes', price: 8.888888888888888888888e+41};
			eval('Game.TieredUpgrade='+Game.TieredUpgrade.toString().replace(`tier!='fortune'`, `tier!='fortune' && tier!='purity'`).replace(`else desc=loc("%1 are <b>twice</b> as efficient.",cap(Game.Objects[building].plural))+desc;`, `else if (tier!='purity') { desc=loc("%1 are <b>twice</b> as efficient.",cap(Game.Objects[building].plural))+desc; }`));
			this.upgrades = [];
			this.upgrades.push(Game.TieredUpgrade('Weekly finger-cutting', 'Cursors accumulate <b>20%</b> less decay.<q>Each cursor can possess a very great number of fingers, which past a point, doesn\'t really help them as they start to become intertwined and locked. Cutting some down from time to time helps a lot!</q>', 'Cursor', 'purity')); Game.last.icon = [0, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('Concentrated workplace', 'Grandmas accumulate <b>40%</b> less decay.<q>Extensive studies have found that placing Grandmas in close proximity seems to help them. We\'re not sure why and honestly kind of scared, but I guess that\'s the way it is.</q>', 'Grandma', 'purity')); Game.last.icon = [1, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('Everything repellant', 'Farms accumulate <b>60%</b> less decay.<q>When mother nature just can\'t escape the force of death, why not add in a batch of industrial poison?</q>', 'Farm', 'purity')); Game.last.icon = [2, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('Improved resting condition', 'Mines accumulate <b>58%</b> less decay.<q>Everyone asks how is the working condition, but never how is the resting condition...</q>', 'Mine', 'purity')); Game.last.icon = [3, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('Unified production lines', 'Factories accumulate <b>56%</b> less decay.<q>Why have so many small and neverending production lines, constantly clogging up space and losing products to the void between them - when you can just have... one?</q>', 'Factory', 'purity')); Game.last.icon = [4, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('Sensible policies', 'Banks accumulate <b>54%</b> less decay.<q>You have realized the power of reducing suffering. Time to get to work!</q>', 'Bank', 'purity')); Game.last.icon = [15, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('Morals', 'Temples accumulate <b>52%</b> less decay.<q>Thou must eat cookies.</q>', 'Temple', 'purity')); Game.last.icon = [16, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('Reduced babbling', 'Wizard towers accumulate <b>50%</b> less decay.<q>In this house, we follow the laws of thermodynamics.</q>', 'Wizard tower', 'purity')); Game.last.icon = [17, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('No more engines', 'Shipments accumulate <b>48%</b> less decay.<q>No more pollution!</q>', 'Shipment', 'purity')); Game.last.icon = [5, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('Lab-free alchemy', 'Alchemy labs accumulate <b>46%</b> less decay.<q>How to alchemy without lab:<br>1. Have ingredients at your ready;<br>2. Have the right tools;<br>3. Alchemy!<br>4. Don\'t get caught.</q>', 'Alchemy lab', 'purity')); Game.last.icon = [6, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('Anti-anti-gravity-anti-matter', 'Portals accumulate <b>44%</b> less decay.<q>To close the portals of course. How else would you close them?</q>', 'Portal', 'purity')); Game.last.icon = [7, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('The present', 'Time machines accumulate <b>42%</b> less decay.<q>Now we wait.</q>', 'Time machine', 'purity')); Game.last.icon = [8, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('Matter conversion', 'Antimatter condensers accumulate <b>40%</b> less decay.<q>Aha, the ultimate solution! Just convert matter back into antimatter!</q>', 'Antimatter condenser', 'purity')); Game.last.icon = [13, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('-1st electron layer', 'Prisms accumulate <b>38%</b> less decay.<q>Just make sure to not do this too much so you don\'t get any neutron stars.</q>', 'Prism', 'purity')); Game.last.icon = [14, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('Quantom tunneling', 'Chancemakers accumulate <b>36%</b> less decay.<q>Helps a lot with clearing away the cookies around your Chancemakers.</q>', 'Chancemaker', 'purity')); Game.last.icon = [19, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('0.00000000001', 'Fractal engines accumulate <b>34%</b> less decay.<q>In a technique known as "Fractalization acceleration", it make copies of itself with a size scaling as close to 0 as possible. It seems to help, somewhat.</q>', 'Fractal engine', 'purity')); Game.last.icon = [20, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('Restarts', 'Javascript consoles accumulate <b>32%</b> less decay.<q>As they always say: One restart a day, keeps all the bugs away.</q>', 'Javascript console', 'purity')); Game.last.icon = [21, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('Going bowling', 'Idleverses accumulate <b>30%</b> less decay.<q>That\'s a hit!</q>', 'Idleverse', 'purity')); Game.last.icon = [22, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('A nice walk outside', 'Cortex bakers accumulate <b>28%</b> less decay.<q>If you experience any difficulty walking, please contact a manager.</q>', 'Cortex baker', 'purity')); Game.last.icon = [23, 4, kaizoCookies.images.custImg];
			this.upgrades.push(Game.TieredUpgrade('Me', 'You accumulate <b>26%</b> less decay.<q>You, alone, are the reason behind all those decay. I figure that if there were less of you... maybe you can have even less.</q>', 'You', 'purity')); Game.last.icon = [24, 4, kaizoCookies.images.custImg];
			for (let i in this.upgrades) {
				this.upgrades[i].order = 19200 + i / 100;
			}
			Game.registerHook('check', function() { const has = Game.Has('Purification domes'); for (let i in Game.Objects) { if (has && Game.Objects[i].amount >= 600) { Game.Unlock(Game.Objects[i].tieredUpgrades.purity.name); } } });

			this.achievements.push(Game.NewUpgradeCookie({name: 'Decayed cookie', desc: 'Looks bad, but still edible - barely.', power: 1, price: 6789, icon: [4, 2, kaizoCookies.images.custImg]}));
   			Game.last.order = 999;
			Game.cookieUpgrades.push(Game.last);

			this.achievements = this.achievements.concat(this.upgrades);

			this.achievements.push(new Game.Upgrade('Ultra-concentrated sweetener', 'Each building accumulates <b>2%</b> less decay for every level it has, for up to level 20.<q>\>99.99999% pure sweetness. Warning: ingestation may lead to lead poisoning.</q>', 1e15, [9, 4, kaizoCookies.images.custImg])); Game.last.pool = 'prestige';
			Game.last.parents = [Game.Upgrades['Purification domes']];
	  		Game.PrestigeUpgrades.push(Game.last);
	 		Game.last.posY = 242; Game.last.posX = 513;

			this.achievements.push(new Game.Upgrade('Lumpy evolution', 'Decay propagation <b>-1%</b> for each building leveled to level 10 or above.<q>In this universe, the weak survives while the strong dies.</q>', 2e15, [23, 3, kaizoCookies.images.custImg])); Game.last.pool = 'prestige';
			Game.last.parents = [Game.Upgrades['Ultra-concentrated sweetener']];
	  		Game.PrestigeUpgrades.push(Game.last);
	 		Game.last.posY = 355; Game.last.posX = 492;

			this.achievements.push(new Game.Upgrade('Wrinkler ambergris',getStrCookieProductionMultiplierPlus(6)+'<br>'+"All upgrades are <b>1% cheaper</b>."+'<br>'+"Cost scales with CpS."+'<q>Occasionally regurgitated by wrinklers.<br>The byproduct of some obscure metabolic process or other, it is as rare and precious as it is pungent.<br>Makes for a great toast spread.</q>',60,[7,2,kaizoCookies.images.custImg]));
			Game.last.priceFunc=function(){return Math.max(1000000,Game.cookiesPs*60*60);};
			Game.last.order = 25050.875;
			
			decay.purityTierStrengthMap = [0.2, 0.4, 0.6, 0.58, 0.56, 0.54, 0.52, 0.5, 0.48, 0.46, 0.44, 0.42, 0.4, 0.38, 0.36, 0.34, 0.32, 0.3, 0.28, 0.26];

			this.achievements.push(new Game.Upgrade('Kitten janitors', 'You gain <b>more milk</b> the more purity you have.<q>This job sucks meow</q>', 900e+63, [18, 4, kaizoCookies.images.custImg])); Game.last.tier = 'purity'; Game.last.order = 20010;
			eval('Game.CalculateGains='+Game.CalculateGains.toString().replace(`milkMult*=Game.eff('milk');`, `milkMult*=Game.eff('milk'); if (Game.Has('Kitten janitors')) { milkMult*=1 + Math.log2(Math.max(decay.gen, 1)) * 0.0123; }`))

			this.achievements.push(new Game.Upgrade('Script writer', 'Writing certain things will give some special effects (case insensitive).<q>Balance? I barely know her.<br><br>Where to start? The leading spriter of this mod might have the answer...</q>', 5000000000000, [8, 2, kaizoCookies.images.custImg])); Game.last.pool = 'prestige';
			Game.last.parents = [Game.Upgrades['Sound test']];
	  		Game.PrestigeUpgrades.push(Game.last);
	 		Game.last.posY = 672; Game.last.posX = 279;

			this.achievements.push(new Game.Upgrade('Bakery', 'Unlocks the <b>cookie selector</b>, letting you pick how the big cookie looks.<br>Comes with a variety of cookies.<q>Weird, why would anyone build a bakery up here?</q>', 1000, [9, 1, kaizoCookies.images.custImg])); Game.last.pool = 'prestige';
			Game.last.parents = [Game.Upgrades['Legacy']];
			Game.PrestigeUpgrades.push(Game.last);
			Game.last.posY = 180; Game.last.posX = -200;

			this.achievements.push(new Game.Upgrade('Cookie selector', 'Lets you pick which cookie to display.',0,[26,17]));
			Game.last.descFunc=function(){
				var choice=this.choicesFunction()[Game.cookieType];
				if (choice==0) choice=this.choicesFunction()[0];
				return '<div style="text-align:center;">'+loc("Current:")+' '+tinyIcon(choice.icon)+' <b>'+choice.name+'</b></div><div class="line"></div>'+this.ddesc;
			};
			Game.last.order = 60000;
			decay.toggleUpgradesMap.push({name: 'cookie selector', choice: true, upgrade: Game.Upgrades['Cookie selector']});

			Game.last.pool='toggle';
			Game.last.choicesFunction=function()
			{
				var choices=[];
				for (let i in Game.cookiesByChoice)
				{
					choices[i]={name:Game.cookiesByChoice[i].name,icon:Game.cookiesByChoice[i].icon,order:Game.cookiesByChoice[i].order||parseInt(i)};
				}
				
				choices[1].div=true;
				
				for (let i in choices)
				{
					var it=choices[i];
				}
				
				choices[Game.cookieType].selected=1;
				return choices;
			}
			Game.last.choicesPick=function(id)
			{Game.cookieType=id;}
			
			Game.AllCookies=[
				{pic:'perfectCookie',name:'Automatic',icon:[0,7]},
				{pic:'perfectCookie.png',name:'Perfect cookie',icon:[28,10]},
				{pic:kaizoCookies.images.bigGolden,name:'Golden cookie',icon:[10,14]},
				{pic:kaizoCookies.images.bigWrath,name:'Wrath cookie',icon:[15,5]},
				{pic:kaizoCookies.images.classic,name:'Classic cookie',icon:[18,1,kaizoCookies.images.custImg]},
				{pic:'imperfectCookie.png',name:'Imperfect cookie',icon:[19,1,kaizoCookies.images.custImg]},
				{pic:kaizoCookies.images.yeetDragon,name:'Yeetdragon cookie',icon:[11,2,kaizoCookies.images.custImg]},
				{pic:kaizoCookies.images.minecraft,name:'Minecraft cookie',icon:[10,1,kaizoCookies.images.custImg]},
				{pic:kaizoCookies.images.terraria,name:'Terraria cookie',icon:[21,2,kaizoCookies.images.custImg]}
			];
			Game.cookiesByChoice={};
			for (let i in Game.AllCookies)
			{
				Game.cookiesByChoice[i]=Game.AllCookies[i];
			}
			if (!EN)
			{
				Game.cookiesByChoice[0].name=loc(Game.cookiesByChoice[0].name);
				for (var i=1;i<Game.cookiesByChoice.length;i++)
				{
					Game.cookiesByChoice[i].name='"'+Game.cookiesByChoice[i].pic+'"';
				}
			}

			this.achievements.push(new Game.Upgrade('Enchanted Permanent upgrade slot I',"Placing an upgrade in this slot will make its effects <b>permanent</b> across all playthroughs, <b>even in the Unshackled decay challenge mode</b>.<br>In addition, having this upgrade makes you start with <b>0.02</b> less acceleration for the Unshackled decay challenge mode.",	1,[0,0,kaizoCookies.images.custImg]));Game.last.pool='prestige';Game.last.iconFunction=function(){return Game.EnchantedPermanentSlotIcon(0);};Game.last.activateFunction=function(){Game.AssignEnchantedPermanentSlot(0);};
			Game.last.parents = [Game.Upgrades['Starter kit']];
			Game.PrestigeUpgrades.push(Game.last);
			Game.last.posX = -552; Game.last.posY = -384;
			Game.last.showIf=function(){return (decay.challengeStatus(1));};
			this.achievements.push(new Game.Upgrade('Enchanted Permanent upgrade slot II',"Placing an upgrade in this slot will make its effects <b>permanent</b> across all playthroughs, <b>even in the Unshackled decay challenge mode</b>.<br>In addition, having this upgrade makes you start with <b>0.02</b> less acceleration for the Unshackled decay challenge mode.",	200,[1,0,kaizoCookies.images.custImg]));Game.last.pool='prestige';Game.last.iconFunction=function(){return Game.EnchantedPermanentSlotIcon(1);};Game.last.activateFunction=function(){Game.AssignEnchantedPermanentSlot(1);};
			Game.last.parents = [Game.Upgrades['Enchanted Permanent upgrade slot I']];
			Game.PrestigeUpgrades.push(Game.last);
			Game.last.posX = -695; Game.last.posY = -460;
			Game.last.showIf=function(){return (decay.challengeStatus(2));};
			this.achievements.push(new Game.Upgrade('Enchanted Permanent upgrade slot III',"Placing an upgrade in this slot will make its effects <b>permanent</b> across all playthroughs, <b>even in the Unshackled decay challenge mode</b>.<br>In addition, having this upgrade makes you start with <b>0.02</b> less acceleration for the Unshackled decay challenge mode.",	30000,[2,0,kaizoCookies.images.custImg]));Game.last.pool='prestige';Game.last.iconFunction=function(){return Game.EnchantedPermanentSlotIcon(2);};Game.last.activateFunction=function(){Game.AssignEnchantedPermanentSlot(2);};
			Game.last.parents = [Game.Upgrades['Enchanted Permanent upgrade slot II']];
			Game.PrestigeUpgrades.push(Game.last);
			Game.last.posX = -795; Game.last.posY = -581;
			Game.last.showIf=function(){return (decay.challengeStatus(3));};
			this.achievements.push(new Game.Upgrade('Enchanted Permanent upgrade slot IV',"Placing an upgrade in this slot will make its effects <b>permanent</b> across all playthroughs, <b>even in the Unshackled decay challenge mode</b>.<br>In addition, having this upgrade makes you start with <b>0.02</b> less acceleration for the Unshackled decay challenge mode.",	4000000,[3,0,kaizoCookies.images.custImg]));Game.last.pool='prestige';Game.last.iconFunction=function(){return Game.EnchantedPermanentSlotIcon(3);};Game.last.activateFunction=function(){Game.AssignEnchantedPermanentSlot(3);};
			Game.last.parents = [Game.Upgrades['Enchanted Permanent upgrade slot III']];
			Game.PrestigeUpgrades.push(Game.last);
			Game.last.posX = -815; Game.last.posY = -741;
			Game.last.showIf=function(){return (decay.challengeStatus(4));};
			this.achievements.push(new Game.Upgrade('Enchanted Permanent upgrade slot V',"Placing an upgrade in this slot will make its effects <b>permanent</b> across all playthroughs, <b>even in the Unshackled decay challenge mode</b>.<br>In addition, having this upgrade makes you start with <b>0.02</b> less acceleration for the Unshackled decay challenge mode.",	500000000,[4,0,kaizoCookies.images.custImg]));Game.last.pool='prestige';Game.last.iconFunction=function(){return Game.EnchantedPermanentSlotIcon(4);};Game.last.activateFunction=function(){Game.AssignEnchantedPermanentSlot(4);};
			Game.last.parents = [Game.Upgrades['Enchanted Permanent upgrade slot IV']];
			Game.PrestigeUpgrades.push(Game.last);
			Game.last.posX = -773; Game.last.posY = -895;
			Game.last.showIf=function(){return (decay.challengeStatus(5));};
			
			var enchantedSlots=['Enchanted Permanent upgrade slot I','Enchanted Permanent upgrade slot II','Enchanted Permanent upgrade slot III','Enchanted Permanent upgrade slot IV','Enchanted Permanent upgrade slot V'];
			Game.EnchantedPermanentUpgrades=[-1,-1,-1,-1,-1];

			for (var i=0;i<enchantedSlots.length;i++)
			{
				Game.Upgrades[enchantedSlots[i]].descFunc=function(i){return function(context){
					if (Game.EnchantedPermanentUpgrades[i]==-1) return this.desc+(context=='stats'?'':'<br><b>'+loc("Click to activate.")+'</b>');
					var upgrade=Game.UpgradesById[Game.EnchantedPermanentUpgrades[i]];
					return '<div style="text-align:center;">'+loc("Current:")+' '+tinyIcon(upgrade.icon)+' <b>'+upgrade.dname+'</b><div class="line"></div></div>'+this.ddesc+(context=='stats'?'':'<br><b>'+loc("Click to activate.")+'</b>');
				};}(i);
				Game.Upgrades[enchantedSlots[i]].order = 270 + Game.Upgrades[enchantedSlots[i]].id * 0.001;
			}

			Game.EnchantedPermanentSlotIcon=function(slot)
			{
				if (Game.EnchantedPermanentUpgrades[slot]==-1) return [slot,0,kaizoCookies.images.custImg];
				return Game.UpgradesById[Game.EnchantedPermanentUpgrades[slot]].icon;
			}

			Game.AssignEnchantedPermanentSlot=function(slot)
			{
				PlaySound('snd/tick.mp3');
				Game.tooltip.hide();
				var list=[];
				for (var i in Game.Upgrades)
				{
					var me=Game.Upgrades[i];
					if (me.bought && me.unlocked && !me.noPerm && (me.pool=='' || me.pool=='cookie'))
					{
						var fail=0;
						for (var ii in Game.EnchantedPermanentUpgrades) {if (Game.EnchantedPermanentUpgrades[ii]==me.id) fail=1;}//check if not already in another permaslot
						if (!fail) list.push(me);
					}
				}
				
				var sortMap=function(a,b)
				{
					if (a.order>b.order) return 1;
					else if (a.order<b.order) return -1;
					else return 0;
				}
				list.sort(sortMap);
				
				var upgrades='';
				for (var i in list)
				{
					var me=list[i];
					upgrades+=Game.crate(me,'','PlaySound(\'snd/tick.mp3\');Game.PutUpgradeInEnchantedPermanentSlot('+me.id+','+slot+');','upgradeForPermanent'+me.id);
				}
				var upgrade=Game.EnchantedPermanentUpgrades[slot];
				Game.SelectingEnchantedPermanentUpgrade=upgrade;
				Game.Prompt('<id PickPermaUpgrade><h3>'+loc("Pick an upgrade to make permanent")+'</h3>'+
				
							'<div class="line"></div><div style="margin:4px auto;clear:both;width:120px;"><div class="crate upgrade enabled" style="'+writeIcon([slot, 0, kaizoCookies.images.custImg])+'"></div><div id="upgradeToSlotNone" class="crate upgrade enabled" style="'+writeIcon([0, 7])+'display:'+(upgrade!=-1?'none':'block')+';"></div><div id="upgradeToSlotWrap" style="float:left;display:'+(upgrade==-1?'none':'block')+';">'+(Game.crate(Game.UpgradesById[upgrade==-1?0:upgrade],'','','upgradeToSlot'))+'</div></div>'+
							'<div class="block crateBox" style="overflow-y:scroll;float:left;clear:left;width:317px;padding:0px;height:250px;">'+upgrades+'</div>'+
							'<div class="block" style="float:right;width:152px;clear:right;height:234px;">'+loc("Here are all the upgrades you've purchased last playthrough.<div class=\"line\"></div>Pick one to permanently gain its effects!<div class=\"line\"></div>You can reassign this slot anytime you ascend.")+'</div>'
							,[[loc("Confirm"),'Game.EnchantedPermanentUpgrades['+slot+']=Game.SelectingEnchantedPermanentUpgrade;Game.BuildAscendTree();Game.ClosePrompt();'],loc("Cancel")],0,'widePrompt');
			}
			Game.SelectingEnchantedPermanentUpgrade=-1;
			Game.PutUpgradeInEnchantedPermanentSlot=function(upgrade,slot)
			{
				Game.SelectingEnchantedPermanentUpgrade=upgrade;
				l('upgradeToSlotWrap').innerHTML='';
				l('upgradeToSlotWrap').style.display=(upgrade==-1?'none':'block');
				l('upgradeToSlotNone').style.display=(upgrade!=-1?'none':'block');
				l('upgradeToSlotWrap').innerHTML=(Game.crate(Game.UpgradesById[upgrade==-1?0:upgrade],'','','upgradeToSlot'));
			}

			this.achievements.push(new Game.Upgrade('Market manipulator', 'You gain momentum <b>5%</b> slower.<br>You gain <b>x1.0<span></span>5</b> CpS for every <b>x2</b> CpS multiplier from your purity.<q>Inflation? Deflation? No problem! Just call the F23s!</q>', 1000000000000, [24, 2, kaizoCookies.images.custImg])); Game.last.pool = 'prestige';
			Game.last.parents = [Game.Upgrades['Sucralosia Inutilis']];
			Game.PrestigeUpgrades.push(Game.last);
			Game.last.posY = -1468; Game.last.posX = 152;

			decay.offBrandFingers = [];

			this.achievements.push(new Game.Upgrade('Illustrium fingernails', 'Repeated decay halting (such as via rapid clicks) halts decay for up to <b>+15%</b> more time.<br>Clicking halts decay for <b>5%</b> longer.<q>This illustrious metal gleams with a teal-green light. It seems to be especially effective in stabilizing reality.</q>', 1e30, [0, 5, kaizoCookies.images.custImg])); decay.offBrandFingers.push(Game.last);
			this.achievements.push(new Game.Upgrade('Vegetable-oiled joints', 'Repeated decay halting (such as via rapid clicks) halts decay for up to <b>+15%</b> more time.<br>Clicking halts decay for <b>5%</b> longer.<q>Reject chemistry, embrace nature.</q>', 1e36, [0, 6, kaizoCookies.images.custImg])); decay.offBrandFingers.push(Game.last);
			this.achievements.push(new Game.Upgrade('Ultraviolet obliteration', 'Repeated decay halting (such as via rapid clicks) halts decay for up to <b>+15%</b> more time.<br>Clicking halts decay for <b>5%</b> longer.<q>The power of the sun imprinted on my hand...</q>', 1e42, [0, 7, kaizoCookies.images.custImg])); decay.offBrandFingers.push(Game.last);
			this.achievements.push(new Game.Upgrade('Method acting', 'Repeated decay halting (such as via rapid clicks) halts decay for up to <b>+15%</b> more time.<br>Clicking halts decay for <b>5%</b> longer.<q>Oh no, my hands are on fire!</q>', 1e48, [0, 8, kaizoCookies.images.custImg])); decay.offBrandFingers.push(Game.last);
			this.achievements.push(new Game.Upgrade('Sinister glint', 'Repeated decay halting (such as via rapid clicks) halts decay for up to <b>+15%</b> more time.<br>Clicking halts decay for <b>5%</b> longer.<q>...</q>', 1e54, [0, 9, kaizoCookies.images.custImg])); decay.offBrandFingers.push(Game.last);
			this.achievements.push(new Game.Upgrade('Future clicks', 'Repeated decay halting (such as via rapid clicks) halts decay for up to <b>+15%</b> more time.<br>Clicking halts decay for <b>5%</b> longer.<q>In the future, clicking will be eternal.</q>', 1e60, [0, 10, kaizoCookies.images.custImg])); decay.offBrandFingers.push(Game.last);
			this.achievements.push(new Game.Upgrade('Shanzhai glucosium', 'Repeated decay halting (such as via rapid clicks) halts decay for up to <b>+15%</b> more time.<br>Clicking halts decay for <b>5%</b> longer.<q>Despite its off-brand status, it is somehow better than the original. Just for this one.</q>', 1e63, [0, 11, kaizoCookies.images.custImg])); decay.offBrandFingers.push(Game.last);
			for (let i in decay.offBrandFingers) {
				decay.offBrandFingers[i].order = 110 + 0.0001 * decay.offBrandFingers[i].id;
			}

			this.achievements.push(new Game.Upgrade('Vial of challenges', 'Unlocks <b>new challenges</b> for the <b>Unshackled decay</b> challenge mode.<q>Quite concentrated, in fact.</q>', 6e5, [9, 0, kaizoCookies.images.custImg])); Game.last.pool = 'prestige';
			Game.last.parents = [Game.Upgrades['Persistent memory']];
			Game.PrestigeUpgrades.push(Game.last);
			Game.last.posX = 218; Game.last.posY = -115;

			this.achievements.push(new Game.Upgrade('Box of challenges', 'Unlocks <b>new challenges</b> for the <b>Unshackled decay</b> challenge mode.<q>It\'s full of fun!</q>', 6e9, [8, 0, kaizoCookies.images.custImg])); Game.last.pool = 'prestige';
			Game.last.parents = [Game.Upgrades['Shimmering veil']];
			Game.PrestigeUpgrades.push(Game.last);
			Game.last.posX = 72; Game.last.posY = 961;

			this.achievements.push(new Game.Upgrade('Truck of challenges', 'Unlocks <b>new challenges</b> for the <b>Unshackled decay</b> challenge mode.<q>Is a truck really necessary for this...?</q>', 6e13, [10, 0, kaizoCookies.images.custImg])); Game.last.pool = 'prestige';
			Game.last.parents = [Game.Upgrades['Chimera']];
			Game.PrestigeUpgrades.push(Game.last);
			Game.last.posX = 190; Game.last.posY = -1305;

			decay.multiFingers = [];
			this.achievements.push(new Game.Upgrade('Shell breaker', 'Your clicks are <b>15%</b> more effective against wrinklers.<q>Wrinklers have a very hard and resilient shell, but luckily, rapid clicks alongside a sharp tip can help with that!</q>', 1e9, [12, 5, kaizoCookies.images.custImg])); decay.multiFingers.push(Game.last);
			this.achievements.push(new Game.Upgrade('Liquidating touch', 'Your clicks are <b>15%</b> more effective against wrinklers.<q>What? It\'s just bleach.</q>', 1e13, [12, 6, kaizoCookies.images.custImg])); decay.multiFingers.push(Game.last);
			this.achievements.push(new Game.Upgrade('Carbon disintegration', 'Your clicks are <b>15%</b> more effective against wrinklers.', 1e18, [12, 7, kaizoCookies.images.custImg])); decay.multiFingers.push(Game.last);
			this.achievements.push(new Game.Upgrade('Rare earths', 'Your clicks are <b>15%</b> more effective against wrinklers.<q>Wrinklers are allergic to them, apparently. There has not been any conclusive scientific research about this topic.</q>', 1e24, [12, 8, kaizoCookies.images.custImg])); decay.multiFingers.push(Game.last);
			this.achievements.push(new Game.Upgrade('Holy glow', 'Your clicks are <b>15%</b> more effective against wrinklers.<q>Looks... a bit different than I expected.</q>', 1e31, [12, 9, kaizoCookies.images.custImg])); decay.multiFingers.push(Game.last);
			this.achievements.push(new Game.Upgrade('Click flurry', 'Your clicks are <b>15%</b> more effective against wrinklers.<q>Lets you get 1.15 clicks per click!</q>', 1e39, [12, 10, kaizoCookies.images.custImg])); decay.multiFingers.push(Game.last);
			this.achievements.push(new Game.Upgrade('Lunar banishment', 'Your clicks are <b>15%</b> more effective against wrinklers.', 1e48, [12, 11, kaizoCookies.images.custImg])); decay.multiFingers.push(Game.last);
			for (let i in decay.multiFingers) {
				decay.multiFingers[i].order = 120 + 0.0001 * decay.multiFingers[i].id;
			}

			this.achievements.push(new Game.Upgrade('Touch of nature', 'Big cookie clicks have a <b>1%</b> chance to purify a small amount of decay.<q>Within this mouse... is the power to stop your misery!</q>', 1e57, [11, 4, kaizoCookies.images.custImg])); Game.last.order = 160;
			

			this.upgrades = []; //:ortroll:

			decay.purityAchievsReqMap = [];
			decay.purityAchievs = [];
			this.createPurityAchiev = function(name, buildId, iconId, flavor) {
				decay.purityAchievsReqMap.push(1 + (0.5 + 0.1 * buildId + 0.5) * (1 + buildId) / 2);
				decay.purityAchievs.push(new Game.Achievement(name, 'Obtain a CpS multiplier from purity of <b>+'+((50 + 10 * buildId + 50) * (1 + buildId) / 2)+'%</b> or more for at least <b>5 seconds</b>.'+(flavor?'<q>'+flavor+'</q>':''), [iconId, 4, kaizoCookies.images.custImg]));
				decay.purityAchievs[decay.purityAchievs.length - 1].order = 8000 + buildId / 100;
				return decay.purityAchievs[decay.purityAchievs.length - 1];
			}
			this.upgrades = this.upgrades.concat([
				this.createPurityAchiev('You gotta start somewhere', 0, 0),
				this.createPurityAchiev('+110% purity is a lot', 1, 1),
				this.createPurityAchiev('Half life 1.8 CONFIRMED', 2, 2),
				this.createPurityAchiev('P4M: Purified 4 Mines', 3, 3),
				this.createPurityAchiev('5-dimensional Purification Punch', 4, 4),
				this.createPurityAchiev('We couldn\'t afford a 4.5', 5, 15),
				this.createPurityAchiev('Not a luck-related achievement', 6, 16),
				this.createPurityAchiev('90 degrees to NaN', 7, 17, 'Relatable.'),
				this.createPurityAchiev('To a better world', 8, 5, 'Use Sunfall!'),
				this.createPurityAchiev('Consistency obtained', 9, 6),
				this.createPurityAchiev('Gravity of the situation', 10, 7),
				this.createPurityAchiev('The old days were better', 11, 8),
				this.createPurityAchiev('Pretty close to infinity', 12, 13, 'Oh, the AD references? Thought you were talking about the first 8?'),
				this.createPurityAchiev('As bright as a hypernova', 13, 14),
				this.createPurityAchiev('Pure skill', 14, 19, 'Not a luck-related achievement?'),
				this.createPurityAchiev('In filtration', 15, 20),
				this.createPurityAchiev('var decay = undefined', 16, 21),
				this.createPurityAchiev('Third-universe idleverses', 17, 22, 'Does that make me a bad person?'),
				this.createPurityAchiev('Innocence', 18, 23),
				this.createPurityAchiev('Self remade', 19, 24)
			]);
			decay.checkPurityUpgrades = function() { //ultra troll
				if (Game.T % 5 == 0) {
					if (decay.multList.length < 25) { return; }
					for (let i in decay.purityAchievsReqMap) {
						var win = true;
						for (let ii = 0; ii < 50; ii++) {
							if (decay.multList[ii] < decay.purityAchievsReqMap[i]) {
								win = false; break;
							}
						}
						if (win) { Game.Win(decay.purityAchievs[i].name); } else { break; }
					}
				}
				if (decay.gen >= 101) {
					Game.Win('Weak grail material');
				}
			};
			Game.registerHook('logic', decay.checkPurityUpgrades);
			this.upgrades.push(new Game.Achievement('Weak grail material', 'Obtain a CpS multiplier from purity of <b>+10,000%</b> or higher.<q>As the mysterious developer walked onto the stage, surrounded by distraught and hopeless fans, he said, in the most gentle of all voices: "The players will find a way. They will."<br>And thus the crowd quieted down, relieved by the antidote of hope.</q>', [0, 2, kaizoCookies.images.custImg]));
			Game.Achievements['Weak grail material'].order = 70000; Game.Achievements['Weak grail material'].pool = 'shadow';
			let willPurifyDecayStr = '<div class="line"></div>Obtaining this achievement <b>purifies decay</b> by a <b>very large</b> amount.';
			this.upgrades.push(new Game.Achievement('Morale boost', 'Obtain a CpS multiplier from decay of <b>-50%</b> or less.'+willPurifyDecayStr, [3, 1, kaizoCookies.images.custImg])); Game.Achievements['Morale boost'].order = 7500.1;
			this.upgrades.push(new Game.Achievement('Glimmering hope', 'Obtain a CpS multiplier from decay of <b>-99%</b> or less.'+willPurifyDecayStr, [3, 1, kaizoCookies.images.custImg])); Game.Achievements['Glimmering hope'].order = 7500.2;
			this.upgrades.push(new Game.Achievement('Saving grace', 'Obtain a CpS multiplier from decay of <b>-99.99%</b> or less.'+willPurifyDecayStr, [3, 1, kaizoCookies.images.custImg])); Game.Achievements['Saving grace'].order = 7500.3;
			this.upgrades.push(new Game.Achievement('Last chance', 'Obtain a CpS multiplier from decay of <b>1 / 1 quinquinquagintillion</b> or less.'+willPurifyDecayStr, [3, 1, kaizoCookies.images.custImg])); Game.Achievements['Last chance'].order = 7500.4;
			this.upgrades.push(new Game.Achievement('Ultimate death', 'Reach <b>infinite decay</b>.<q>Almost as bad as ascending at 1.</q>', [3, 1, kaizoCookies.images.custImg])); Game.Achievements['Ultimate death'].order = 8080;
			this.upgrades.push(new Game.Achievement('Magmaball effect', 'Reach a decay rates multiplier of at least <b>x3</b> from your momentum.<q>The snowball effect, but bad.</q>', [2, 1, kaizoCookies.images.custImg])); Game.Achievements['Magmaball effect'].order = 7510.1;
			this.upgrades.push(new Game.Achievement('Fast (but you wish it wasn\'t)', 'Reach a decay rates multiplier of at least <b>x6</b> from your momentum.<q>Another one of those at x12!</q>', [2, 1, kaizoCookies.images.custImg])); Game.Achievements['Fast (but you wish it wasn\'t)'].order = 7510.2;
			this.upgrades.push(new Game.Achievement('Unstoppable', 'Reach a decay rates multiplier of at least <b>x12</b> from your momentum.<q>Did you do it via the hard way, or the smart way?</q>', [2, 1, kaizoCookies.images.custImg])); Game.Achievements['Unstoppable'].order = 7510.3;
			this.upgrades.push(new Game.Achievement('Calcium overflow', 'Reach a kitten multiplier of at least +123 trillion% whilst having a CpS multiplier from purity of at least +1234%. ', [11, 4, kaizoCookies.images.custImg])); Game.Achievements['Calcium overflow'].order = 10001;

			this.upgrades.push(new Game.Achievement('First contact', 'Complete a challenge.', [12, 6])); Game.Achievements['First contact'].order = 31000;
			this.upgrades.push(new Game.Achievement('Better, faster, stronger', 'Complete <b>5</b> challenges.', [13, 6])); Game.Achievements['Better, faster, stronger'].order = 31001;
			this.upgrades.push(new Game.Achievement('The olympiad', 'Complete <b>15</b> challenges.', [14, 6])); Game.Achievements['The olympiad'].order = 31002;
			this.upgrades.push(new Game.Achievement('Godhood', 'Complete <b>every</b> challenge.', [14, 6])); Game.Achievements['Godhood'].order = 31100;
			this.upgrades.push(new Game.Achievement('Getting a taste of what\'s to come', 'Complete <b>every</b> challenge from the <b>vial of challenges</b>.', [11, 12, kaizoCookies.images.custImg])); Game.Achievements['Getting a taste of what\'s to come'].order = 31010;
			this.upgrades.push(new Game.Achievement('All boxed up', 'Complete <b>every</b> challenge from the <b>box of challenges</b>.', [12, 12, kaizoCookies.images.custImg])); Game.Achievements['All boxed up'].order = 31011;
			this.upgrades.push(new Game.Achievement('Esoteric world traveler', 'Complete <b>every</b> challenge from the <b>truck of challenges</b>.', [13, 12, kaizoCookies.images.custImg])); Game.Achievements['Esoteric world traveler'].order = 31012;
			this.upgrades.push(new Game.Achievement('Practice makes perfect', 'Complete a repeatable challenge at least <b>3</b> times.', [15, 12, kaizoCookies.images.custImg])); Game.Achievements['Practice makes perfect'].order = 31020;
			this.upgrades.push(new Game.Achievement('Total mastery', 'Complete a repeatable challenge at least <b>6</b> times.', [16, 12, kaizoCookies.images.custImg])); Game.Achievements['Total mastery'].order = 31021;

			this.upgrades.push(new Game.Achievement('Corrupted and tainted', 'Ascend with a purity of at least <b>+2,000%</b>.', [21, 2, kaizoCookies.images.custImg])); Game.Achievements['Corrupted and tainted'].order = 30550;
			eval('Game.Ascend='+Game.Ascend.toString().replace('Game.choiceSelectorOn=-1;', 'Game.choiceSelectorOn=-1; if (decay.gen >= 21) { Game.Win("Corrupted and tainted"); }'));
			this.checkChallengeAchievs = function() {
				const completions = decay.challengeCompleted;
				if (completions>=1) { Game.Win('First contact'); }
				if (completions>=5) { Game.Win('Better, faster, stronger'); }
				if (completions>=15) { Game.Win('The olympiad'); }
				if (completions==decay.totalChallenges) { Game.Win('Godhood'); }
				var bool = true;
				for (let i in decay.challengeCategories.vial) {
					if (!decay.challengeCategories.vial[i].completed) { bool = false; break; }
				}
				if (bool) { Game.Win('Getting a taste of what\'s to come'); }
				bool = true;
				for (let i in decay.challengeCategories.box) {
					if (!decay.challengeCategories.box[i].completed) { bool = false; break; }
				}
				if (bool) { Game.Win('All boxed up'); }
				bool = true;
				for (let i in decay.challengeCategories.truck) {
					if (!decay.challengeCategories.truck[i].completed) { bool = false; break; }
				}
				if (bool) { Game.Win('Esoteric world traveler'); }
				for (let i in decay.repeatableChallenges) {
					if (decay.repeatableChallenges[i].completed>=3) { Game.Win('Practice makes perfect'); }
					if (decay.repeatableChallenges[i].compelted>=6) { Game.Win('Total mastery'); }
				}
			}
			
			LocalizeUpgradesAndAchievs();
	
		}
		this.getThisModAchievs = function() {
			var n = 0;
			for (let i in Game.Achievements) {
				if (Game.Achievements[i].vanilla && Game.Achievements[i].pool == 'normal') { n++; }
			}
			for (let i in this.upgrades) {
				if (this.upgrades[i].pool == 'normal') { n++; }
			}
			return n;
		}
		this.checkAchievements=function(){//Adding the unlock condition
			if (Game.cookiesEarned>=1000000000) { Game.Unlock('Golden sugar'); }
			if (Game.cookiesEarned>=1000000000000000) { Game.Unlock('Caramelized luxury'); }
			if (Game.AchievementsOwned>=400) { Game.Unlock('Meaty disgust'); }
			if (Game.AchievementsOwned>=500) { Game.Unlock('High-fructose sugar lumps'); }
			if (Game.HasAchiev('Sugar sugar')) { Game.Unlock('Rainy day lumps'); }

			if (Game.Has('Cursedor')) { Game.Unlock('Cursedor [inactive]'); }
			
			if (Game.AchievementsOwned>=kaizoCookies.getThisModAchievs()) { Game.Unlock('The ultimate cookie'); }

			if (decay.unlocked) { Game.Unlock('Decayed cookie'); }

			if (Game.Has('Kitten strategists') && Game.HasAchiev('Self remade')) { Game.Unlock('Kitten janitors'); }

			for (let i in decay.offBrandFingers) {
				if (Game.cookiesEarned > decay.offBrandFingers[i].basePrice) { Game.Unlock(decay.offBrandFingers[i].name); }
			}
			for (let i in decay.multiFingers) {
				if (Game.cookiesEarned > decay.multiFingers[i].basePrice) { Game.Unlock(decay.multiFingers[i].name); }
			}

			if (Game.Has('Bakery')) { Game.Unlock('Cookie selector'); }

			if (Game.Has('Purification domes') && Game.HasAchiev('Self remade')) { Game.Unlock('Touch of nature'); }
		}
		if(Game.ready) this.createAchievements()
		else Game.registerHook("create", this.createAchievements)
		Game.registerHook("check", this.checkAchievements)

		this.checkUpgrades = function() {
			if (!decay.unlocked) { return; }
			if (decay.gen < 0.5) { Game.Win('Morale boost'); } 
			if (decay.gen < 0.01) { Game.Win('Glimmering hope'); }
			if (decay.gen < 0.0001) { Game.Win('Saving grace'); }
			var m = decay.TSMultFromMomentum;
			if (decay.gen < 1e-168) { Game.Win('Last chance'); }
			if (m >= 3) { Game.Win('Magmaball effect'); }
			if (m >= 6) { Game.Win('Fast (but you wish it wasn\'t)'); }
			if (m >= 12) { Game.Win('Unstoppable'); }

			if (decay.gen >= 13.34 && Game.cookiesMultByType['kittens'] >= 1.23e+12) { Game.Win('Calcium overflow'); }
		}
		Game.registerHook('check', this.checkUpgrades);

		decay.unlockWrinklerambergris=function(){
			if (!Game.HasUnlocked('Wrinkler ambergris') && Math.random()<1/(me.type==1?1000:10000))
			{
				Game.Unlock('Wrinkler ambergris');
				Game.Notify(`You found Wrinkler ambergris.`,"",[7,2,kaizoCookies.images.custImg],10,1);
			}
		}

		eval('Game.UpdateWrinklers='+Game.UpdateWrinklers.toString().replace("Game.mouseX,Game.mouseY);","Game.mouseX,Game.mouseY); decay.unlockWrinklerambergris()"));

		Game.parseNewLumpUpgrades = function() {
			var hour = 1000*60*60;
			if (Game.Has('Golden sugar')) { Game.lumpMatureAge-=(hour*8); Game.lumpRipeAge-=(hour*8);}
			if (Game.Has('Caramelized luxury')) { Game.lumpMatureAge-=(hour*4); Game.lumpRipeAge-=(hour*4); }
			if (Game.Has('Meaty disgust')) { Game.lumpMatureAge-=(hour*2); Game.lumpRipeAge-=(hour*2); }
			if (Game.Has('High-fructose sugar lumps')) { Game.lumpMatureAge-=(hour*1); Game.lumpRipeAge-=(hour*1); }
		}

		Game.Upgrades['Wrinkler ambergris'].lasting=true;
		decay.unskippableUpgrades.push(Game.Upgrades['Wrinkler ambergris']);
		Game.Achievements['Last Chance to See'].dname = 'First Chance to Suffer'; 
		Game.Achievements["Last Chance to See"].name='First Chance to Suffer';

		Game.EarnSelectedEnchantedPermanentUpgrade=function()
		{
			if (Game.ascensionMode != 1) {
				for (var i in Game.EnchantedPermanentUpgrades)
				{
					if (Game.EnchantedPermanentUpgrades[i]!=-1)
					{Game.UpgradesById[Game.EnchantedPermanentUpgrades[i]].earn();}
				}
			}
		}
		

		        

		Game.registerHook('reset', Game.EarnSelectedEnchantedPermanentUpgrade);

		Game.registerHook('check', this.checkUpgrades);

		Game.cookieType=0;//custom cookie
		eval("Game.DrawBackground="+Game.DrawBackground.toString().replace(`ctx.drawImage(Pic('perfectCookie.png'),x,y,s,s);`,`var pic='perfectCookie.png'; if (Game.cookieType!=0 && Game.ascensionMode!=1) pic=Game.cookiesByChoice[Game.cookieType].pic; ctx.drawImage(Pic(pic),x,y,s,s);`).replace(`ctx.drawImage(Pic('perfectCookie.png'),-s/2,-s/2,s,s);`, `var pic = 'perfectCookie.png'; if (Game.cookieType!=0 && Game.ascensionMode!=1) pic=Game.cookiesByChoice[Game.cookieType].pic; ctx.drawImage(Pic(pic),-s/2,-s/2,s,s);`));
		eval('Game.Reset='+Game.Reset.toString().replace('Game.bgType=0;','Game.bgType=0; Game.cookieType=0; Game.EnchantedPermanentUpgrades=[-1,-1,-1,-1,-1];'));
		
          
		eval('Game.computeLumpTimes='+Game.computeLumpTimes.toString().replace('ipeAge/=2000;}','ipeAge/=2000;} Game.parseNewLumpUpgrades();'));//Adding the effect of the upgrade

		decay.CursedorUses = 0;

		//first number: absolute minimum clicks for that effect to spawn; seoncd number: the mult to click amount needed to gain another entry in the pool
		decay.cursedorThresholdMap = {
			'click frenzy': [60000, 2.5],
			'cursed finger': [5000, 300],
			'blood frenzy': [66666, 6],
			'sugar frenzy': [10000, 10],
			'sugar blessing': [10000, 3],
			'building special': [100000, 5],
			'cookie storm drop': [150, 15],
			'blab': [2500000, 1.05],
			'cookie storm': [10000, 8],
			'clot': [6666, 6],
			'ruin': [6666, 6],
			'everything must go': [200, 25],
			'Nasty goblins': [1000, 1000],
			'Haggler\'s misery': [1000, 1000],
			'Crafty pixies': [2500, 250],
			'Haggler\'s luck': [2500, 250],
			'free sugar lump': [200000, 1.5],
			'dragon harvest': [300000, 2.5],
			'dragonflight': [111111, 11],
			'frenzy': [7500, 7.5],
			'multiply cookies': [7500, 7.5],
			'failure': [100000, 2000]
		}
		decay.getCursedorEffAdd = function(eff, clicks) {
			if (clicks < decay.cursedorThresholdMap[eff][0]) { return 0; }
			return randomFloor(Math.log(clicks / decay.cursedorThresholdMap[eff][0]) / Math.log(decay.cursedorThresholdMap[eff][1]));
		}
		Game.registerHook('click',function() {
			if (Game.Has("Cursedor [inactive]")) {
                decay.CursedorUses++;
				Math.seedrandom(Game.seed+'/'+decay.CursedorUses);
				var pool=[];

				var clicks = Game.cookieClicks;
				clicks *= 5; //must preserve 66666

				for (let i in decay.cursedorThresholdMap) {
					for (let ii = 0; ii < decay.getCursedorEffAdd(i, clicks); ii++) {
						pool.push(i);
					}
				}
				if (pool.length > 0) { 
					var toforce = choose(pool);
				} else {
					var toforce = 'failure';
				}
				if (toforce == 'building special' && Game.BuildingsOwned<10) { toforce = 'failure'; }
				if (toforce == 'click frenzy' && Game.hasBuff('Dragonflight')) { toforce = 'failure'; }
				if (toforce != 'failure') { var newShimmer = new Game.shimmer('golden'); newShimmer.force = toforce; Game.Popup('<div style="font-size:80%;">'+loc("Successful click! Click count reset.")+'</div>',Game.mouseX,Game.mouseY); } else {
					Game.Popup('<div style="font-size:80%;">'+loc("Failed due to not enough clicks! Click count reset.")+'</div>',Game.mouseX,Game.mouseY);
				}
				Game.cookieClicks=0;
				Math.seedrandom();
			}
		});

		Game.registerHook('draw', decay.draw); //removing the east wall to fill the west wall
		decay.setRates();
		if (Game.ready) { Game.compileLowerCasedUpgrades(); Game.compiledLowercasedDragonAuras(); } else { Game.registerHook('create', function() { Game.compileLowerCasedUpgrades(); Game.compiledLowercasedDragonAuras(); }); }

		decay.markPrereqs();

		if (Game.Objects['Wizard tower'].minigameLoaded) { this.reworkGrimoire(); } else { let h = setInterval(() => { kaizoCookies.reworkGrimoire(); if (grimoireUpdated) { clearInterval(h); } }, 10); }
		if (Game.Objects['Farm'].minigameLoaded) { this.reworkGarden(); } else { let h = setInterval(() => { kaizoCookies.reworkGarden(); if (gardenUpdated) { clearInterval(h); } }, 10); }
		if (Game.Objects['Temple'].minigameLoaded) { this.reworkPantheon(); } else { let h = setInterval(() => { kaizoCookies.reworkPantheon(); if (pantheonUpdated) { clearInterval(h); } }, 10); }
		if (Game.Objects['Bank'].minigameLoaded) { this.reworkStock(); } else { let h = setInterval(() => { kaizoCookies.reworkStock(); if (stockUpdated) { clearInterval(h); } }, 10); }
		Game.rebuildAuraCosts();
		decay.checkCovenantModeUnlocks();
		Game.prestige = Game.HowMuchPrestige(Game.cookiesReset);
		Game.normalAchievsN = Game.getNormalAchievsN();
		decay.notifsLoaded = true;
		let allStyles = document.createElement('style');
		allStyles.textContent = cssList;
		cssList = '';
		l('game').appendChild(allStyles);

		for (let i in Game.BankAchievements) {
			this.achievsToBackupSave.push(Game.BankAchievements[i]);
		}
		for (let i in Game.CpsAchievements) {
			this.achievsToBackupSave.push(Game.CpsAchievements[i]);
		}
		for (let i in Game.Objects) {
			for (let ii in Game.Objects[i].productionAchievs) {
				this.achievsToBackupSave.push(Game.Objects[i].productionAchievs[ii].achiev);
			}
		}
		this.achievsToBackupSave.push(Game.Achievements['Speed baking I']);
		this.achievsToBackupSave.push(Game.Achievements['Speed baking II']);
		this.achievsToBackupSave.push(Game.Achievements['Speed baking III']);

		Game.RebuildUpgrades();

		if (Game.cookiesEarned + Game.cookiesReset < 1000) { kaizoWarning = false; }
		allValues('init completion');

		if (this.toLoad) { this.toLoad = false; this.applyLoad(this.loadStr); this.loadStr = ''; }
	},
	save: function(){
        let str = kaizoCookiesVer + '/';
        for(let i of kaizoCookies.achievements) {
          str+=i.unlocked; //using comma works like that in python but not js
          str+=i.bought; //seperating them otherwise it adds 1+1 and not "1"+"1"
        }
		str+='/';
		for (let i = 0; i < 20; i++) {
			str += decay.mults[i]; 
			str += ',';
		}
		str += decay.gen;
		str += '/' + decay.halt + ',' + decay.haltOvertime + ',' + decay.bankedPurification + '/';
		str += Game.pledgeT + ',' + Game.pledgeC;
		str += '/' + Game.veilHP + ',';
		if (Game.Has('Shimmering veil')) {
			if (Game.veilOn()) {
				str += 'on';
			} else if (Game.veilOff()) {
				str += 'off';
			} else if (Game.veilBroken()) {
				str += 'broken';
			}
		}
		str += ',';
		str += Game.veilRestoreC + ',' + Game.veilPreviouslyCollapsed + '/';
		for (let i in decay.prefs.preventNotifs) {
			str += (decay.prefs.preventNotifs[i]?1:0);
		}
		str += '/';
		str += 'h,' + decay.momentum;
        str += '/' + decay.CursedorUses + '/';
		for (let i in decay.times) {
			str += decay.times[i];
			str += ',';
		}
		str = str.slice(0, str.length - 1) + '/';
		for (let i in decay.prefs) {
			if (i != 'preventNotifs') { str += decay.prefs[i]; str += ','; }
		}
		str = str.slice(0, str.length - 1) + '/';
		for (let i in this.upgrades) {
			str += this.upgrades[i].won + ',';
		}
		str = str.slice(0, str.length - 1) + '/';
		str += decay.acceleration + '/';
		for (let i in Game.EnchantedPermanentUpgrades) {
			str += Game.EnchantedPermanentUpgrades[i] + ',';
		}
		str = str.slice(0, str.length - 1) + '/' + Game.TCount + '/';
		for (let i in decay.challenges) {
			str += decay.challenges[i].save() + ',';
		}
		str = str.slice(0, str.length - 1) + '/' + decay.currentConditional + '/' + Game.cookieClicksGlobal;
		str += '/' + Game.saveAllWrinklers() + '/' + decay.power + '/' + decay.timePlayed;
		str += '/' + decay.fatigue + '/' + decay.exhaustion + '/';
		for (let i = 0; i < decay.seFrees.length - 1; i++) { str += decay.seFrees[i] + ','; }
		str += decay.seFrees[decay.seFrees.length - 1];

		str += '/' + decay.getCurrentCovenantMode() + '/' + this.saveBackupStats() + '/' + decay.saveNGMInfo();
        return str;
    },
	loadStr: '',
	toLoad: false,
    load: function(str) {
		//resetting stuff
		this.loadStr = str;
		this.toLoad = true;
		kaizoWarning = false;
	},
	achievsToBackupSave: [],
	saveBackupStats: function() {
		let str = '';
		str += Game.cookiesEarned + '_' + Game.cookies + '_' + Game.lumps + '_' + Game.lumpsTotal + '_';
		for (let i in this.achievsToBackupSave) {
			str += this.achievsToBackupSave[i].won;
		}

		return str;
	},
	loadBackupStats: function(str) {
		let strs = str.split('_');
		if (isv(strs[0])) { Game.cookiesEarned = parseFloat(strs[0]); }
		if (isv(strs[1])) { Game.cookies = parseFloat(strs[1]); }
		if (isv(strs[2])) { Game.lumps = parseFloat(strs[2]); }
		if (isv(strs[3])) { Game.lumpsTotal = parseFloat(strs[3]); }
		if (isv(strs[4])) { for (let i in this.achievsToBackupSave) {
			this.achievsToBackupSave[i].won = parseInt(strs[4][i]);
		} }
	},
	applyLoad: function(str) {
		console.log('Kaizo Cookies loaded. Save string: '+str);
		str = str.split('/'); //results (current ver): [version, upgrades, decay mults, decay halt + overtime + banked purification, pledgeT + pledgeC, veilHP + veil status (on, off, or broken) + veilRestoreC + veilPreviouslyCollapsed, preventNotifs, momentum (this got added too late), cursedorUses, times, prefs (without preventNotifs), achievements, acceleration, enchanted permaslots, TCount, challenges, currentConditional, cookie clicks global, power, timePlayed, fatigue, exhaustion]
		var version = getVer(str[0]);
		for (let i = 0; i < str[1].length; i += 2) { 
           	if (isv(str[1][i])) { kaizoCookies.achievements[i / 2].unlocked=parseInt(str[1][i]); }
           	if (isv(str[1][i + 1])) { kaizoCookies.achievements[i / 2].bought=parseInt(str[1][i + 1]); }
		}
		var strIn = str[2].split(',');
		for (let i in strIn) {
			if (isv(strIn[i])) { decay.mults[i] = parseFloat(strIn[i]); }
		}
		allValues('load; upgrades and decay basic');
		if (isv(strIn[20])) { decay.gen = parseFloat(strIn[20]); }
		
		strIn = str[3].split(',');
		if (isv(strIn[0])) { decay.halt = parseFloat(strIn[0]); }
		if (isv(strIn[1])) { decay.haltOvertime = parseFloat(strIn[1]); }
		if (isv(strIn[2])) { decay.bankedPurification = parseFloat(strIn[2]); }
			
		strIn = str[4].split(',');
		if (isv(strIn[0])) { Game.pledgeT = parseFloat(strIn[0]); } else { Game.pledgeT = 0; }
		if (isv(strIn[1])) { Game.pledgeC = parseFloat(strIn[1]); }
		if (Game.pledgeT > 0 || Game.pledgeC > 0) { Game.Upgrades['Elder Pledge'].bought = 1; } else { Game.Upgrades['Elder Pledge'].bought = 0; }
		if (Game.pledgeC > 0) {
			Game.Upgrades["Elder Pledge"].icon[0] = 6; Game.Upgrades["Elder Pledge"].icon[1] = 3; Game.Upgrades["Elder Pledge"].icon[2] = kaizoCookies.images.custImg;
		}
		
		strIn = str[5].split(',');
		allValues('load; pledge and halt');
		if (isv(strIn[0])) { Game.veilHP = parseFloat(strIn[0]); }
		
		if (Game.Has('Shimmering veil')) { 
			Game.setVeilMaxHP();
			if (strIn[1] == 'on') {
				Game.Upgrades['Shimmering veil [off]'].earn();
				Game.Lock('Shimmering veil [on]'); Game.Unlock('Shimmering veil [on]'); 
				Game.Lock('Shimmering veil [broken]');
			} else if (strIn[1] == 'off') {
				Game.Upgrades['Shimmering veil [on]'].earn();
				Game.Lock('Shimmering veil [off]'); Game.Unlock('Shimmering veil [off]'); 
				Game.Upgrades['Shimmering veil [broken]'].unlocked = 0;
			} else if (strIn[1] == 'broken'){
				Game.Lock('Shimmering veil [on]'); Game.Lock('Shimmering veil [off]');
				Game.Upgrades['Shimmering veil [broken]'].earn();
			} else {
				Game.Upgrades['Shimmering veil [on]'].earn();
				Game.Lock('Shimmering veil [off]'); Game.Unlock('Shimmering veil [off]'); 
				Game.Upgrades['Shimmering veil [broken]'].unlocked = 0;
				console.log('veil: something went wrong');
			}
		}
		if (isv(strIn[2])) { Game.veilRestoreC = parseFloat(strIn[2]); }
		if (isv(strIn[3])) { Game.veilPreviouslyCollapsed = Boolean(strIn[3]); }
   		
		allValues('load; veil');
		var counter = 0;
		strIn = str[6];
		for (let i in decay.prefs.preventNotifs) {
			if (isv(strIn[counter])) { decay.prefs.preventNotifs[i] = Boolean(parseInt(strIn[counter])); if (parseInt(strIn[counter])) { decay.hasEncounteredNotif = true; }}
			counter++;
		}
		strIn = str[7].split(',');
		if (isv(strIn[1])) { decay.momentum = parseFloat(strIn[1]); }
        if (isv(str[8])) { decay.CursedorUses = parseInt(str[8]); }
		strIn = str[9].split(',');
		counter = 0;
		for (let i in decay.times) {
			if (isv(strIn[counter])) { decay.times[i] = parseInt(strIn[counter]); }
			counter++;
		}
		strIn = str[10].split(',');
		counter = 0;
		
		for (let i in decay.prefs) {
			if (isv(strIn[counter]) && i != 'preventNotifs') { decay.prefs[i] = parseInt(strIn[counter]); }
			if (i != 'preventNotifs') { counter++; }
		}
		
		strIn = str[11].split(',');
		for (let i = 0; i < strIn.length; i++) {
			if (isv(strIn[i])) { kaizoCookies.upgrades[i].won = strIn[i]; }
		}
		Game.recalcAchievCount();
		
		strIn = str[12];
		if (isv(strIn)) { decay.acceleration = parseFloat(strIn); }

		strIn = str[13].split(',');
		for (let i in Game.EnchantedPermanentUpgrades) {
			if (isv(strIn[i])) { Game.EnchantedPermanentUpgrades[i] = parseFloat(strIn[i]); }
		}

		strIn = str[14];
		if (isv(strIn)) { Game.TCount = parseFloat(strIn); }

		strIn = str[15].split(',');
		counter = 0;
		for (let i in decay.challenges) {
			if (isv(strIn[counter])) { decay.challenges[i].load(strIn[counter]); }
			counter++;
		}

		if (typeof str[16] !== 'undefined') {
			if (str[16] == 'null') { decay.currentConditional = null; } else { decay.currentConditional = str[16]; }
		}
		decay.checkChallengeUnlocks();
		decay.getCompletionCount();
		decay.checkRotation();
		if (decay.currentConditional && decay.challenges[decay.currentConditional].init) { decay.challenges[decay.currentConditional].init(); }

		strIn = str[17];
		if (isv(strIn)) { Game.cookieClicksGlobal = parseFloat(strIn); if (Game.cookieClicksGlobal > decay.cookieClicksTotalNGM) { decay.cookieClicksTotalNGM = Game.cookieClicksGlobal; }}

		Game.loadAllWrinklers(str[18]);

		strIn = str[19];
		if (isv(strIn)) { decay.power = parseFloat(strIn); }

		strIn = str[20];
		if (isv(strIn)) { decay.timePlayed = parseFloat(strIn); }

		strIn = str[21];
		if (isv(strIn)) { decay.fatigue = parseFloat(strIn); }

		strIn = str[22];
		if (isv(strIn)) { decay.exhaustion = parseFloat(strIn); }

		strIn = str[23].split(',');
		for (let i in strIn) {
			if (isv(strIn[i])) { decay.seFrees[i] = parseFloat(strIn[i]); Game.ObjectsById[i].getFree(decay.seFrees[i]); }
		}

		strIn = str[24];
		if (isv(strIn) && strIn != 'NA') {
			decay.covenantModes[strIn].upgrade.unlocked = 1;
			decay.covenantModes[strIn].upgrade.bought = 0;
		}

		strIn = str[25];
		if (isv(strIn)) {
			this.loadBackupStats(strIn);
		}

		decay.loadNGMInfo(str[26]);
		
    	Game.storeToRefresh=1;

		decay.setRates();
		decay.assignThreshold();
		Game.killShimmers();
		Game.RebuildUpgrades();
		allValues('load completion');
    }
});
