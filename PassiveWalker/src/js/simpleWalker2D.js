/*
Name: Timothy Luciani
Class: CS527
File: simpleWalker2D.js
Final Project
*/
"use strict";

let Simple_Walker_2D = (function(global_options) {

  /* Initial conditions from the paper, derived from theoretical equations */
  const theta00 = 0.970956,
        theta01 = -0.270837,
        alpha   = -1.045203,
        c1      = 1.062895,
        tgamma3 = theta00 * Math.pow(global_options.gamma, 1/3);

  /* Closure variable to track internal states */
  let walker = {};

  return function(options) {

    /* Equations:[theta_p,  =  [ -1   0                    0   0,   x  [theta_m,
    *             theta_pp,       0   cos(2 x theta_m)     0   0,       theta_mp,
    *             phi_p,         -2   0                    0   0,       phi_m,
    *             phi_pp ]        0   cos(theta_pp) x      0   0 ]      phi_mp ]
    *                                   (1-cos(theta_pp)                      */
    function passive_motion_ODE(options){
      let y0 = options.y0;
      /* Returns [theta_p, theta_pp, phi_p, phi_pp ] */
      return [
        options.y0[1],
        Math.sin(y0[0]-global_options.gamma),
        options.y0[3],
        Math.sin(y0[0]-global_options.gamma) +
          Math.sin( y0[2]) * (y0[1]*y0[1] - Math.cos(y0[0]-global_options.gamma) )
      ]
    }

    function walk() {

    }

    function render_walker_2D() {

    }

    function initialize_system() {
      /* Calculate the initial for stable walking based on the papers equations */
      walker.theta   = tgamma3 + theta01*options.gamma;
      walker.theta_p = alpha *tgamma3 + (alpha*theta01 * c1) * options.gamma;
      walker.phi     = 2.0 * theta;
      walker.phi_p   = walker.theta_p *(1.0 - Math.cos(walker.phi));

    }

    return {
      initialize: initialize_system,
      walk: walk,
      render: render_walker_2D
    }
  }
})();