/*!
 Library: Modiphy
 Author: David Gormley
 Date: 2016-08-06T12:22AM
 Version: 0.6.3

 Modiphy is an image manipulation library that cna be used on the fly
 to filter images with common Photoshop like filters by using the
 HTML5 Canvas API to get and modify pixel data in different ways.

 This library is primarily an educational exercise but is released
 under the MIT License (Copyright 2016 David Gormley) and provided
 as is for use. Suggestions welcome at my github:
 https://github.com/dwalkz/Modiphy
 */
(function(window, undefined){
    'use strict';

    var version = "0.6.3";
    var console = window.console;

    var TWO_PI = Math.PI * 2;
    var QUARTER_PI = Math.PI / 4;

    //Check for canvas support
    var canvas = document.createElement("canvas");
    var canvasSupport = canvas.getContext && canvas.getContext("2d");
    //If we can't use the canvas, Modiphy won't be able to do anything
    if(!canvasSupport) {
        return;
    }

    //TODO: Implement filter stacking?? Grayscale and pixelate?
    function Modiphy(img, options) {
        this.img = img;
        this.options = {            //Set the default options for a Modiphy object
            filter: {               //Filter is an object itself with a name, method, and shape
                name: "pixel",          //The name of the filter
                method: "quick",        //The algorithm or method to use, if applicable
                shape: "square",        //The shape of the output pixels for pixelate
                divisor: 50,            //Determins the block size in pixelate
                decompose: "maximum"    //Decompositing algorithm to use
            },
            debug: true
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
        if(options.filter) {
            this.options.filter.name = options.filter.name || this.options.filter.name;
            this.options.filter.shape = options.filter.shape || this.options.filter.shape;
            this.options.filter.method = options.filter.method || this.options.filter.method;
            this.options.filter.divisor = options.filter.divisor || this.options.filter.divisor;
            this.options.filter.decompose = options.filter.decompose || this.options.filter.decompose;
        }
        this.options.debug = options.debug || this.options.debug;
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
        switch(this.options.filter.name.toLowerCase()) {
            case "pixel":
                pixelate.call(this);
                break;
            case "grayscale":
                grayscale.call(this);
                break;
            default:
                console.log("No filter or invalid filter given. Pixelating image by default");
                pixelate.call(this);
                break;
        }
    };

    /*
     Function called by render when filter == "pixel" to handle
     checking which pixelMethod we want to use to pixelate
     */
    function pixelate() {
        //Determine how we need to pixelate the image whether by using
        //An average or using the quick pixelate cheating method
        if(this.options.filter.method.toLowerCase() == "quick") {
            pixelateQuick.call(this);
        } else {
            pixelateAverage.call(this);
        }
    }

    //TODO: Implement a hex shape? I think it sounds cool
    /*!
     A thorough pixelation method which uses a real average RGB value
     of all the pixels in each "pixel block" as determined by the divisor.

     This function will loop through each pixel in the block and calculate
     an average. This process can be time consuming, but is more mathematically
     accurate because of it.
     */
    function pixelateAverage() {
        if(this.drawing === true) {
            //If we're already drawing a new image, don't do anything. This prevents resource hogging
            //Since the "average" method can take quite a long time
            return;
        }

        this.drawing = true;
        var start = new Date().getTime();

        //Clear the canvas and redraw the original image on top to clear out old data
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.img, 0, 0);

        var divisor = this.options.filter.divisor;
        var pixelWidth = Math.ceil(this.img.width / divisor);
        var pixelHeight = Math.ceil(this.img.height / divisor);
        var radius = pixelWidth/2;

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
            switch(this.options.filter.shape.toLowerCase()) {
                case "circle":
                    this.ctx.clearRect(currX, currY, pixelWidth, pixelHeight); //Clear out this sector now that we don't need it
                    this.ctx.beginPath();
                    this.ctx.arc(currX, currY, radius, 0, TWO_PI);
                    this.ctx.fill();
                    this.ctx.closePath();
                    break;
                case "diamond":
                    break;
                default: //square
                    this.ctx.fillRect(currX, currY, pixelWidth, pixelHeight);
                    break;
            }

            currX += pixelWidth;
            if(currX >= this.img.width) {
                currX = 0;
                currY += pixelHeight
            }
        }

        var end = new Date().getTime();
        this.drawing = false;

        if(this.options.debug === true)
            console.log("Filter: Pixel\nMethod: Average\nDivisor: "+divisor+"\nNumber of Blocks: "+Math.pow(divisor, 2)+"\nExecution Time: "+(end - start)+"ms");
    }

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
    function pixelateQuick(){
        if(this.drawing === true) {
            return;
        }

        this.drawing = true;
        var start = new Date().getTime();

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.img, 0, 0);

        var divisor = this.options.filter.divisor;
        var pixelWidth = Math.ceil(this.img.width / divisor);
        var pixelHeight = Math.ceil(this.img.height / divisor);
        var radius = pixelWidth / 2;

        var currX = 0, currY = 0;
        var currentPixelBlock, cpi, rVal, gVal, bVal;
        var diamond = pixelWidth / Math.SQRT2;
        var halfDiamond = diamond / 2;

        for(var i = 0; i < Math.pow(divisor, 2); i++) {
            currentPixelBlock = this.ctx.getImageData(currX, currY, pixelWidth, pixelHeight).data;
            cpi = (Math.floor(currentPixelBlock.length / 4 / 2) - 1) * 4;
            rVal = currentPixelBlock[ cpi   ];
            gVal = currentPixelBlock[ cpi+1 ];
            bVal = currentPixelBlock[ cpi+2 ];


            this.ctx.fillStyle = "rgb("+rVal+", "+gVal+", "+bVal+")";
            switch(this.options.filter.shape.toLowerCase()) {
                case "circle":
                    this.ctx.clearRect(currX, currY, pixelWidth, pixelHeight);
                    this.ctx.beginPath();
                    this.ctx.arc(currX, currY, radius, 0, TWO_PI);
                    this.ctx.fill();
                    this.ctx.closePath();
                    break;
                case "diamond":
                    this.ctx.clearRect(currX, currY, pixelWidth, pixelHeight);
                    this.ctx.save();
                    this.ctx.translate(currX, currY);
                    this.ctx.rotate(QUARTER_PI);
                    this.ctx.fillRect(-halfDiamond, -halfDiamond, diamond, diamond);
                    this.ctx.restore();
                    break;
                default: //square
                    this.ctx.fillRect(currX, currY, pixelWidth, pixelHeight);
            }
            currX += pixelWidth;
            if(currX >= this.img.width) {
                currX = 0;
                currY += pixelHeight
            }
        }

        var end = new Date().getTime();
        this.drawing = false;

        if(this.options.debug === true)
            console.log("Filter: Pixel\nMethod: Quick\nDivisor: "+divisor+"\nNumber of Blocks: "+Math.pow(divisor, 2)+"\nExecution Time: "+(end - start)+"ms");
    }

    /*!
        Handle switching between grayscale algorithms based on input method
     */
    function grayscale() {
        //Determine which method to use grayscale the image
        switch(this.options.filter.method.toLowerCase()){
            case "average":
                grayscaleAvg.call(this);
                break;
            case "lightness":
                grayscaleLight.call(this);
                break;
            case "luminosity":
                grayscaleLumin.call(this);
                break;
            case "decompose":
                grayscaleDecompose.call(this);
                break;
            default:
                console.log("Invalid Grayscale Method given, using average by default");
                grayscaleAvg.call(this);
                break;

        }
    }

    /*!
        The Average method for grayscale takes the average of the RGB values in
        each pixel and sets each pixel back to that average. A run-of-the-mill
        grayscale algorithm
     */
    function grayscaleAvg(){
        if(this.drawing === true) {
            return;
        }

        this.drawing = true;
        var start = new Date().getTime();

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.img, 0, 0);

        var pixelData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        var r, g, b;
        for(var i = 0; i < pixelData.data.length; i+=4){
            r = pixelData.data[ i   ];
            g = pixelData.data[ i+1 ];
            b = pixelData.data[ i+2 ];

            pixelData.data[i] = pixelData.data[i+1] = pixelData.data[i+2] = (r+g+b)/3;
        }

        this.ctx.putImageData(pixelData, 0, 0);

        var end = new Date().getTime();
        this.drawing = false;

        if(this.options.debug === true){
            console.log("Filter: Grayscale\nMethod: Average\nExecution Time: "+(end - start)+"ms");
        }
    }

    /*!
        The lightness method takes into account only the most prominent and
        least prominent colors which tends to lend itself to greater contrast
        compared to Average. This could also be called "desaturation"
     */
    function grayscaleLight(){
        if(this.drawing === true) {
            return;
        }

        this.drawing = true;
        var start = new Date().getTime();

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.img, 0, 0);

        var pixelData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        var r, g, b;
        for(var i = 0; i < pixelData.data.length; i+=4){
            r = pixelData.data[ i   ];
            g = pixelData.data[ i+1 ];
            b = pixelData.data[ i+2 ];

            pixelData.data[i] = pixelData.data[i+1] = pixelData.data[i+2] = (Math.max(r, g, b) + Math.min(r, g, b))/2;
        }

        this.ctx.putImageData(pixelData, 0, 0);

        var end = new Date().getTime();
        this.drawing = false;

        if(this.options.debug === true){
            console.log("Filter: Grayscale\nMethod: Lightness\nExecution Time: "+(end - start)+"ms");
        }
    }

    /*!
        The luminosity method weights each RGB value based on human perception.
        Since humans are more sensitive to green values, the G value is weighted
        higher in the end lending itself to a more "realistic" grayscale.
     */
    function grayscaleLumin(){
        if(this.drawing === true) {
            return;
        }

        this.drawing = true;
        var start = new Date().getTime();

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.img, 0, 0);

        var pixelData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        var r, g, b;
        for(var i = 0; i < pixelData.data.length; i+=4){
            r = pixelData.data[ i   ];
            g = pixelData.data[ i+1 ];
            b = pixelData.data[ i+2 ];

            pixelData.data[i] = pixelData.data[i+1] = pixelData.data[i+2] = (0.21 * r) + (0.72 * g) + (0.07 * b);
        }

        this.ctx.putImageData(pixelData, 0, 0);

        var end = new Date().getTime();
        this.drawing = false;

        if(this.options.debug === true){
            console.log("Filter: Grayscale\nMethod: Luminosity\nExecution Time: "+(end - start)+"ms");
        }
    }

    /*!
        De-composition of the image means determining which RGB channel is most
        important for a pixel and then setting all channels to that value.

        Combines with the grayscaleDecompose option to be either maximum or minimum
        E.g. a pixel with RGB(10, 20, 30) will end up (30, 30, 30) under maximum or
            (10, 10, 10) under minimum.
     */
    function grayscaleDecompose(){
        if(this.drawing === true) {
            return;
        }

        this.drawing = true;
        var start = new Date().getTime();

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.img, 0, 0);

        var pixelData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        var r, g, b;
        for(var i = 0; i < pixelData.data.length; i+=4){
            r = pixelData.data[ i   ];
            g = pixelData.data[ i+1 ];
            b = pixelData.data[ i+2 ];

            if(this.options.filter.decompose.toLowerCase() == "maximum")
                pixelData.data[i] = pixelData.data[i+1] = pixelData.data[i+2] = Math.max(r, g, b);
            else
                pixelData.data[i] = pixelData.data[i+1] = pixelData.data[i+2] = Math.min(r, g, b);

        }

        this.ctx.putImageData(pixelData, 0, 0);

        var end = new Date().getTime();
        this.drawing = false;

        if(this.options.debug === true){
            console.log("Filter: Grayscale\nMethod: Luminosity\nExecution Time: "+(end - start)+"ms");
        }
    }


    HTMLImageElement.prototype.Modiphy = function( options ) {
        return new Modiphy(this, options);
    }

    window.Modiphy = Modiphy;
})(window);