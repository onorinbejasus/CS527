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
    const
        gamma     = global_options.gamma,
        theta0    = 0.970956,
        theta1    = -0.270837,
        alpha     = -1.045203,
        c1        = 1.062895,
        tgamma3   = theta0 * Math.pow(global_options.gamma, 1/3),
        step_size = global_options.step_size;

    let Solver = null;
    /* Closure variable to track internal states */
    let walker = {},
        steps = 0,
        collision_found = false;

    function passive_motion_ODE45(dydt, y, t){
      let theta = y[0],
          theta_prime = y[1],
          phi = y[2],
          phi_prime = y[3],
          theta_m_gamma = theta-gamma;
      /* Returns [theta_p, theta_pp, phi_p, phi_pp ] */
        dydt[0] = theta_prime;
        dydt[1] = Math.sin(theta_m_gamma);
        dydt[2] = phi_prime;
        dydt[3] = Math.sin(theta_m_gamma) + Math.sin(phi) *
          (theta_prime*theta_prime - Math.cos(theta_m_gamma))
    }

    /* Transitions from pre collision conditions to post */
    /* Equations:[theta_p,  =  [ -1   0                    0   0,   x  [theta_m,
*             theta_pp,       0   cos(2 x theta_m)     0   0,       theta_mp,
*             phi_p,         -2   0                    0   0,       phi_m,
*             phi_pp ]        0   cos(theta_pp) x      0   0 ]      phi_mp ]
*                                   (1-cos(theta_pp)                      */
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

      let collision = phi - (2.0 * theta);

      // if(Math.abs(collision.toFixed(5)) < 0.0001){
      if( Math.abs(collision.toFixed(4) ) <= 0.0001){
        /* Update the walker's hip and legs */
        update_walker(theta, phi);

        let stance_leg =  Utilities.Vector_Utils.subtract(walker.stance_foot, walker.hip),
            swing_leg  =  Utilities.Vector_Utils.subtract(walker.swing_foot, walker.hip);

        /* If the angle between the legs is sufficiently past parallel */
        let angle = Utilities.Vector_Utils.angleBetween(stance_leg, swing_leg);
        console.log('angle', angle);
        if(angle > 0.4){
          collision_found = true;
          return true;
        }
      }
        // console.log([walker.theta, walker.theta_p], [walker.phi, walker.phi_p], collision);
      return false;
    }

    function update_walker(theta, phi){

      let stance = (!collision_found) ? walker.stance_foot : walker.swing_foot;

      /* Update Hip position */
      walker.hip = [
        stance[0]-walker.L*Math.sin(theta-gamma),
        stance[1]+walker.L*Math.cos(theta-gamma)
      ];

      /* Update Swing Foot position*/
      if(!collision_found){
        walker.swing_foot = [
          walker.hip[0]-walker.L*Math.sin(phi-theta+gamma),
          walker.hip[1]-walker.L*Math.cos(phi-theta+gamma)
        ];
      }
      else {
        walker.stance_foot = [
          walker.hip[0]-walker.L*Math.sin(phi-theta+gamma),
          walker.hip[1]-walker.L*Math.cos(phi-theta+gamma)
        ];
      }

    }

    function walk(time) {

      let t = [], y = [], target_time = time + step_size;
      // var t0 = performance.now();
      while( Solver.step(target_time) ) {

        if(collision_check(Solver.y[0], Solver.y[2])){
          console.log(Solver.y);
          /* Break out of the loop */
          break;
        }

        // Store the solution at this timestep:
        t.push( Solver.t );
        y.push( _.clone(Solver.y) );
      }
      // var t1 = performance.now();
      // console.log("Call to doSomething took " + (t1 - t0) + " milliseconds.");
      let current = y.slice(-1)[0];

      /* Store the current angles */
      walker.theta   = current[0];
      walker.theta_p = current[1];
      walker.phi     = current[2];
      walker.phi_p   = current[3];

      /* Update the walker's position */
      update_walker(walker.theta, walker.phi);

      steps++;
    }

    function render_walker_2D(options) {
      if(!collision_found && steps % 20 === 0) {
        update_walker();
      }

      /* Render the stance leg */
      options.ctx.lineWidth = 2;
      options.ctx.strokeStyle = "black";
      Utilities.Render_Utils.drawLine(
          options.ctx,
          parseInt(walker.stance_foot[0]*options.multiplier+options.offset[0]),
          options.height - parseInt(walker.stance_foot[1]*options.multiplier+options.offset[1]),
          parseInt(walker.hip[0]*options.multiplier+options.offset[0]),
          options.height - parseInt(walker.hip[1]*options.multiplier+options.offset[1])
      );

      /* Render the swing leg*/
      options.ctx.strokeStyle = "red";
      Utilities.Render_Utils.drawLine(
          options.ctx,
          parseInt(walker.swing_foot[0]*options.multiplier+options.offset[0]),
          options.height - parseInt(walker.swing_foot[1]*options.multiplier+options.offset[1]),
          parseInt(walker.hip[0]*options.multiplier+options.offset[0]),
          options.height - parseInt(walker.hip[1]*options.multiplier+options.offset[1])
      );

    }

    function initialize_walker_model(){
      let w = {
        theta   : tgamma3 + theta1*gamma,
        theta_p : alpha * tgamma3 + (alpha*theta1 + c1) * gamma,
        phi     : 2.0 * (tgamma3 + theta1*gamma),
        phi_p   : (alpha * tgamma3 + (alpha*theta1 + c1) * gamma)
                    * (1.0 - Math.cos(2.0 * (tgamma3 + theta1*gamma))),
        L:global_options.L,
        stance_foot:[0,0]
      };

      /* Initial Hip position */
      w.hip = [
        w.stance_foot[0]-w.L*Math.sin(w.theta-gamma),
        w.stance_foot[1]+w.L*Math.cos(w.theta-gamma)
      ];

      /* Initial Swing Foot position*/
      w.swing_foot = [
        w.hip[0]-w.L*Math.sin(w.phi-w.theta+gamma),
        w.hip[1]-w.L*Math.cos(w.phi-w.theta+gamma)
      ];

      return w;
    }

    function initialize_system(options) {
      /* Calculate the initial for stable walking based on the papers equations */
      let w = initialize_walker_model();
      walker = _.clone(w);

      Solver = IntegratorFactory(
          [walker.theta, walker.theta_p, walker.phi, walker.phi_p],
          passive_motion_ODE45,
          options.start_time,
          step_size,
          {
            maxIncreaseFactor: options.maxIncreaseFactor,
            maxDecreaseFactor: options.maxDecreaseFactor
          });

      return w;
    }

    return {
      initialize: initialize_system,
      walk: walk,
      render: render_walker_2D
    }
  }
})();