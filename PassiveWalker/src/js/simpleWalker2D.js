/*
Name: Timothy Luciani
Class: CS527
File: simpleWalker2D.js
Final Project
*/
"use strict";

let Simple_Walker_2D = (function() {

  return function(global_options) {

    /* Initial conditions from the paper, derived from theoretical equations */
    const theta0 = 0.970956,
        theta1 = -0.270837,
        alpha   = -1.045203,
        c1      = 1.062895,
        tgamma3 = theta0 * Math.pow(global_options.gamma, 1/3);

    let Solver = null;
    /* Closure variable to track internal states */
    let walker = {sign_flips:0, prev_check:0}, steps = 0;

    /* Equations:[theta_p,  =  [ -1   0                    0   0,   x  [theta_m,
    *             theta_pp,       0   cos(2 x theta_m)     0   0,       theta_mp,
    *             phi_p,         -2   0                    0   0,       phi_m,
    *             phi_pp ]        0   cos(theta_pp) x      0   0 ]      phi_mp ]
    *                                   (1-cos(theta_pp)                      */
    function passive_motion_ODE(options){
      let theta = options.y0[0][0],
          theta_prime = options.y0[0][1],
          phi = options.y0[1][0],
          phi_prime = options.y0[1][1],
          theta_m_gamma = theta-global_options.gamma;
      /* Returns [theta_p, theta_pp, phi_p, phi_pp ] */
      return [
        [theta_prime, Math.sin(theta_m_gamma)],
        [phi_prime, Math.sin(theta_m_gamma) +
                        Math.sin(phi) *
                        (theta_prime*theta_prime - Math.cos(theta_m_gamma) )]
      ]
    }

    /* Transitions from pre collision conditions to post */
    function Poincare_map(){
      /* Compute intermediate value */
      let cos2theta = Math.cos(2.0 * walker.theta);
      return [
          [-1.0 * walker.theta,
          cos2theta * walker.theta_p],
          [-2.0 * walker.theta,
          cos2theta * (1.0 - cos2theta) * walker.theta_p]
      ];
    }

    /* A collision occurs when: phi - 2*theta = 0*/
    function collision_check(theta, phi) {

      let collision = phi.toFixed(5) - (2.0 * theta.toFixed(5));

      console.log([walker.theta, walker.theta_p], [walker.phi, walker.phi_p], collision);
      if(Math.abs(collision.toFixed(4)) < 0.001)
        console.log([walker.theta, walker.theta_p], [walker.phi, walker.phi_p], collision);

      return (Math.abs(collision.toFixed(4)) < 0.001);
    }

    function walk(dt) {
      /* Integrate */
      let y_dot = Solver.Runge_Kutta(
          /* ODE solver function ==> returns the new rotations and velocities */
          passive_motion_ODE,
          /* y0 -- Initial y */
          [ [walker.theta, walker.theta_p], [walker.phi, walker.phi_p]],
          /* time step plus a time number to avoid division by 0*/
          dt,
          {
            num_vars:2,
            var_dimensions:2,
            order: 4
          }
      );


      /* Check for collision with the ramp. If one occurred,
       * invoke the Poincare map to switch the legs  */
      /* Save the current state */
      // prev = _.clone(walker);
      walker.theta   += y_dot[0][0] * dt;
      walker.theta_p += y_dot[0][1] * dt;
      walker.phi     += y_dot[1][0] * dt;
      walker.phi_p   += y_dot[1][1] * dt;

      if(collision_check(walker.theta, walker.phi)){
        /* On collision, reverse legs with the Poincare map */
        let shift =  Poincare_map();

        walker.theta = parseFloat(shift[0][0].toPrecision(5));
        walker.theta_p = parseFloat(shift[0][1].toPrecision(5));
        walker.phi = parseFloat(shift[1][0].toPrecision(5));
        walker.phi_p = parseFloat(shift[1][1].toPrecision(5));

        walker.sign_flips = 0;

        console.log();
      }


      steps++;
    }

    function render_walker_2D() {

    }

    function initialize_system() {
      /* Setup the integrator */
      Solver = new Integration({scheme:"RK4", constant_forces:[]});
      let gamma = global_options.gamma;
      /* Calculate the initial for stable walking based on the papers equations */
      walker.theta   = tgamma3 + theta1*gamma;
      walker.theta_p = alpha * tgamma3 + (alpha*theta1 + c1) * gamma;
      walker.phi     = 2.0 * walker.theta;
      walker.phi_p   = walker.theta_p *(1.0 - Math.cos(walker.phi));
    }

    return {
      initialize: initialize_system,
      walk: walk,
      render: render_walker_2D
    }
  }
})();