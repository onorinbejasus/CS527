(function(){
  if ( ! Detector.webgl ) Detector.addGetWebGLMessage();
  var container, stats;
  var camera, scene, renderer;
  var points, controls;

  const Rs = 38,
    Rf = 19.6,
    ah = 9,
    Vec3 = THREE.Vector3;
  let compute_z = function(x,y){return Math.sqrt(Rf*Rf-x*x) - Rf + Math.sqrt(Rs*Rs-y*y) - Rs;};

  function createConvex(positions, color, rot, trans){
    let group = new THREE.Group();
    let geometry = new THREE.ConvexBufferGeometry(positions);
    let material = new THREE.MeshLambertMaterial( {
      color: color,
      opacity: 1,
      transparent: false
    } );
    let mesh1 = new THREE.Mesh( geometry, material );

    if(rot && rot.length > 0){
      mesh1.rotateX(rot[0]);
      mesh1.rotateY(rot[1]);
      mesh1.rotateZ(rot[2]);
    }

    if(trans && trans.length > 0){
      mesh1.translateX(trans[0]);
      mesh1.translateY(trans[1]);
      mesh1.translateZ(trans[2]);
    }

    mesh1.material.side = THREE.BackSide; // back faces
    mesh1.renderOrder = 0;
    group.add(mesh1);

    let mesh2 = new THREE.Mesh( geometry, material );
    mesh2.material.side = THREE.FrontSide; // back faces
    mesh2.renderOrder = 1;

    if(rot && rot.length > 0){
      mesh2.rotateX(rot[0]);
      mesh2.rotateY(rot[1]);
      mesh2.rotateZ(rot[2]);
    }
    if(trans && trans.length > 0){
      mesh2.translateX(trans[0]);
      mesh2.translateY(trans[1]);
      mesh2.translateZ(trans[2]);
    }
    group.add(mesh2);

    return group;
  }

  /* Function to create the rocking foot model */
  function create_foot(ankle, num_points, z_off) {
    /* Center of the foot */
    let center = [-ankle[0], -ankle[1] + Rf - ah];
    /* Min/Max X point */

    let minX = -1.0,//Rs * Math.sin(phi) + center[0],
      maxX = 2.25,//Rs * Math.sin(-phi) + center[0],

      minTheta = Math.asin((minX-center[0])/Rf),
      maxTheta = Math.asin((maxX-center[0])/Rf);

    /* Create the vertices from the theoretical angles */
    points = [
      new Vec3(minX,0.0,compute_z(minX,0.0)),
      new Vec3(maxX,0.0,compute_z(maxX,0.0))
    ];

    console.log(points[0].x, points[1].z);

    for(let i = 0; i <= num_points; i++){
      let theta = maxTheta - (maxTheta-minTheta)/num_points * i;
      theta = +theta.toFixed(4);

      let x =    Rf * Math.sin(theta) + center[0],
          y   = -Rf * Math.cos(theta) + center[1],
          z = compute_z(x,y);

     /* Add the point to the list */
     points.push(new Vec3(x,y,z));
    }

    points.push(new Vec3(minX,0,compute_z(minX,0)));

    /* Clone the points to make the back have of the foot*/
    let verts = [];
    let len = points.length;
   // for(let j = 0; j < len; j++){
   //   result.addVectors(points[j],offset);
   //   points.push(_.clone(result));
   // }

    return createConvex(points, "#ffffff",[],[])
  }

  function init() {
    container = document.getElementById( 'container' );
    //
    camera = new THREE.PerspectiveCamera( 27, window.innerWidth / window.innerHeight, 5, 3500 );
    camera.position.z = 50;
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x050505 );
    scene.add( new THREE.AxisHelper() );
    /* Add lighting */
    scene.add( new THREE.AmbientLight( 0xffffff ) );
    camera.add( new THREE.PointLight( 0xffffff, 1 ) );

    controls = new THREE.OrbitControls( camera );
    controls.minDistance = 10;
    controls.maxDistance = 1500;

    let feet = create_foot([0.5 + 1.08, -7.625], 10, 0);
    scene.add(feet);

    renderer = new THREE.WebGLRenderer( { antialias: false } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );
    //
    stats = new Stats();
    container.appendChild( stats.dom );
    //
    window.addEventListener( 'resize', onWindowResize, false );
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
  }
  //
  function animate() {
    requestAnimationFrame( animate );
    render();
    stats.update();
  }

  function render() {
    var time = Date.now() * 0.001;
    //points.rotation.x = time * 0.25;
    //points.rotation.y = time * 0.5;
    renderer.render( scene, camera );
  }

  init();
  animate();

}());