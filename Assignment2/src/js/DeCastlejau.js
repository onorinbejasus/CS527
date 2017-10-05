'use strict';
  function DeCastlejau(p0, p1, p2, p3){

    let self = {};

    self.p0 = p0;
    self.p1 = p1;
    self.p2 = p2;
    self.p3 = p3;

    return {
      evaluate: function (t, bone) {

        let Q0 = new THREE.Quaternion(),
            Q1 = new THREE.Quaternion(),
            Q2 = new THREE.Quaternion(),
            R1 = new THREE.Quaternion(),
            R2 = new THREE.Quaternion();

        // de Castlejau construction
        THREE.Quaternion.slerp(self.p0, self.p1, Q0, t);
        THREE.Quaternion.slerp(self.p1, self.p2, Q1, t);
        THREE.Quaternion.slerp(self.p2, self.p3, Q2, t);

        THREE.Quaternion.slerp(Q0, Q1, R1, t);
        THREE.Quaternion.slerp(Q1, Q2, R2, t);

        THREE.Quaternion.slerp(R1, R2, bone, t);
      }
    };
  }