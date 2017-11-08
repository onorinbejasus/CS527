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

  let Matrix_Utils = function(){
    return {
      create: function(m,n) {
        let mat = [...Array(m)].map(() => Array.from({length:n}, () => 0 ));
        mat.constructor = "Matrix";
        return mat;
      },
      createAndSet(mat){
        let m = Matrix_Utils.create(mat.length, mat[0].length);
        for(let i = 0; i < mat.length; i++){
          for(let j = 0; j < mat[i].length; j++){
            m[i][j] = mat[i][j];
          }
        }
      return m;
      }
    }
  }();

  /* Vector Math Utilities */
  let Vector_Utils =  function() {
    return {
      /* Create a 2D empty vector */
      create_vector() { return {x:0,y:0,z:0} },
      toVector(v) { return _.values(v); },

      /* Add all components of a and b*/
      // add: function(a, ...b) {
      //   let c = {};
      //   /* previous implementation for x,y,z vectors */
      //   if(_.isPlainObject(a)){
      //     _.keys(a).forEach(function(key){
      //       c[key] = a[key];
      //       for(let B of b){
      //         c[key] += B[key];
      //       }
      //     });
      //   }
      //   /* Add two 'array' vectors */
      //   else if(_.isArray(a[0]) && _.isArray(b[0])) {
      //     c = [];
      //     for(let i = 0; i < a.length; i++){
      //       c.push(Vector_Utils.add(a[i], b[0][i]))
      //     }
      //     return c;
      //   }
      //   /* Array addition */
      //   else {
      //     c = [];
      //     for(let i = 0; i < a.length; i++){
      //       c[i] = a[i] + b[0][i];
      //     }
      //   }
      //   return c;
      // },

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

      /* Based on :
      https://stackoverflow.com/questions/4492678/swap-rows-with-columns-transposition-of-a-matrix-in-javascript*/
      transpose: function (a) {

        // Calculate the width and height of the Array
        let w = a.length || 0;
        let h = a[0] instanceof Array ? a[0].length : 0;

        // In case it is a zero matrix, no transpose routine needed.
        if(h === 0 || w === 0) { return []; }

        /**
         * @var {Number} i Counter
         * @var {Number} j Counter
         * @var {Array} t Transposed data is stored in this array.
         */
        let i, j, t = [];

        // Loop through every item in the outer array (height)
        for(i=0; i<h; i++) {

          // Insert a new row (array)
          t[i] = [];

          // Loop through every item per item in outer array (width)
          for(j=0; j<w; j++) {

            // Save transposed data.
            t[i][j] = a[j][i];
          }
        }
        return t;
      },

      /* Multiple all components of a with b */
      simplifiedMatrixMatrixMultiply: function(a,b) {

        let c = {};
        _.keys(a).forEach(function(key){
          c[key] = a[key] * b[key]
        });

        /* if the input is an array, return an array*/
        if(_.isArray(a)){
          return _.values(c);
        }
        else{
          return c;
        }
      },

      /* Matrix-Vector multiplication */
      matrixVectorMultiply(m,v) {
        /* Invalid sizes */
        if(m[0].length !== v.length ) return null;
        let c = [];
        for(let i = 0; i < m.length; i++){
          c.push(Vector_Utils.dot(m[i], v));
        }
        return c;
      },

      /* Vector-Matrix multiplication */
      vectorMatrixMultiply(v,m) {
        /* Invalid sizes */
        if(v.length !== m.length ) return null;
        let c = [], entry = 0;
        for(let i = 0; i < v.length; i++){
          entry = 0;
          for(let j = 0; j < m[i].length; j++){
            entry += v[i] * m[i][j];
          }
          c.push(entry);
        }
        return c;
      },

      /* Multiply each component of the vector v by a scalar s */
      vectorScalarMultiply(v,s){
       return _.map(v, _.curry(_.multiply)(s));
      },

      /* Multiple all components of a with s */
      multiply_components: function(a,b) {
        let c = {};
        _.keys(a).forEach(function(key){
          c[key] = a[key] * b[key]
        });
        return c;
      },

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

      // /* Multiple all components of a with s */
      // multiply: function(a, ...s) {
      //   let c = {};
      //   /* Check the type of arguments */
      //   if(s.length === 1) {
      //     /* Matrix-Vector Multiplication */
      //     if(a.constructor === "Matrix" && _.isArray(s[0])){
      //       return Vector_Utils.matrixVectorMultiply(a,s[0]);
      //     }
      //     /* Vector x Vector of vectors */
      //     else if(_.isArray(a) && _.isArray(s[0])) {
      //       if(a.length !== s[0][0].length) return null;
      //       c = [];
      //       let vec = s[0];
      //       for(let i = 0; i < vec.length; i++){
      //         c.push(Vector_Utils.dot(vec[i], a));
      //       }
      //       return c;
      //     }
      //     /* Vector Vector Multiplication */
      //     else if(_.isPlainObject(a) && _.isPlainObject(s[0])){
      //       return Vector_Utils.simplifiedMatrixMatrixMultiply(a, s[0]);
      //     }
      //     /* Vector-Matrix Multiplication */
      //     else if(_.isArray(a) && s[0].constructor === "Matrix"){
      //       return Vector_Utils.vectorMatrixMultiply(a, s[0]);
      //     }
      //   }
      //
      //   /* Vector * array of scalars */
      //   if(_.isArray(a)){
      //     c = [];
      //     a.forEach(function(v){
      //       let entry = v;
      //       for(let S of s) {
      //         entry *= S;
      //       }
      //       c.push(entry);
      //     })
      //   }
      //
      //   /* Object notation */
      //   else{
      //     _.keys(a).forEach(function(key){
      //       c[key] = a[key];
      //       for(let S of s){
      //         c[key] *= S;
      //       }
      //     });
      //   }
      //
      //   return c;
      // },

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
              Vector_Utils.simplifiedMatrixMatrixMultiply(o.normal, {x:1, y:Y_UP})),

            v = Utilities.Vector_Utils.dot(
              particle.velocity, Vector_Utils.simplifiedMatrixMatrixMultiply(o.normal, {x:1, y:Y_UP})
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
          particle.model.lookAt(new THREE.Vector3(0,0,0));
          // particle.model.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),
          //   new THREE.Vector3(unitVelocity.x, unitVelocity.y, unitVelocity.z) );

          return particle;
        }
      }
  }();

  return {Vector_Utils: Vector_Utils, Model_Utils: Model_Utils, Matrix_Utils: Matrix_Utils};
}();