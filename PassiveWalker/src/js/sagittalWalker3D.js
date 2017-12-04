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
        step_period = -1;

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
          H_inv = math.matrix([[H22/det_H,-H12/det_H],[-H12/det_H,H11/det_H]]);
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

    function Poincare_map(y){

      let Omega_m = [
        2.0*b*d*Math.cos(y[1]-y[0])-(b+d)*R*Math.cos(y[1]-gamma) -
          2.0*b*R*Math.cos(y[0]-gamma) + 2.0*R*R + b*b - b*d,
        (b-d)*(b-R*Math.cos(y[1]-gamma)),
        (b-d)*(b-R*Math.cos(y[1]-gamma)),
        0
      ],
        oM = math.matrix([
          [Omega_m[0],Omega_m[1]],
          [Omega_m[2],Omega_m[3]]
        ]);

      let Omega_p = [
        (b-d)*(d*Math.cos(y[0]-y[1]) - R*Math.cos(y[0]-gamma)+(b-d)),
        -R*(b-d)*Math.cos(y[0]-gamma) - R*(b+2.0*d) * Math.cos(y[1]-gamma) + d*d + 2.0*R*R +
          R*b*Math.cos(y[1]+gamma) - b*b*Math.cos(2.0*y[1]) + d*(b-d)*Math.cos(y[0]-y[1]),
        (b-d)*(b-d),
        (b-d)*(d*Math.cos(y[0]-y[1]) - R*Math.cos(y[0]-gamma))
      ],
        oP = math.matrix([
          [Omega_p[0],Omega_p[1] ],
          [Omega_p[2],Omega_p[3]]
        ]),

        det_oP = math.det(oP),

        oP_inv = math.matrix([
          [ Omega_p[3]/det_oP,-Omega_p[1]/det_oP],
          [-Omega_p[2]/det_oP,Omega_p[0]/det_oP]
        ]);

      let Omega_p_m = math.multiply(oP_inv, oM),
          ydot = math.matrix([ [y[2]], [y[3]] ]),
          Poincare = math.multiply(Omega_p_m, ydot);

      return [Poincare._data[0][0], Poincare._data[1][0]];
    }

    /* A collision occurs when: phi - 2*theta = 0*/
    function collision_check(theta, phi) {
      let collision = Math.abs(+theta.toFixed(4)) - Math.abs(2.0 * +phi.toFixed(4));
          collision = +(collision.toFixed(4));

      return !Math.abs(collision);
    }

    function update_walker(theta, phi){

    }

    function walk(time) {

      let t = [], y = [], target_time = time + step_size, omega;

      while( internal_time <= target_time ) {

        dydt = passive_motion_ODE45(dydt);

        y.push(_.clone(dydt));

        // console.log(internal_time);

        /* On collision, apply the Poincare map and update the walker */
        if(step_period < 0){ // no gait determined yet, use the angles
          if( Math.abs(+dydt[0].toFixed(3)) > 0 && collision_check(dydt[0], dydt[1])) {
            /* Apply the Poincare map and update the solver's value*/
            omega = Poincare_map(dydt);
            /* Mark that a collision was found */
            collision_found = true;
            last_collision_t = step_period = internal_time;
          }
        }
        else if((internal_time - last_collision_t) > step_period ){
          omega = Poincare_map(dydt);
          collision_found = true;
          last_collision_t = internal_time;
        }

        /* If the collision is found, calculate the impulse's effect on the other foot */
        if(collision_found){
          let previous = y.pop();

          /* Reverse the leg angles based on the impulse */
          dydt[0] = previous[1];
          dydt[1] = previous[0];
          dydt[2] = omega[1];
          dydt[3] = omega[0];

          /* Push the new solution onto the list*/
          y.push(dydt);

          collision_found = false;
          console.log(dydt);
        }


        internal_time += step_size;
        steps++;

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