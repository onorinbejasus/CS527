(function(){

  let particles = [];
  let c = document.getElementById("particleCanvas"),
    ctx = c.getContext("2d");

  // rAF
  window.requestAnimationFrame = function() {
    return window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      window.oRequestAnimationFrame ||
      function(f) {
        window.setTimeout(f,1e3/60);
      }
  }();

  function initialize() {

  }

  function accumulateForces() {

  }

  function integrate() {

  }

  function animationLoop() {

  }

  function render() {
    ctx.beginPath();
    ctx.arc(95,50,40,0,2*Math.PI);
    ctx.stroke();
  }

  function renderingLoop() {
    requestAnimationFrame( renderingLoop );
    render();
  }

// TODO look at this: http://jsfiddle.net/m1erickson/CtsY3/


})();