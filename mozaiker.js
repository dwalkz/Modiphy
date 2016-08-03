var range = document.getElementById("userInput");       //The input range which determines our tile size
var tileSize = document.getElementById("tileSize");     //A debugging output to show what our current tile divisor is
var timer = document.getElementById("timer");           //Debug output to show how long it took to execute drawing
var fileInput = document.getElementById("imgInput");    //File input element to take image from user which we want to mosaic
var canvas = document.getElementById("imageDisplay");   //The canvas to be drawn on
var ctx = canvas.getContext("2d");                      //Variable to hold the 2d context of our canvas

var imgObj = 0;                                         //imgObj will eventually be an Image object
var drawing = false;                                    //A flag to determine whether or not we're currently drawing
var pixelSpacing = 10;                                  //How many pixels we want to skip when averaging values

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
        canvas.width = imgObj.width;
        canvas.height = imgObj.height;
        ctx.drawImage(imgObj, 0, 0);
    }
});

/*
    Use an additional event listener on input of the range so our divisor debug output always updates
    Regardless of whether or not we're drawing
 */
range.addEventListener("input", function(){
    tileSize.innerHTML = "Tile Divisor: "+range.value;
});

/*
    Additionally when the range is dragged, let's determine what our block size is and get
    on with the magic of making it into a mosaic.
 */
range.addEventListener("input", function(){

    if(drawing) {                                                   //If we're already in the middle of drawing a mosaic
        return;                                                     //Don't start another drawing. This prevents resource
    }                                                               //misuse when dragging happens before we can finish drawing

    if(imgObj !== 0) {                                              //Ensure we have an image
        drawing = true;                                             //Set our drawing flag
        var start = new Date().getTime();

        canvas.width = imgObj.width;                                //Redraw the canvas with our imgObj so we're using
        canvas.height = imgObj.height;                              //a fresh image to tile.
        ctx.drawImage(imgObj, 0, 0);

        var divisor = range.value;
        var totalWidth = imgObj.width;
        var totalHeight = imgObj.height;
        var blockWidth = Math.ceil(totalWidth / divisor);           //Ceiling here prevents problems with fractional
        var blockHeight = Math.ceil(totalHeight / divisor);         //block sizes preventing even mosaic tiles

        var currX = 0;
        var currY = 0;                                              //The current x,y position of our block data

        /*
            Generate list of mosaic pixel blocks by iterating over the image row by row
            divisor^2 gives us the total number of blocks we should have in the end.
         */
        for(var i = 0; i < Math.pow(divisor, 2); i++) {
            //Instead of pushing to an array, just simply update changes in place
            var pixelBlock = ctx.getImageData(currX, currY, blockWidth, blockHeight);
            /*
             Calculate the average values for this block
             */
            var redSum = 0;
            var greenSum = 0;
            var blueSum = 0;
            var numPixels = 0;
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
                        y += 4*pixelSpacing;                //We're on the Alpha, so let's skip ahead by a number of pixels
                        numPixels++;                        //So that we don't average every pixel, but get close enough
                        break;                              //This speeds us up, on average, by about 1.2s comparatively
                }
            }

            var redValue = redSum / numPixels;
            var greenValue = greenSum / numPixels;
            var blueValue = blueSum / numPixels;

            /*
                Put our average values back into imagedata
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

            /*
                Write this new pixelBlock out to the image and then update our X,Y pointer to the next position
             */
            ctx.putImageData(pixelBlock, currX, currY);
            currX += blockWidth;
            if(currX >= totalWidth) {
                currX = 0;
                currY += blockHeight;
            }
        }

        drawing = false;                                            //We're no longer drawing

        var end = new Date().getTime();
        timer.innerHTML = end - start + "ms to execute";         //Output how long in ms it to to draw
    }
});