"use strict";
(function() {

    let controls, scene, camera, renderer, geometry, material, mesh, interpolate;
    let textLoader, animation_then, animation_count = 0, total_elapsed = 0;

    let rotations = [];

    let render = function() {
        renderer.render(scene, camera);
    };

    /* apply spherical interpolation */
    function slerp(euler,t) {
      let quaternion = new THREE.Quaternion().setFromEuler(euler);
      let q = mesh.quaternion.slerp(quaternion, 1.0-t);
    }

    /* apply linear interpolation */
    function lerp(euler,t) {

      let currentRot = mesh.rotation.toVector3(),
             nextRot = currentRot.lerp(euler.toVector3(), t);
      mesh.rotation.setFromVector3(nextRot, euler.order);
    }

    /* based on the request animation example here: http://jsfiddle.net/m1erickson/CtsY3/*/
    function animate(interval) {
      // request another frame
      requestAnimationFrame(animate.bind(null,interval));

      controls.update();

      // calculate elapsed time since last loop
      let now  = Date.now(),
          elapsed = now - animation_then;

      // increment the total time elapsed
      total_elapsed += elapsed;

      let next_second = parseInt(total_elapsed / 1000.0) + 1.0,
          t = next_second - (total_elapsed/ 1000.0),
          idx = ((next_second-1) % rotations.length);

      // if enough time has elapsed, draw the next frame
      if (elapsed > interval && mesh) {
        let euler = new THREE.Euler(rotations[idx].x, rotations[idx].y, rotations[idx].z, "XYZ");
        interpolate(euler,t);

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

    let createGeometry = function(letter, tempMesh, color, rotation, animated) {
        textLoader = new THREE.FontLoader();
        textLoader.load( 'font/Georgia_Regular.json',  function ( font ) {

            geometry = new THREE.TextGeometry( letter, {
                font: font,
                size: 1,
                height: 0.2,
                curveSegments: 12
            } );

            // geometry = new THREE.BoxGeometry( 1, 1, 1 );
            material = new THREE.MeshBasicMaterial( { color: color } );
            tempMesh = new THREE.Mesh( geometry, material );

            if(rotation){
                let euler = new THREE.Euler(rotation.x, rotation.y, rotation.z, "XYZ");
                tempMesh.quaternion.setFromEuler(euler);
            }

            if(animated){
                mesh = tempMesh;
            }

            scene.add( tempMesh );
        } );

    };

    let parseJSON = function(file) {

        d3.json(file, function(error, data) {
          let tempMesh;
          /* Create the letter */
          createGeometry(data.letter, mesh, 0x00ff00, null, true);

          /* Read the interpolation and rotations*/
          if(data.interpolation === "slerp") {
            interpolate = slerp;
          }
          else if(data.interpolation === "lerp"){
            interpolate = lerp;
          }

          data.rotations.forEach(function(ts){
              let rotation;
              if(ts.format === "radians"){
                  rotation = {
                      x: parseFloat(ts.rotation.x),
                      y: parseFloat(ts.rotation.y),
                      z: parseFloat(ts.rotation.z)};
              }
              else{
                  rotation = {
                      x:parseFloat(ts.rotation.x) * Math.PI/2.0,
                      y:parseFloat(ts.rotation.y)* Math.PI/2.0,
                      z:parseFloat(ts.rotation.z)* Math.PI/2.0 };
              }

              rotations.push(rotation);
              createGeometry(data.letter, tempMesh, 0xffffff, rotation);

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

   parseJSON("models/juans.json");
   // parseJSON("models/gimble.json");
   // parseJSON("models/positions.json");

  /* keyboard */
  document.addEventListener('keydown', (event) => {
    const keyName = event.key;

    if (keyName === 'Control') {
      // do not alert when only Control key is pressed.
      return;
    }

    switch(keyName){

      case 's':
      case 'S':
        interpolate = slerp;
        break;
      case 'l':
      case 'L':
        interpolate = lerp;
        break;

    }

  }, false);



})();