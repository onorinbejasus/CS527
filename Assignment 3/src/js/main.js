/*
Name: Timothy Luciani
Class: CS527
File: main.js
Assignment 3
*/
"use strict";
(function(){
  let
      particles = [],
      canvas, ctx, animation_then, calculate_then,
      background = "rgba(238,238,238,0.4)";

  let objects = [{
    name: "floor", type: "wall", position: {x:0, y:1000}, normal: {x: 0, y:1}
  }];

  let animation_count = 0,
      computation_count = 0;

  let motion_blur = false;

  function mouseClickCB(e) {
    /* Clone the particle template */
    //let p = Utilities.Model_Utils.createParticle( {position:{x:e.x, y:e.y}} );
    /* Add the particle to the list */
    //particles.push(p);
  }

  function render(){
    /* Clear the canvas s*/
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    /* Render the scene */
    Boids_Manager.render(ctx);
  }

  function derivativeEval(dt) {
    /* iterate over each particle */
    particles.forEach(function(p){
      if(p.motion){
        /* Integrate */
        Integration.RK4_step(p, dt);
      }
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
      animation_then = now - (elapsed % interval);

      //calculateNextStep(elapsed/1e3);
      Boids_Manager.navigate(elapsed/1e3);

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

    Boids_Manager.initialize(8);

    /* Add the click listener */
    // canvas.addEventListener("click", mouseClickCB);

    /* Begin animation */
    setAnimationIntervals(64, animate);
  }

  /* start the application once the DOM is ready */
  document.addEventListener('DOMContentLoaded', initialize);

})();