/*
Name: Timothy Luciani
Class: CS527
File: main.js
Assignment 1
*/
"use strict";
(function(){
  let
      particles = [], particle = { position:[0,0], velocity:{u:0,v:0}, forces: {x:0,y:0}, mass: 1.0, radius: 1.0 },
      canvas, ctx, animation_then, calculate_then;

  let objects = [{
    name: "floor", position: {x:0, y:1000}
  }];

  let animation_count = 0,
      computation_count = 0;

  function mouseClickCB(e) {
    /* Clone the particle template */
    let p = _.cloneDeep(particle);
    /* Set initial positions */
    p.position.x = e.x;
    p.position.y = e.y;
    /* Add the particle to the list */
    particles.push(p);
  }

  function derivativeEval(dt) {
    /* iterate over each particle */
    particles.forEach(function(p){
      Integration.euler_step(p, dt);
    });
  }

  function render(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    /* iterate over each particle and render them to the screen */
    particles.forEach(function(p){
      ctx.beginPath();
      ctx.arc(p.position.x, p.position.y, 50, 0, 2 * Math.PI, false);
      ctx.fillStyle = "rgb(255, 0, 0)";
      ctx.fill();
    });
  }

  function calculateNextStep(interval) {
    // request another frame
    requestAnimationFrame(calculateNextStep.bind(null,interval));

    // calculate elapsed time since last loop
    let now = Date.now(),
        elapsed = now - calculate_then;

    // if enough time has elapsed, draw the next frame
    if (elapsed > interval) {
      computation_count++;
      calculate_then = now - (elapsed % interval);
      /* Evaluate the derivative */
      derivativeEval(elapsed/1000);
    }
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
      // Also, adjust for fpsInterval not being multiple of 16.67
      animation_then = now - (elapsed % interval);

      /* Render the scene */
      render();
    }
  }
  /* Start animating at a certain fps */
  function setAnimationIntervals(fps,cb) {
    animation_then = calculate_then = Date.now();
    cb(1000 / fps);
  }

  function initialize() {
    /* Setup the canvas */
    canvas = document.getElementById("particleCanvas");
    ctx = canvas.getContext("2d");

    /* Add the click listener */
    canvas.addEventListener("click", mouseClickCB);

    /* Begin moving forward in time */
    setAnimationIntervals(120, calculateNextStep);
    /* Begin animation */
    setAnimationIntervals(32, animate);
  }

  /* start the application once the DOM is ready */
  document.addEventListener('DOMContentLoaded', initialize);

})();