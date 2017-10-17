/*
Name: Timothy Luciani
Class: CS527
File: boids.js
Assignment 3
*/
"use strict";

  const Boids_Manager = function() {

    /* Convenience utility function references */
    const createBoid   = Utilities.Model_Utils.createParticle3D,
          createVec   = Utilities.Vector_Utils.create_vector,
          difference   = Utilities.Vector_Utils.subtract,
          angleBetween = Utilities.Vector_Utils.angleBetween,
          multiply     = Utilities.Vector_Utils.multiply,
          divide       = Utilities.Vector_Utils.divide,
          shift_divide = Utilities.Vector_Utils.shift_divide,
          magnitude    = Utilities.Vector_Utils.magnitude,
          normalize    = Utilities.Vector_Utils.normalize,
          rotate2D    = Utilities.Vector_Utils.rotate2D,
          add          = Utilities.Vector_Utils.add,
          dot          = Utilities.Vector_Utils.dot;

    let Solver = null;

    let self = {
      height: 1200, width: 1600, binSize:50, width_binSize:1600/50, height_binSize:1200/50,
      boids : [], bins: [],
      particle_def: { position: {x:0,y:0,z:0}, velocity: {x:0,y:0,z:0}, forces: {x:0,y:0,z:0},
                      length: 10.0, rotation:{pitch:0, yaw:0, roll:0}, sight: 50, mass: 1, radius: 5,
                      separation: 30.0, maxSpeed: 2, maxForce: 0.03, name: -1, bin: -1, model:null}
    };

    self.objects = [
        {name: "left_wall", type: "wall", position: {x:0, y:0}, normal: {x:1, y:0}, center: {x:0, y:self.height/2.0}},
        {name: "left_wall", type: "wall", position: {x:0, y:0}, normal: {x:-1, y:0}, center: {x:self.width, y:self.height/2.0}},
        {name: "top_wall", type: "wall", position: {x:0, y:0}, normal: {x:0, y:1}, center: {x:self.width/2.0, y:0}},
        {name: "bottom_wall", type: "wall", position: {x:0, y:0}, normal: {x:0, y:-1}, center: {x:self.width/2.0, y:self.height}}
        ];

    function randomDirection() { return (Math.floor(Math.random() * 201) - 100) / 100.0; }
    function computeIndex(x,y) {
      return parseInt(y/self.binSize) + self.width_binSize * parseInt(x/self.binSize);
    }

    /* Initialize the boids system
     *  1) Create the boid particles */
    function initialize_system(flock_size, scene) {
      Utilities.Model_Utils.setParticleDefinition(self.particle_def);
      Solver = new Integration([]);

      return new Promise(function(resolve, reject){
        for(let w = 0; w <= self.width_binSize; w++){
          for(let h = 0; h <= self.height_binSize; h++){
            self.bins.push([]);
          }
        }

        let center = {x:40,y:40,z:40}, initial_bin = computeIndex(center.x, center.y);
        for(let i = 0; i < flock_size; i++){
          let boid = createBoid(center, {x:randomDirection(), y:0, z:randomDirection()}, "boid_"+i, initial_bin);

          /* Add the boid to the correct bin */
          self.bins[initial_bin].push(boid);
          self.boids.push(boid);

          /* Add the boid to the scene */
          scene.add(boid.model);
        }
        /* Done setting up */
        resolve();
      });
    }

    /* Finds the closest neighbors to the current boid
    *  Returns the indices of those neighbors */
    function find_closest_neighbors(boid) {
      let neighbors = [],
          distances = [],
          index = parseInt(boid.position.x/self.binSize) + self.width_binSize * parseInt(boid.position.y/self.binSize),
          neighbor_subset = [ self.bins[index] ];

      // if(index+1 < self.bins.length) neighbor_subset.push(self.bins[index+1]);
      // if(index+self.width_binSize < self.bins.length) neighbor_subset.push(self.bins[index+self.width_binSize]);
      // if(index > 0) neighbor_subset.push(self.bins[index-1]);
      // if(index-self.width_binSize > -1) neighbor_subset.push(self.bins[index-self.width_binSize]);

      neighbor_subset = [self.boids];

      for(let neighbor of _.flatten(neighbor_subset)) {
        if(boid.name === neighbor.name) continue;
        /* Calculate the distance */
        let distance_target = difference(neighbor.position,boid.position),
            distance = magnitude(distance_target);
        /* If the boid is close enough to us, add it as a neighbor*/
        if(distance < boid.sight) {
          /* Check if the neighbor is in our FOV (180 degrees -- good enough) */
          /* Point is right on top of the neighbor */
          if(magnitude(distance_target) > 0){
            let FOV = angleBetween(distance_target, boid.velocity);
            if(FOV <= Math.PI/2.0) {
              neighbors.push(neighbor);
              distances.push(distance);
            }
          }
        }
      }

      /* Only consider the 4 closest neighbors */
      if(neighbors.length > 10){
        /* LoDash Magic */
        neighbors = _.chain(distances)
          .toPairs().sortBy(1)
          .map(function (i) { return neighbors[i[0]]; })
          .value().slice(0,10);
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

    /* Avoid an object in our direct path */
    function avoid_object(boid){
      let force = createVec();
      /* iterate over the objects and check to see if we are within striking distance */
      for(let obstacle of self.objects){
        let visible = dot(boid.velocity, obstacle.normal);
        if(visible < 0){
          /* get the distance to the wall */
          let distance_target = difference(obstacle.center,boid.position),
              distance = Math.abs(dot(distance_target, obstacle.normal));
          /* If we can see the wall, react */
          if(distance < boid.sight){
            let angle = angleBetween(distance_target, boid.velocity);
            if(angle >= Math.PI/2.0){
              angle -= Math.PI/2.0;
            }
            let target = rotate2D(boid.velocity, angle),
                avoidance = compute_seeking_force(target,boid),
                distanceCM = distance/100.0;
            force = add(force, multiply(avoidance, (boid.sight/100.0) /(distanceCM*(1.0+distanceCM)) ));
          }
        }
      }
      return force;
    }

    /* Move all boids forward in time
    *  1) Alignment (Velocity)
    *  2) Cohesion (Position)
    *  3) Separation (Centering) */
    function compute_flocking_force(boid,dt) {
      /* Find the closest neighbors */
      let neighbors = find_closest_neighbors(boid);
      /* Initiate the three rules */
      /* Alignment -- Normalized neighbor velocity */
      let alignment  = createVec(),
          alignment_force = createVec(),
          /* Separation -- Negated, normalized distance of boid with respect to each of its neighbors */
          separation = createVec(),
          separation_force = createVec(),
          separationCount = 0,
          /* Cohesion -- Normalized neighbor position */
          cohesion   = createVec(),
          cohesion_target = createVec(),
          cohesive_force = createVec(),

          seeking_force = createVec(),
          avoidance_force = createVec(),

          /* New velocity -- The combined velocity rules */
          desired_velocity = createVec();

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

        /* Calculate the velocities */
        separation_force = compute_seeking_force(separation, boid);
        cohesion_target = difference(cohesion, boid.position);
        cohesive_force = compute_seeking_force(cohesion_target, boid);
        alignment_force = compute_seeking_force(alignment, boid);
      }

      /* Direction to seek */
      seeking_force = compute_seeking_force( difference({ x:0, y: 100, z: 0 }, boid.position), boid );
      // avoidance_force = avoid_object(boid);

      /* Add the 3 flocking rules for the new velocity */
      desired_velocity  =
        add(multiply(separation_force, 1.5),
        cohesive_force, alignment_force,
        multiply(seeking_force, 0.05), avoidance_force);

      /* Return the acceleration */
      return multiply(desired_velocity, boid.mass);
    }

    function flock(dt) {
      for(let boid of self.boids) {
        /* Step forward in time */
        Solver.RK4_step(boid, dt,[compute_flocking_force]);

        /* Get the indices */
        // let boid_index = self.bins[boid.bin].indexOf(boid),
        //     new_bin = parseInt(boid.position.x/self.binSize) + self.width_binSize * parseInt(boid.position.y/self.binSize);
        // /* Remove the element from the old bin, place it in the new one */
        // if (boid_index > -1) {
        //   self.bins[boid.bin].splice(boid_index, 1);
        // }
        // boid.bin = new_bin;
        // self.bins[new_bin].push(boid);

      }}

      function render_boids_3D(){
        /* iterate over each of the boids
           and render a triangle around its position */
        for(let boid of self.boids){
          let lookAt = normalize(boid.velocity);
          boid.model.position.set(boid.position.x,boid.position.y,boid.position.z);
          boid.model.lookAt(new THREE.Vector3(boid.velocity.x,boid.velocity.y,boid.velocity.z));
        }

      }

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

      for(let i = 0; i < self.width; i+=50){
        ctx.beginPath();
        ctx.moveTo(i,0);
        ctx.lineTo(i,self.height);
        ctx.stroke();
      }
      for(let j = 0; j < self.height; j+=50){
        ctx.beginPath();
        ctx.moveTo(0,j);
        ctx.lineTo(self.width,j);
        ctx.stroke();
      }
    }

    return {
      initialize: initialize_system,
      navigate: flock,
      render: render_boids_3D
    }

  }();