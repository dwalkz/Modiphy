var range = document.getElementById("userInput");       //The input range which determines our tile size
var tileSize = document.getElementById("tileSize");     //A debugging output to show what our current tile divisor is
var fileInput = document.getElementById("imgInput");    //File input element to take image from user which we want to mosaic
var canvas = document.getElementById("imageDisplay");   //The canvas to be drawn on
var ctx = canvas.getContext("2d");                      //Variable to hold the 2d context of our canvas

var imgObj = 0;                                         //imgObj will eventually be an Image object
var drawing = false;                                    //A flag to determine whether or not we're currently drawing

/*
    When a file is uploaded, set our global imgObj to be a copy of this uploaded image file
    Then set our canvas width, height, and draw the image onto the canvas.

    We'll need the image in an imgObj later so we can manipulate the pixel data and reset it
    after manipulation
 */
fileInput.addEventListener("change", function() {
    var file = this.files[0];
    var url = window.URL || window.webkitURL;
    var src = url.createObjectURL(file);

    imgObj = new Image();
    imgObj.src = src;
    imgObj.onload = function(){
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(imgObj, 0, 0);
    }
});

/*
    Additionally when the range is dragged, let's determine what our block size is and get
    on with the magic of making it into a mosaic.
 */
range.addEventListener("input", function(){

    if(drawing) {                                                   //If we're already in the middle of drawing a mosaic
        return;                                                     //Don't start another drawing. This prevents resource
    }                                                               //misuse when dragging happens before we can finish drawing

    tileSize.innerHTML = "Tile Divisor: "+range.value;              //Output the current divisor to the debug output

    canvas.width = image.width;                                     //Redraw the canvas with our imgObj so we're using
    canvas.height = image.height;                                   //a fresh image to tile.
    ctx.drawImage(imgObj, 0, 0);

    var divisor = range.value;
    var totalWidth = image.width;
    var totalHeight = image.height;
    var blockWidth = Math.ceil(totalWidth / divisor);               //Ceiling here prevents problems with fractional
    var blockHeight = Math.ceil(totalHeight / divisor);             //block sizes preventing even mosaic tiles

    if(imgObj !== 0) {                                              //Ensure we have an image
        drawing = true;                                             //Set our drawing flag
        var oldPixels = [];                                         //Use an array to hold all of our pixel values
        var currX = 0;
        var currY = 0;                                              //The current x,y position of our block data

        /*
            Generate list of mosaic pixel blocks by iterating over the image row by row
            divisor^2 gives us the total number of blocks we should have in the end.
         */
        for(var i = 0; i < Math.pow(divisor, 2); i++) {
            oldPixels.push(ctx.getImageData(currX, currY, blockWidth, blockHeight));
            currX += blockWidth;                                    //Grab the current block and then move X to the next position
            if(currX >= totalWidth) {
                currX = 0;                                          //If X hits the bound of the image, set it back to
                currY += blockHeight;                               //the start and set Y to the next row of blocks
            }
        }

        /*
            Loop through our blocks and calculate average RGB values for that block
        */
        for (var x = 0; x < oldPixels.length; x++) {
            var pixelBlock = oldPixels[x];

            var redSum = 0;
            var greenSum = 0;
            var blueSum = 0;
            /*
                Pixels are in array where every four values represents a pixel in [R, G, B, A] format.
                Therefore, if our index % 4 is 0 then we're on the first value, making it red, and so on.
                index % 4 is 3 when we're on the alpha channel, which is ignored at this point.
            */
            for (var y = 0; y < pixelBlock.data.length; y++) {
                switch(y%4) {
                    case 0:
                        redSum += pixelBlock.data[y];
                        break;
                    case 1:
                        greenSum += pixelBlock.data[y];
                        break;
                    case 2:
                        blueSum += pixelBlock.data[y];
                        break;
                    default:
                        break;
                }
            }

            var numPixels = pixelBlock.data.length / 4;             //The total number of pixels we checked in this block
            var redValue = redSum / numPixels;                      //Average is the sum / number of pixels
            var greenValue = greenSum / numPixels;
            var blueValue = blueSum / numPixels;

            /*
                 Put the average RGB values back into the pixelblock using same method as above
            */
            for (var z = 0; z < pixelBlock.data.length; z++) {
                switch(z%4) {
                    case 0:
                        pixelBlock.data[z] = redValue;
                        break;
                    case 1:
                        pixelBlock.data[z] = greenValue;
                        break;
                    case 2:
                        pixelBlock.data[z] = blueValue;
                        break;
                    default:
                        break;
                }
            }

            oldPixels[x] = pixelBlock;
        }

        /*
            Use the same method as before to iterate back over our image and reset the pixel data to our newly averaged
            pixelBlocks.
        */
        currX = 0;
        currY = 0;
        for(var c = 0; c < Math.pow(divisor, 2); c++) {
            ctx.putImageData(oldPixels[c], currX, currY);
            currX += blockWidth;

            if(currX >= totalWidth) {
                currX = 0;
                currY += blockHeight;
            }
        }

        drawing = false;                                            //We're no longer drawing
    }
});