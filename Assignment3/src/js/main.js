/*
Name: Timothy Luciani
Class: CS527
File: main.js
Assignment 3
*/
"use strict";
(function(){
  let
      animation_then, calculate_then,
      camera, controls, scene, renderer;

  let animation_count = 0;

  function render(){
    /* Render the scene */
    Boids_Manager.render(scene);
    renderer.render(scene, camera);
  }

  /* based on the request animation example here: http://jsfiddle.net/m1erickson/CtsY3/*/
  function animate(interval) {
    // request another frame
    requestAnimationFrame(animate.bind(null,interval));

    // calculate elapsed time since last loop
    let now = Date.now(),
      elapsed = now - animation_then;

    // if enough time has elapsed, draw the next frame
    if (elapsed > interval) {
      animation_count++;
      // Get ready for next frame by setting then=now, but...
      animation_then = now - (elapsed % interval);

      Boids_Manager.navigate(elapsed/1e3);

      /* Render the scene */
      render();
    }
  }

  /* Start animating at a certain fps */
  function setAnimationIntervals(fps,cb) {
    animation_then = calculate_then = Date.now();
    cb(1000.0 / fps);
  }

  function initialize() {

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.set( 715, 0, 458 );

    controls = new THREE.OrbitControls( camera );
    controls.minDistance = 10;
    controls.maxDistance = 1500;

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xeeeeee );

    // renderer
    renderer = new THREE.WebGLRenderer( { canvas: document.getElementById("particleCanvas"), antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    /* Add lights to the scene to see the model */
    let ambientLight = new THREE.AmbientLight( 0x444444 );
    scene.add( ambientLight );

    let directionalLight = new THREE.DirectionalLight( 0xffeedd );
        directionalLight.position.set( 0, 0, 1 ).normalize();
    scene.add( directionalLight );


    /* Grid Floor*/
    let floor = new THREE.GridHelper( 800, 10 );
    let ceiling = new THREE.GridHelper( 800, 10 );
    // celing
    let axis = new THREE.AxisHelper(50);
    scene.add( floor );
    // scene.add( ceiling );
    scene.add( axis );

    Boids_Manager.initialize(10, scene);
      // .then(function(){
      /* begin animating the scene */
      setAnimationIntervals(60, animate);
    // });

    document.body.appendChild( renderer.domElement );

    window.addEventListener( 'resize', onWindowResize, false );
  }

  function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
  }

  /* start the application once the DOM is ready */
  document.addEventListener('DOMContentLoaded', initialize);

})();