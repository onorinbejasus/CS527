/*
Name: Timothy Luciani
Class: CS527
File: main.js
Assignment 1
*/
"use strict";
(function(){
  let
      particles = [],
      particle = { position:[0,0], velocity:{x:0,y:0}, forces: {x:0,y:0}, mass: 1.0/*kg*/, radius: 25.0/*cm*/,
        motion: true, collision: false, deformation : 50.0 },
      canvas, ctx, animation_then, calculate_then;

  let objects = [{
    name: "floor", type: "wall", position: {x:0, y:1000}, normal: {x: 0, y:1}
  }];

  let animation_count = 0,
      computation_count = 0;

  function mouseClickCB(e) {
    /* Clone the particle template */
    let p = _.cloneDeep(particle);
    /* Set initial positions */
    p.position = {x:e.x, y:e.y};
    /* Add the particle to the list */
    particles.push(p);
  }

  function render(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#EEEEEE";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    /* iterate over each particle and render them to the screen */
    particles.forEach(function(p){

      /* Save the context state*/
      ctx.save();

      /* If a collision occurred, deform the ball */
      if(p.collision) {
        ctx.translate(p.position.x, p.position.y - p.deformation);
        p.collision = false;
      }
      else {
        /* Translate the ball to it's position */
        ctx.translate(p.position.x, p.position.y);
      }

      /* Scale to deform the ball on impact */
      //ctx.scale(1.0/(p.deformation/50.0), 1.0);

      /* Draw the ball */
      ctx.beginPath();
      ctx.arc(0,0, p.radius, 0, 2 * Math.PI, false);

      /* Restore the original state*/
      ctx.restore();

      ctx.fillStyle = "rgb(255, 0, 0)";
      ctx.fill();
    });
  }

  function derivativeEval(dt) {
    /* iterate over each particle */
    particles.forEach(function(p){
      if(p.motion){
        /* Integrate */
        Integration.euler_step(p, dt);
        /* Iterate over every object and check for collisions */
        Utilities.Model_Utils.checkForIntersections(p, objects);
        /* Check the deformation and bring it back to its normal scale */
        // if( parseInt(p.radius-p.deformation) !== 0){
        //   let diff = parseInt(p.radius-p.deformation)/2.0;
        //   p.deformation = _.clamp(Math.round(p.deformation + diff), p.radius);
        // }
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

    /* Add the click listener */
    canvas.addEventListener("click", mouseClickCB);

    /* Begin moving forward in time */
    setAnimationIntervals(128, calculateNextStep);
    /* Begin animation */
    setAnimationIntervals(64, animate);
  }

  /* start the application once the DOM is ready */
  document.addEventListener('DOMContentLoaded', initialize);

})();