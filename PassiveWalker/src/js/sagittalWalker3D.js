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
        Vec3 = THREE.Vector3,
        Mat4 = THREE.Matrix4;

    let internal_time = 0,
        dydt          = [0.0, 0.0, 0.0, 0.0],
        ankle         = [],
        hip_pos       = [],
        sW_foot       = false,
        debug         = false;


    let Solver = null;
    /* Closure variable to track internal states */
    let walker = {},
        steps = 0,
        collision_found = false,
        last_collision_t = 0,
        step_period = -1,
        prev_hip = -1;

    function rotate(angle) {
      return [[Math.cos(angle), -Math.sin(angle)], [Math.sin(angle), Math.cos(angle)]];
    }

    let degToRad = (a) => {return a * 0.0174533};

    /* To calculate Z-position */
    let compute_z = function(x,y){return Math.sqrt(Rf*Rf-x*x) - Rf + Math.sqrt(Rs*Rs-y*y) - Rs;};

    function createConvex(positions, color, rot, trans){
      let group = new THREE.Group();
      let geometry = new THREE.ConvexBufferGeometry(positions);
      let material = new THREE.MeshLambertMaterial( {
        color: color,
        opacity: 1,
        transparent: false
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

    /* Function to create the rocking foot model */
    function create_foot(ankle, num_points, z_off) {
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
          y   = -Rs * Math.cos(theta) + center[1];
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
      return createConvex(points, "#ffffff",[],[0,0,(-offset.z/2.0)+z_off])
    }

    /* Function to create the model's let */
    function create_legs (ankle, hip,feet_dist) {
      let legs_groups = new THREE.Group();
      let swing_group = new THREE.Group();
      let stance_group = new THREE.Group();

      let leg = [
        [0.625,0.75,1.7], [-0.625,ankle[1],1.5],
        [0.625,0.75,0.5], [-0.625,-1.12500,1.7],
      ];

      /* Construct the two legs */
      let points = [];
      for(let i = 0; i < leg.length; i++) {
        let swP = math.add(hip,leg[i]);
        let swX = swP[0], swY = swP[1], swZ = swP[2];
        points.push([swX,swY,swZ]);
      }

      let width_leg  = points[0][0]-points[1][0],
          height_leg = points[0][1]-points[1][1],
          depth_leg  = points[0][2]-points[1][2],
          width_chamber = points[2][0]-points[3][0],
          height_chamber = points[2][1]-points[3][1],
          depth_chamber = points[2][2]-points[3][2];

      let material = new THREE.MeshLambertMaterial( {
        color: "#00ff00",
        opacity: 1.0,
        transparent: false
      } ),

      chamber_geometry = new THREE.BoxGeometry( width_chamber, height_chamber, depth_chamber ),
      chamber_mesh = new THREE.Mesh( chamber_geometry, material );
      chamber_mesh.material.side = THREE.DoubleSide;

      let swing_geometry = new THREE.BoxGeometry( width_leg, height_leg, depth_leg ),
      swing_mesh = new THREE.Mesh( swing_geometry, material ),

      stance_geometry = new THREE.BoxGeometry( width_leg, height_leg, depth_leg ),
      stance_mesh = new THREE.Mesh( stance_geometry, material );

      let ratio = height_chamber/height_leg;

      /* Offset the leg by the ankle position */
      let swing_chamber =  chamber_mesh.clone(),
          stance_chamber = chamber_mesh.clone();
      swing_chamber.translateY(-ankle[1]-height_chamber*ratio);
      swing_chamber.translateZ(ankle[0]+(feet_dist)/2.0+depth_chamber+depth_leg/2.0);

      swing_mesh.position.setZ(ankle[0]+(feet_dist-width_leg)/2.0);
      swing_mesh.position.setY(-ankle[1]/2);

      stance_chamber.translateY(-ankle[1]-height_chamber*ratio);
      stance_chamber.translateZ(ankle[0]-(feet_dist)/2.0-depth_chamber-depth_leg/2.0);

      stance_mesh.position.setZ((ankle[0]-(feet_dist-width_leg)/2.0));
      stance_mesh.position.setY(-ankle[1]/2);

      /* Add the legs to the group */
      stance_group.add(stance_mesh);
      stance_group.add(stance_chamber);
      swing_group.add(swing_mesh);
      swing_group.add(swing_chamber);

      /* Construct the foot of the walker */
      let sw_foot = create_foot(ankle, 30,feet_dist/2);
      let st_foot = create_foot(ankle, 30,-feet_dist/2);

      // Add the feet to the group
      stance_group.add(st_foot);
      swing_group.add(sw_foot);

      /*Add the legs to a group */
      swing_group.name = "swing_leg";
      stance_group.name = "stance_leg";

      legs_groups.rotateX(degToRad(270));
      legs_groups.translateY(ankle[1]);

      legs_groups.add(swing_group);
      legs_groups.add(stance_group);

      return legs_groups;
    }

    function create_axel(hip,r,feet_dist,ankle) {
      // let axel_points = [];
      // for(let i = 0; i < 2.0*Math.PI; i+=0.1){
      //   axel_points.push([r*Math.sin(i)+hip[0][0], r*Math.cos(i)+hip[1][0]]);
      // }

      let material = new THREE.MeshLambertMaterial( {
        color: "#0000ff",
        opacity: 1.0,
        transparent: false
      } );
      let axel_geometry = new THREE.CylinderGeometry( r, r, feet_dist, 32 ),
          axel_mesh = new THREE.Mesh( axel_geometry, material );

      axel_mesh.name = "axel";

      axel_mesh.translateX(hip[0]);
      axel_mesh.translateY(hip[1]);
      axel_mesh.rotateX(90.0*0.0174533);

      return axel_mesh;
    }

    function get_hip(angular_disp) {
      // let group = new THREE.Group();
      let theta_rot = rotate(angular_disp[0]),
          phi_rot = rotate(angular_disp[1]);

      let theta = (!sW_foot)?angular_disp[0]:angular_disp[1],
          other_theta = (!sW_foot)?angular_disp[1]:angular_disp[0];

      let st_alpha = Math.max(Math.min(angular_disp[0]-gamma,phi),-phi),
          sw_alpha = Math.max(Math.min(angular_disp[1]-gamma,phi),-phi),
          alpha =  (!sW_foot)?st_alpha:sw_alpha,
          other_alpha = (sW_foot)?st_alpha:sw_alpha,
          gc = math.multiply(rotate(gamma),[[-Rs*alpha],[0]]),
          center = math.add(gc,math.multiply(rotate(theta-alpha), [[0],[Rs]])),
          hip = math.subtract(center, math.multiply(theta_rot, [[0],[d]]));

      if(prev_hip !== -1){
        //+hip[0][0].toFixed(3) !== +prev_hip[0][0].toFixed(3)
        if(hip[0][0] < prev_hip[0][0] || hip[1][0] > prev_hip[1][0]) {
          console.log("before", hip[0][0]);
              // gc = math.multiply(rotate(gamma),[[-Rs*alpha],[0]]);
              // center = math.add(gc,math.multiply(rotate(theta-alpha), [[0],[Rs]]));
              // hip = math.subtract(center, math.multiply(theta_rot, [[0],[d]]));
          gc = math.multiply(rotate(gamma),[[-Rs*other_alpha],[0]]);
          center = math.add(gc,math.multiply(rotate(other_theta-other_alpha), [[0],[Rs]]));
          hip = math.subtract(center, math.multiply(phi_rot, [[0],[d]]));
          if(hip[0][0] < prev_hip[0][0] && hip[1][0] > prev_hip[1][0]){
            sW_foot = false;
          }
        }
      }
      //
      prev_hip = hip;

      return hip;
    }

    function create_body(angular_disp) {
          // sw_center = math.add(hip, math.multiply(phi_rot, [[0],[d]])),
          // sw_gc = math.add(sw_center, math.multiply(rotate(angular_disp[1]-sw_alpha), [[0],[-Rs]]));

      let hip = get_hip(angular_disp);
      prev_hip = hip;
      hip_pos.push([hip[0][0],hip[1][0]]);

      ankle = [0.0,-11.5];
      let feet_distance = 6;

      /* Create the axel that connects the legs */
      let axel = create_axel(hip,0.25,feet_distance,ankle);

      /* Create the legs and feet */
      hip = [hip[0][0],hip[1][0],hip[0][0]/2];
      let legs = create_legs(ankle,hip, feet_distance);
      axel.add(legs);

      return axel;
    }

    /* Motion and rendering  */

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
      let swing = (!sW_foot) ? App.scene.getObjectByName("swing_leg") : App.scene.getObjectByName("stance_leg");
      let stance = (sW_foot) ? App.scene.getObjectByName("stance_leg") : App.scene.getObjectByName("swing_leg");
      let axel = App.scene.getObjectByName("axel");
      //let rot = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, degToRad(theta)), 'XYZ');

      //let hip = get_hip(
          //[theta,phi]);
          //(!sW_foot)?[theta,phi]:[phi,theta]);

      //hip_pos.push([hip[0][0],hip[1][0]]);

      // if(hip_pos.length > 10) {
      //   debug = true;
      // }

      // axel.position.setX(hip[0][0]);
      // axel.position.setY(hip[1][0]);

      // axel.translateX(hip[0][0]);
      // axel.translateY(hip[1][0]);

      swing.translateY(-ankle[1]);
      swing.setRotationFromEuler(new THREE.Euler(0,0,theta,"XYZ"));
      swing.translateY(ankle[1]);

      stance.translateY(-ankle[1]);
      stance.setRotationFromEuler(new THREE.Euler(0,0,phi,"XYZ"));
      stance.translateY(ankle[1]);
    }

    function walk(time) {

      let t = [], y = [], target_time = time + step_size, omega;

      while( internal_time <= target_time ) {

        dydt = passive_motion_ODE45(dydt);

        y.push(_.clone(dydt));

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

          update_walker(dydt[0],dydt[1]);

          /* Reverse the leg angles based on the impulse */
          dydt[0] = previous[1];
          dydt[1] = previous[0];
          dydt[2] = omega[1];
          dydt[3] = omega[0];

          sW_foot = !sW_foot;
          update_walker(dydt[0],dydt[1]);

          console.log("collision");

          /* Push the new solution onto the list*/
          y.push(dydt);

          collision_found = false;
        }
        internal_time += step_size;
        steps++;
        // if(steps > 600){
        //   console.log(hip_pos);
        //   App.walk = false;
        // }
      }

      // App.walk = false;
      update_walker(dydt[0],dydt[1]);

      // let current = y.slice(-1)[0];
      // console.log(t.slice(-1)[0]);
      // console.log(current[0], current[1], current[2], current[3]);

      /* Update the walker's position */
      //update_walker(current[0], current[2]);

    }

    function initialize_walker_model(scene){
      let hip = create_body([0,0]);
      scene.add(hip);
    }

    function initialize_system(options, scene) {
      /* Calculate the initial for stable walking based on the papers equations */

      let w = initialize_walker_model(scene);
    }

    return {
      initialize: initialize_system,
      walk: walk,
      update: update_walker
    }
  }
})();