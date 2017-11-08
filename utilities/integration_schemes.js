/*
Name: Timothy Luciani
Class: CS527
File: integration_schemes.js
*/
"use strict";

const Y_UP = -1.0;

let DRAG_COEFFICIENT = 0.47, // dimensionless
    FLUID_DENSITY = 1.22; // kg/m^3

let Integration = function(CONSTANT_FORCES){

  /* Utility shortcuts */
  const multiply = Utilities.Vector_Utils.multiply,
        dot = Utilities.Vector_Utils.dot,
        transpose = Utilities.Vector_Utils.transpose,
        add = Utilities.Vector_Utils.add,
        divide = Utilities.Vector_Utils.divide,
        shift_divide = Utilities.Vector_Utils.shift_divide,
        limit = Utilities.Vector_Utils.limit,
        create_particle = Utilities.Model_Utils.createParticle3D;

  const RK4_A = [0, 0.5, 0.5, 1],
        RK4_B = Utilities.Matrix_Utils.createAndSet(
          [
            [0,   0,   0, 0],
            [0.5, 0,   0, 0],
            [0,   0.5, 0, 0],
            [0,   0,   1, 0]
          ]),
        RK4_C = [1/3, 1/6, 1/6, 1/3];

  function clearAndAccumulateForces(p, other_forces, dt) {
    /* Clear the previous forces */
    let forces = Utilities.Vector_Utils.zero(p.forces);
    /* Accumulate the constant forces */
    for(let force of _.flatten([CONSTANT_FORCES, other_forces])){
      forces = add(forces, force(p,dt));
    }
    /* return the acceleration*/
    return divide(forces,p.mass);
  }

  /* Euler Integration */
  function euler(p, forces, y0, dt) {
    /* Check to see if any non-constant forces were passed */
    let other_forces = forces || [],
      /* Convert back to cm */
        dt_cm = dt * 100.0;
    /* Accumulate the forces on the particle and calculate the acceleration */
    let acceleration = clearAndAccumulateForces(p, other_forces),
        /* Calculate the new velocity */
        d_v = add(y0[1], multiply(acceleration, dt)),
        /* Use the new and previous velocity to calculate the new position */
        d_x = add(y0[0], multiply(d_v, dt_cm));
    return [d_x, d_v];
  }

  /**
   * RK4 Integration Butcher's Tab.
   * @constructor
   * @param {function} ODE - Calculates the ODE and returns an {array} of results
   * @param {array} y0 - An array of initial y conditions.
   * @param {float} h, time step
   */
  function RK_Tableau(ODE, y0, h) {

    /* Intermediate steps: initializes mxn k vector
    * IMPORTANT: This must be a vector so that the matrix multiplications work correctly
    * */
    let k = [...Array(RK4_C.length)].map(() => Array.from({length:y0.length}, () => [0,0,0] ));
    /* Iterate over and compute the intermediate steps */
    for(let i = 0; i < RK4_C.length; i++){
      /* Pre-compute h*A and K*B*/
      let hA  = RK4_A[i]*h,
          hB  = multiply(RK4_B[i], h),
          hBk = multiply(hB,transpose(k));

      /* Add the increment to the matrix */
      k[i] = ODE(hA, add(y0,hBk));
    }
    /* Set the final result from based on the ODE */
    /* This will multiply scale each of the ODE's output
    *  Now we want a matrix for the dot product
    * */
    let kt = Utilities.Matrix_Utils.createAndSet(transpose(k));
    /* returned y_dot */
    return multiply(kt, RK4_C);
  }

  /* RK4 Integration */
  function RK4(p, dt, forces) {
    /* Check to see if any non-constant forces were passed */
    let other_forces = forces || [];
    /*dt * conversion m->cm*/
    let dt_cm = dt * 100.0;
    /* Calculate the initial acceleration */
    let acceleration = clearAndAccumulateForces(p,other_forces,dt);
    /* K1 -- Euler */
    let k1 = multiply(acceleration,dt),
        /* Save k1/2.0 for later use */
        k1over2 = shift_divide(k1),
        /* Euler Velocity = v*dt */
        dv_1 = p.velocity,
        /* Calculate the euler midpoint position: p1 = p0 * (v*dt)/2.0 */
        p1 = create_particle( add(p.position, shift_divide(multiply(dv_1,dt_cm))),dv_1, p.name );

    /* Calculate the acceleration at the Euler position */
    acceleration = clearAndAccumulateForces(p1,other_forces,dt);
    /* K2 -- First Midpoint */
    let k2 = multiply(acceleration,dt),
        /* Save k2/2.0 for later use */
        k2over2 = shift_divide(k2),
        /* Midpoint velocity: d_v2 = dt * (v0 + k1/2.0) */
        dv_2 = add(p.velocity, k1over2),
        /* Calculate the midpoint position: p2 = p0 * (v*dt)/2.0 */
        p2 = create_particle( add(p.position, shift_divide(multiply(dv_2,dt_cm))),dv_2, p.name );

    /* Calculate the acceleration at the first midpoint position */
    acceleration = clearAndAccumulateForces(p2,other_forces,dt);
    /* K3 -- Second Midpoint */
    let k3 = multiply(acceleration,dt),
        /* Midpoint velocity: d_v3 = dt * (v0 + k2) */
        dv_3 = add(p.velocity, k2over2),
        /* Calculate the midpoint position: p2 = p0 * (v*dt)/2.0 */
        p3 = create_particle( add(p.position, multiply(dv_3,dt_cm)),dv_3, p.name );

    /* Calculate the acceleration at the last midpoint */
    acceleration = clearAndAccumulateForces(p3,other_forces,dt);
    /* K4 -- Last Midpoint */
    let k4 = multiply(acceleration,dt),
    /* Midpoint velocity: d_v3 = dt * (v0 + k3) */
        dv_4 = add(p.velocity, k3);

    /* Set the new position */
    let dvt = add(multiply(dv_1, 0.16667),
                  multiply(dv_2, 0.33334),
                  multiply(dv_3, 0.33334),
                  multiply(dv_4, 0.16667));

    p.position = add(p.position, multiply(dvt,dt_cm));

    /* Set the new velocity */
    p.velocity = limit(
        add(p.velocity,
            multiply(k1, 0.16667),
            multiply(k2, 0.33334),
            multiply(k3, 0.33334),
            multiply(k4, 0.16667)
        ), p.maxSpeed)
    ;
  }

  return {
    Runge_Kutta: RK_Tableau,
    euler_step: euler,
    RK4_step: RK4
  }

};