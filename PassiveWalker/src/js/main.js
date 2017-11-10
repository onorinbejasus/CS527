/*
Name: Timothy Luciani
Class: CS527
File: simpleWalker2D.js
Final Project
*/
"use strict";
(function(){
  let
    canvas, ctx, animation_then, calculate_then,
    animation_count = 0;

  function render(){
    /* Clear the canvas s*/
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    /* Render the walker */
    Simple_Walker_2D.render();
  }

  /* based on the request animation example here: http://jsfiddle.net/m1erickson/CtsY3/*/
  function animate(interval) {
    // request another frame
    requestAnimationFrame(animate.bind(null,interval));

    // calculate elapsed time since last loop
    let now = Date.now(),
      elapsed = now - animation_then;

    // if enough time has elapsed, draw the next frame
    if (elapsed > interval) {
      animation_count++;
      // Get ready for next frame by setting then=now, but...
      animation_then = now - (elapsed % interval);

      /* Move the walker forward in the scene */
      Simple_Walker_2D.walk(elapsed/1e3);

      /* Render the scene */
      render();
    }
  }

  /* Start animating at a certain fps */
  function setAnimationIntervals(fps,cb) {
    animation_then = calculate_then = Date.now();
    cb(1000.0 / fps);
  }

  function initialize() {
    /* Setup the canvas */
    canvas = document.getElementById("particleCanvas");
    ctx = canvas.getContext("2d");

    /* Initialize the walker */
    Simple_Walker_2D.initialize();

    /* Begin animation */
    setAnimationIntervals(64, animate);
  }

  /* start the application once the DOM is ready */
  document.addEventListener('DOMContentLoaded', initialize);

})();