/*
Name: Timothy Luciani
Class: CS527
File: boids.js
Assignment 3
*/
"use strict";

  const Boids_Manager = function() {

    /* Convenience utility function references */
    const createBoid   = Utilities.Model_Utils.createParticle,
          createVec2   = Utilities.Vector_Utils.create_vector,
          difference   = Utilities.Vector_Utils.subtract,
          angleBetween = Utilities.Vector_Utils.angleBetween,
          multiply     = Utilities.Vector_Utils.multiply,
          divide       = Utilities.Vector_Utils.divide,
          magnitude    = Utilities.Vector_Utils.magnitude,
          normalize    = Utilities.Vector_Utils.normalize,
          dot          = Utilities.Vector_Utils.dot,
          add          = Utilities.Vector_Utils.add;

    let Solver = null;

    let self = {
      boids : [],
      particle_def: { position: {x:0,y:0}, velocity: {x:0,y:0}, forces: {x:0,y:0},
                      length: 1.0, rotation:{pitch:0, yaw:0, roll:0}, sight: 75, mass: 1, maxSpeed: 4, maxForce: 0.2 }
    };

    /* Initialize the boids system
     *  1) Create the boid particles
     * */
    function initialize_system(flock_size) {

      Utilities.Model_Utils.setParticleDefinition(self.particle_def);
      Solver = new Integration([]);

      let radius = 75, center = {x:1200,y:400}, toRadians = Math.PI/180.0;
      for(let i = 0; i < flock_size; i++){
        let angle = (i * 30 * toRadians),
            x = center.x + Math.cos(angle) * radius,
            y = center.y + Math.sin(angle) * radius,
            boid = createBoid({x:x, y:y}, {x:-2, y:0});
        boid.name = i;
        self.boids.push(boid);
      }
    }

    /* Finds the closest neighbors to the current boid
    *  Returns the indices of those neighbors */
    function find_closest_neighbors(boid) {
      let neighbors = [];
      for(let neighbor of self.boids) {
        if(boid === neighbor) continue;
        /* Calculate the distance */
        let distance = magnitude(difference(neighbor.position,boid.position));
        /* If the boid is close enough to us, add it as a neighbor*/
        if(distance < boid.sight) {
          /* Check if the neighbor is in our FOV (270 degrees -- good enough) */
          let FOV = angleBetween(difference(neighbor.position, boid.position), boid.velocity);
          if(FOV <= Math.PI/2.0) {
            neighbors.push( neighbor );
          }
        }
      }
      return neighbors;
    }

    /* Steer the boid in the direction of the target vector */
    function compute_steering_force(target_vector, boid){
      /* Desired velocity */
      let desired_vel = normalize(difference(target_vector,boid.position), boid.maxSpeed);
      /* Return the normalized steering force */
      return normalize(difference(desired_vel,boid.velocity), boid.maxForce);
    }

    /* Move all boids forward in time
    *  1) Alignment (Velocity)
    *  2) Cohesion (Position)
    *  3) Separation (Centering) */
    function compute_flocking_force(boid) {

      /* Find the closest neighbors */
      let neighbors = find_closest_neighbors(boid);
      /* Initiate the three rules */

      // if(boid.name === 0){
      //   console.log(neighbors)
      // }

      /* Alignment -- Normalized neighbor velocity */
      let alignment  = createVec2(),
          /* Cohesion -- Normalized neighbor position */
          cohesion   = createVec2(),
          /* Separation -- Negated, normalized distance of boid with respect to each of its neighbors */
          separation = createVec2(),
          /* New velocity -- The combined velocity rules */
          new_velocity = createVec2();

      /* Iterate over the neighbors and calculate the alignment, cohesion, and separation */
      for(let neighbor of neighbors){

        /* Alignment -- Add the neighbors velocity */
        //alignment = add(alignment, neighbor.velocity);

        /* Cohesion -- Add the neighbors position */
        cohesion = add(cohesion, neighbor.position);

        /* Separation -- repel by the neighbors position */
      }

      if(neighbors.length){
        /* Normalize the three rules based on the number of neighbors */
        /* alignment = ||alignment_total / #neighbors|| */

        /* cohesion = ||(cohesion_all / #neighbors) - boid.position||*/
        let target = difference(divide(cohesion,neighbors.length), boid.position),
            steering_force = compute_steering_force(target, boid);

        /* Add the 3 flocking rules for the new velocity, then
         * normalize the new velocity by the boids instantaneous speed */
        new_velocity = steering_force;
      }
      /* Return the acceleration */
      return multiply(new_velocity, boid.mass);
    }

    function move_boids(dt) {
      for(let boid of self.boids) {
        /* Step forward in time */
        Solver.RK4_step(boid, dt,[compute_flocking_force]);
      }
    }

    /* Renders the particles onto the screen */
    function render_boids_2D(ctx){
      /* iterate over each of the boids
         and render a triangle around its position */
      for(let boid of self.boids){
        /* Save the context state*/
        ctx.save();
        // ctx.beginPath();
        // ctx.moveTo(boid.position.x-10,boid.position.y);
        // ctx.lineTo(boid.position.x+10, boid.position.y+7);
        // ctx.lineTo(boid.position.x+10, boid.position.y-7);
        let width = 25, height = 15,
            angle = angleBetween({x:-1,y:0},boid.velocity);
        ctx.translate(boid.position.x+width/2, boid.position.y-height/2, width, height);
        ctx.rotate(angle*Math.PI/180);
        ctx.fillRect(-width/2, -height/2, width, height);
        ctx.fill();
        ctx.restore();
      }

    }

    return {
      initialize: initialize_system,
      navigate: move_boids,
      render: render_boids_2D
    }

  }();