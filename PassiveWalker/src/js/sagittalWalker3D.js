/*
Name: Timothy Luciani
Class: CS527
File: sagittalWalker3D.js
Final Project
*/
"use strict";

var App = App || {};

let Sagittal_Walker_3D = (function() {

  return function(global_options) {

    /* Initial conditions from the paper, derived from the physical walker Dr. */
    const
        gamma     = global_options.gamma || 0.1,
        m         = 2.795,
        I         = 17.5,
        R         = global_options.R || 14.8,
        d         = R-12.94,
        b         = R-8,
        g         = 386.088,
        phi       = 0.23, // angle between the axel center and foot
        step_size = global_options.step_size;

    let internal_time = 0,
        dydt = [0.0, 0.0, 0.0, 0.0];

    let Solver = null;
    /* Closure variable to track internal states */
    let walker = {},
        steps = 0,
        collision_found = false,
        last_collision_t = 0,
        step_period = 0.035;

    function passive_motion_ODE45(y){
      let solution = y;
      let theta_st = y[0],   theta_sw = y[1],
          theta_st_p = y[2], theta_sw_p = y[3],
          theta_p = math.matrix([theta_st_p, theta_sw_p]);

      /* ODE: H(theta)*theta_p + C(theta, theta_p)*theta_P + G(theta) = 0 */
      let
          H11 = I + m*b*b + m*d*d + 2.0*m*R*R - 2.0*m*R*(b+d)*Math.cos(theta_st-gamma),
          H12 = m*(b-d)*(d*Math.cos(theta_st-theta_sw)-R*Math.cos(theta_sw-gamma)),
          H22 = I + m*(b-d)*(b-d),
          H = math.matrix([[H11,H12],[H12,H22]]),
          det_H = math.det(H),
          H_inv = math.matrix([[H22/det_H,-H12/det_H],[-H12/det_H,H11/det_H]]);//math.multiply(H, 1.0/det_H);
      let
          C11 = m*R*(b+d)*theta_st_p*Math.sin(theta_st-gamma)
              + 0.5*m*d*(b-d) * theta_sw_p*Math.sin(theta_st-theta_sw),
          C12 = m*(b-d) * (d*Math.sin(theta_st-theta_sw) * (theta_sw_p-0.5*theta_st_p)
              + R*Math.sin(theta_sw-gamma)*theta_sw_p),
          C21 = m*(b-d) * (d*Math.sin(theta_st-theta_sw) * (theta_st_p-0.5*theta_sw_p)
              - 0.5*R* Math.sin(theta_sw-gamma) * theta_sw_p),
          C22 = 0.5*m*(b-d) * theta_st_p * (d*Math.sin(theta_st-gamma)
              + R*Math.sin(theta_sw-gamma)),
          C   = math.matrix([[C11,C12],[C21,C22]]),
          nC  = math.multiply(C, -1.0);
      let G = math.matrix([ m*g*((b+d)*Math.sin(theta_st) - 2.0*R*Math.sin(gamma)),
                            m*g*((b-d)*Math.sin(theta_sw))]);

      /* Calculate the angular acceleration */
      /* theta_dp = H^-1 * (-C * theta_p - G ) */
      let nC_t_theta_p = math.multiply(nC,theta_p),
          minus_g = math.subtract(nC_t_theta_p, G),
          theta_dp = math.multiply(H_inv, minus_g);

      /* set the output */
      solution[0] = y[0] + theta_st_p * step_size;
      solution[1] = y[1] + theta_sw_p* step_size;
      solution[2] = y[2] + theta_dp._data[0]* step_size;
      solution[3] = y[3] + theta_dp._data[1]* step_size;

      return solution;

      // dydt[0] = theta_st_p * 1; dydt[0] = +dydt[0].toFixed(5);
      // dydt[1] = theta_sw_p* 1; dydt[1] = +dydt[1].toFixed(5);
      // dydt[2] = theta_dp._data[0]* 1; dydt[2] = +dydt[2].toFixed(5);
      // dydt[3] = theta_dp._data[1]* 1; dydt[3] = +dydt[3].toFixed(5);
    }

    /* Transitions from pre collision conditions to post */
    /* Equations:[theta_p,  =  [ -1   0                    0   0,   x  [theta_m,
*             theta_pp,       0   cos(2 x theta_m)     0   0,       theta_mp,
*             phi_p,         -2   0                    0   0,       phi_m,
*             phi_pp ]        0   cos(theta_pp) x      0   0 ]      phi_mp ]
*                                   (1-cos(theta_pp)                      */
    function Poincare_map(y){
    }

    /* A collision occurs when: phi - 2*theta = 0*/
    function collision_check(theta, phi) {
      let collision = Math.abs(phi) - Math.abs(2.0 * theta);

      console.log(theta, phi, collision);

      if(Math.abs(+collision.toFixed(5)) === 0) {
        return true;
      }
      return false;
    }

    function update_walker(theta, phi){
    }

    function walk(time) {

      let t = [], y = [], target_time = time + step_size;

      console.log(time);

      while( internal_time <= target_time ) {

        dydt = passive_motion_ODE45(dydt);

        y.push(_.clone(dydt));

        console.log(internal_time);

        /* On collision, apply the Poincare map and update the walker */
        if( Math.abs(+dydt[0].toFixed(3)) > 0 && collision_check(dydt[0], dydt[1])) {
          /* Apply the Poincare map and update the solver's value*/
          //Solver.y = Poincare_map( _.clone(Solver.y) );
          /* Mark that a collision was found */
          collision_found = !collision_found;
        }


        internal_time += step_size;
        steps++;

        // // Store the solution at this time step:
        // t.push( Solver.t );
        // y.push( _.clone(Solver.y) );
      }

      // let current = y.slice(-1)[0];
      // console.log(t.slice(-1)[0]);
      // console.log(current[0], current[1], current[2], current[3]);

      /* Update the walker's position */
      //update_walker(current[0], current[2]);

    }

    function render_walker_3D(options) {
      /* Render the stance leg */


      /* Render the swing leg*/


    }

    function initialize_walker_model(){


      return w;
    }

    function initialize_system(options) {
    //   /* Calculate the initial for stable walking based on the papers equations */
    //   // let w = initialize_walker_model();
    //   // walker = _.clone(w);
    //
    //   Solver = IntegratorFactory(
    //       [0.0, 0.0, 0.0, 0.0],
    //       passive_motion_ODE45,
    //       options.start_time,
    //       step_size,
    //       {
    //         maxIncreaseFactor: options.maxIncreaseFactor,
    //         maxDecreaseFactor: options.maxDecreaseFactor,
    //         tol: 1e-5,
    //         dtMaxMag: 1e-3,
    //         dtMinMag: 1e-3,
    //         errorScaleFunction: function( i, dt, y, dydt ) {
    //           let scale = Math.abs(y) + Math.abs(dt * dydt);
    //           scale += (scale === 0) ? 1e32 : 1e-32;
    //           return scale;
    //         }
    //       });

      //return w;
    }

    return {
      initialize: initialize_system,
      walk: walk,
      render: render_walker_3D
    }
  }
})();