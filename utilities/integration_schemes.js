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
        add = Utilities.Vector_Utils.add,
        divide = Utilities.Vector_Utils.divide,
        shift_divide = Utilities.Vector_Utils.shift_divide,
        create_particle = Utilities.Model_Utils.createParticle;

  function clearAndAccumulateForces(p,other_forces) {
    /* Clear the previous forces */
    p.forces = Utilities.Vector_Utils.zero(p.forces);
    /* Accumulate the constant forces */

    for(let force of _.flatten([CONSTANT_FORCES, other_forces])){
      p.forces = add(p.forces, force(p));
    }

    return divide(p.forces,p.mass);
  }

  /* Euler Integration */
  function euler(p,dt) {
    /* Accumulate the forces on the particle and calculate the acceleration */
    let acceleration = clearAndAccumulateForces(p),
        /* Calculate the new velocity */
        d_v = add(p.velocity, multiply(acceleration, dt)),
        /* Use the new and previous velocity to calculate the new position */
        d_x = add(p.position, multiply(d_v, dt * 100.0 /* Convert back to cm */));
    /* Set the new velocity */
    if(!isNaN(d_v.y) && isFinite(d_v.y))
      p.velocity = d_v;
    /* convert back to cm */
    if(!isNaN(d_x.y) && isFinite(d_x.y))
      p.position = d_x;
  }

  function RK4(p, dt, forces) {
    /* Check to see if any non-constant forces were passed */
    let other_forces = forces || [];

    /* Calculate the initial acceleration */
    let acceleration = clearAndAccumulateForces(p,other_forces);
    /* K1 -- Euler */
    let k1 = multiply(acceleration,dt),
        /* Save k1/2.0 for later use */
        k1over2 = shift_divide(k1),
        /* Euler Velocity = v*dt */
        d_v1 = multiply(p.velocity, dt, 100.0 /*m->cm*/),
        /* Calculate the euler midpoint position: p1 = p0 * (v*dt)/2.0 */
        p1 = create_particle( add(p.position, shift_divide(d_v1)) );

    /* Calculate the acceleration at the Euler position */
    acceleration = clearAndAccumulateForces(p1,other_forces);
    /* K2 -- First Midpoint */
    let k2 = multiply(acceleration,dt),
        /* Save k2/2.0 for later use */
        k2over2 = shift_divide(k2),
        /* Midpoint velocity: d_v2 = dt * (v0 + k1/2.0) */
        dv_2 = multiply(add(p.velocity, k1over2), dt, 100.0 /*m->cm*/),
        /* Calculate the midpoint position: p2 = p0 * (v*dt)/2.0 */
        p2 = create_particle( add(p.position, shift_divide(dv_2)) );

    /* Calculate the acceleration at the first midpoint position */
    acceleration = clearAndAccumulateForces(p2,other_forces);
    /* K3 -- Second Midpoint */
    let k3 = multiply(acceleration,dt),
        /* Midpoint velocity: d_v3 = dt * (v0 + k2) */
        dv_3 = multiply( add(p.velocity, k2over2), dt, 100.0 /*m->cm*/),
        /* Calculate the midpoint position: p2 = p0 * (v*dt)/2.0 */
        p3 = create_particle( add(p.position, dv_3) );

    /* Calculate the acceleration at the last midpoint */
    acceleration = clearAndAccumulateForces(p3,other_forces);
    /* K4 -- Last Midpoint */
    let k4 = multiply(acceleration,dt),
        /* Midpoint velocity: d_v3 = dt * (v0 + k3) */
        dv_4 = multiply( add(p.velocity, k3), dt, 100.0 /*m->cm*/);

    /* Set the new position */
    p.position = add(p.position,
                      multiply(d_v1, 0.16667),
                      multiply(dv_2, 0.33334),
                      multiply(dv_3, 0.33334),
                      multiply(dv_4, 0.16667));

    /* Set the new velocity */
    p.velocity = add(p.velocity,
                        multiply(k1, 0.16667),
                        multiply(k2, 0.33334),
                        multiply(k3, 0.33334),
                        multiply(k4, 0.16667));
  }

  return {
    euler_step: euler,
    RK4_step: RK4
  }

};