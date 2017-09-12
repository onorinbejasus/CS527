/*
Name: Timothy Luciani
Class: CS527
File: integration_schemes.js
Assignment 1
*/
"use strict";

const FLOOR_DAMPENING  = 0.8,
      DRAG_COEFFICIENT = 0.47;


/* Constant Forces */
const GRAVITY = function(){return {x:0.0, y:-9.8 * Y_UP}},

  AIR_FRICTION = function(velocity) {
        return Utilities.Vector_Utils.multiply(velocity, DRAG_COEFFICIENT);
};

const CONSTANT_FORCES = [GRAVITY];
const VARIABLE_FORCES = [AIR_FRICTION];

const Y_UP = -1.0;

const Integration = function(){
  /* Euler Integration */
  function euler(p,dt) {

    function clearAndAccumulateForces() {
      /* Clear the previous forces */
      Utilities.Vector_Utils.zero(p.forces);
      /* Accumulate the constant forces */
      CONSTANT_FORCES.forEach(function(f){
        p.forces = Utilities.Vector_Utils.add(p.forces, f(p))
      });

      VARIABLE_FORCES.forEach(function(f){
        p.forces = Utilities.Vector_Utils.add(p.forces, f(p.velocity))
      });
    }

    function calculateVelocityAndPosition(acceleration) {
      /* Calculate the new velocity */
      let d_v = Utilities.Vector_Utils.add(p.velocity, Utilities.Vector_Utils.multiply(acceleration, dt));
      /* Use the new and previous velocity to calculate the new position */
      p.position =
          Utilities.Vector_Utils.add(p.position,
            Utilities.Vector_Utils.multiply( Utilities.Vector_Utils.add(p.velocity, d_v), dt*0.5));
      /* Set the new velocity */
      p.velocity = d_v;
    }

    /* Accumulate the forces on the particle */
    clearAndAccumulateForces();
    /* Calculate the acceleration */
    let acceleration = Utilities.Vector_Utils.divide(p.forces, p.mass);
    /* Orient the up vector */
    // acceleration.y *= Y_UP;
    /* Update the velocity and position */
    calculateVelocityAndPosition(acceleration);
  }

  return {
    euler_step: euler
  }

}();