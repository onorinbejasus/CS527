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
          limit        = Utilities.Vector_Utils.limit,
          magnitude    = Utilities.Vector_Utils.magnitude,
          normalize    = Utilities.Vector_Utils.normalize,
          add          = Utilities.Vector_Utils.add;

    let Solver = null;

    let self = {
      boids : [],
      particle_def: { position: {x:0,y:0}, velocity: {x:0,y:0}, forces: {x:0,y:0},
                      length: 1.0, rotation:{pitch:0, yaw:0, roll:0}, sight: 75, mass: 1,
                      separation: 30.0, maxSpeed: 2, maxForce: 0.03, name: -1}
    };

    function randomDirection() { return (Math.floor(Math.random() * 201) - 100) / 100.0; }

    /* Initialize the boids system
     *  1) Create the boid particles */
    function initialize_system(flock_size) {
      Utilities.Model_Utils.setParticleDefinition(self.particle_def);
      Solver = new Integration([]);

      let radius = 20, center = {x:1200,y:600}, toRadians = Math.PI/180.0;
      for(let i = 0; i < flock_size; i++){
        let
            // angle = (i * 30 * toRadians),
            // x = center.x + Math.cos(angle) * radius,
            // y = center.y + Math.sin(angle) * radius,
            boid = createBoid(center, {x:randomDirection(), y:randomDirection()}, "boid_"+i);
        self.boids.push(boid);
      }
    }

    /* Finds the closest neighbors to the current boid
    *  Returns the indices of those neighbors */
    function find_closest_neighbors(boid) {
      let neighbors = [],
          distances = [];
      for(let neighbor of self.boids) {
        if(boid.name === neighbor.name) continue;
        /* Calculate the distance */
        let distance = magnitude(difference(neighbor.position,boid.position));
        /* If the boid is close enough to us, add it as a neighbor*/
        if(distance < boid.sight) {
          /* Check if the neighbor is in our FOV (270 degrees -- good enough) */
          let diff = difference(neighbor.position, boid.position);
          /* Point is right on top of the neighbor */
          if(magnitude(diff) >  0){
            let FOV = angleBetween(diff, boid.velocity);
            if(FOV <= Math.PI/2.0) {
              neighbors.push( neighbor );
              distances.push(distance);
            }
          }
        }
      }

      /* Only consider the 4 closest neighbors */
      if(neighbors.length > 4){
        /* LoDash Magic */
        neighbors = _.chain(distances)
          .toPairs().sortBy(1)
          .map(function (i) { return neighbors[i[0]]; })
          .value().slice(0,4);
        console.log();
      }

      return neighbors;
    }

    /* Steer the boid in the direction of the target vector */
    function compute_seeking_force(target_vector, boid){
      /* Desired velocity */
      let desired_vel = normalize(target_vector,boid.maxSpeed);
      /* Return the normalized steering force */
      return difference(desired_vel,boid.velocity);
    }

    /* Move all boids forward in time
    *  1) Alignment (Velocity)
    *  2) Cohesion (Position)
    *  3) Separation (Centering) */
    function compute_flocking_force(boid) {
      /* Find the closest neighbors */
      let neighbors = find_closest_neighbors(boid);
      /* Initiate the three rules */
      /* Alignment -- Normalized neighbor velocity */
      let alignment  = createVec2(),
          /* Separation -- Negated, normalized distance of boid with respect to each of its neighbors */
          separation = createVec2(),
          separationCount = 0,
          /* Cohesion -- Normalized neighbor position */
          cohesion   = createVec2(),
          /* New velocity -- The combined velocity rules */
          desired_velocity = createVec2();

      /* Iterate over the neighbors and calculate the separation, cohesion, and alignment */
      for(let neighbor of neighbors){
        /* Separation -- repel by the neighbors position */
        let target = difference(boid.position,neighbor.position),
            distance = magnitude(target);

        /* We want to check the max separation */
        if(distance > 0 && distance < boid.separation){
          /* Weight the target vector by the distance from the current boid */
          target = divide(normalize(target), distance);
          /* Add to target force to the separation */
          separation = add(separation, target);
          /* Increment the separation count */
          separationCount++;
        }

        /* Alignment -- Add the neighbors velocity */
        alignment = add(alignment, neighbor.velocity);
        /* Cohesion -- Add the neighbors position */
        cohesion = add(cohesion, neighbor.position);
      }

      if(neighbors.length){
        /* Normalize the three rules based on the number of neighbors */
        separation = divide(separation,separationCount||1.0);
        alignment  = divide(alignment,neighbors.length);
        cohesion   = divide(cohesion,neighbors.length);

        let separation_force = compute_seeking_force(separation, boid);
        //separation_force = difference(separation_force, boid.velocity);

        /* Weight the separation higher to prioritize it*/
        separation_force = multiply(separation_force, 1.5);

        let cohesion_target = difference(cohesion, boid.position),
          cohesive_force = compute_seeking_force(cohesion_target, boid);
          //cohesive_force = normalize(cohesion_target, boid.maxSpeed);//compute_steering_force(cohesion_target, boid);
            //cohesive_force = difference(cohesive_force, boid.velocity);

        let alignment_force = compute_seeking_force(alignment, boid);
            //alignment_force = difference(alignment_force, boid.velocity);

        let seeking = compute_seeking_force( difference({ x:0, y: 0 }, boid.position), boid );
          /* Add the 3 flocking rules for the new velocity, then
           * normalize the new velocity by the boids instantaneous speed */
        desired_velocity  = add(separation_force, cohesive_force, alignment_force, seeking);
      }
      /* Return the acceleration */
      return desired_velocity;
    }

    function flock(dt) {
      for(let boid of self.boids) {
        /* Step forward in time */
        Solver.euler_step(boid, dt,[compute_flocking_force]);

        if(boid.position.x <= -7.5){
          // console.log(boid.position.x);
          boid.position.x = 1600 - boid.position.x;
        }
        else if(boid.position.x > 1607){
          boid.position.x = boid.position.x - 1600;
        }

        if(boid.position.y <= -5){
          boid.position.y = 1200 - boid.position.y;
        }
        else if(boid.position.y > 1205){
          boid.position.y = boid.position.y - 1200;
        }

      }}

    /* Renders the particles onto the screen */
    function render_boids_2D(ctx){
      /* iterate over each of the boids
         and render a triangle around its position */
      for(let boid of self.boids){
        /* Save the context state*/
        ctx.save();
        let width = 15, height = 10,
            angle = angleBetween({x:0,y:0},boid.velocity);
        ctx.translate(boid.position.x+width/2, boid.position.y-height/2, width, height);
        ctx.rotate(angle);
        ctx.fillRect(-width/2, -height/2, width, height);
        ctx.fill();
        ctx.restore();
      }

    }

    return {
      initialize: initialize_system,
      navigate: flock,
      render: render_boids_2D
    }

  }();