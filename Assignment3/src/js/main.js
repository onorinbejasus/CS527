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
      render(animation_count);
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
    let ambientLight = new THREE.AmbientLight( 0xFFFFFF );
    scene.add( ambientLight );

    // let directionalLight = new THREE.DirectionalLight( 0xffeedd );
    //     directionalLight.position.set( 0, 0, 1 ).normalize();
    // scene.add( directionalLight );


    /* Grid Floor*/
    let floor = new THREE.GridHelper( 800, 10 );
    let ceiling = new THREE.GridHelper( 800, 10 );

    let axis = new THREE.AxisHelper(50);
    scene.add( floor );
    // scene.add( ceiling );
    scene.add( axis );

    /* Create a wireframe cube around the scene */
    let cubeGeometry = new THREE.BoxGeometry( 800, 400, 800 );
    let water_material = new THREE.MeshBasicMaterial( {color: 0x0000ff} );
    water_material.transparent = true;
    water_material.opacity = 0.1;

    //
    // let edge = new THREE.EdgesGeometry( cubeGeometry );
    // let edgeMaterial = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 2 } );
    // let wireframe = new THREE.LineSegments( edge, edgeMaterial );

    let sphereGroup = new THREE.Group();
    sphereGroup.name = "sphereGroup";
    let geometry = new THREE.SphereGeometry( 20, 64, 64 );
    let material = new THREE.MeshBasicMaterial( {color: 0xffff00} );

    let sphere = new THREE.Mesh( geometry.clone(), material.clone() );
      sphere.position.set(100, 100, 100)
    let sphere1 = new THREE.Mesh( geometry.clone(), material.clone() );
      sphere1.position.set(10, 250, -300)
    let sphere2 = new THREE.Mesh( geometry.clone(), material.clone() );
    sphere2.position.set(350, 30, -10)
    let sphere3 = new THREE.Mesh( geometry.clone(), material.clone() );
    sphere3.position.set(0, 50, 0)
    let sphere4 = new THREE.Mesh( geometry.clone(), material.clone() );
    sphere4.position.set(0, 350, 75);

    sphereGroup.add( sphere );
    sphereGroup.add (sphere1  );
    sphereGroup.add( sphere2);
    sphereGroup.add( sphere3 );
    sphereGroup.add( sphere4 );

    scene.add(sphereGroup);

    let aquarium = new THREE.Mesh(cubeGeometry, water_material);
    aquarium.position.set(0, 200, 0);
    scene.add( aquarium );

    d3.json("boids.json", function(data) {
      Boids_Manager.initialize(data.number, data.direction, scene);
      // .then(function(){
      /* begin animating the scene */
      setAnimationIntervals(60, animate);
    });


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