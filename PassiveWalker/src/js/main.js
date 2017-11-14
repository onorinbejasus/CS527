/*
Name: Timothy Luciani
Class: CS527
File: simpleWalker2D.js
Final Project
*/
"use strict";
(function () {

  /*Application variables*/
  let
    canvas, ctx, previous_time, calculate_then, total_elapsed = 0,
    animation_count = 0, interval;

  /* Walker variables */
  let walker, slope = 0.01, L = 2.5, multiplier = 40, offset_x = 0, offset_y = 0, IC;

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
  function animate() {

    // request another frame
    requestAnimationFrame(animate);

    // calculate elapsed time since last loop
    let now = Date.now(),
      elapsed = now - previous_time + Number.EPSILON;
      total_elapsed += elapsed;
      // Get ready for next frame by setting then=now, but...
      previous_time = now - (elapsed % interval);

    // if enough time has elapsed, draw the next frame
    if (elapsed > interval) {
      animation_count++;

      /* Move the walker forward in the scene */
      walker.walk(total_elapsed/1e3);

      /* Render the scene */
      render();
    }

  }

  /* Start animating at a certain fps */
  function setAnimationIntervals(fps, cb) {
    previous_time = calculate_then = Date.now();
    interval = 1000.0 / fps;
    cb();
  }

  function initialize() {
    /* Setup the canvas */
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");

    /* Pixel offset to place walker in the middle */
    offset_x = canvas.width / 4.0;
    offset_y = canvas.height / 2.0;
    /* Initialize the walker */
    walker = new Simple_Walker_2D({gamma: slope, L: L, step_size:1e-3});

    /* get the initial conditions (ICs) */
    IC = walker.initialize({
      start_time: 0,
      maxIncreaseFactor: 1,
      maxDecreaseFactor: 1
    });

    /* Begin animation */
    setAnimationIntervals(64, animate);
  }

  /* start the application once the DOM is ready */
  document.addEventListener('DOMContentLoaded', initialize);

})();