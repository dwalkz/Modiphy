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
    filter: "pixelate",
    method: "quick",
    divisor: 50
});
```
This code will replace the image element with a canvas (keeping the same id/class attributes in place) and will pixelate the image using the Quick method and a divisor of 50. 

The above line can also be rewritten as ` filtered = new Modiphy(img) ` since the options used are already default. 

After a Modiphy object has been created, you can change any options and recreate it.
``` js
filtered.render({
   method: "average",
   divisor: 100
});
```

## Options
The options that can be passed to Modiphy are as follows:
``` 
filter:     (string)    Currently "pixelate" is the only option but we're looking into adding 
                        blurs, color shifts, glitches, and many other styles.
        
method:     (string)    Combined with pixelate, there's two methods available:
                        "quick"   - (default) Uses a fast, cheap algorithm to pixelate without looking 
                        at all pixels in a new block.
                        "average" - Averages all RGB values in a block to get mathematically accurate
                        pixelation but takes more time to complete
                    
divisor:    (int)       Defaults to 50. For the pixelate filter, the width and height gets
                        divided by this number to determine the block sizes. E.x. a square
                        image of 500px by 500px and a divisor of 50 means each new pixel block
                        will be 10px by 10px. Higher divisor == more detailed pixels
            
debug:      (boolean)   Defaults to false. Specifies whether verbose output should be output
                        to the console
```
