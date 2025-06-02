# Crumbs Engine

Crumbs Engine allows you to easily manipulate and change canvas-based elements, including any that were present in vanilla. Traditionally, canvas elements are created through large functions that redraw the canvas every frame based on various factors, making them clunky to edit and difficult to mod. Crumbs Engine solves this by abstracting much of that complexity away, leaving the user with core functionalities designed for creating more content.

## Integration
Load the mod with `Game.LoadMod('https://cursedsliver.github.io/Crumbs-engine/Crumbs.js');`.

If you wish to have this as a strict prerequisite, consider forcing your users to load this mod before yours (in the case of steam) or wrap the rest of your code in a function to wait until this mod loads completely before calling it. You'll know when it is loaded completely when the global variable `CrumbsEngineLoaded` becomes `true`.

---

## Object

### Class: `Crumbs.object`

The core of the mod’s functionality, an object is exactly what it sounds like.

---

### Instantiation

Instantiate a `Crumbs.object` by passing an object into the function `Crumbs.spawn` that contains the parameters for the new object. Every property of the passed-in object will be copied over to the new object.  
For any properties that aren’t specified, defaults are taken from `Crumbs.objectDefaults`.

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
| `imgs`     | array/string | [0x0 empty image] | The images of the object. Can be a string or an array of strings. Strings are automatically converted to arrays. |
| `imgUsing` | number    | 0       | The image currently displayed, out of all the images listed in `imgs`. |
| `noDraw`   | boolean   | false   | Prevents the object from being drawn, but its behaviors and components still function. |
| `offsetX`  | number    | 0       | Offset the image drawn by that amount on the x axis, which also rotates with its rotation. |
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
    - `parameters` (optional): An object passed into the function on every call and can be modified by the function.
- If not an array, it will be converted into one.

---

## Children

- Child objects can be created upon initialization or for existing objects via `Crumbs.object.prototype.spawnChild`.
- Children inherit the coordinate plane and rotation of their parent, and also scales with them. You can nest children in children to create more complex effects.

---

## Canvas Scopes & Custom Canvases

Available canvas scopes in `Crumbs.scopedCanvas`:

- **left**: The leftmost section of the game, containing the big cookie.
- **middle**: The rows of building displays, containing the minigames.
- **right**: The store.
- **background**: The background of the entire game.
- **foreground**: A canvas overlayed on top of the entire game.

You can create a new canvas by doing `new Crumbs.canvas(parentEle, key, id, css)`.
- `parentEle`: parent element to attach the canvas to. The canvas will assume 100% of the parent's width and height.
- `key`: its key in `Crumbs.scopedCanvas`.
- `id`: id of the canvas itself (not the canvas container)
- `css`: optional CSS

---

## Custom anchors

You can create your own anchors by assigning something to a new instance of Crumbs.anchor. It takes two parameters:
- x: the amount of distance to the right compared to the width of the object of the anchor, starting from top left 
- y: the amount of distance downward compared to the height of the object of the anchor, starting from top left
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
- Helpful tip: You can see the collider boxes of objects with this component by setting `Crumbs.prefs.colliderDisplay` to 1.
#### `pointerInteractive` Component Properties

| Property            | Type     | Default   | Description                                                                 |
|---------------------|----------|-----------|-----------------------------------------------------------------------------|
| `enabled`           | boolean  | true      | Whether the component is active and can interact with pointer events.       |
| `onClick`           | function | empty     | Function called when the object is clicked down.                                 |
| `onRelease`         | function | empty     | Function called when the mouse button is released over the object.          |
| `onMouseover`       | function | empty     | Function called when the mouse enters the object's area.                    |
| `onMouseout`        | function | empty     | Function called when the mouse leaves the object's area.                    |
| `alwaysInteractable`| boolean  | false     | If true, the object is interactable even if another object with a pointerInteractive component is drawn above it
| `boundingType`      | string   | 'rect'/'oval'    | The shape used for hit detection                  |

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
| `imageSmoothingEnabled`   | boolean   | true      | Enables or disables image smoothing when scaling images.                                       |
| `imageSmoothingQuality`   | string    | 'low'     | Sets the quality of image smoothing. Possible values: 'low', 'medium', 'high'.                |

### `Crumbs.component.patternFill`
- Fills the image of the object across some width and length in a grid pattern.
#### `patternFill` Component Properties

| Property   | Type    | Default | Description                                                                                  |
|------------|---------|---------|----------------------------------------------------------------------------------------------|
| `enabled`  | boolean | true    | Whether the pattern fill is active.                                                          |
| `width`    | number  | 2       | Number of minimum pixels to fill by repeating the image horizontally.                                            |
| `height`   | number  | 2       | Number of minimum pixels to fill by repeating the image vertically.                                          |
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
| `progress`      | number   | 1       | Midpoint of the fade effect (0 to 1).                                                            |
| `distance`      | number   | 30      | Total distance of the fade in pixels; scales with the object.                                    |
| `sliceWidth`    | number   | 3       | Width in pixels between each redraw slice.                                                       |
| `horizontal`    | boolean  | false   | If true, the fade is applied horizontally; otherwise, it is vertical.                            |
| `initialAlpha`  | number/null | null | Starting opacity for the fade. If null, uses the object's base opacity.                          |
| `finalAlpha`    | number/null | null | Ending opacity for the fade. If null, defaults to 0 (fully transparent).                         |
| `enabled`       | boolean  | true    | Whether the linear fade effect is active.                                                        |

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

For more details, refer to the [source code](https://github.com/CursedSliver/Crumbs-engine/blob/main/Crumbs.js).
