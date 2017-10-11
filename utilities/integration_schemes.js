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

  let multiply = Utilities.Vector_Utils.multiply,
      multiply_components = Utilities.Vector_Utils.multiply_components,
      sqrt_components = Utilities.Vector_Utils.sqrt_component,
      add = Utilities.Vector_Utils.add,
      difference = Utilities.Vector_Utils.subtract,
      divide = Utilities.Vector_Utils.divide;

  function clearAndAccumulateForces(p) {
    /* Clear the previous forces */
    p.forces = Utilities.Vector_Utils.zero(p.forces);
    /* Accumulate the constant forces */
    CONSTANT_FORCES.forEach(function(f){
      let force = f(p);
      // if( Math.abs(force.y) > 6.0 * 9.8 ){
      //   force = BOUYANCY(p);
      // }
      p.forces = Utilities.Vector_Utils.add(p.forces, force);
    });
    if( Math.abs(p.forces.y) > 6.0 * 9.8 ){
      //console.log(BOUYANCY(p));
      p.forces.y = 0;
      p.velocity.y = 0;
    }

    return Utilities.Vector_Utils.divide(p.forces,p.mass);
  }

  function calculateVelocityAndPosition(p, acceleration, dt) {
    /* Calculate the new velocity */
    let d_v = Utilities.Vector_Utils.add(p.velocity, Utilities.Vector_Utils.multiply(acceleration, dt)),
        /* Use the new and previous velocity to calculate the new position */
        d_x =
            Utilities.Vector_Utils.add(p.position, Utilities.Vector_Utils.multiply(d_v, dt * 100 /* Convert back to cm */));
    /* Set the new velocity */
    if(!isNaN(d_v.y) && isFinite(d_v.y))
      p.velocity = d_v;
    /* convert back to cm */
    if(!isNaN(d_x.y) && isFinite(d_x.y))
      p.position = d_x;
  }

  /* Constant Forces */
  const GRAVITY = function(){return {x:0.0, y:-9.81 * Y_UP}},

      AIR_FRICTION = function(particle) {
        let area = Math.PI * particle.radius/100.0 * particle.radius/100.0, // convert to meters
            coeff = -0.5 * DRAG_COEFFICIENT * area * FLUID_DENSITY,
            drag = ( particle.velocity.y === 0 ) ? 0 : coeff * particle.velocity.y * particle.velocity.y * particle.velocity.y / Math.abs(particle.velocity.y );
        return {x:0, y: isNaN(drag/particle.mass)?0:drag/particle.mass};
      },

      BOUYANCY = function(particle) {
        let f = DRAG_COEFFICIENT * FLUID_DENSITY / (2.0 * particle.velocity.y * particle.velocity.y * particle.velocity.y / Math.abs(particle.velocity.y ));
        f /= -particle.mass * Y_UP;
        return {x:0,y:f};
      };

  const CONSTANT_FORCES = [GRAVITY,AIR_FRICTION];

  /* Euler Integration */
  function euler(p,dt) {
    /* Accumulate the forces on the particle and calculate the acceleration */
    let acceleration = clearAndAccumulateForces(p);
    /* Update the velocity and position */
    calculateVelocityAndPosition(p, acceleration, dt);
  }

  /* Runge-Kutta 4 Integration */
  function RK4(p,dt){

    console.log(p);

    /* Accumulate the forces on the particle and calculate the acceleration */
    let acceleration = clearAndAccumulateForces(p);

    let dth = dt + dt/2.0,
        dtt = dt+dt,
        vO2 = sqrt_components(p.velocity, p.velocity);

    /* K1 -- Euler */
    let d_v1 = add(p.velocity, multiply(acceleration, dt)),
        k1 = multiply( divide( add(p.velocity, d_v1), 2.0), dt, 100);

    /* K2 */
    let k1o2 = divide(k1, 2.0),
        d_v2 = sqrt_components( add(vO2, multiply_components( acceleration, multiply(k1o2, 2.0)))),
        k2 = multiply( divide( add(p.velocity, d_v2), 2.0), dth, 100);

    /* K3 */
    let k2o2 = divide(k2, 2.0),
        d_v3 = sqrt_components( add(vO2, multiply_components( acceleration, multiply(k2o2, 2.0)))),
        k3 = multiply( divide( add(p.velocity, d_v3), 2.0), dth, 100);

    /* K4 */
    let d_v4 = sqrt_components( add(vO2, multiply_components( acceleration, multiply(k3, 2.0)))),
        k4 = multiply( divide( add(p.velocity, d_v4), 2.0), dtt, 100);


    /* x0 + 1/6*k1 + 1/3*k2 + 1/3*k3 + 1/6*k4*/
    let d_pos = Utilities.Vector_Utils.add(
                                  Utilities.Vector_Utils.multiply(k1, 0.16667),
                                  Utilities.Vector_Utils.multiply(k2, 0.33334),
                                  Utilities.Vector_Utils.multiply(k3, 0.33334),
                                  Utilities.Vector_Utils.multiply(k4, 0.16667));

    let d_vel = Utilities.Vector_Utils.add(
                                  Utilities.Vector_Utils.multiply(d_v1, 0.16667),
                                  Utilities.Vector_Utils.multiply(d_v2, 0.33334),
                                  Utilities.Vector_Utils.multiply(d_v3, 0.33334),
                                  Utilities.Vector_Utils.multiply(d_v4, 0.16667));

    p.position = add(p.position, d_pos);
    p.velocity = add(p.velocity, d_vel);

    // console.log(k1, k2, k3, k4);
    console.log(p.position);

  }

  return {
    euler_step: euler,
    RK4: RK4
  }

}();