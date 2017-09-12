"use strict";
/* Constant Forces */
const GRAVITY = {x:0.0, y:-9.8};
const CONSTANT_FORCES = [GRAVITY];
const Y_UP = -1.0;

const Integration = function(){
  /* Euler Integration */
  function euler(p,dt) {

    function clearAndAccumulateForces() {
      /* Clear the previous forces */
      p.forces.x = 0;
      p.forces.y = 0;
      /* Accumulate the constant forces */
      CONSTANT_FORCES.forEach(function(f){
        p.forces.x += f.x;
        p.forces.y += f.y;
      });
    }

    function calculateVelocityAndPosition(acceleration) {
      /* Calculate the new velocity */
      let d_v = {
        u : p.velocity.u + acceleration.x * dt,
        v : p.velocity.v + acceleration.y * dt
      };
      /* Use the new and previous velocity to calculate the new position */
      p.position = {x:p.position.x + 0.5*(p.velocity.u + d_v.u)*dt, y:p.position.y + 0.5*(p.velocity.v + d_v.v)*dt};
      /* Set the new velocity */
      p.velocity = d_v;
    }

    /* Accumulate the forces on the particle */
    clearAndAccumulateForces();
    /* Calculate the acceleration */
    let acceleration = { x : p.forces.x / dt, y: p.forces.y / dt * Y_UP};
    /* Update the velocity and position */
    calculateVelocityAndPosition(acceleration);
  }

  return {
    euler_step: euler
  }

}();