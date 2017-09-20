"use strict";
(function() {

    let controls, scene, camera, renderer, geometry, material, mesh;
    let jsonLoader, textLoader;

    let render = function() {
        renderer.render(scene, camera);
    };

    let animate = function () {
        requestAnimationFrame( animate );
        controls.update();
        render();
    };

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
                curveSegments: 12,
                // bevelEnabled: true,
                // bevelThickness: 10,
                // bevelSize: 8,
                // bevelSegments: 5
            } );

            // geometry = new THREE.BoxGeometry( 1, 1, 1 );
            material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );

            mesh = new THREE.Mesh( geometry, material );
            scene.add( mesh );
        } );

    };

    let parseJSON = function(file) {

        d3.json(file, function(error, data) {

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

    createGeometry("B");
    addControls();

    parseJSON("models/positions.json");


    animate();

    
})();