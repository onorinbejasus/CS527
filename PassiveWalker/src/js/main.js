/*
Name: Timothy Luciani
Class: CS527
File: simpleWalker2D.js
Final Project
*/
"use strict";

var App = App || {};

(function () {

  /*Application variables*/
  let previous_time, calculate_then, total_elapsed = 0,
    animation_count = 0, interval, controls;
  let container, stats, camera,renderer;
  App.walk = false;

  /* Walker variables */
  let walker, slope = -0.1, IC, rotationX = 0, rotationY = 0;

  function create_ramp(slope) {
    let A = new THREE.Vector2( -2, 0 );
    let B = new THREE.Vector2( -2, 10 );
    let C = new THREE.Vector2( 10/Math.tan(slope),0 );

    let height = 10;
    let geometry = new App.PrismGeometry( [ A, B, C ], height );
    geometry.scale(1.0,1.0,1.5);

    let material = new THREE.MeshLambertMaterial( {
          color: 0x8c510a,
          opacity: 0.75,
          transparent: true
        } );
    let prism1 = new THREE.Mesh( geometry, material );

    prism1.translateY(-10);
    prism1.translateZ(-prism1.geometry.vertices[5].z/2.0);
    App.scene.add( prism1 );
  }

  function render() {
    renderer.render( App.scene, camera );
  }

  /* based on the request animation example here: http://jsfiddle.net/m1erickson/CtsY3/*/
  function animate() {
    // request another frame
    requestAnimationFrame(animate);

    if(App.walk){
      // calculate elapsed time since last loop
      let now = Date.now(),
          elapsed = now - previous_time;
      total_elapsed += elapsed;
      // Get ready for next frame by setting then=now, but...
      previous_time = now - (elapsed % interval);

      // if enough time has elapsed, draw the next frame
      if (elapsed > interval) {
        animation_count++;

        /* Move the walker forward in the App.scene */
        walker.walk(total_elapsed/1e3 + Number.EPSILON);
      }

      if(total_elapsed/1e3 > 10){
        App.walk = false;
      }

    }

    /* Render the scene */
    render();
  }

  /* Start animating at a certain fps */
  function setAnimationIntervals(fps, cb) {
    previous_time = calculate_then = Date.now();
    interval = 1000.0 / fps;
    cb();
  }

  function initialize() {
    /* Setup the canvas */
    container = document.getElementById( 'container' );

    /* Create the camera and set it's position */
    camera = new THREE.PerspectiveCamera( 27, window.innerWidth / window.innerHeight, 5, 3500 );
    camera.position.z = 150;
    /* Create the App.scene */
    App.scene = new THREE.Scene();
    App.scene.background = new THREE.Color( 0x050505 );
    /* Add the axis helper*/
    App.scene.add( new THREE.AxisHelper() );
    /* Add lighting */
    App.scene.add( new THREE.AmbientLight( 0xffffff ) );
    camera.add( new THREE.PointLight( 0xffffff, 1 ) );
    /* Set the mouse controls */
    controls = new THREE.OrbitControls( camera );
    controls.minDistance = 10;
    controls.maxDistance = 1500;

    /* Initialize the walker */
    walker = new Sagittal_Walker_3D({gamma: slope, step_size:1e-3});

    /* get the initial conditions (ICs) */
    IC = walker.initialize({
      start_time: 0,
      maxIncreaseFactor: 2,
      maxDecreaseFactor: 4
    }, App.scene);

    create_ramp(Math.sign(slope)*slope);

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );
    setAnimationIntervals(64, animate);

    /* start the application once the DOM is ready */
    document.addEventListener('keydown', (event) => {
      const keyName = event.key;
      if (keyName === 'a') {
        rotationX -= (3 * 0.0174533);
        walker.update([rotationX,rotationY]);
      }
      else if (keyName === 's') {
        rotationY -= (3 * 0.0174533);
        walker.update([rotationX,rotationY]);
      }
      else if(keyName === 'r') {
        previous_time = calculate_then = Date.now();
        App.walk = !App.walk;
      }

    }, false);
  }

  document.addEventListener('DOMContentLoaded', initialize);

})();