/*
Name: Timothy Luciani
Class: CS527
File: simpleWalker2D.js
Final Project
*/
"use strict";

let Simple_Walker_2D = (function(options) {

  /* Initial conditions from the paper, derived from theoretical equations */
  const theta00 = 0.970956,
        theta01 = -0.270837,
        alpha   = -1.045203,
        c1      = 1.062895,
        tgamma3 = theta00 * Math.pow(options.gamma, 1/3);

  return function(options) {
    function walk() {

    }

    function render_walker_2D() {

    }

    function initialize_system() {
      /* Calculate the initial for stable walking based on the papers equations */
      let theta   = tgamma3 + theta01*options.gamma,
          theta_p = alpha*tgamma3 + (alpha*theta01 * c1) * options.gamma,
          phi     = 2.0 * theta,
          phi_p   = theta_p *(1.0 - Math.cos(phi));



    }


    return {
      initialize: initialize_system,
      walk: walk,
      render: render_walker_2D
    }
  }
})();