# Crumbs Engine

Crumbs Engine allows you to easily manipulate and change canvas-based elements, including any that were present in vanilla. Traditionally, canvas elements are created through large functions that redraw the canvas every frame based on various factors, making them clunky to edit and difficult to mod. Crumbs Engine solves this by abstracting much of that complexity away, leaving the user with core functionalities designed for creating more content.

## Integration
Load the mod with `Game.LoadMod('https://cursedsliver.github.io/Crumbs-engine/Crumbs.js');`.

If you wish to have this as a strict prerequisite, consider forcing your users to load this mod before yours (in the case of Steam) or wrap the rest of your code in a function to wait until this mod loads completely before calling it. You'll know when it is loaded completely when the global variable `CrumbsEngineLoaded` becomes `true`.

---

## Object

### Class: `Crumbs.object`

The core of the mod’s functionality, an object is exactly what it sounds like.

---

### Instantiation

Instantiate a `Crumbs.object` with the function `Crumbs.spawn(template, custom)`. Pass in an object into `template`, and (optionally) pass in another into `custom`. 
- Every property of the passed-in object in `template` will be copied over to the new object.  
- Then, every property of the passed-in object in `custom`, if there is one, will be copied over to the new object.
- Essentially, you can create a "template" for your Crumbs objects by creating an object and assigning it to another variable, then specify details for each object you want to create with that template.
- You can use `Crumbs.spawnVisible(template, custom)` to have it only spawn the object when the game is being looked at.
- You can also use `Crumbs.object.prototype.die()` to remove the object from the game.
- For any properties that aren’t specified in either object, defaults are taken from `Crumbs.objectDefaults`.

---

## Properties

| Property   | Type      | Default | Description |
|------------|-----------|---------|-------------|
| `enabled`  | boolean   | false   | If false, the object will not be drawn or updated, including its behaviors and components. |
| `x`        | number    | 0       | The x-coordinate of the object. |
| `y`        | number    | 0       | The y-coordinate of the object. |
| `rotation` | number    | 0       | The rotation of the object, clockwise in radians. |
| `scaleX`   | number    | 1       | Scaling multiplier on the x-direction. |
| `scaleY`   | number    | 1       | Scaling multiplier on the y-direction. |
| `alpha`    | number    | 1       | The opacity of the image drawn (between 0 and 1 inclusive). |
| `imgs`     | array/string | [0x0 empty image] | The images of the object. Can be a string or an array of them. If it is not one, it will be automatically converted to arrays. |
| `imgUsing` | number    | 0       | The image currently displayed, out of all the images listed in `imgs`. |
| `noDraw`   | boolean   | false   | Prevents the object from being drawn, but its behaviors and components still function. |
| `offsetX`  | number    | 0       | Offsets the image drawn by that amount on the x axis, which also rotates with its rotation. |
| `offsetY`  | number    | 0       | Like `offsetX`, but on the y axis. |
| `anchor`   | string/`Crumbs.anchor` <br>instance    | "center"/<br>`Crumbs.defaultAnchors.center` | The location of its position on the image. Values: “top-left”, “top”, “top-right”, “left”, “center”, “right”, “bottom-left”, “bottom”, “bottom-right”, or custom by creating custom Crumbs.anchor instances (instructions detailed below). |
| `scope`    | string/`Crumbs.canvas` <br>instance    | "foreground"/<br>`Crumbs.scopedCanvas.foreground` | Which canvas to draw it on, represented by its key in `Crumbs.scopedCanvas`. <br>Defaults available: “left”, “middle”, “right”, “background”, “foreground” (but you can create your own canvases). |
| `order`    | number    | 0       | The order in which to draw the object (acts as the z-index). |
| `width`    | number/null | null  | If assigned, overrides the width from the image. |
| `height`   | number/null | null  | If assigned, overrides the height from the image. |
| `sx`       | number    | 0       | The x-coordinate of the top-left corner of the rectangle to draw the image provided. |
| `sy`       | number    | 0       | The y-coordinate of the top-left corner of the rectangle to draw the image provided. |
| `id`       | any       | null    | An identifier of the object. Can be used to find objects via `Crumbs.findObject`, `Crumbs.getObjects`, `Crumbs.object.prototype.findChild`, and `Crumbs.object.prototype.getChildren`. |
| `init`     | function  | empty   | A function to be called on object initialization, with `this` being the object. |
| `behaviors`| array/function/<br>`Crumbs.behavior`/<br>`Crumbs.behaviorInstance`<br>instance(s) | [] | Instances of `Crumbs.behaviorInstance`, containing a function called every logic frame. Non-arrays are converted to arrays. |
| `components`| array/component | [] | Instances of objects listed in `Crumbs.component`. Non-arrays are converted to arrays. |
| `children` | array     | []      | Child objects to create upon initialization. Not stored in the resulting object; converted to an array of children `Crumbs.object` instead. |
| `t`        | number    |         | Cannot be set on object initialization. The moment when the object is created, relative to `Crumbs.t`. You can thus get the lifespan of the object in terms of frames by doing `Crumbs.t - object.t`. |
| `parent`   | Crumbs.object/null | | Cannot be set on object initialization. The parent object, or null if it is not a child. |

---

## Behaviors

- **Behaviors** are instances of `Crumbs.behaviorInstance`, containing a function called every logic frame with `this` set to the object and an object passed in for local variables.
- `Crumbs.behaviorInstance(behavior, parameters)`  
    - `behavior`: An instance of `Crumbs.behavior`, containing a function called every frame.
        - To create a `Crumbs.behavior`, simply pass in a function for `new Crumbs.behavior`.
    - `parameters` (optional): An object passed into the function on every call, and is only accessible and modifiable to the function.
    - Note: if you don't need custom behavior parameters per object, place these in templates. Place as `Crumbs.behavior` if `parameters` is needed, otherwise put as `Crumbs.behaviorInstance`.
    - If you do need custom behavior parameters, override behavior in `custom` with new `Crumbs.behaviorInstance` from behaviors assigned to variables.
    - Try not to put your functions directly in your object.
- If not an array, it will be converted into one.

---

## Images

- You can declare images in the `img` property. 
- Access and change them with the `imgUsing` property.
- If you place them in templates, MAKE SURE to ALWAYS wrap them in arrays, even if there's only one element!

---

## Children

- Child objects can be created upon initialization or for existing objects via `Crumbs.object.prototype.spawnChild(template, custom)` or `Crumbs.object.prototype.spawnChildVisible(template, custom)`.
- Children inherit the coordinate plane and rotation of their parent, and also scale with them. You can nest children in children to create more complex effects.

-- 

## Methods & Helpers

Crumbs Engine contains many helper methods to help you find, manipulate, and do more stuff.

### `Crumbs.object.prototype` methods

| Method         | Description         |
|----------------|---------------------|
| `hasChildren()` | Returns `true` if the object has any children, otherwise `false`. |
| `removeChild(index)` | Removes the child at the specified index by setting it to `null`. Note: Children arrays are not automatically cleaned, so manage them carefully. |
| `addComponent(comp)` | Adds a component to the object, and calls the component's `init` method if it exists. |
| `removeComponent(type)` | Removes the first component of the specified type from the object and returns it; returns `null` if not found. |
| `getComponent(type)` | Returns the first component of the specified type attached to the object, or `null` if not found. |
| `getAllComponents(type)` | Returns an array of all components of the specified type attached to the object. |
| `addBehavior(behavior)` | Adds a behavior to the object. Accepts a `Crumbs.behavior`, `Crumbs.behaviorInstance`, or a function. |
| `findChild(id)` | Recursively searches for a child (or descendant) with the specified `id` and returns it. Returns `null` if not found. |
| `getChildren(id)` | Returns an array of all direct children, or all children (and descendants) with the specified `id` if provided. |
| `die()` | Removes the object from the game. |
| `spawnChild(template, custom)` | Instantiates a child object using the given template and custom properties, and attaches it as a child of the current object. |
| `spawnChildVisible(template, custom)` | Instantiates a child object using the given template and custom properties, and attaches it as a child of the current object, if the game is currently being viewed. |

### Global methods

| Method         | Description         |
|----------------|---------------------|
| `Crumbs.findObject(id, scope)` | Returns the first object with the specified `id`. If `scope` is provided, searches only within that canvas scope. Returns `null` if not found. |
| `Crumbs.getObjects(id, scopes)` | Returns an array of all objects with the specified `id`. If `scopes` is provided (string or array), searches only within those scopes. |
| `Crumbs.globalSearch(id)` | Returns an array of all objects and their descendants with the specified `id` across all scopes. Not recommended for frequent use due to performance. |
| `Crumbs.forceDrawObject(o, ctx)` | Forcibly draws the object `o` on that context, ignoring `components`, `noDraw`, and `children`. |
| `Crumbs.manipImage(old, newPropertyName, width, height, filters, drawCallback)` | Creates a new copy of an image at `Game.Loader.assets[newPropertyName]` with new width and height (scaling), optional css filters, and an optional callback that overrides the drawing step. Set `old` and `newPropertyName` to be the same to enable direct application. |

---

## Canvas Scopes & Custom Canvases

Available canvas scopes in `Crumbs.scopedCanvas`:

- **left**: The leftmost section of the game, containing the big cookie.
- **middle**: The rows of building displays, containing the minigames.
- **right**: The store.
- **background**: The background of the entire game.
- **foreground**: A canvas overlaid on top of the entire game.

You can create a new canvas by doing `new Crumbs.canvas(parentEle, key, id, css)`.
- `parentEle`: Parent element to attach the canvas to. The canvas will assume 100% of the parent's width and height.
- `key`: Its key in `Crumbs.scopedCanvas`.
- `id`: ID of the canvas itself (not the canvas container).
- `css`: Optional CSS.

Other properties of each `scopedCanvas`:
- `l`: the element of the canvas.
- `c`: `l.getContext('2d')`.
- `objects`: array of objects.
- `sortedObjects`: objects sorted by draw order; used by components such as `pointerInteractive`.
- `mouseX`: the x position of the mouse in its coordinate system.
- `mouseY`: the y position of the mouse in its coordinate system.
- `redrawPerFrame`: whether to redraw the canvas each frame, default: `true`. To manually redraw a canvas, do `Crumbs.drawObjectsIn(scope)`.

---

## Custom anchors

You can create your own anchors by assigning something to a new instance of `Crumbs.anchor`. It takes two parameters:
- x: The amount of distance to the right compared to the width of the object of the anchor, starting from the top left.
- y: The amount of distance downward compared to the height of the object of the anchor, starting from the top left.
- For example, Crumbs.defaultAnchors.center has x and y set to 0.5 each.
- Note that you can set them to any value you like, including numbers bigger than 1 and smaller than 0.
- Helpful tip: You can see the anchors of objects by setting `Crumbs.prefs.anchorDisplay` to 1.

---

## Notable Components

- To create a new component, use `new Crumbs.component[component key](obj)`.
- Attach the component to the component key either by itself or in an array with other components.
- Components can be used for more complex behaviors, such as cursor interaction, draw settings, pattern fill, text, and more.
- You can disable the warnings for having multiple of the same component on an object with `Crumbs.prefs.warnDuplicateComponents`.

### `Crumbs.component.pointerInteractive`
- Handles interaction with the mouse, allowing for hover detection and click detection.
- Always maximally fits the width and height of the object it's attached to.
- The `this` keyword refers to the object that it's attached to.
- Helpful tip: You can see the collider boxes of objects with this component by setting `Crumbs.prefs.colliderDisplay` to 1.
#### `pointerInteractive` Component Properties

| Property            | Type     | Default   | Description                                                                 |
|---------------------|----------|-----------|-----------------------------------------------------------------------------|
| `enabled`           | boolean  | true      | Whether the component is active and can interact with pointer events.       |
| `onClick`           | function | empty     | Function called when the object is clicked down.                            |
| `onRelease`         | function | empty     | Function called when the mouse button is released over the object.          |
| `onMouseover`       | function | empty     | Function called when the mouse enters the object's area.                    |
| `onMouseout`        | function | empty     | Function called when the mouse leaves the object's area.                    |
| `alwaysInteractable`| boolean  | false     | If true, the object is interactable even if another object with a pointerInteractive component is drawn above it. |
| `boundingType`      | string   | 'rect' or <br>Crumbs.colliderType    | The shape used for hit detection.                  |

### Custom bounding boxes
- You can create your own bounding boxes with `new Crumbs.colliderType(func)`. Pass in a function that determines whether or not a given position is in the box.
- The function has the following arguments passed into it as individual arguments:
  - `s`: scope of the object it's attached to
  - `m`: the object
  - `pWidth`: the width of the object in pixels, accounting for scaling (so you don't have to calculate that yourself)
  - `pHeight`: the height of the object in pixels, accounting for scaling
- You can also pass in a string alongside the function to have it as its name. Once set, you will be able to have instantiations using the string as its bounding type convert the string into its corresponding collider.
- There are two default boundingTypes available: `rect` and `oval`. You can pass in `'rect'` or `'oval'` to specify them.

### `Crumbs.component.canvasManipulator`
- Gives raw control over the canvas, with drawing operations centered on the object itself (discounting offsetX and offsetY).
- The `this` keyword refers to the component object itself, not the object it's attached to.
- Be careful! Make sure that you have an equal amount of `ctx.save();` and `ctx.restore();` in each canvasManipulator, otherwise things will break horribly.
#### `canvasManipulator` Component Properties

| Property   | Type     | Default | Description                                                                                 |
|------------|----------|---------|---------------------------------------------------------------------------------------------|
| `enabled`  | boolean  | true    | Whether the canvasManipulator component is active.                                           |
| `function` | function | empty   | Function called with the object (`m`) and the canvas context (`ctx`) for custom drawing.     |
| `before` | function | empty   | Function called with the object (`m`) and the canvas context (`ctx`) for custom drawing, with the difference that this is called right before the object is drawn.     |

### `Crumbs.component.text`
- Displays text on the origins of the object.
- Inherits most of its properties from canvas itself.
#### `text` Component Properties

| Property       | Type     | Default        | Description                                                                 |
|----------------|----------|---------------|-----------------------------------------------------------------------------|
| `enabled`      | boolean  | true          | Whether the text component is active and displayed.                         |
| `content`      | string   | ''            | The text content to display.                                                |
| `size`         | number   | 10            | Font size in pixels.                                                        |
| `font`         | string   | 'Merriweather'| Font family used for the text.                                              |
| `align`        | string   | 'left'        | Text alignment. Possible values: 'left', 'center', 'right'.                 |
| `direction`    | string   | 'inherit'     | Text direction. Usually 'inherit', 'ltr', or 'rtl'.                         |
| `color`        | string   | '#fff'        | Text color (CSS color value).                                               |
| `outlineColor` | string   | '#000'        | Outline color for the text (CSS color value).                               |
| `outline`      | number   | 0             | Outline thickness in pixels.                                                |
| `maxWidth`     | number/null | null       | Maximum width of the text box in pixels. If null, no limit is applied.      |

### `Crumbs.component.settings`
- Adjusts global canvas drawing properties for this object.
- Inherits all of its properties from canvas itself.
#### `settings` Component Properties

| Property                  | Type      | Default   | Description                                                                                   |
|---------------------------|-----------|-----------|-----------------------------------------------------------------------------------------------|
| `enabled`  | boolean | true    | Whether the setting changes are active.                                                          |
| `globalCompositeOperation`| string    | 'source-over' | Sets how new drawings are composited onto the existing canvas. See [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation) for options. |
| `filter` | string   | ''      | Adds filters to the draw. See [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/filter) for options. Will lag, ues in moderation. Not available in all browsers. If the shader parameters do not need to be changed often during runtime, consider using `Crumbs.manipImage(old, newPropertyName, width, height, filters, drawCallback)` instead. |
| `imageSmoothingEnabled`   | boolean   | true      | Enables or disables image smoothing when scaling images.                                       |
| `imageSmoothingQuality`   | string    | 'low'     | Sets the quality of image smoothing. Possible values: 'low', 'medium', 'high'.                |

### `Crumbs.component.patternFill`
- Fills the image of the object across some width and length in a grid pattern.
#### `patternFill` Component Properties

| Property   | Type    | Default | Description                                                                                  |
|------------|---------|---------|----------------------------------------------------------------------------------------------|
| `enabled`  | boolean | true    | Whether the pattern fill is active.                                                          |
| `width`    | number  | 2       | Number of minimum pixels to fill by repeating the image horizontally.                        |
| `height`   | number  | 2       | Number of minimum pixels to fill by repeating the image vertically.                          |
| `offX`     | number  | 0       | Horizontal offset (in pixels) for the pattern's starting position.                           |
| `offY`     | number  | 0       | Vertical offset (in pixels) for the pattern's starting position.                             |
| `dWidth`   | number/null | null | Destination width for each pattern tile. If null, uses the image's width.                    |
| `dHeight`  | number/null | null | Destination height for each pattern tile. If null, uses the image's height.                  |
| `sWidth`   | number/null | null | Source width from the image to use for each tile. If null, uses the full image width.        |
| `sHeight`  | number/null | null | Source height from the image to use for each tile. If null, uses the full image height.      |
| `sx`       | number/null | null | X-coordinate of the top-left corner of the source rectangle. If null, starts at 0.           |
| `sy`       | number/null | null | Y-coordinate of the top-left corner of the source rectangle. If null, starts at 0.           |

### `Crumbs.component.linearFade`
- Adds a gradual fading effect onto the object.
#### `linearFade` Component Properties

| Property        | Type     | Default | Description                                                                                      |
|-----------------|----------|---------|--------------------------------------------------------------------------------------------------|
| `enabled`       | boolean  | true    | Whether the linear fade effect is active.                                                        |
| `progress`      | number   | 1       | Midpoint of the fade effect (0 to 1).                                                            |
| `distance`      | number   | 30      | Total distance of the fade in pixels; scales with the object.                                    |
| `sliceWidth`    | number   | 3       | Width in pixels between each redraw slice.                                                       |
| `horizontal`    | boolean  | false   | If true, the fade is applied horizontally; otherwise, it is vertical.                            |
| `flip`          | boolean  | false   | If true, reverses the fade direction.                                                     |
| `initialAlpha`  | number/null | null | Starting opacity for the fade. If null, uses the object's base opacity.                          |
| `finalAlpha`    | number/null | null | Ending opacity for the fade. If null, defaults to 0 (fully transparent).                         |
| `cutOff`        | boolean  | false   | If true, will no longer draw the section before the gradient begins (will not affect the gradient itself)                 |

### `Crumbs.component.tooltip`
- Makes the object display a tooltip when it is hovered over.
#### `tooltip` Component Properties

| Property            | Type                | Default   | Description                                                                                      |
|---------------------|---------------------|-----------|--------------------------------------------------------------------------------------------------|
| `enabled`           | boolean             | true      | Whether the tooltip component is active and displayed.                                           |
| `content`           | string/function     | ''        | The tooltip text to display, or a function returning the text (for dynamic tooltips). The function will have the component itself as an argument, and use `this` to access the attached object.  |
| `origin`            | string              | 'middle'  | The origin point for the tooltip display. Valid values: `left`,   `middle`, `bottom-right`, `bottom`, `this`, `store`. If the tooltip has crate enabled, all values other than `left` do the same thing. |
| `crate`             | boolean             | false     | If true, tooltip is fixed on the object; if false, follows the mouse.                            |
| `alwaysInteractable`| boolean             | false     | If true, tooltip is interactable even if another object is above it.                             |
| `hideOnClick`       | boolean             | false     | If true, hides the tooltip when the left mouse button is held down.                                           |
| `boundingType`      | string or <br>Crumbs.colliderType | 'rect'     | The collider type used for hit detection (default is rectangle).                                 |

---

## Example

```js
const myBehavior = new Crumbs.behavior(function(p) { 
    this.x += 10 / Game.fps;
    this.y -= p.rate;
    p.rate += 1 / Game.fps;
}, { rate: 0 })
const myObject = Crumbs.spawn({
    x: 100,
    y: 200,
    scaleX: 3,
    scaleY: 2,
    imgs: "glint.png",
    behaviors: [new Crumbs.behaviorInstance(myBehavior)],
    components: [new Crumbs.component.settings({ globalCompositeOperation: 'lighter' })]
});
```

---

## Particles

A particle is a simplified version of `Crumbs.object` that uses less memory and less computing power, but with reduced functionality. They are always drawn on top of all objects and does not support drawing order, components, or stacking images and behaviors. Declare a particle with `Crumbs.spawnParticle(template, x, y, r, a, scope);`, where:
- template: detailed in table below;
- x: x position;
- y: y position;
- r: rotation; 
- a: alpha (opacity);
- scope: same as scope in regular objects.

### Particle Template Properties

| Property     | Type      | Default           | Description                                                                 |
|--------------|-----------|-------------------|-----------------------------------------------------------------------------|
| `width`      | number    | 1                 | Width of the particle.                                                      |
| `height`     | number    | 1                 | Height of the particle.                                                     |
| `img`        | string    | (empty)           | Image used for the particle (optional).                                     |
| `life`       | number    | `2 * Game.fps`    | Lifespan of the particle in frames.                                         |
| `init`       | function  | null              | Function called on particle initialization.                                 |
| `behavior`   | function  | null              | Function called every frame for custom particle logic.                      |
| `reusePool`  | array     | null              | Pool for reusing particle instances (optional, for optimization); see below.|

## `reusePool` instructions

To use it, assign `Crumbs.newReusePool()` to it in the template (never place the object declaration directly in `Crumbs.spawnParticle`!), which will register it and automatically pull from the pool over creating new objects. The pool is cleaned once every 120 seconds. You can do `Crumbs.prunePool(pool)` to clean any pool of your choice.

---

## Vanilla Implementation

Almost all vanilla elements that rely on canvas (with the exception of building displays) are converted into Crumbs Engine objects. You can access them with `Crumbs.findObject(id, scope)` or `Crumbs.getObjects(id, scope)` and modify them as you wish.
- You can also easily modify all instances of a behavior with `Crumbs.behavior.prototype.replace(original, newCode)` or `Crumbs.behavior.prototype.inject(line, code)`, and find their corresponding behavior from their behaviorInstance with `Crumbs.behaviorInstance.prototype.getBehavior()`.
- For more details on how they are implemented and their IDs, refer to [Implementation.js](https://github.com/CursedSliver/Crumbs-engine/blob/main/Implementation.js).

---

For more details, refer to the [source code](https://github.com/CursedSliver/Crumbs-engine/blob/main/Crumbs.js).
