"use strict";
(function(){

  let clock = new THREE.Clock(),
    camera, controls, scene, renderer, mixer, skeletonHelper;


  function setupSkeleton(result) {
      skeletonHelper = new THREE.SkeletonHelper( result.skeleton.bones[ 0 ] );
      skeletonHelper.skeleton = result.skeleton; // allow animation mixer to bind to SkeletonHelper directly

      let boneContainer = new THREE.Group();
      boneContainer.add( result.skeleton.bones[ 0 ] );

      scene.add( skeletonHelper );
      scene.add( boneContainer );

      // play animation
      mixer = new THREE.AnimationMixer( skeletonHelper );
      mixer.clipAction( result.clip ).setEffectiveWeight( 1.0 ).play();
  }


  function loadBVH(model) {
    return new Promise(function(resolve, reject) {
      let loader = new THREE.BVHLoader();
      loader.load( model, function(result){
        resolve(result);
      });
    });
  }


  function init() {

    /* Load the BVH models*/
    loadBVH("models/bvh/pirouette.bvh").then(function(result){
      /* Setup the model once the async data fetch resolves  */
      setupSkeleton(result);
    });

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.set( 0, 200, 400 );

    controls = new THREE.OrbitControls( camera );
    controls.minDistance = 300;
    controls.maxDistance = 700;

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xeeeeee );

    scene.add( new THREE.GridHelper( 400, 10 ) );

    // renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    document.body.appendChild( renderer.domElement );

    window.addEventListener( 'resize', onWindowResize, false );

    /* animate the scene */
    animate();
  }

  function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

  }

  function animate() {

    requestAnimationFrame( animate );

    let delta = clock.getDelta();

    if ( mixer ) mixer.update( delta );

    renderer.render( scene, camera );

  }

  /* start the application once the DOM is ready */
  document.addEventListener('DOMContentLoaded', init);

})();