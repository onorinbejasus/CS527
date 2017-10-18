/*
Name: Timothy Luciani
Class: CS527
File: utilities.js
*/
"use strict";
const Utilities = function(){
  /* Global Definitions */
  const FLOOR_RESTITUTION  = 0.7, DEFAULT_VALUE = 1.0;
  let particle_def = { position:{x:0,y:0,z:0}, velocity:{x:0,y:0,z:0}, forces: {x:0,y:0,z:0}, mass: 1.0/*kg*/, radius: 25.0};
  let default_material = new THREE.MeshBasicMaterial( {color: 0xff0000} );


    /* Vector Math Utilities */
    let Vector_Utils =  function() {
      return {
        /* Create a 2D empty vector */
        create_vector() { return {x:0,y:0,z:0} },
        /* Add all components of a and b*/
        add: function(a, ...b) {
          let c = {};
          _.keys(a).forEach(function(key){
            c[key] = a[key];
            for(let B of b){
              c[key] += B[key];
            }
          });
          return c;
        },

        /* Difference all components of a and b */
        subtract: function(a, ...b) {
          let c = {};
          _.keys(a).forEach(function(key){
            c[key] = a[key];
            for(let B of b){
              c[key] -= B[key];
            }
          });
          return c;
        },

        /* Normalize the vector */
        limit: function(a,b) {
          let c = {},
              magnitude = Vector_Utils.magnitude(a);
          if(magnitude > 0 && magnitude > (b || DEFAULT_VALUE)){
            _.keys(a).forEach(function(key) {
              c[key] = a[key] / (magnitude || DEFAULT_VALUE) * (b || DEFAULT_VALUE);
            });
            return c;
          }
          return a;
        },

        normalize: function(a,b) {
          let c = {},
              magnitude = Vector_Utils.magnitude(a);
          _.keys(a).forEach(function(key){
            c[key] = a[key] / (magnitude || DEFAULT_VALUE) * (b || DEFAULT_VALUE);
          });
          return c;
        },

        /* Angle between vectors a and b */
        angleBetween: function(a,b) {
          let a_mag = Vector_Utils.magnitude(a),
              b_mag = Vector_Utils.magnitude(b);
          return Math.acos(Vector_Utils.dot(a,b) / (a_mag*b_mag));
        },

        /* Multiple all components of a with s */
        multiply: function(a, ...s) {
          let c = {};
          _.keys(a).forEach(function(key){
            c[key] = a[key];
            for(let S of s){
              c[key] *= S;
            }
          });
          return c;
        },

        /* Divide all components of a by s */
        divide: function(a, ...s) {
          let c = {};
          _.keys(a).forEach(function(key){
            c[key] = a[key];
            for(let S of s){
              c[key] /= S;
            }
          });
          return c;
        },

        /* Divide all components by 2 */
        shift_divide: function(a) {
          let c = {};
          _.keys(a).forEach(function(key){
            c[key] = a[key] >> 1;
          });
          return c;
        },

        /* Multiply all components by 2 */
        shift_multiply: function(a) {
          let c = {};
          _.keys(a).forEach(function(key){
            c[key] = a[key] << 1;
          });
          return c;
        },

        /* Multiple all components of a with s */
        multiply_components: function(a,b) {
          let c = {};
          _.keys(a).forEach(function(key){
            c[key] = a[key] * b[key]
          });
          return c;
        },

        /* Get the magnitude of the vector */
        magnitude: function(a) {
          return Math.sqrt(Vector_Utils.dot(a,a));
        },

        /* Get the magnitude of the vector */
        sqrt_component: function(a) {
          let c = {};
          _.keys(a).forEach(function(key){
            let sign = Math.sign(a[key]);
            c[key] = sign * Math.sqrt(sign * a[key]);
          });
          return c;
        },

        /* Zero out all values */
        zero: function(a) {
          let c = {};
          _.keys(a).forEach(function(key){
            c[key] = 0
          });
          return c;
        },

        /* Dot vectors a and b */
        dot: function(a,b) {
          let c = 0;
          _.keys(a).forEach(function(key){
            c += a[key] * b[key];
          });
          return c;
        },

        /* Rotate 2D */
        rotate2D: function(v,axis,angle){
          switch(axis){
            case 'z':
              return {x:v.x*Math.cos(angle)-v.y*Math.sin(angle), y:v.x*Math.sin(angle)+v.y*Math.cos(angle), z:v.z};
            case 'x':
              return {x:v.x,y:v.y*Math.cos(angle)-v.z*Math.sin(angle), z:v.y*Math.sin(angle)+v.z*Math.cos(angle)};
            case 'y':
              return {x:v.x*Math.cos(angle)+v.z*Math.sin(angle), y:v.y, z:v.z*Math.cos(angle)-v.x*Math.sin(angle)};
          }
        },

        rotateArbAxis(v, axis, angle){
          let oneMinusCos = 1.0 - Math.cos(angle);
          let xRot = v.x * (Math.cos(angle) + (axis.x*axis.x)*oneMinusCos)
                + v.y * ((axis.x*axis.y)*oneMinusCos - axis.z*Math.sin(angle))
                + v.z * ((axis.x*axis.z)*oneMinusCos + axis.y*Math.sin(angle));

          let yRot = v.x * ((axis.y*axis.x)*oneMinusCos + axis.z*Math.sin(angle))
            + v.y * (Math.cos(angle) + (axis.y*axis.y)*oneMinusCos)
            + v.z * ((axis.y*axis.z)*oneMinusCos - axis.x*Math.sin(angle));

          let zRot = v.x * ((axis.z*axis.x)*oneMinusCos - axis.y*Math.sin(angle))
            + v.y * ((axis.y*axis.z)*oneMinusCos + axis.x*Math.sin(angle))
            + v.z * (Math.cos(angle) + (axis.z*axis.z)*oneMinusCos);

          return {x:xRot, y:yRot, z:zRot};
        }

      }
    }();

    /* Utilities for checking model conditions and create elements */
    let Model_Utils = function() {
        return {

          setParticleDefinition: function(def){
            particle_def = def;
          },

          checkForIntersections: function(particle, objects) {
            /* Check for an intersection with any of the objects */
            objects.forEach(function(o){

              let e = particle.radius,
              c = Utilities.Vector_Utils.dot(
                Vector_Utils.subtract(particle.position, o.position),
                Vector_Utils.multiply_components(o.normal, {x:1, y:Y_UP})),

              v = Utilities.Vector_Utils.dot(
                particle.velocity, Vector_Utils.multiply_components(o.normal, {x:1, y:Y_UP})
              );

              /* Check if a collision occurred */
              if(c < e && v < 0) {
                particle.collision = true;
                particle.deformation = particle.radius - c;
                // particle.motion = false;

                let absorbed_force = (1.0-FLOOR_RESTITUTION) * particle.velocity.y;

                if(o.type === "wall") {
                  /* Flip the tangent component on the velocity */
                  particle.velocity.y = Y_UP * FLOOR_RESTITUTION * particle.velocity.y;
                  /* place the particle one radius above the object */
                  particle.position.y = o.position.y - particle.radius;
                }
              }

              /* Stop the particle if it is just resting on the bottom */
              if(o.name === "floor"){
                if(Math.abs(Utilities.Vector_Utils.magnitude(particle.forces) - 9.81) < 0.09 &&
                    Math.abs(o.position.y - particle.position.y) <= particle.radius
                ){
                  particle.motion = false;
                }
                else {
                  particle.motion = true;
                }
              }

            });
          },

          createParticle2D: function(position,velocity,name,bin) {
            /* Clone the particle template*/
            let particle = _.cloneDeep(particle_def);
            /* Set the particle attributes */
            particle.position = position || Vector_Utils.create_vector();
            particle.velocity = velocity || Vector_Utils.create_vector();
            particle.name = name || "";
            particle.bin = bin || -1;

            return particle;
          },

          createParticle3D: function(position,velocity,name,bin,model) {
            /* Clone the particle template*/
            let particle = _.cloneDeep(particle_def);
            /* Set the particle attributes */
            particle.position = position || Vector_Utils.create_vector();
            particle.velocity = velocity || Vector_Utils.create_vector();
            particle.name = name || "";
            particle.bin = bin || -1;

            /* Create the boid model */
            if(model){
              particle.model = model;
            }
            else {
              let geometry = new THREE.ConeGeometry(particle.radius, particle.length, 32);
              particle.model = new THREE.Mesh( geometry, default_material );
            }
            particle.model.position.set(position.x,position.y,position.z);

            let unitVelocity = Vector_Utils.normalize(velocity);
            particle.model.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),
              new THREE.Vector3(unitVelocity.x, unitVelocity.y, unitVelocity.z) );

            return particle;
          }
        }
    }();

  return {Vector_Utils: Vector_Utils, Model_Utils: Model_Utils};
}();