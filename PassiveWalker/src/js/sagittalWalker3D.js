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
        Rs         = global_options.Rs || 14.8,
        Rf         = global_options.Rf || 19.6,
        d         = Rs-12.94,
        b         = Rs-8,
        g         = 386.088,
        phi       = 0.23, // angle between the axel center and foot
        step_size = global_options.step_size,
        Vec3 = THREE.Vector3;

    let internal_time = 0,
        dydt = [0.0, 0.0, 0.0, 0.0];

    let Solver = null;
    /* Closure variable to track internal states */
    let walker = {},
        steps = 0,
        collision_found = false,
        last_collision_t = 0,
        step_period = -1;

    function rotate(angle) {
      return [[Math.cos(angle), -Math.sin(angle)], [Math.sin(angle), Math.cos(angle)]];
    }

    function createConvex(positions, color, rot, trans){
      let group = new THREE.Group();
      let geometry = new THREE.ConvexBufferGeometry(positions);
      let material = new THREE.MeshLambertMaterial( {
        color: color,
        opacity: 0.5,
        transparent: true
      } );
      let mesh1 = new THREE.Mesh( geometry, material );

      if(rot && rot.length > 0){
        mesh1.rotateX(rot[0]);
        mesh1.rotateY(rot[1]);
        mesh1.rotateZ(rot[2]);
      }

      if(trans && trans.length > 0){
        mesh1.translateX(trans[0]);
        mesh1.translateY(trans[1]);
        mesh1.translateZ(trans[2]);
      }

      mesh1.material.side = THREE.BackSide; // back faces
      mesh1.renderOrder = 0;
      group.add(mesh1);

      let mesh2 = new THREE.Mesh( geometry, material );
      mesh2.material.side = THREE.FrontSide; // back faces
      mesh2.renderOrder = 1;

      if(rot && rot.length > 0){
        mesh2.rotateX(rot[0]);
        mesh2.rotateY(rot[1]);
        mesh2.rotateZ(rot[2]);
      }
      if(trans && trans.length > 0){
        mesh2.translateX(trans[0]);
        mesh2.translateY(trans[1]);
        mesh2.translateZ(trans[2]);
      }
      group.add(mesh2);

      return group;
    }

    function create_body(angular_disp) {

      let group = new THREE.Group();
      let theta_rot = rotate(angular_disp[0]), phi_rot = rotate(angular_disp[1]);
      let st_alpha   = Math.max(Math.min(angular_disp[0]-gamma,phi),-phi),
          sw_alpha = Math.max(Math.min(angular_disp[1]-gamma,phi),-phi),
          gc = math.multiply(rotate(gamma),[[-Rs*st_alpha],[0]]),
          center = math.add(gc,math.multiply(rotate(angular_disp[0]-sw_alpha), [[0],[Rs]])),
          hip = math.subtract(center, math.multiply(theta_rot, [[0],[d]])),
          sw_center = math.add(hip, math.multiply(phi_rot, [[0],[d]])),
          sw_gc = math.add(sw_center, math.multiply(rotate(angular_disp[1]-sw_alpha), [[0],[-Rs]]));

      let axel_points = [], ankle_position = [0.0, -11.5];
      for(let i = 0; i < 2.0*Math.PI; i+=0.1){
        axel_points.push([0.25*Math.sin(i)+hip[0][0], 0.25*Math.cos(i)+hip[1][0]]);
      }

      let leg = [
          [-0.625,0.75], [0.625,0.75], [0.625,ankle_position[1]], [-0.625,ankle_position[1]],[-0.625,0.75]
      ];

      /* Construct the two legs */
      let swing_leg = [], stance_leg = [];
      hip = [hip[0][0],hip[1][0]];
      for(let i = 0; i < leg.length; i++) {
        swing_leg.push(math.add(hip,math.multiply(theta_rot,leg[i])));
        stance_leg.push(math.add(hip,math.multiply(phi_rot,leg[i])));
      }
      // get the ankle positions
      let st_ankle = math.add(hip,math.multiply(theta_rot,ankle_position));
      let sw_ankle = math.add(hip,math.multiply(phi_rot,ankle_position));

      /* Construct the foot of the walker */
      let st_foot = create_foot(ankle_position, 30, 3);
      let sw_foot = create_foot(ankle_position, 30, -3);

      group.add(st_foot);
      group.add(sw_foot);

      return group;
    }


    /* Function to create the rocking foot model */
    function create_foot(ankle, num_points, z_off) {
      /* To calculate Z-position */
      let compute_z = function(x,y){return Math.sqrt(Rf*Rf-x*x) - Rf + Math.sqrt(Rs*Rs-y*y) - Rs;};
      /* Center of the foot */
      let center = [-ankle[0], -ankle[1]+ d ];
      /* Min/Max X point */
      let minX = Rs * Math.sin(phi) + center[0],
          maxX = Rs * Math.sin(-phi) + center[0],
          /* Create the vertices from the theoretical angles */
          points = [new Vec3(minX,0.0,compute_z(minX,0.0)), new Vec3(maxX,0.0,compute_z(maxX,0.0))];
      for(let i = 0; i < num_points; i++){
        let theta = -phi + (2.0*phi/num_points) * i;
            theta = +theta.toFixed(4);
        /* The last point occurs at phi */
        if(theta === phi) break;
        let x =  Rs * Math.sin(theta) + center[0],
            y = -Rs * Math.cos(theta) + center[1];
        /* Add the point to the list */
        points.push(new Vec3(x,y,compute_z(x,y)));
      }
      /* Add the last two points */
      let x = Rs*Math.sin(phi)+center[0], y =-Rs*Math.cos(phi)+center[1];
      points.push(new Vec3(x,y,compute_z(x,y)));
      points.push(new Vec3(minX,0.0,compute_z(minX,0.0)));
      /* Clone the points to make the back have of the foot*/
      let offset = new Vec3(0.0,0.0,3.25), result = new Vec3(0,0,0);
      let len = points.length;
      for(let j = 0; j < len; j++){
        result.addVectors(points[j],offset);
        points.push(_.clone(result));
      }
      return createConvex(points, "#ffffff",[],[0,0,z_off])
    }

    function passive_motion_ODE45(y){
      let solution = y;
      let theta_st = y[0],   theta_sw = y[1],
          theta_st_p = y[2], theta_sw_p = y[3],
          theta_p = math.matrix([theta_st_p, theta_sw_p]);

      /* ODE: H(theta)*theta_p + C(theta, theta_p)*theta_P + G(theta) = 0 */
      let
          H11 = I + m*b*b + m*d*d + 2.0*m*Rs*Rs - 2.0*m*Rs*(b+d)*Math.cos(theta_st-gamma),
          H12 = m*(b-d)*(d*Math.cos(theta_st-theta_sw)-Rs*Math.cos(theta_sw-gamma)),
          H22 = I + m*(b-d)*(b-d),
          H = math.matrix([[H11,H12],[H12,H22]]),
          det_H = math.det(H),
          H_inv = math.matrix([[H22/det_H,-H12/det_H],[-H12/det_H,H11/det_H]]);
      let
          C11 = m*Rs*(b+d)*theta_st_p*Math.sin(theta_st-gamma)
              + 0.5*m*d*(b-d) * theta_sw_p*Math.sin(theta_st-theta_sw),
          C12 = m*(b-d) * (d*Math.sin(theta_st-theta_sw) * (theta_sw_p-0.5*theta_st_p)
              + Rs*Math.sin(theta_sw-gamma)*theta_sw_p),
          C21 = m*(b-d) * (d*Math.sin(theta_st-theta_sw) * (theta_st_p-0.5*theta_sw_p)
              - 0.5*Rs* Math.sin(theta_sw-gamma) * theta_sw_p),
          C22 = 0.5*m*(b-d) * theta_st_p * (d*Math.sin(theta_st-gamma)
              + Rs*Math.sin(theta_sw-gamma)),
          C   = math.matrix([[C11,C12],[C21,C22]]),
          nC  = math.multiply(C, -1.0);
      let G = math.matrix([ m*g*((b+d)*Math.sin(theta_st) - 2.0*Rs*Math.sin(gamma)),
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
        2.0*b*d*Math.cos(y[1]-y[0])-(b+d)*Rs*Math.cos(y[1]-gamma) -
          2.0*b*Rs*Math.cos(y[0]-gamma) + 2.0*Rs*Rs + b*b - b*d,
        (b-d)*(b-Rs*Math.cos(y[1]-gamma)),
        (b-d)*(b-Rs*Math.cos(y[1]-gamma)),
        0
      ],
        oM = math.matrix([
          [Omega_m[0],Omega_m[1]],
          [Omega_m[2],Omega_m[3]]
        ]);

      let Omega_p = [
        (b-d)*(d*Math.cos(y[0]-y[1]) - Rs*Math.cos(y[0]-gamma)+(b-d)),
        -Rs*(b-d)*Math.cos(y[0]-gamma) - Rs*(b+2.0*d) * Math.cos(y[1]-gamma) + d*d + 2.0*Rs*Rs +
          Rs*b*Math.cos(y[1]+gamma) - b*b*Math.cos(2.0*y[1]) + d*(b-d)*Math.cos(y[0]-y[1]),
        (b-d)*(b-d),
        (b-d)*(d*Math.cos(y[0]-y[1]) - Rs*Math.cos(y[0]-gamma))
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

    function initialize_walker_model(scene){

      let hip = create_body([Math.asin(3.5/Rf),0]);

      scene.add(hip);
    }

    function initialize_system(options, scene) {
      /* Calculate the initial for stable walking based on the papers equations */

      let w = initialize_walker_model(scene);
    }

    return {
      initialize: initialize_system,
      walk: walk,
      render: render_walker_3D
    }
  }
})();