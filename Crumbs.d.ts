declare global { declare namespace Crumbs {
    declare namespace h {
        export function injectCSS(str: string): void;
        export function resolveInjects(): void;
        export function inRect(x: number, y: number, t: { w: number, h: number, x: number, y: number }): boolean;
        export function inRectOld(x: number, y: number, rect: { w: number, h: number, x: number, y: number }): boolean;
        export function inOval(x: number, y: number, rx: number, ry: number, ox: number, oy: number, r: number): boolean;
        /**
         * Rotates a vector
         * @param r rotation in radian
         * @param x x of vector
         * @param y y of vector
         * @returns array of two numbers representing new vector
         */
        export function rv(r: number, x: number, y: number): [number, number];
        export function isTouchDevice(): boolean;
        /**
         * Call to update functions cached in event listeners, such as Game.ClickCookie
         */
        export function rebuildBigCookieButton(): void;
        export function patchCtx(ctx: CanvasRenderingContext2D): void;
        /**
         * Fills pattern
         * @param ctx canvas
         * @param img source image
         * @param w width
         * @param h height
         * @param dx real x
         * @param dy real y
         * @param dw real width (total)
         * @param dh real height (total)
         * @param sx x in image
         * @param sy y in image
         * @param sw width crop
         * @param sh height crop
         * @param offx in-image offset
         * @param offy in-image offset
         */
        export function fillPattern(ctx: CanvasRenderingContext2D, img: HTMLImageElement | HTMLCanvasElement, w: number, h: number, dx: number, dy: number, dw: number, dh: number, sx: number, sy: number, sw: number, sh: number, offx: number, offy: number): void;
        /**
         * Finds a point by a central angle theta on an arbitrary ellipse
         * @param cx ellipse center x
         * @param cy ellipse center y
         * @param rx x-axis radii
         * @param ry y-axis radii
         * @param rotation ellipse rotation
         * @param theta central angle
         */
        export function pointOnRotatedEllipse(cx: number, cy: number, rx: number, ry: number, rotation: number, theta: number): [number, number];
    }
    declare namespace prefs {
        export let object: Object;
        export let particles: Object;
        /**
         * Displays anchors; default: 0
         */
        export let anchorDisplay: 0 | 1;
        /**
         * Displays colliders from pointerInteractives and tooltip components in real time; default: 0
         */
        export let colliderDisplay: 0 | 1;
        /**
         * Default: 1
         */
		export let warnDuplicateComponents: 0 | 1;
    }
    export interface canvas {
        l: HTMLCanvasElement;
        c: CanvasRenderingContext2D;
        key: string;
        shaders: any[];
        background: string;
        redrawPerFrame: boolean;
        boundingClientRect: DOMRect;
        mouseX: number;
        mouseY: number;
        left: number;
        top: number;
        objects: Crumbs.object[];
        sortedObjects: Crumbs.object[];
        setSelf(): void;
        getShader(type: string): any;
        getAllShaders(type: string): any[];
        addShader(shader: any, index?: number): void;
    }
    export let canvas: {
        new(parentEle: HTMLElement, key: string, id: any, css: undefined | string): canvas;
    }
    export interface anchor {
        x: number;
        y: number;
    }
    export let anchor: {
        new(x: number, y: number): anchor;
    }
    export let objects: Object<string, Crumbs.canvas[]>;
    export let sortedObjectList: Object<string, Crumbs.canvas[]>;
    export interface object {
        enabled: boolean;
        parent: null | Crumbs.object;
        x: number;
        y: number;
        scaleX: number;
        scaleY: number;
        /**
         * Clockwise, in radian
         */
        rotation: number;
        alpha: number;
        /**
         * To set subpositions in images, use sx and sy; imgUsing determines which image is currently active
         */
        imgs: string[];
        imgUsing: number;
        scope: Crumbs.canvas;
        anchor: Crumbs.anchor;
        /**
         * Called immediately after object creation
         * If an object, the properties of the object are copied over
         * The this keyword refers to the object itself if function is inputted
         */
        init: Function | object | null;
        /**
         * All will be converted into Crumbs.behaviorInstance instances
         */
        behaviors: (Crumbs.behaviorInstance | Crumbs.behavior | Partial<Function>)[];
        /**
         * Default: null
         * Recommend being strings
         */
        id: any;
        /**
         * Higher number = being drawn on top
         */
        order: number;
        /**
         * If not specified, the object will be drawn based on the dimensions of the pic provided;
         * If specified, the object will be drawn on the width provided instead
         * Can be used in combination with sx and sy to crop the image
         */
        width: number | null;
        /**
         * If not specified, the object will be drawn based on the dimensions of the pic provided;
         * If specified, the object will be drawn on the height provided instead
         * Can be used in combination with sx and sy to crop the image
         */
        height: number | null;
        /**
         * x, but rotation changes the effect (rotates at the point where offsetX == 0 as a pivot); does not propagate to children and are purely visual
         */
        offsetX: number;
        /**
         * y, but rotation changes the effect (rotates at the point where offsetX == 0 as a pivot); does not propagate to children and are purely visual
         */
        offsetY: number;
        /**
         * Default: 0
         * coordinates in-image to draw (unless width and height are specified, setting this does nothing)
         */
        sx: number;
        /**
         * Default: 0
         * coordinates in-image to draw (unless width and height are specified, setting this does nothing)
        */
        sy: number;
        components: (Crumbs.component.rect | Crumbs.component.path | Crumbs.component.settings | Crumbs.component.text | Crumbs.component.tCounter | Crumbs.component.patternFill | Crumbs.component.canvasManipulator | Crumbs.component.pointerInteractive | Crumbs.component.linearFade | Crumbs.component.tooltip)[];
        /**
         * All logic still runs if this is true
         */
        noDraw: boolean;
        children: Crumbs.object[];
        set(o: Object): void;
        getInfo(): object;
        commenceInit(): void;
        /**
         * Removes the object from the game
         */
        die(): void;
        /**
         * Spawns a Crumbs object as its child
         * @param template Javascript object defining the properties of the object, usually a reused object with the base parameters
         * @param custom Javascript object defining any additional properties on top of the template, can override template properties
         */
        spawnChild(template: Object, custom?: Object): object;
        /**
         * Spawns a Crumbs object as its child, only while the game is being observed
         * @param template Javascript object defining the properties of the object, usually a reused object with the base parameters
         * @param custom Javascript object defining any additional properties on top of the template, can override template properties
         */
        spawnChildVisible(template: Object, custom?: Object): object | undefined;
        hasChildren(): boolean;
        removeChild(index: number): void;
        addComponent(comp: (Crumbs.component.rect | Crumbs.component.path | Crumbs.component.settings | Crumbs.component.text | Crumbs.component.tCounter | Crumbs.component.patternFill | Crumbs.component.canvasManipulator | Crumbs.component.pointerInteractive | Crumbs.component.linearFade | Crumbs.component.tooltip)): void;
        removeComponent(type: string): any;
        /**
         * Gets a reference to the component type present on the object
         * @param type the name of the component (will only return the first one if multiple are found)
         */
        getComponent(type: string): any;
        /**
         * Gets references to all components of the type on the object
         * @param type the name of the component
         */
        getAllComponents(type: string): any[];
        addBehavior(behavior: Function | Crumbs.behavior): void;
        reorder(at: number): void;
        triggerBehavior(): void;
        updateChildren(): void;
        findChild(id: any): object | null;
        getChildren(id?: any): object[];
        compile(): object[];
        recursiveCompile(): object[];
        /**
         * Gets the x position of the object after all calculations are complete (only excludes offsetX and offsetY)
         */
        getTrueX(): number;
        /**
         * Gets the y position of the object after all calculations are complete (only excludes offsetX and offsetY)
         */
        getTrueY(): number;
        /**
         * Gets the rotation of the object as it is drawn on canvas
         */
        getTrueRotation(): number;
        /**
         * Sets a new anchor to the object
         * @param anchor the anchor
         */
        setAnchor(anchor: string | Crumbs.anchor): void;

        [key: string]: any;
    }
    export let object: {
        new(obj: Partial<Crumbs.object>, parent?: Crumbs.object): Crumbs.object;
    }
    export let behaviorSym: symbol;
    export let initSym: symbol;
    export interface behavior {
        [Crumbs.behaviorSym]: Function;
        init?: Function | Object;
        [Crumbs.initSym]?: Function;
        /**
         * Injects code by replacing code
         * @param original original code
         * @param newCode new code to replace
         */
        replace(original: string, newCode: string): this;
        /**
         * Injects code at a line in the function
         * @param line the line (0-indexed, counts the function declaration itself)
         * @param code code to inject
         */
        inject(line: number, code: string): this;
    }
    export let behavior: {
        /**
         * Defines a behavior
         * @param func the function that is called each frame, where the "this" keyword refers to the object itself, and the behavior instance object containing the private properties are passed into it as the first argument
         * @param init default private properties
         */
        new(func: (this: Crumbs.object, instance?: Crumbs.behaviorInstance) => void, init?: Object): behavior;
    }
    export interface behaviorInstance {
        [Crumbs.behaviorSym]: Crumbs.behavior;
        reset(): void;
        /**
         * Gets the behavior that this instance is instantiated from
         */
        getBehavior(): Crumbs.behavior;

        [key: string]: any;
    }
    export let behaviorInstance: {
        /**
         * Instantiates an instance of a behavior
         * @param b the behavior
         * @param init Initialize private properties on top of the default ones, can override
         */
        new(b: ((this: Crumbs.object, instance?: behaviorInstance) => void) | Crumbs.behavior, init?: Object): behaviorInstance;
    }
    export let particles: Object<string, Crumbs.particle[]>;
    export interface particle {
        x: number;
        y: number;
        /**
         * Clockwise, in radian
         */
        rotation: number;
        alpha: number;
        width: number;
        height: number;
        sx: number;
        sy: number;
        /**
         * In frames; to convert from seconds multiply by Game.fps
         */
        life: number;
        init?: Function;
        behavior?: Function;
        reusePool?: Crumbs.particle[];
        obj: Object;
        scope: Crumbs.particle[];
        /**
         * Removes the particle from the game
         */
        die(): void;
        update(): void;
    }
    /**
     * Creates a new reuse pool; should be put into the reusePool property of particle templates
     */
    export function newReusePool(): Array<Crumbs.particle>;
    export let particle: {
        new(obj: Partial<Crumbs.particle>, x: number, y: number, r: number, a: number, scope: string | Crumbs.canvas): particle;
    }
    export let objectDefaults: Object;
    export namespace component {
        export interface rect {
            enabled: boolean;
            color: string;
            outline: number;
            outlineColor: string;
        }
        export let rect: {
            new(obj: Partial<rect>): rect;
        }
        /**
         * @deprecated
         */
        export interface path {
            enabled: boolean;
            paths: any[];
            cx: number;
            cy: number;
        }
        export let path: {
            new(obj: Partial<path>): path;
        }
        export interface settings {
            enabled: boolean;
            obj: {
                globalCompositeOperation?: GlobalCompositeOperation;
                filter?: string;
                imageSmoothingEnabled?: boolean;
                imageSmoothingQuality?: ImageSmoothingQuality;
            };
        }
        export let settings: {
            new(obj: Partial<settings>): settings;
        }
        export interface text {
            enabled: boolean;
            content: string;
            size: number;
            font: string;
            align: CanvasTextAlign;
            direction: CanvasDirection;
            color: string;
            outlineColor: string;
            outline: number;
            maxWidth: number | null;
        }
        export let text: {
            new(obj: Partial<text>): text;
        }
        export interface tCounter {
            enabled: boolean;
            /**
             * A function that is called every logic frame.
             * The `this` context and the first argument are the parent Crumbs object.
             * The return value is added to the object's internal `tCount` property.
             */
            function: ((this: Crumbs.object, m: Crumbs.object) => number) | null;
        }
        export let tCounter: {
            new(obj: Partial<tCounter>): tCounter;
        }
        export interface patternFill {
            enabled: boolean;
            width: number;
            height: number;
            offX: number;
            offY: number;
            dWidth: number | null;
            dHeight: number | null;
            sWidth: number | null;
            sHeight: number | null;
            sx: number | null;
            sy: number | null;
        }
        export let patternFill: {
            new(obj: Partial<patternFill>): patternFill;
        }
        export interface canvasManipulator {
            enabled: boolean;
            /**
             * A function to manipulate the canvas context *after* the parent object and its children have been drawn.
             * @param m the parent object.
             * @param ctx the canvas rendering context.
             */
            function: ((m: Crumbs.object, ctx: CanvasRenderingContext2D) => void) | null;
            /**
             * A function to manipulate the canvas context *before* the parent object and its children have been drawn.
             * @param m the parent object.
             * @param ctx the canvas rendering context.
             */
            before: ((m: Crumbs.object, ctx: CanvasRenderingContext2D) => void) | null;
        }
        export let canvasManipulator: {
            new(obj: Partial<canvasManipulator>): canvasManipulator;
        }
        export interface pointerInteractive {
            enabled: boolean;
             /**
             * Function called when the object is clicked. `this` refers to the object.
             */
            onClick: (this: Crumbs.object) => void;
             /**
             * Function called when a click on the object is released. `this` refers to the object.
             */
            onRelease: (this: Crumbs.object) => void;
             /**
             * Function called when the mouse pointer enters the object's bounds. `this` refers to the object.
             */
            onMouseover: (this: Crumbs.object) => void;
             /**
             * Function called when the mouse pointer leaves the object's bounds. `this` refers to the object.
             */
            onMouseout: (this: Crumbs.object) => void;
            alwaysInteractable: boolean;
            boundingType: string | Crumbs.colliderType;
        }
        export let pointerInteractive: {
            new(obj: Partial<pointerInteractive>): pointerInteractive;
        }
        export interface linearFade {
            enabled: boolean;
            progress: number;
            distance: number;
            sliceWidth: number;
            horizontal: boolean;
            flip: boolean;
            initialAlpha: number | null;
            finalAlpha: number | null;
            cutOff: boolean;
        }
        export let linearFade: {
            new(obj: Partial<linearFade>): linearFade;
        }
        export interface tooltip {
            enabled: boolean;
            /**
             * The content to display in the tooltip.
             * If a function, `this` refers to the object and the first argument is the component instance. It should return the string to display.
             */
            content: string | ((this: Crumbs.object, c: Crumbs.component.tooltip) => string);
            origin: string;
            crate: boolean;
            alwaysInteractable: boolean;
            hideOnClick: boolean;
            boundingType: string | Crumbs.colliderType;
        }
        export let tooltip: {
            new(obj: Partial<tooltip>): tooltip;
        }
    }
    export let colliderTypes: {[key: string]: Crumbs.colliderType};
    export interface colliderType {
        checkFunc: (s: Crumbs.canvas, m: Crumbs.object, pWidth: number, pHeight: number) => boolean;
        key?: string;
    }
    export let colliderType: {
        new(func: (s: Crumbs.canvas, m: Crumbs.object, pWidth: number, pHeight: number) => boolean, str: string): colliderType;
    }
    export interface objectBehaviors {
        [key: string]: any;
    }
    export const objectBehaviors: objectBehaviors;

    export let version: string;
    export let h: typeof Crumbs.h;
    export let imagesToManip: { [key: string]: any[] };
    /**
     * Amount of time that has passed in frames; saved per run and never resets
     */
    export let t: number;
    export let validScopes: string[];
    export let nonQuickSettable: string[];
    export let nonValidProperties: string[];
    export let allProperties: string[];
    export let defaultAnchors: { [key: string]: Crumbs.anchor };
    export let sleepDetectionBuffer: number;
    export let unfocusedSpawn: boolean;
    export let lastUpdate: number;
    export let defaultPathConfigs: { [key: string]: any };
    export let validPathConfigs: string[];
    export let validPathFuncs: string[];
    export let subPathsLogic: { [key: string]: Function };
    export let shader: typeof Crumbs.shader;
    export let shaderDefaults: typeof Crumbs.shaderDefaults;
    export let preloads: string[];
    export let preloadRequired: boolean;
    export let pointerHold: boolean;
    export let onCrate: Crumbs.object | null;
    export let tooltipRegister: HTMLDivElement;
    export let dynamicTooltipFunction: Function;
    export let reusePools: Crumbs.particle[][];

    /**
     * Spawns a Crumbs object
     * @param template Javascript object defining the properties of the object, usually a reused object with the base parameters
     * @param custom Javascript object defining any additional properties on top of the template, can override template properties
     */
    export function spawn(template: Object, custom?: Object): Crumbs.object;
    /**
     * Spawns a Crumbs object, only while the game is being observed
     * @param template Javascript object defining the properties of the object, usually a reused object with the base parameters
     * @param custom Javascript object defining any additional properties on top of the template, can override template properties
     */
    export function spawnVisible(template: Object, custom?: Object): Crumbs.object | false;
    /**
     * Spawns a Crumbs particle
     * @param template Javascript object defining the properties of the particle
     * @param x x position
     * @param y y position
     * @param r rotation (in radian)
     * @param a alpha/opacity
     * @param scope the string key of the scope (canvas) it is in
     */
    export function spawnParticle(template: Object, x: number, y: number, r: number, a: number, scope: string): Crumbs.particle;
    /**
     * Manipulates an image, including cropping and/or applying images
     * @param old Key of the image in Loader (usually the url)
     * @param newPropertyName New key (can be the old, in which case the image is replaced)
     * @param width width to draw to scale the image (assuming drawCallback is not defined)
     * @param height height to draw to scale the image (assuming drawCallback is not defined)
     * @param filters CSS filters
     * @param drawCallback function that lets you draw the image yourself
     */
    export function manipImage(old: string, newPropertyName: string, width?: number, height?: number, filters?: string, drawCallback?: (ctx: CanvasRenderingContext2D, img: HTMLImageElement, canvas: HTMLCanvasElement) => void): void;
    /**
     * Finds the first object with the given id and returns it; returns null if not found
     * @param id the id of the object you want to find
     * @param scope the canvas it is found in; if not specified, searches all canvases
     */
    export function findObject(id: any, scope?: Crumbs.canvas | string): Crumbs.object | null;
    /**
     * Finds all objects with the given id and returns them all
     * @param id the id of the objects you want to find
     * @param scopes the canvases it is found in; if not specified, searches all canvases
     */
    export function getObjects(id: any, scopes?: Crumbs.canvas | string | string[]): Crumbs.object[];
    /**
     * Returns the x offset due to the anchor
     * @param anchor anchor
     * @param width width of the object post-scaling
     */
    export function getOffsetX(anchor: Crumbs.anchor, width: number): number;
    /**
     * Returns the y offset due to the anchor
     * @param anchor anchor
     * @param height height of the object post-scaling
     */
    export function getOffsetY(anchor: Crumbs.anchor, height: number): number;
    /**
     * Gets the width post-scaling
     * @param o the Crumbs object
     */
    export function getPWidth(o: Crumbs.object): number;
    /**
     * Gets the height post-scaling
     * @param o the Crumbs object
     */
    export function getPHeight(o: Crumbs.object): number;
    export function updateCanvas(): void;
    export function getCanvasByScope(s: string): Crumbs.canvas;
    export function globalSearch(id: any): Crumbs.object[];
    export function killAllObjects(): void;
    export function reorderAllObjects(): void;
    export function updateObjects(): void;
    export function compileObjects(s: string): Crumbs.object[];
    export function merge(arr: Crumbs.object[], left: number, middle: number, right: number): Crumbs.object[];
    export function mergeSort(arr: Crumbs.object[], left: number, right: number): Crumbs.object[];
    export function drawAnchorDisplay(o: Crumbs.object, ctx: CanvasRenderingContext2D): void;
    export function manipLoadedImg(old: string, newPropertyName: string, width?: number, height?: number, filters?: string, drawCallback?: (ctx: CanvasRenderingContext2D, img: HTMLImageElement, canvas: HTMLCanvasElement) => void): void;
    export function iterateObject(o: Crumbs.object, ctx: CanvasRenderingContext2D): void;
    /**
     * Draws an object onto some canvas
     * @param o the object to be drawn
     * @param ctx the canvas
     * @param callback any additional operations
     */
    export function forceDrawObject(o: Crumbs.object, ctx: CanvasRenderingContext2D, callback?: (this: Crumbs.object, ctx: CanvasRenderingContext2D) => void): void;
    /**
     * Sets up drawing translations, rotations, and others according to an object
     * @param o object
     * @param ctx canvas
     */
    export function setupContext(o: Crumbs.object, ctx: CanvasRenderingContext2D): void;
    export function drawPure(o: Crumbs.object, ctx: CanvasRenderingContext2D, callback?: (this: Crumbs.object, ctx: CanvasRenderingContext2D) => void): void;
    export function drawObjects(): void;
    export function drawObjectsIn(scope: string): void;
} 
declare namespace CrumbsEngineModObj {
    export function init(): void;
    export function header(): void;
    export function loadBridge(id: string, order: number): void;
    export function loadAllViableBridges(): void;
    export function declareBridgeLoaded(): void;

    export let bridgesSource: string;
    export let bridges: { [key: string]: [string | null, string | null] };
    export let bridgesToLoad: number;
    export let bridgesLoaded: number;
    export let bridgesPendingCoreReady: Array;

    export let ready: boolean;
    export let coreReady: boolean;
    export function setReady(): void;

    export function save(): string;
    export function load(str: string): void;
}
export let CrumbsEngineLoaded: boolean; 
/**
 * Loads assets locally, namely Implementation.js and bridgesList.json
 */
export let crumbs_load_local: undefined | boolean;
/**
 * Will not fetch bridges and will keep default bridges as defined in Crumbs.js
 */
export let crumbs_nofetch_bridges: undefined | boolean;
}
export {};