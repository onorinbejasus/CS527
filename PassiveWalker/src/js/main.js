/*
Name: Timothy Luciani
Class: CS527
File: simpleWalker2D.js
Final Project
*/
"use strict";

var App = App || {};

(function () {

  /*Application variables*/
  let
    canvas, ctx, previous_time, calculate_then, total_elapsed = 0,
    animation_count = 0, interval;

  /* Walker variables */
  let walker, slope = -0.1, L = 2.5, multiplier = 40, offset_x = 0, offset_y = 0, ramp_size, IC;

  function render_ramp() {
    ctx.lineWidth = 3;
    ctx.strokeStyle = "black";
    Utilities.Render_Utils.drawLine(ctx,
      parseInt(IC.swing_foot[0] * multiplier + offset_x),
      canvas.height - parseInt(IC.swing_foot[1] * multiplier + offset_y),
      parseInt(ramp_size * multiplier + offset_x),
      canvas.height - parseInt((IC.swing_foot[1] - ramp_size) * Math.tan(slope) * multiplier + offset_y)
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
        elapsed = now - previous_time;
    total_elapsed += elapsed;
    // Get ready for next frame by setting then=now, but...
    previous_time = now - (elapsed % interval);

    // if enough time has elapsed, draw the next frame
    if (elapsed > interval) {
      animation_count++;

      /* Move the walker forward in the scene */
      walker.walk(total_elapsed/1e3 + Number.EPSILON);

      /* Render the scene */
      //render();
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

    App.render = true;

    /* Pixel offset to place walker in the middle */
    offset_x = 20;
    offset_y = canvas.height / 2.0;
    ramp_size = canvas.width;

    /* Initialize the walker */
    walker = new Sagittal_Walker_3D({gamma: slope, L: L, step_size:1e-3});

    /* get the initial conditions (ICs) */
    IC = walker.initialize({
      start_time: 0,
      maxIncreaseFactor: 2,
      maxDecreaseFactor: 4
    });

    /* start the application once the DOM is ready */
    document.addEventListener('keydown', (event) => {
      const keyName = event.key;

      if (keyName === 'a') {
        console.log("start");
        /* Begin animation */
        setAnimationIntervals(64, animate);
      }

    }, false);
  }

  document.addEventListener('DOMContentLoaded', initialize);

})();