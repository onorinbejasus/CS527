/*
Name: Timothy Luciani
Class: CS527
File: boids.js
Assignment 3
*/
"use strict";
(function(){

  const Boids_Manager = function() {

    const createBoid = Utilities.Model_Utils.createParticle;
    let self = {
      boids : []
    };

    /* Initialize the boids system
*  1) Create the boid particles
* */
    function initialize_system(flock_size) {

      for(let i = 0; i < flock_size; i++){
        self.boids.push(createBoid())
      }

    }

    /* Move all boids forward in time
    *  1) Alignment (Velocity)
    *  2) Cohesion (Position)
    *  3) Separation (Centering)
    * */
    function move_boids(dt) {

      /* Alignment -- Normalized neighbor velocity */

      /* Cohesion -- Normalized neighbor position */

      /* Separation
        -- Negated, normalized distance of boid with respect to each of its neighbors */
    }

    /* Renders the particles onto the screen */
    function render_boids(){

    }

    return {
      initialize: initialize_system,
      move: move_boids,
      render: render_boids
    }

  }



})();