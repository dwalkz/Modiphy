# Mozaiker
An educational exercise in javascript to test capabilities of image data manipulation

I simply attempted this because I had the idea for an algorithm to copy the  "mosaic tile" filter found in popular image editing programs like Photoshop and Gimp. The idea is that these filters break an image into discrete tiles and use a dominant color in that tile. In this way, an image with less tiles will be less detailed and the more tiles you have, the more detailed you get. 

The algorithm takes any image input by a user and breaks it into even tiles based on a slider input. It will then find an average RGB value for the pixels in that block and then set the block to that average value and redraw it on an HTML5 canvas on the fly. 

As of first versioning, tiling a large image (1600x1200 72dpi) into 200 even tiles takes about 1.5 seconds on average, but several improvements to this are in the works. At some point, I plan on abstracting these features into an image manipulation library that can be used to duplicate various other features, perhaps like blurring, cartoonizing, edge detection, etc. 
