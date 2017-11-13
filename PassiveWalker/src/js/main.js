/*
Name: Timothy Luciani
Class: CS527
File: simpleWalker2D.js
Final Project
*/
"use strict";
(function () {
  let
    canvas, ctx, animation_then, calculate_then,
    animation_count = 0, slope = 0.01, L = 2.5, multiplier = 40, offset_x = 0, offset_y = 0,
    IC;

  let walker;

  function render_ramp() {
    ctx.lineWidth = 3;
    ctx.strokeStyle = "black";
    Utilities.Render_Utils.drawLine(ctx,
      parseInt(IC.swing_foot[0] * multiplier + offset_x),
      canvas.height - parseInt(IC.swing_foot[1] * multiplier + offset_y),
      parseInt(10.25 * multiplier + offset_x),
      canvas.height - parseInt((IC.swing_foot[1] - 10.25) * Math.tan(slope) * multiplier + offset_y)
    );
  }

  function render() {
    /* Clear the canvas s*/
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* Render the slope */
    render_ramp();

    /* Render the walker */
    walker.render({ctx: ctx, multiplier: multiplier, offset: [offset_x, offset_y], height: canvas.height});
  }

  /* based on the request animation example here: http://jsfiddle.net/m1erickson/CtsY3/*/
  function animate(interval) {
    // request another frame
    requestAnimationFrame(animate.bind(null, interval));

    // calculate elapsed time since last loop
    let now = Date.now(),
      elapsed = now - animation_then;

    // if enough time has elapsed, draw the next frame
    if (elapsed > interval) {
      animation_count++;
      // Get ready for next frame by setting then=now, but...
      animation_then = now - (elapsed % interval);

      /* Move the walker forward in the scene */
      walker.walk(0.001);

      /* Render the scene */
      render();
    }
  }

  /* Start animating at a certain fps */
  function setAnimationIntervals(fps, cb) {
    animation_then = calculate_then = Date.now();
    cb(1000.0 / fps);
  }

  function initialize() {
    /* Setup the canvas */
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");

    /* Pixel offset to place walker in the middle */
    offset_x = canvas.width / 4.0;
    offset_y = canvas.height / 2.0;
    /* Initialize the walker */
    walker = new Simple_Walker_2D({gamma: slope, L: L});
    IC = walker.initialize();

    /* Begin animation */
    setAnimationIntervals(1000, animate);
  }

  /* start the application once the DOM is ready */
  document.addEventListener('DOMContentLoaded', initialize);

})();