/*!
 Library: Modiphy
 Author: David Bott
 Date: 2016-08-06T12:22AM
 Version: 0.6.3

 Modiphy is an image manipulation library that cna be used on the fly
 to filter images with common Photoshop like filters by using the
 HTML5 Canvas API to get and modify pixel data in different ways.

 This library is primarily an educational exercise but is released
 under the MIT License and provided as is for use. 
 
 Suggestions welcome at my github: https://github.com/dwalkz/Modiphy
 */
(function (window, undefined) {
    'use strict';

    var version = "0.6.3";
    var console = window.console;

    var TWO_PI = Math.PI * 2;
    var QUARTER_PI = Math.PI / 4;

    //Check for canvas support
    var canvas = document.createElement("canvas");
    var canvasSupport = canvas.getContext && canvas.getContext("2d");
    //If we can't use the canvas, Modiphy won't be able to do anything
    if (!canvasSupport) {
        return;
    }

    //TODO: Simplify filter stacking by possibly passing through a .filters option all the filters wanted rather than having to specify .render in multiple chains
    function Modiphy(img, options) {
        this.img = img;
        this.options = {            //Set the default options for a Modiphy object
            filter: "pixel",        //The name of the filter
            method: "quick",        //The algorithm or method to use, if applicable
            shape: "square",        //The shape of the output pixels for pixelate
            divisor: 50,            //Determins the block size in pixelate
            decompose: "maximum",   //Decompositing algorithm to use
            levels: 8,              //The number of "gaps" we'll keep in posterize
            grouping: 20,           //The number of pixel rows to shift at once in glitch
            autoRender: true,       //Whether to automatically render on generation
            debug: false
        };

        var canvas = this.canvas = document.createElement("canvas");
        this.ctx = canvas.getContext("2d");
        canvas.className = img.className;
        canvas.id = img.id;

        /*
            Initialize the canvas to the starting image. From here on functions
            will use the canvas object to draw so that we can stack layers
            until it's reset
         */
        this.width = this.canvas.width = this.img.width;
        this.height = this.canvas.height = this.img.height;
        this.ctx.drawImage(this.img, 0, 0);

        //Replace the image with a canvas
        if (img.parentNode !== undefined && img.parentNode !== null) {
            img.parentNode.replaceChild(canvas, img);
        }

        this.render(options);     //Render (or re-render) the image with a number of options
    }

    Modiphy.prototype.about = function () {
        alert("Modiphy is currently in development version " + version);
        return this;
    };

    /*
     Merge options passed into this.render with our default options
     */
    Modiphy.prototype.updateOptions = function (options) {
        this.options.filter = empty(options.filter) ? this.options.filter : options.filter;
        this.options.shape = empty(options.shape) ? this.options.shape : options.shape;
        this.options.method = empty(options.method) ? this.options.method : options.method;
        this.options.divisor = empty(options.divisor) ? this.options.divisor : options.divisor;
        this.options.decompose = empty(options.decompose) ? this.options.decompose : options.decompose;
        this.options.levels = empty(options.levels) ? this.options.levels : options.levels;
        this.options.grouping = empty(options.grouping) ? this.options.grouping : options.grouping;
        this.options.debug = empty(options.debug) ? this.options.debug : options.debug;
        this.options.autoRender = empty(options.autoRender) ? this.options.autoRender : options.autoRender;
        return this;
    };

    function empty(value) {
        return value === undefined || value === null || value === "" || value.length === 0;
    }

    Modiphy.prototype.render = function (options) {
        if (options)
            this.updateOptions(options);
        else
            this.updateOptions({});

        if (!this.options.autoRender) { return false; }

        //Draw the image on our canvas
        this.ctx.drawImage(this.canvas, 0, 0);

        //Let's determine how we need to filter the image
        switch (this.options.filter.toLowerCase()) {
            case "pixel":
                pixelate.call(this);
                break;
            case "grayscale":
                grayscale.call(this);
                break;
            case "posterize":
                posterize.call(this);
                break;
            case "glitch":
                glitch.call(this);
                break;
            case "invert":
                invertColors.call(this);
                break;
            case "channelrotate":
                channelRotate.call(this);
                break;
            default:
                console.error("No filter or invalid filter given.");
                break;
        }

        return this;
    };

    Modiphy.prototype.brightness = function (percentage) {
        setBrightness.call(this, percentage);
        return this;
    };

    Modiphy.prototype.contrast = function (percentage) {
        setContrast.call(this, percentage);
        return this;
    };

    Modiphy.prototype.resetModiphications = function () {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.img, 0, 0);
        return this;
    };

    Modiphy.prototype.export = function () {
        return this.canvas.toDataURL();
    };

    /*
     * Handle setting the brightness by an additional percentage modifier between -100 and +100%
     * 
     */
    function setBrightness(percent) {
        if (this.drawing === true) {
            return;
        }

        this.drawing = true;
        var start = new Date().getTime();

        this.ctx.drawImage(this.canvas, 0, 0);

        var pixelData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        var r = [],
            g = [],
            b = [];
        for (var i = 0; i < pixelData.data.length; i += 4) {
            r[i] = pixelData.data[i];
            g[i] = pixelData.data[i + 1];
            b[i] = pixelData.data[i + 2];
        }

        var avgR = r.reduce(function (a, b) { return a + b; }, 0) / r.length;
        var avgG = g.reduce(function (a, b) { return a + b; }, 0) / g.length;
        var avgB = b.reduce(function (a, b) { return a + b; }, 0) / b.length;

        var distR = (255 - avgR) * (percent / 100);
        var distG = (255 - avgG) * (percent / 100);
        var distB = (255 - avgB) * (percent / 100);

        for (i = 0; i < pixelData.data.length; i += 4) {
            r = pixelData.data[i] + distR;
            g = pixelData.data[i + 1] + distG;
            b = pixelData.data[i + 2] + distB;
            if (r > 255) {
                r = 255;
            }
            if (g > 255) {
                g = 255;
            }
            if (b > 255) {
                b = 255;
            }
            if (r < 0) {
                r = 0;
            }
            if (g < 0) {
                g = 0;
            }
            if (b < 0) {
                b = 0;
            }

            pixelData.data[i] = r;
            pixelData.data[i + 1] = g;
            pixelData.data[i + 2] = b;
        }

        this.ctx.putImageData(pixelData, 0, 0);

        var end = new Date().getTime();
        this.drawing = false;

        if (this.options.debug === true) {
            console.log("Filter: Brightness\nValue: " + percent + "\nExecution Time: " + (end - start) + "ms");
        }
    }

    /*
     * Handle setting the contrast of the image by an additional percentage modifier between -100 and +100%
     */
    function setContrast(percent) {
        if (this.drawing === true) {
            return;
        }

        this.drawing = true;
        var start = new Date().getTime();

        this.ctx.drawImage(this.canvas, 0, 0);

        var pixelData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        //Dim decimalContrast As Decimal = (dbCdec(Contrast) / 100.0) + 1.0 'convert it to a decimal and shift range from 0 to 2
        //Dim intercept As Decimal = 128 * (1 - decimalContrast)
        var contrast = (percent / 100) + 1.0;
        var intercept = 128 * (1 - contrast);

        var r, g, b;
        for (var i = 0; i < pixelData.data.length; i += 4) {
            r = pixelData.data[i] * contrast + intercept;
            g = pixelData.data[i + 1] * contrast + intercept;
            b = pixelData.data[i + 2] * contrast + intercept;
            if (r > 255) {
                r = 255;
            }
            if (g > 255) {
                g = 255;
            }
            if (b > 255) {
                b = 255;
            }
            if (r < 0) {
                r = 0;
            }
            if (g < 0) {
                g = 0;
            }
            if (b < 0) {
                b = 0;
            }

            pixelData.data[i] = r;
            pixelData.data[i + 1] = g;
            pixelData.data[i + 2] = b;
        }

        this.ctx.putImageData(pixelData, 0, 0);

        var end = new Date().getTime();
        this.drawing = false;

        if (this.options.debug === true) {
            console.log("Filter: Contrast\nValue: " + percent + "\nExecution Time: " + (end - start) + "ms");
        }
    }


    /*
     Function called by render when filter == "pixel" to handle
     checking which pixelMethod we want to use to pixelate
     */
    function pixelate() {
        //Determine how we need to pixelate the image whether by using
        //An average or using the quick pixelate cheating method
        if (this.options.method.toLowerCase() == "quick") {
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
        if (this.drawing === true) {
            //If we're already drawing a new image, don't do anything. This prevents resource hogging
            //Since the "average" method can take quite a long time
            return;
        }

        this.drawing = true;
        var start = new Date().getTime();

        //Clear the canvas and redraw the original image on top to clear out old data
        this.ctx.drawImage(this.canvas, 0, 0);

        var divisor = this.options.divisor;
        var pixelWidth = Math.ceil(this.img.width / divisor);
        var pixelHeight = Math.ceil(this.img.height / divisor);
        var radius = pixelWidth / 2;
        //TODO: Fix this to account for non-square dimensions
        var diamond = pixelWidth / Math.SQRT2;
        var halfDiamond = diamond / 2;

        var currX = 0, currY = 0;

        //Loop through the image and break it down into pixel blocks of a width and height
        for (var i = 0; i < Math.pow(divisor, 2); i++) {
            var currentPixelBlock = this.ctx.getImageData(currX, currY, pixelWidth, pixelHeight).data;
            //Calculate the average values for this block
            var rSum = 0, gSum = 0, bSum = 0, numPixels = 0;
            for (var n = 0; n < currentPixelBlock.length; n += 4) {
                rSum += currentPixelBlock[n];
                gSum += currentPixelBlock[n + 1];
                bSum += currentPixelBlock[n + 2];
                //Alpha would be here, but it's not supported now because it's unnecessary
                numPixels++;
            }

            var rVal = (rSum / numPixels).toFixed();
            var gVal = (gSum / numPixels).toFixed();
            var bVal = (bSum / numPixels).toFixed();
            var centroidX;
            var centroidY;

            //Draw a new "pixel" in place with our average value
            this.ctx.fillStyle = "rgb(" + rVal + ", " + gVal + ", " + bVal + ")";
            switch (this.options.shape.toLowerCase()) {
                case "circle":
                    this.ctx.clearRect(currX, currY, pixelWidth, pixelHeight); //Clear out this sector now that we don't need it
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
                case "hex":
                    this.ctx.clearRect(currX, currY, pixelWidth, pixelHeight);
                    this.ctx.beginPath();
                    centroidX = currX + (pixelWidth / 2);
                    centroidY = currY + (pixelHeight / 2);
                    this.ctx.moveTo(centroidX + (radius * Math.cos(0)), centroidY + (radius * Math.sin(0)));
                    this.ctx.lineTo(centroidX + (radius * Math.cos(Math.PI / 3)), centroidY + (radius * Math.sin(Math.PI / 3)));
                    this.ctx.lineTo(centroidX + (radius * Math.cos(2 * Math.PI / 3)), centroidY + (radius * Math.sin(2 * Math.PI / 3)));
                    this.ctx.lineTo(centroidX + (radius * Math.cos(Math.PI)), centroidY + (radius * Math.sin(Math.PI)));
                    this.ctx.lineTo(centroidX + (radius * Math.cos(4 * Math.PI / 3)), centroidY + (radius * Math.sin(4 * Math.PI / 3)));
                    this.ctx.lineTo(centroidX + (radius * Math.cos(5 * Math.PI / 3)), centroidY + (radius * Math.sin(5 * Math.PI / 3)));
                    this.ctx.closePath();
                    this.ctx.fill();
                    break;
                default: //square
                    this.ctx.fillRect(currX, currY, pixelWidth, pixelHeight);
                    break;
            }

            currX += pixelWidth;
            if (currX >= this.img.width) {
                currX = 0;
                currY += pixelHeight
            }
        }

        var end = new Date().getTime();
        this.drawing = false;

        if (this.options.debug === true)
            console.log("Filter: Pixel\nMethod: Average\nDivisor: " + divisor + "\nNumber of Blocks: " + Math.pow(divisor, 2) + "\nExecution Time: " + (end - start) + "ms");
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
    function pixelateQuick() {
        if (this.drawing === true) {
            return;
        }

        this.drawing = true;
        var start = new Date().getTime();

        this.ctx.drawImage(this.canvas, 0, 0);

        var divisor = this.options.divisor;
        var pixelWidth = Math.ceil(this.img.width / divisor);
        var pixelHeight = Math.ceil(this.img.height / divisor);
        var radius = pixelWidth / 2;

        var currX = 0, currY = 0;
        var currentPixelBlock, cpi, rVal, gVal, bVal;
        //TODO: Fix this to account for non-square dimensions
        var diamond = pixelWidth / Math.SQRT2;
        var halfDiamond = diamond / 2;
        var centroidX;
        var centroidY;

        for (var i = 0; i < Math.pow(divisor, 2); i++) {
            currentPixelBlock = this.ctx.getImageData(currX, currY, pixelWidth, pixelHeight).data;
            cpi = (Math.floor(currentPixelBlock.length / 4 / 2) - 1) * 4;
            rVal = currentPixelBlock[cpi];
            gVal = currentPixelBlock[cpi + 1];
            bVal = currentPixelBlock[cpi + 2];


            this.ctx.fillStyle = "rgb(" + rVal + ", " + gVal + ", " + bVal + ")";
            switch (this.options.shape.toLowerCase()) {
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
                case "hex":
                    this.ctx.clearRect(currX, currY, pixelWidth, pixelHeight);
                    this.ctx.beginPath();
                    centroidX = currX + (pixelWidth / 2);
                    centroidY = currY + (pixelHeight / 2);
                    this.ctx.moveTo(centroidX + (radius * Math.cos(0)), centroidY + (radius * Math.sin(0)));
                    this.ctx.lineTo(centroidX + (radius * Math.cos(Math.PI / 3)), centroidY + (radius * Math.sin(Math.PI / 3)));
                    this.ctx.lineTo(centroidX + (radius * Math.cos(2 * Math.PI / 3)), centroidY + (radius * Math.sin(2 * Math.PI / 3)));
                    this.ctx.lineTo(centroidX + (radius * Math.cos(Math.PI)), centroidY + (radius * Math.sin(Math.PI)));
                    this.ctx.lineTo(centroidX + (radius * Math.cos(4 * Math.PI / 3)), centroidY + (radius * Math.sin(4 * Math.PI / 3)));
                    this.ctx.lineTo(centroidX + (radius * Math.cos(5 * Math.PI / 3)), centroidY + (radius * Math.sin(5 * Math.PI / 3)));
                    this.ctx.closePath();
                    this.ctx.fill();
                    break;
                default: //square
                    this.ctx.fillRect(currX, currY, pixelWidth, pixelHeight);
            }
            currX += pixelWidth;
            if (currX >= this.img.width) {
                currX = 0;
                currY += pixelHeight
            }
        }

        var end = new Date().getTime();
        this.drawing = false;

        if (this.options.debug === true)
            console.log("Filter: Pixel\nMethod: Quick\nDivisor: " + divisor + "\nNumber of Blocks: " + Math.pow(divisor, 2) + "\nExecution Time: " + (end - start) + "ms");
    }

    /*!
        Handle switching between grayscale algorithms based on input method
     */
    function grayscale() {
        //Determine which method to use grayscale the image
        switch (this.options.method.toLowerCase()) {
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
        The tried and true method for grayscale. Boring, but gets the job done.
     */
    function grayscaleAvg() {
        if (this.drawing === true) {
            return;
        }

        this.drawing = true;
        var start = new Date().getTime();

        this.ctx.drawImage(this.canvas, 0, 0);

        var pixelData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        var r, g, b;
        for (var i = 0; i < pixelData.data.length; i += 4) {
            r = pixelData.data[i];
            g = pixelData.data[i + 1];
            b = pixelData.data[i + 2];

            pixelData.data[i] = pixelData.data[i + 1] = pixelData.data[i + 2] = (r + g + b) / 3;
        }

        this.ctx.putImageData(pixelData, 0, 0);

        var end = new Date().getTime();
        this.drawing = false;

        if (this.options.debug === true) {
            console.log("Filter: Grayscale\nMethod: Average\nExecution Time: " + (end - start) + "ms");
        }
    }

    /*!
        The luminosity method weighs each RGB value based on human perception.
        The coefficients for this method are as given by the CCIR Rec. 601 which
        you can read more about here:

        https://en.wikipedia.org/wiki/Luma_%28video%29#Rec._601_luma_versus_Rec._709_luma_coefficients
     */
    function grayscaleLumin() {
        if (this.drawing === true) {
            return;
        }

        this.drawing = true;
        var start = new Date().getTime();

        this.ctx.drawImage(this.canvas, 0, 0);

        var pixelData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        var r, g, b;
        for (var i = 0; i < pixelData.data.length; i += 4) {
            r = pixelData.data[i];
            g = pixelData.data[i + 1];
            b = pixelData.data[i + 2];

            pixelData.data[i] = pixelData.data[i + 1] = pixelData.data[i + 2] = (0.299 * r) + (0.587 * g) + (0.114 * b);
        }

        this.ctx.putImageData(pixelData, 0, 0);

        var end = new Date().getTime();
        this.drawing = false;

        if (this.options.debug === true) {
            console.log("Filter: Grayscale\nMethod: Luminosity\nExecution Time: " + (end - start) + "ms");
        }
    }

    /*!
        De-composition of an image means separating the RGB values (this can technically
        be done with any colorspace but since pixels are in RGB already...) into their
        component channels. This method is adapted as described in many places but initially
        Tanner Helland in the link below. Maximum or minimum decomposition involves setting
        each pixel to either the most important or least important (respectively) channel in
        the color space.

        http://www.tannerhelland.com/3643/grayscale-image-algorithm-vb6/
     */
    function grayscaleDecompose() {
        if (this.drawing === true) {
            return;
        }

        this.drawing = true;
        var start = new Date().getTime();

        this.ctx.drawImage(this.canvas, 0, 0);

        var pixelData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        var r, g, b;
        for (var i = 0; i < pixelData.data.length; i += 4) {
            r = pixelData.data[i];
            g = pixelData.data[i + 1];
            b = pixelData.data[i + 2];

            if (this.options.decompose.toLowerCase() == "maximum")
                pixelData.data[i] = pixelData.data[i + 1] = pixelData.data[i + 2] = Math.max(r, g, b);
            else
                pixelData.data[i] = pixelData.data[i + 1] = pixelData.data[i + 2] = Math.min(r, g, b);

        }

        this.ctx.putImageData(pixelData, 0, 0);

        var end = new Date().getTime();
        this.drawing = false;

        if (this.options.debug === true) {
            console.log("Filter: Grayscale\nMethod: Luminosity\nExecution Time: " + (end - start) + "ms");
        }
    }

    /*!
         The lightness method is here as described by John D. Cook (and GIMP) which
         essentially modifies the average method to only take into account the
         most and least prominent channels in the color space.

        http://www.johndcook.com/blog/2009/08/24/algorithms-convert-color-grayscale/
     */
    function grayscaleLight() {
        if (this.drawing === true) {
            return;
        }

        this.drawing = true;
        var start = new Date().getTime();

        this.ctx.drawImage(this.canvas, 0, 0);

        var pixelData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        var r, g, b;
        for (var i = 0; i < pixelData.data.length; i += 4) {
            r = pixelData.data[i];
            g = pixelData.data[i + 1];
            b = pixelData.data[i + 2];

            pixelData.data[i] = pixelData.data[i + 1] = pixelData.data[i + 2] = (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
        }

        this.ctx.putImageData(pixelData, 0, 0);

        var end = new Date().getTime();
        this.drawing = false;

        if (this.options.debug === true) {
            console.log("Filter: Grayscale\nMethod: Lightness\nExecution Time: " + (end - start) + "ms");
        }
    }


    /*
        Separate each color channel into a number of even gaps in order to
        reduce the number of colors in the final image. Outcome should be
        basically like the posterize filter in Photoshop or what happens
        when saving a GIF with a low number of colors.
     */
    function posterize() {
        if (this.drawing === true) {
            return;
        }

        this.drawing = true;
        var start = new Date().getTime();

        this.ctx.drawImage(this.canvas, 0, 0);

        var pixelData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        var g = 256 / this.options.levels;
        for (var i = 0; i < pixelData.data.length; i += 4) {
            pixelData.data[i] = Math.round(pixelData.data[i] / g) * g;
            pixelData.data[i + 1] = Math.round(pixelData.data[i + 1] / g) * g;
            pixelData.data[i + 2] = Math.round(pixelData.data[i + 2] / g) * g;
        }

        this.ctx.putImageData(pixelData, 0, 0);

        var end = new Date().getTime();
        this.drawing = false;

        if (this.options.debug === true) {
            console.log("Filter: Posterize\nLevels: " + this.options.levels + "\nExecution Time: " + (end - start) + "ms");
        }
    }

    //TODO: See what happens if we do multiple passes with decreasing groupings and shift lengths each time
    /*
        Shift rows of pixels in the image by a random value relative to the
        size of the image in alternating directions to make a cool "glitchy"
        style look.
     */
    function glitch() {
        if (this.drawing === true) {
            return;
        }

        this.drawing = true;
        var start = new Date().getTime();

        this.ctx.drawImage(this.canvas, 0, 0);

        var dir = true;
        var tmp = null;
        //i == currY.
        //Loop through every row and manipulate the imageData for this row
        for (var i = 0; i < this.canvas.width; i++) {
            var pixelData = this.ctx.getImageData(0, i, this.canvas.width, 1); //get a single pixel row
            if (dir) {
                //Repeat this ten times to shift pixels down ten
                for (var y = 0; y < 9; y++) {
                    //Shift every pixel down one...When we hit the end, let's use our first pixel's value
                    for (var x = 0; x < pixelData.data.length - 4; x += 4) {
                        pixelData.data[x] = pixelData.data[x + 4]; //R of pixel
                        pixelData.data[x + 1] = pixelData.data[x + 5]; //B of pixel
                        pixelData.data[x + 2] = pixelData.data[x + 6]; //G of pixel
                        pixelData.data[x + 3] = pixelData.data[x + 7]; //A of pixel
                    }
                }
            }
            if (i % this.options.grouping === 0) dir = !dir;

            this.ctx.putImageData(pixelData, 0, i);
        }

        // var pixelData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        // var indicesPerRow = pixelData.data.length / this.canvas.width;
        //
        // var dir = true;
        // //Loop over every row in the image horizontally
        // for(var i = 0; i < pixelData.data.length; i+=indicesPerRow){
        //     //i should be the starting index of the row.
        //     //i + rowLength is the last index of the row.
        //     if(dir) {
        //         //Shift these rows to the left by stealing some pixels off the front and placing them at the end of
        //         // this column
        //
        //         //TypedArray here .set allows you to read from an array values in place into the array but it
        //         // writes over what was there so we need to slice out the first portion of the array (from i to
        //         // i+rowLength-numPixelsToShift and .set that into the array at index 0
        //         pixelData.data.set(pixelData.data.slice(i, i+indicesPerRow-(4*100)));
        //         dir = false;
        //     } else {
        //         //Shift these rows to the right
        //         dir = true;
        //     }
        // }
        //
        // this.ctx.putImageData(pixelData, 0, 0);

        var end = new Date().getTime();
        this.drawing = false;

        if (this.options.debug === true) {
            console.log("Filter: Glitch\nGrouping: " + this.options.grouping + "\nExecution Time: " + (end - start) + "ms");
        }
    }

    /*
        Invert all the colors in the image by setting each channel to 255 - V where V is the current value
     */
    function invertColors() {
        if (this.drawing === true) {
            return;
        }

        this.drawing = true;
        var start = new Date().getTime();
        this.ctx.drawImage(this.canvas, 0, 0);
        var pixelData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        for (var i = 0; i < pixelData.data.length; i += 4) {
            pixelData.data[i] = 255 - pixelData.data[i];
            pixelData.data[i + 1] = 255 - pixelData.data[i + 1];
            pixelData.data[i + 2] = 255 - pixelData.data[i + 2];
        }

        this.ctx.putImageData(pixelData, 0, 0);
        var end = new Date().getTime();
        this.drawing = false;

        if (this.options.debug === true) {
            console.log("Filter: Invert\nExecution Time: " + (end - start) + "ms");
        }
    }

    /*
        Rotate the color channels clockwise to see what happens. R -> G, G -> B, B ->R
     */
    function channelRotate() {
        if (this.drawing === true) {
            return;
        }

        this.drawing = true;
        var start = new Date().getTime();
        this.ctx.drawImage(this.canvas, 0, 0);
        var pixelData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        var r;
        var g;
        var b;
        for (var i = 0; i < pixelData.data.length; i += 4) {
            r = pixelData.data[i];
            g = pixelData.data[i + 1];
            b = pixelData.data[i + 2];
            pixelData.data[i] = b;
            pixelData.data[i + 1] = r;
            pixelData.data[i + 2] = g;
        }

        this.ctx.putImageData(pixelData, 0, 0);
        var end = new Date().getTime();
        this.drawing = false;

        if (this.options.debug === true) {
            console.log("Filter: Channel Rotate\nExecution Time: " + (end - start) + "ms");
        }
    }

    HTMLImageElement.prototype.Modiphy = function (options) {
        return new Modiphy(this, options);
    };

    window.Modiphy = Modiphy;
})(window);
