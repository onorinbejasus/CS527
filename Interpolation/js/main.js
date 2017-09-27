"use strict";
(function() {

    let controls, scene, camera, renderer, geometry, material, mesh;
    let textLoader, animation_then, animation_count = 0, total_elapsed = 0;

    let rotations = [];

    let render = function() {
        renderer.render(scene, camera);
    };

  /* based on the request animation example here: http://jsfiddle.net/m1erickson/CtsY3/*/
  function animate(interval) {
    // request another frame
    requestAnimationFrame(animate.bind(null,interval));

    controls.update();

    // calculate elapsed time since last loop
    let now = Date.now(),
        elapsed = now - animation_then;

    // increment the total time elapsed
    total_elapsed += elapsed;

    let next_second = parseInt(total_elapsed / 1000.0) + 1.0,
        t = next_second - (total_elapsed/ 1000.0),
        idx = ((next_second-1) % rotations.length);

    // if enough time has elapsed, draw the next frame
    if (elapsed > interval && mesh) {
      console.log(t);
      let quaternion = new THREE.Quaternion(rotations[idx].x, rotations[idx].y, rotations[idx].z, 1.0);
      mesh.quaternion.slerp(quaternion, 1.0-t);

      animation_count++;
      // Get ready for next frame by setting then=now, but...
      animation_then = now - (elapsed % interval);

      /* Render the scene */
      render();
    }
  }

  /* Start animating at a certain fps */
  function setAnimationIntervals(fps,cb) {
    animation_then = Date.now();
    cb(1000.0 / fps);
  }

    let addControls = function() {
        controls = new THREE.OrbitControls( camera, renderer.domElement );
        controls.addEventListener( 'change', render ); // remove when using animation loop
        // enable animation loop when using damping or autorotation
        //controls.enableDamping = true;
        //controls.dampingFactor = 0.25;
        controls.enableZoom = true;
    };

    let createGeometry = function(letter) {
        textLoader = new THREE.FontLoader();
        textLoader.load( 'font/Georgia_Regular.json', function ( font ) {

            geometry = new THREE.TextGeometry( letter, {
                font: font,
                size: 2,
                height: 0.5,
                curveSegments: 12
            } );

            // geometry = new THREE.BoxGeometry( 1, 1, 1 );
            material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );

            mesh = new THREE.Mesh( geometry, material );
            scene.add( mesh );
        } );

    };

    let parseJSON = function(file) {

        d3.json(file, function(error, data) {
          createGeometry(data.letter);

          data.rotations.forEach(function(rot){
            rotations.push({x:parseInt(rot.x),y:parseInt(rot.y),z:parseInt(rot.z)})
          });

          /* start animation */
          setAnimationIntervals(60, animate);
        });
    };

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
    renderer = new THREE.WebGLRenderer();

    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    camera.position.z = 10;

    let axisHelper = new THREE.AxisHelper( 5 );
    scene.add( axisHelper );

    addControls();

   parseJSON("models/positions.json");

})();