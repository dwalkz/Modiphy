# Modiphy
What began as an educational exercise in manipulating pixel data in the HTML5 canvas, I'm now turning into a full fledged Image Manipulation Library.

Current functionality is limited only to pixelating an image into square pixels, but I'm planning on releasing updates to use differently shaped pixels (square, diamond, circle, triangle, hexagonal), create different filters (blur, color shifts, inverse, swirl, "glitch", and more)

My hope is to turn this into a relatively light-weight image manipulation library that can be used to provide on-the-fly pure javascript based image filters and show off some of the theoretical capabilities of the Canvas API for editing pixel data.

## Minimum Usage
``` js
var img = document.getElementById("imgElem");
var mod = new Modiphy(img);
```
Simple as that!
 
## Example Code
This script works on any _same domain image_. This restriction is due to HTML5 Canvas restrictions on cross-domain content and using getImageData. You can read the spec [here](http://dev.w3.org/html5/spec/the-canvas-element.html#security-with-canvas-elements).

Use the library by grabbing your image element and creating a new Modiphy object with it
``` html
<img id='image1' src='/images/mountains.png' />
```
``` js
//Ensure the image has loaded using addEventListener or some other method before attempting to Modiphy it
var img = document.getElementById("image1");
var filtered = new Modiphy(img, {
    filter: "pixel",
    method: "quick",
    shape: "square"
    divisor: 50,
    debug: false
});
```
This code will replace the image element with a canvas (keeping the same id/class attributes in place) and will pixelate the image using the Quick method, dividing the image into 50 even rectangles on width and height and output the new pixels as squares.

The above line can also be rewritten as ` filtered = new Modiphy(img) ` since the options used are the defaults. 

After a Modiphy object has been created, you can change options and recreate it. The below line will reset the image back to the original input and then re-run the method for pixelation to use the Average and divide into 100 even pixels instead of 50.
``` js
filtered.resetModiphications().render({
    method: "average",
    divisor: 100
});
```
If `resetModiphications()` is not run before another render, then modifications happen in place. This allows us to "stack" filters on top of each other like `filtered.render({filter: "grayscale"}).render({filter: "pixel"})` in order to turn the image to black and white and then pixelate it!
## Options
The options that can be passed to Modiphy are as follows:

| param | type | default | description |
|---|---|---|---|
|filter| `string` |`"posterize"` | The type of filter to use |
|method| `string` | `"quick"` | The algorithm used in processing the image. |
|divisor|`int`| `50` | For pixel filter, determines size of output pixels |
|shape|`string`| `"square"` |For pixel filter, the shape of the output pixels.|
|decompose|`string`| `"maximum"` |For grayscale decompose method, whether to decompose the maximum or minimum |
|levels|`int`| `8` |For posterize filter, the number of allowed colors per channel.|
|grouping|`int`| `20` |For glitch filter, the number of rows to be shifted per direction.|
|debug|`boolean`| `false` | Whether verbose output should be logged to the console.|

Currently, the following filter options are supported.

####Pixelate
Pixelates an image similar to Photoshop's Pixelate filter

|parameter|values|
|---|---|
|`filter`|`"pixel"`|
|`method`|`"quick", "average"`|
|`divisor`|`Any number greater than 1.`|
|`shape`| `"square", "circle", "diamond", "hex"`|
Though, keep in mind that more complicated shapes (those not built in to the canvas API by default) may take longer to render. This is something I'd like to improve on, but it is what it is for the moment.

####Grayscale
Convert an image to black and white using various methods for differing results and artistic effects.

|parameter|values|
|---|---|
|`filter`|`"grayscale"`|
|`method`|`"average", "lightness", "luminosity", "decompose"`|
|`decompose`|`"maximum", "minimum"`|
|`shape`| `"square", "circle", "diamond"`|
####Posterize
Similar to Photoshop's posterize filter or the effect that happens when saving an image like a .gif with a lower number of colors. Limit the available colors to an image to give it an old-school poster like effect.

|parameter|values|
|---|---|
|`filter`|`posterize`|
|`levels`|`Any positive number.`|
####Glitch
Alternatingly shift horizontal rows of pixels left and right to create interesting "glitch" effects

|parameter|values|
|---|---|
|`filter`|`glitch`|
|`grouping`|`Any positive number.`|