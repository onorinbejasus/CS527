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
          multiply_components     = Utilities.Vector_Utils.multiply_components,
          divide       = Utilities.Vector_Utils.divide,
          limit       = Utilities.Vector_Utils.limit,
          magnitude    = Utilities.Vector_Utils.magnitude,
          normalize    = Utilities.Vector_Utils.normalize,
          add          = Utilities.Vector_Utils.add,
          dot          = Utilities.Vector_Utils.dot;

    let Solver = null;
    let clock = new THREE.Clock();


    let goal = { x:100, y: 100, z: 0 };

    let self = {
      height: 400, width: 400, depth: 400,  binSize:50, width_binSize:1600/50, height_binSize:1200/50,
      boids : [], bins: [],
      particle_def: { position: {x:0,y:0,z:0}, velocity: {x:0,y:0,z:0}, forces: {x:0,y:0,z:0},
                      length: 10.0, rotation:{pitch:0, yaw:0, roll:0}, sight: 50, mass: 1, radius: 5,
                      separation: 30.0, maxSpeed: 2, maxForce: 0.03, name: -1, bin: -1, model:null}
    };

    self.objects = [
      {name: "left_wall", type: "wall", position: {x:0, y:0, z:0}, normal: {x:1, y:0,z:0},
        center: {x:0, y:self.height/2.0, z:self.depth/2.0}},
      {name: "right_wall", type: "wall", position: {x:0, y:0, z:0}, normal: {x:-1, y:0,z:0},
        center: {x:self.width, y:self.height/2.0, z:self.depth/2.0}},

      {name: "front_wall", type: "wall", position: {x:0, y:0, z:0}, normal: {x:0, y:0,z:1},
        center: {x:self.width/2, y:self.height/2.0, z:0}},
      {name: "back_wall", type: "wall", position: {x:0, y:0, z:0}, normal: {x:-0, y:0,z:-1},
        center: {x:self.width/2.0, y:self.height/2.0, z:self.depth}},

      {name: "top_wall", type: "wall", position: {x:0, y:0, z:0}, normal: {x:0, y:-1,z:0},
        center: {x:self.width/2.0, y:self.height, z:self.depth/2.0}},
      {name: "bottom_wall", type: "wall", position: {x:0, y:0, z:0}, normal: {x:0, y:1,z:0},
          center: {x:self.width/2.0, y:0, z:self.depth/2.0}},

    ];
    self.scene = null;
    self.mixers = [];

    function randomDirection() { return (Math.floor(Math.random() * 399) - 399 )  }
    function computeIndex(x,y) {
      return parseInt(y/self.binSize) + self.width_binSize * parseInt(x/self.binSize);
    }

    /* Initialize the boids system
     *  1) Create the boid particles */
    function initialize_system(flock_size, direction, scene) {
      Utilities.Model_Utils.setParticleDefinition(self.particle_def);
      Solver = new Integration([]);

      self.scene = scene;

      /* Load the FBX model */

      // MeshLoader.loadFBX('models/fbx/fishy2.fbx', self.mixers)
      MeshLoader.loadJSON('models/json/fishy.json', self.mixers)
        .then(function(obj){
          // let center = {x:40,y:100,z:40};//, initial_bin = computeIndex(center.x, center.y);
          for(let i = 0; i < flock_size; i++){
            let center = {x:40 + i*25,y:100,z:40+ i*25};
            let boid = createBoid(center, {x:direction[0], y:direction[1], z:direction[2]}, "boid_"+i, -1, obj.clone());

            /* Add the boid to the correct bin */
            // self.bins[initial_bin].push(boid);
            self.boids.push(boid);

            /* Add the boid to the scene */
            scene.add(boid.model);
          }

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
      // if(neighbors.length > 10){
      //   /* LoDash Magic */
      //   neighbors = _.chain(distances)
      //     .toPairs().sortBy(1)
      //     .map(function (i) { return neighbors[i[0]]; })
      //     .value().slice(0,10);
      // }

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

      let newDir = new THREE.Vector3(boid.velocity.x, boid.velocity.y, boid.velocity.z);
      let pos = new THREE.Vector3();
      pos.addVectors(newDir, boid.model.position);

      let raycaster = new THREE.Raycaster(boid.model.position, newDir, 0, boid.sight*100),
        intersects = raycaster.intersectObjects( self.scene.getObjectByName( "sphereGroup" ).children );


      for(let intersect of intersects){
        let normal = new THREE.Vector3();
        let distanceCM = intersect.distance/10.0;
        normal.subVectors(intersect.point, intersect.object.position);
        normal.multiplyScalar((0.1) / (distanceCM*(distanceCM+0.01)));
        force = add(force, {x:normal.x, y:normal.y, z:normal.z});
      }


      for(let obstacle of self.objects){
        if(obstacle.type === "wall"){
          let visible = dot(boid.velocity, obstacle.normal);
          if(visible < 0){
            /* get the distance to the wall */
            let distance_target = difference(obstacle.center,boid.position),
              distance = Math.abs(dot(distance_target, obstacle.normal));
            /* If we can see the wall, react */
            if(distance < boid.sight){
              let distanceCM = distance/100.0,
                f = multiply(obstacle.normal, (0.1) / (distanceCM*(distanceCM+0.01)) );
              force = add(force, f);
            }
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

          /* steering forces */
          seeking_force = createVec(),
          steering_force = createVec();

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
      let avoidance_force = avoid_object(boid);

      let avoidance_mag = magnitude(avoidance_force);
      let max = boid.maxSpeed*2.0;
      /* Check the speed of the incoming boid */
      if(avoidance_mag > max){
        let speed_remainder = avoidance_mag - max,
            avoidance_normal = normalize(avoidance_force),
            other_direction = difference({x:1,y:1,z:1}, avoidance_normal);

        avoidance_force = limit(avoidance_force, max);
        /* add some of the remaining force to the seek position */

        /* add the force to the other directions */
        seeking_force = multiply(compute_seeking_force(goal, boid), (speed_remainder*dt));
        seeking_force = multiply_components(seeking_force, other_direction);

        /* set the seeking force */
        steering_force = add(multiply(avoidance_force, 1.5), seeking_force);
      }
      else {
        steering_force = multiply(compute_seeking_force(difference(goal, boid.position), boid), 0.05);
      }

      /* Add the 3 flocking rules for the new velocity */
      let desired_velocity  =
        add(multiply(separation_force, 1.25),
        cohesive_force, alignment_force,
        steering_force);

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

        boid.velocity = limit(boid.velocity, boid.maxSpeed);

      }}

    function render_boids_3D(animation_count){

      // if ( self.mixers.length > 0 ) {
      //   for ( let i = 0; i < self.mixers.length; i++ ) {
      //     self.mixers[ i ].update( clock.getDelta() );
      //   }
      // }

      if(animation_count % 50 === 0){
        goal.x = randomDirection();
        goal.y = randomDirection();
        goal.z = randomDirection();
        console.log("change goal");
      }

      /* iterate over each of the boids
         and render a triangle around its position */
      for(let boid of self.boids){

        boid.model.position.set(boid.position.x,boid.position.y,boid.position.z);
        let unitVelocity = normalize(boid.velocity);

        boid.model.lookAt(new THREE.Vector3(unitVelocity.x, unitVelocity.y, 0.0));

        let newDir = new THREE.Vector3(boid.velocity.x, boid.velocity.y, boid.velocity.z);
        let pos = new THREE.Vector3();
        pos.addVectors(newDir, boid.model.position);
        boid.model.lookAt(pos);

        // boid.model.quaternion.setFromUnitVectors(new THREE.Vector3(-1,0,0),
        //   new THREE.Vector3(unitVelocity.x, unitVelocity.y, 0.0) );
        // console.log();
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