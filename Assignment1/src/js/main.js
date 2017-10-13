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
    let p = Utilities.Model_Utils.createParticle();
    /* Set initial positions */
    p.position = {x:e.x, y:e.y};
    /* Add the particle to the list */
    particles.push(p);
  }

  function render(){


    if(motion_blur){
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }



    /* iterate over each particle and render them to the screen */
    particles.forEach(function(p){

      /* Save the context state*/
      ctx.save();

      ctx.translate(p.position.x, p.position.y);
/*
      /!* If a collision occurred, deform the ball *!/
      if(p.collision) {
        ctx.translate(p.position.x, p.position.y - p.deformation);
        p.collision = false;
      }
      else {
        /!* Translate the ball to it's position *!/
        ctx.translate(p.position.x, p.position.y);
      }*/

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
        Integration.RK4_step(p, 1.3/33.0);
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

  function setupCallbacks() {
    $(".btn-group > button.btn").on("click", function(){
      /* Switch the active button highlight */
      $(".btn-group > .btn").removeClass("active");
      $(this).addClass("active");

      /* Switch on the different viscosity */
      /* Used this paper for the viscosity */
      switch($(this).text()){
        case 'Air':
          FLUID_DENSITY = 1.22;
          background = "rgba(238,238,238,0.4)";
          d3.select("#particleCanvas")
              .attr("class", "")
              .classed("background_air", true);
          break;
        case 'Water':
          FLUID_DENSITY = 1000;
          background = "rgba(214, 234, 248,0.4)";
          d3.select("#particleCanvas")
              .attr("class", "")
              .classed("background_water", true);
          break;
        case 'Mercury':
          FLUID_DENSITY = 13595;
          background = "rgba(250, 219, 216,0.4)";
          d3.select("#particleCanvas")
              .attr("class", "")
              .classed("background_mercury", true);
          break;
      }
    });

    /* Change the mass of the particles  */
    d3.select('#massSlider').call(
        d3.slider()
        .axis(d3.svg.axis().ticks(12)).min(1).max(50).step(1)
        .on("slide", function(evt, value) {
          d3.select('#massText').text("Mass: " + value+"kg");
          /* Set the particles to a heavier mass */
          let val = parseInt(value);
          particles.forEach(function(p){
            p.mass = val;
          });
        })
    );

    /* Motion Blur selection */
    $('input[name=blur]').click(function() {
      if($('input[name=blur]:checked').val() === "On") {
        motion_blur = true;
      }
      else {
        motion_blur = false;
      }
    });
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

    setupCallbacks();

  }

  /* start the application once the DOM is ready */
  document.addEventListener('DOMContentLoaded', initialize);

})();