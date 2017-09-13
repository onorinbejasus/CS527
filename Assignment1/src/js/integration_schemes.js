/*
Name: Timothy Luciani
Class: CS527
File: integration_schemes.js
Assignment 1
*/
"use strict";

const Y_UP = -1.0;

let DRAG_COEFFICIENT = 0.47, // dimensionless
    FLUID_DENSITY = 1.22; // kg/m^3

const Integration = function(){

  /* Constant Forces */
  const GRAVITY = function(){return {x:0.0, y:-9.81 * Y_UP}},

      AIR_FRICTION = function(particle) {
        let area = Math.PI * particle.radius/100.0 * particle.radius/100.0, // convert to meters
            coeff = -0.5 * DRAG_COEFFICIENT * area * FLUID_DENSITY,
            drag = ( particle.velocity.y === 0 ) ? 0 : coeff * particle.velocity.y * particle.velocity.y * particle.velocity.y / Math.abs(particle.velocity.y );
        return {x:0, y: drag/particle.mass};
      };

  const CONSTANT_FORCES = [GRAVITY,AIR_FRICTION];

  /* Euler Integration */
  function euler(p,dt) {

    function clearAndAccumulateForces() {
      /* Clear the previous forces */
      p.forces = Utilities.Vector_Utils.zero(p.forces);
      /* Accumulate the constant forces */
      CONSTANT_FORCES.forEach(function(f){
       p.forces = Utilities.Vector_Utils.add(p.forces, f(p));
      });
      return p.forces;
    }

    function calculateVelocityAndPosition(acceleration) {
      /* Calculate the new velocity */
      let d_v = Utilities.Vector_Utils.add(p.velocity, Utilities.Vector_Utils.multiply(acceleration, dt)),
      /* Use the new and previous velocity to calculate the new position */
        d_x =
          Utilities.Vector_Utils.add(p.position, Utilities.Vector_Utils.multiply(d_v, dt * 100 /* Convert back to cm */));
      /* Set the new velocity */
      p.velocity = d_v;
      /* convert back to cm */
      p.position = d_x;
    }

    /* Accumulate the forces on the particle and calculate the acceleration */
    let acceleration = clearAndAccumulateForces();
    /* Update the velocity and position */
    calculateVelocityAndPosition(acceleration);
  }

  return {
    euler_step: euler
  }

}();