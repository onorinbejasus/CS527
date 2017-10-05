'use strict';

  let self = {};

  function DeCastlejau(p0, p1, p2, p3){

    self.p0 = p0;
    self.p1 = p1;
    self.p2 = p2;
    self.p3 = p3;

    return {
      knots : function(){
        return [self.p0, self.p1, self.p2, self.p3];
      },
      evaluate: function (t, bone) {

        // de Castlejau construction
        let Q0 = self.p0.slerp(self.p1, t);
        let Q1 = self.p1.slerp(self.p2, t);
        let Q2 = self.p2.slerp(self.p3, t);

        let R1 = Q0.slerp(Q1, t);
        let R2 = Q1.slerp(Q2, t);

        // THREE.Quaternion.slerp(self.p0, self.p1, Q0, t);
        // THREE.Quaternion.slerp(self.p1, self.p2, Q1, t);
        // THREE.Quaternion.slerp(self.p2, self.p3, Q2, t);

        // THREE.Quaternion.slerp(Q0, Q1, R1, t);
        // THREE.Quaternion.slerp(Q1, Q2, R2, t);

        THREE.Quaternion.slerp(R1, R2, bone, t);
      }
    };
  }