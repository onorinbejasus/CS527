(function(){

  const BSpline = function(ctrlPts) {
    function B_0(t) {
      let myt = 1 - t;
      return (myt*myt*myt/6);
    }
    function B_1(t) {
      return ((3*t*t*t - 6*t*t + 4)/6);
    }

    function B_2(t){
      return ((-3*t*t*t + 3*t*t +3*t+ 1)/6);
    }
    function B_3( t){
      return (t*t*t/6);
    }
    return {
      eval: function (t) {
        let i = 0;
        return (B_0(t) * ctrlPts[i] + B_1(t) * ctrlPts[i + 1] + B_2(t) * ctrlPts[i + 2] + B_3(t) * ctrlPts[i + 3]);
      }
    }
  }

})();