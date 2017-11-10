/*
Name: Timothy Luciani
Class: CS527
File: integration_schemes.js
*/
"use strict";
const Y_UP = -1.0;

let DRAG_COEFFICIENT = 0.47, // dimensionless
    FLUID_DENSITY = 1.22; // kg/m

let Integration = (function(){

  /* Read in the tableau */
  let tableau;
  d3.json("../utilities/data/RK_Tableaus.json", function(data) {
    tableau = data;
  });

  return function(options){

    /* Utility shortcuts */
    const CONSTANT_FORCES = options.constant_forces,
          vector_utils = Utilities.Vector_Utils,
          multiply = vector_utils.multiply,
          add = vector_utils.add,
          divide = vector_utils.divide;

    const RK_A = tableau[options.scheme]["A"],
          RK_B = tableau[options.scheme]["B"],
          RK_C = tableau[options.scheme]["C"];

    function clearAndAccumulateForces(p, other_forces, dt) {
      /* Clear the previous forces */
      p.forces = Utilities.Vector_Utils.zero(p.forces);
      /* Accumulate the constant forces */
      for(let force of _.flatten([CONSTANT_FORCES, other_forces])){
        p.forces = add(p.forces, force(p,dt));
      }
      /* return the acceleration*/
      return divide(p.forces,p.mass);
    }

    /* Euler Integration */
    function euler(p, forces, options) {
      /* Check to see if any non-constant forces were passed */
      let other_forces = forces || [],
          p_prime = _.clone(p);

      p_prime.position = Utilities.Vector_Utils.create_vector(options.y0[0]);
      p_prime.velocity = Utilities.Vector_Utils.create_vector(options.y0[1]);

      /* Accumulate the forces on the particle and calculate the acceleration */
      let acceleration = Utilities.Vector_Utils.toVector(clearAndAccumulateForces(p_prime, other_forces, options.dt)),
          /* Calculate the new velocity */
          k = vector_utils.vectorScalarMultiply(acceleration, options.dt),
          /* Use the new and previous velocity to calculate the new position */
          l = vector_utils.vectorScalarMultiply(options.y0[1], options.dt);
      return [l, k];
    }

    /**
     * RK4 Integration Butcher's Tab.
     * @constructor
     * @param {function} ODE - Calculates the ODE and returns an {array} of results
     * @param {array} y0 - An array of initial y conditions.
     * @param {float} h - time step,
     * @param {object} options - number of return variables, number of dimensions, etc
     */
    function RK_Tableau(ODE, y0, h, options) {
      /* Intermediate steps: initializes mxn k vector
      * IMPORTANT: This must be a vector so that the matrix multiplications work correctly
      * */
      let k = Utilities.Matrix_Utils.create(options.numVars*options.dimensions, RK_C.length);
      //[...Array(RK4_C.length)].map(() => Array.from({length:RK4_C.length}, () => [0,0,0] ));
      /* Iterate over and compute the intermediate steps */
      for(let i = 0; i < RK_C.length; i++){
        /* Pre-compute h*A and K*B*/
        let hA  = RK_A[i]*h,
            hB  = vector_utils.multiply(RK_B[i], h),
            hBk = _.chunk(vector_utils.matrixVectorMultiply(k, hB), options.dimensions);
        /* Add the step to the matrix */
        let solution = _.flatten(ODE({y0:add(y0,hBk), dt:h+hA} ));
        for(let ii = 0; ii < solution.length; ii++)
          k[ii][i] = solution[ii];
      }

      /* Set the final result from based on the ODE */
      /* This will multiply scale each of the ODE's output
      *  Now we want a matrix for the dot product
      * */
      /* return y prime */
      let output = vector_utils.matrixVectorMultiply(k, RK_C);
      return _.chunk(output, options.dimensions);
    }

    return {
      Runge_Kutta: RK_Tableau,
      euler_step: euler,
    }
  };

})();