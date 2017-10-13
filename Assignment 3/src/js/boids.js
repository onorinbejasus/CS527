/*
Name: Timothy Luciani
Class: CS527
File: boids.js
Assignment 3
*/
"use strict";

  const Boids_Manager = function() {

    const createBoid = Utilities.Model_Utils.createParticle;
    let self = {
      boids : [],
      particle_def: { position: {x:0,y:0}, velocity: {x:0,y:0}, forces: {x:0,y:0},
                      length: 1.0, rotation:{pitch:0, yaw:0, roll:0} }
    };

    /* Initialize the boids system
     *  1) Create the boid particles
     * */
    function initialize_system(flock_size) {

      Utilities.Model_Utils.setParticleDefinition(self.particle_def);

      for(let i = 0; i < flock_size; i++){
        self.boids.push(createBoid({x:200 + i * 20, y:200+ i * 20}));
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
    function render_boids(ctx){
      /* iterate over each of the boids
         and render a triangle around its position */
      for(let boid of self.boids){

        /* Save the context state*/
        ctx.save();

        let half = Utilities.Vector_Utils.shift_divide(boid.position);

        ctx.beginPath();
        ctx.moveTo(boid.position.x-10,boid.position.y);
        ctx.lineTo(boid.position.x+10, boid.position.y+7);
        ctx.lineTo(boid.position.x+10, boid.position.y-7);
        ctx.fill();

        ctx.restore();
      }

    }

    return {
      initialize: initialize_system,
      move: move_boids,
      render: render_boids
    }

  }();