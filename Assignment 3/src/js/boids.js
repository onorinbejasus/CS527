/*
Name: Timothy Luciani
Class: CS527
File: boids.js
Assignment 3
*/
"use strict";

  const Boids_Manager = function() {

    const createBoid = Utilities.Model_Utils.createParticle,
          difference = Utilities.Vector_Utils.subtract,
          magnitude  = Utilities.Vector_Utils.magnitude;

    let Solver = null;

    let self = {
      boids : [],
      particle_def: { position: {x:0,y:0}, velocity: {x:0,y:0}, forces: {x:0,y:0},
                      length: 1.0, rotation:{pitch:0, yaw:0, roll:0}, mass: 1 }
    };

    /* Initialize the boids system
     *  1) Create the boid particles
     * */
    function initialize_system(flock_size) {

      Utilities.Model_Utils.setParticleDefinition(self.particle_def);
      Solver = new Integration([]);

      for(let i = 0; i < flock_size; i++){
        self.boids.push(createBoid({x:200 + i * 20, y:200+ i * 20}, {x:-2, y:0}));
      }

    }

    /* Finds the closest neighbors to the current boid
    *  Returns the indices of those neighbors
    * */
    function find_closest_neighbors(boid) {
      let neighbors = [];
      for(let neighbor of self.boids) {
        if(boid === neighbor) continue;
        /* Calculate the distance */
        let distance = magnitude(difference(neighbor.position,boid.position));
        /* If the boid is close enough to us, add it as a neighbor*/
        if(distance < 100) {
          neighbors.push( neighbor );
        }
      }
      return neighbors;
    }

    /* Move all boids forward in time
    *  1) Alignment (Velocity)
    *  2) Cohesion (Position)
    *  3) Separation (Centering)
    * */
    function move_boids(dt) {

      for(let boid of self.boids){

        /* Alignment -- Normalized neighbor velocity */

        let neighbors = find_closest_neighbors(boid);




        /* Cohesion -- Normalized neighbor position */

        /* Separation
          -- Negated, normalized distance of boid with respect to each of its neighbors */

        Solver.RK4_step(boid, dt);

      }

    }

    /* Renders the particles onto the screen */
    function render_boids(ctx){
      /* iterate over each of the boids
         and render a triangle around its position */
      for(let boid of self.boids){

        /* Save the context state*/
        ctx.save();

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
      navigate: move_boids,
      render: render_boids
    }

  }();