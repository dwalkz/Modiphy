/*!
 Library: Modiphy
 Author: David Gormley
 Date: 2016-08-06T12:22AM
 Version: 0.5.1

 Modiphy is an image manipulation library that cna be used on the fly
 to filter images with common Photoshop like filters by using the
 HTML5 Canvas API to get and modify pixel data in different ways.

 This library is primarily an educational exercise but is released
 under the MIT License (Copyright 2016 David Gormley) and provided
 as is for use. Suggestions welcome at my github:
 https://github.com/dwalkz/Modiphy
 */
(function(window){
    'use strict';

    var version = "0.5.1";
    var console = window.console;

    //Check for canvas support
    var canvas = document.createElement("canvas");
    var canvasSupport = canvas.getContext && canvas.getContext("2d");
    //If we can't use the canvas, Modiphy won't be able to do anything
    if(!canvasSupport) {
        return;
    }

    function Modiphy(img, options) {
        this.img = img;
        this.options = {            //Set the default options for a Modiphy object
            filter: "pixelate",     //The filter we want to use on the image
            method: "quick",        //The algorithm used to pixelate
            divisor: 50             //Determines the block size. Divide the image into 'n' blocks
        };

        var canvas = this.canvas = document.createElement("canvas");
        this.ctx = canvas.getContext("2d");
        canvas.className = img.className;
        canvas.id = img.id;

        this.render( options );     //Render (or re-render) the image with a number of options

        //Replace the image with a canvas
        img.parentNode.replaceChild(canvas, img);
    }

    Modiphy.prototype.about = function(){
        alert("Modiphy is currently in development version " + version);
    };

    /*
     Merge options passed into this.render with our default options
     */
    Modiphy.prototype.updateOptions = function(options) {
        this.options.filter = options.filter || this.options.filter;
        this.options.method = options.method || this.options.method;
        this.options.divisor = options.divisor || this.options.divisor;
    };

    Modiphy.prototype.render = function( options ) {
        if(options)
            this.updateOptions(options);
        else
            this.updateOptions({});

        //Draw the image on our canvas
        this.width = this.canvas.width = this.img.width;
        this.height = this.canvas.height = this.img.height;
        this.ctx.drawImage(this.img, 0, 0);

        //Let's determine how we need to filter the image
        switch(this.options.filter) {
            case "pixelate":
                pixelate.call(this);
                break;
            default:
                console.log("No filter or invalid filter given. Pixelating image by default");
                pixelate.call(this);
                break;
        }
    };

    /*
     Function called by render when filter == "pixelate" to handle
     checking which method we want to use to pixelate
     */
    function pixelate ( ) {
        //Determine how we need to pixelate the image whether by using
        //An average or using the quick pixelate cheating method
        if(this.options.method == "quick") {
            pixelateQuick.call(this);
        } else {
            pixelateAverage.call(this);
        }
    }

    //TODO: Implement different shapes for the output pixels
    /*!
     A thorough pixelation method which uses a real average RGB value
     of all the pixels in each "pixel block" as determined by the divisor.

     This function will loop through each pixel in the block and calculate
     an average. This process can be time consuming, but is more mathematically
     accurate because of it.
     */
    function pixelateAverage () {
        if(this.drawing === true) {
            //If we're already drawing a new image, don't do anything. This prevents resource hogging
            //Since the "average" method can take quite a long time
            return;
        }

        this.drawing = true;

        //Clear the canvas and redraw the original image on top to clear out old data
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.img, 0, 0);

        var divisor = this.options.divisor;
        var pixelWidth = Math.ceil(this.img.width / divisor);
        var pixelHeight = Math.ceil(this.img.height / divisor);

        var currX = 0, currY = 0;

        //Loop through the image and break it down into pixel blocks of a width and height
        for(var i = 0; i < Math.pow(divisor, 2); i++) {
            var currentPixelBlock = this.ctx.getImageData(currX, currY, pixelWidth, pixelHeight).data;
            //Calculate the average values for this block
            var rSum = 0, gSum = 0, bSum = 0, numPixels = 0;
            for(var n = 0; n < currentPixelBlock.length; n+=4) {
                rSum += currentPixelBlock[ n   ];
                gSum += currentPixelBlock[ n+1 ];
                bSum += currentPixelBlock[ n+2 ];
                //Alpha would be here, but it's not supported now because it's unnecessary
                numPixels++;
            }

            var rVal = (rSum / numPixels).toFixed();
            var gVal = (gSum / numPixels).toFixed();
            var bVal = (bSum / numPixels).toFixed();

            //Draw a new "pixel" in place with our average value
            this.ctx.fillStyle = "rgb("+rVal+", "+gVal+", "+bVal+")";
            this.ctx.fillRect(currX, currY, pixelWidth, pixelHeight);
            currX += pixelWidth;
            if(currX >= this.img.width) {
                currX = 0;
                currY += pixelHeight
            }
        }

        this.drawing = false;
    }

    //TODO: Implement different shapes for the output pixels
    /*!
     A "cheat" way to emulate pixelation by assuming the important color in
     a given block is always the center-most pixel. Breaks the image down
     into pixel blocks determined by the divisor and then finds the pixel
     in the very center of the block.

     Even though this isn't a true average, as the divisor increases, the
     assumption that the center pixel is the average becomes more true so
     it's computationally faster and looks close enough.

     This is the default pixelation method for speed
     */
    function pixelateQuick (){
        if(this.drawing === true) {
            return;
        }

        this.drawing = true;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.img, 0, 0);

        var divisor = this.options.divisor;
        var pixelWidth = Math.ceil(this.img.width / divisor);
        var pixelHeight = Math.ceil(this.img.height / divisor);

        var currX = 0, currY = 0;

        for(var i = 0; i < Math.pow(divisor, 2); i++) {
            var currentPixelBlock = this.ctx.getImageData(currX, currY, pixelWidth, pixelHeight).data;
            var cpi = ((currentPixelBlock.length / 4 / 2) - 1) * 4;
            var rVal = currentPixelBlock[ cpi   ];
            var gVal = currentPixelBlock[ cpi+1 ];
            var bVal = currentPixelBlock[ cpi+2 ];

            this.ctx.fillStyle = "rgb("+rVal+", "+gVal+", "+bVal+")";
            this.ctx.fillRect(currX, currY, pixelWidth, pixelHeight);
            currX += pixelWidth;
            if(currX >= this.img.width) {
                currX = 0;
                currY += pixelHeight
            }
        }

        this.drawing = false;
    }

    HTMLImageElement.prototype.Modiphy = function( options ) {
        return new Modiphy(this, options);
    }

    window.Modiphy = Modiphy;
})(window);