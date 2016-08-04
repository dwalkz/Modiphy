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
    filter: {
        name: "pixel",
        method: "quick",
        shape: "square"
        divisor: 50
    },
    debug: false
});
```
This code will replace the image element with a canvas (keeping the same id/class attributes in place) and will pixelate the image using the Quick method, dividing the image into 50 even rectangles on width and height and output the new pixels as squares.

The above line can also be rewritten as ` filtered = new Modiphy(img) ` since the options used are the defaults. 

After a Modiphy object has been created, you can change options in place and recreate it. The below line will change the method for pixelation to use the Average and divide into 100 even pixels instead of 50.
``` js
filtered.render({
    filter: {
        method: "average",
        divisor: 100
    }
});
```

## Options
The options that can be passed to Modiphy are as follows:
``` 
filter:     (object)    An object which carries information about the method to be used
        {
            name:   (string)    The type of filter to use.
            method: (string)    The algorithm used in processing the image. 
            divisor:(int)       For pixel filter, determines size of output pixels
            shape:  (string)    For pixel filter, the shape of the output pixels. 
        }
        
debug:      (boolean)   Defaults to false. Specifies whether verbose output should be output
                        to the console
```

Currently, the following filter options are supported.
```
name: "pixel"   Pixelates the image in a number of different ways
   method: 
        "quick"         (default) A quick and dirty way which simply chooses the center pixel 
                        of a given block and uses that as the color. Looks accurate but processes
                        much faster than other methods
        "average"       A more mathematically accurate algorithm which calculates the average RGB 
                        values for each pixel in the block. Takes more processing time, but if 
                        you need an accurate pixelate, this will be your go-to.
                        
   divisor:     The number of even divisions an image will be pixelated into. Defaults to 50 
                so, for example, a 500x500 image would by default be tiled into 10x10 "pixels"
   shape:       The shape of the output pixels. By default, this is squares, but "circle" and 
                "diamond" options are also supported. Working on more options for this, like a 
                hexagon output, or triangular output.
                
name: "grayscale"   Just like it says on the tin. Different methods for grayscaling.
    method:
        "average"       The quick and dirty way to grayscale by averaging the RGB channels of
                        each pixel. Easiest, but can tend to lose contrast.
        "lightness"     A.k.a desaturation. Another method that keeps contrast better.
        "luminosity"    A more "photo-realistic" algorithm that accounts for the fact
                        that humans perceive Green more readily than Red or Blue.
        "decompose"     De-composition involves setting each pixel to either the Max or Min 
                        of the individial RGB channels. Usually used for artistic effect. This
                        method to be used in conjuction with the filter.decompose setting descibed below
    decompose:  
        "maximum"       When method is "decompose" this will use Maximum Decomposition
        "minimum"       (default) this will use Minimum Decomposition 
```
