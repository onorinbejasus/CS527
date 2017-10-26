"use strict";
(function(){

  let clock = new THREE.Clock(),
      camera, controls, scene, renderer, skeletonHelper,
      transformations = {}, times = [],
      looping_transforms = {}, looping_times = {},
      transformations_static = [],
      animation_then, animation_count = 0, total_elapsed = 0,
      t = 0, idx = 0, flag = false, pause = false, iterate = false,
      loop_count = 0, looping = false;

  let boneMap = {bones:{}};
  let cam = new THREE.Vector3(715, 390, 458);

  let render = function() {
    renderer.render(scene, camera);
    // camera.lookAt(boneMap.bones["Hips"]);
  };

  /* based on the request animation example here: http://jsfiddle.net/m1erickson/CtsY3/*/
  function animate(interval) {
    // request another frame
    requestAnimationFrame(animate.bind(null,interval));

    // calculate elapsed time since last loop
    // controls.update();

    // calculate elapsed time since last loop
    let now = Date.now(),
        elapsed = now - animation_then;

    // Get ready for next frame by setting then=now
    animation_then = now - (elapsed % interval);

    /* allow */
    if(iterate) {
      pause = false;
      console.log(idx, t);
    }

    /* pause the animation */
    if(pause) {
      render();
      return;
    }

    // increment the total time elapsed
    total_elapsed += elapsed;

    let now_milli = total_elapsed/1e3;

    // if enough time has elapsed, draw the next frame
    if (elapsed > interval) {

      animation_count++;

      /* Find which frames we are between */
      let timeIdx = _.find(times, function(time) {
        return time > total_elapsed/1e3;
      });

      idx = _.indexOf(times, timeIdx);
      t = (now_milli-times[idx-1])/(timeIdx-times[idx-1]);

      if(flag){
        console.log()
      }

      flag = false;

      /* Iterate over each bone and calculate the next location */
      skeletonHelper.skeleton.bones.forEach(function(bone){

        /* Get the stored rotation and translation */
        let bone_transforms = _.get(transformations, "bones["+bone.name+"]");
        if(!bone_transforms) return;

        if(idx > -1){
          let rotIdx = parseInt(Math.floor(idx/3));
          if(bone_transforms.translation){
            /* Get the rotation and translation */
            let trans  = bone_transforms.translation[idx],
                trans_last = bone_transforms.translation[idx-1];

            let lerpped = new THREE.Vector3().lerpVectors(trans_last,trans,t);
            bone.position.set(lerpped.x, lerpped.y, lerpped.z);

            camera.position.set(cam.x + lerpped.x, cam.y, cam.z + lerpped.z);
          }

          if(bone_transforms.rotation[rotIdx]){
            /* Get the rotation and translation */
            let rot = bone_transforms.rotation[rotIdx];
            /* Interpolate the next rotation */
            try{
              rot.spline.evaluate(t,bone.quaternion);
            }
            catch(e){
              console.log(rotIdx);
            }
          }
        }
        else {
          // increment the times by the total time elapsed
          if(!flag){
            loop_count++;
            let last_time = total_elapsed / 1000;
            times = _.map(looping_times, function(time){ return time + last_time });
            flag = true;
          }

          /* Set the new transformations */
          let loop = _.clone(_.get(looping_transforms, "bones["+bone.name+"]"));
          if (loop.translation){
            /* Save the last translation */
            let previous_translation = _.clone(bone_transforms.translation.slice(-1)[0]);
            loop.translation = _.map(loop.translation, function(pos){
              let addpos = new THREE.Vector3();
              addpos.addVectors(pos, previous_translation);
              return addpos;
            });
            //loop.translation.unshift(previous_translation);
          }
          transformations["bones["+bone.name+"]"] = _.clone(loop);
          looping = true;
        }
      });

      /* Render the scene */
      render();
      if(iterate) {
        iterate = false;
        pause = true;
      }
    }
  }

  /* Start animating at a certain fps */
  function setAnimationIntervals(fps,cb) {
    animation_then = Date.now();
    cb(1000.0 / fps);
  }

  function constructBSplines(tracks){
    tracks.forEach(function(track){
      let bone = track.name.split('.')[1];

      /* construct the interpolates for the rotations */
      if(track.constructor.name === "QuaternionKeyframeTrack"){
        let rotArr = [], loopRotArr = [];
        let i = 0;

        /* store the times */
        if(times.length === 0){
            times = track.times.slice(0,33);//.map(function(x) { return x * 10 });
            looping_times = track.times.slice(15,33);//.map(function(x) { return x * 10 });
            /* normalize the values to start at the next time step after the animation loop*/
            looping_times = _.map(looping_times, function(time){return time - looping_times[0]});
        }

        if(track.values.length === 8){
          let Q = new THREE.Quaternion(track.values[0], track.values[1],
              track.values[2], track.values[3] );//.normalize();
          transformations_static[bone] = transformations_static[bone] || {};
          transformations_static[bone].rotation = Q;
          return;
        }

        /* iterate over the tracks and stores the rotations */
        for(i = 0; i < track.values.length; i+=4){
          rotArr.push(
              new THREE.Quaternion(track.values[i],track.values[i+1],
                          track.values[i+2],track.values[i+3])
          );
        }

        let interpolates = [];
        /* Make the interpolates */
        for(i = 0; i+1 < rotArr.length; i+=3){
          interpolates.push(
            {
              spline: new DeCastlejau(rotArr[i],rotArr[i+1],rotArr[i+2],rotArr[i+3] )//,
            }
            );
        }

        transformations[bone] = transformations[bone] || {};
        transformations[bone].rotation = _.clone(interpolates).slice(0,12);

        /* iterate over the tracks and stores the looping rotations */
        for(i = 60; i < 128; i+=4){
          loopRotArr.push(
            new THREE.Quaternion(track.values[i],track.values[i+1],
              track.values[i+2],track.values[i+3])
          );
        }

        let loop_interpolates = [];
        /* Make the looping interpolates */
        for(i = 0; i+2 < loopRotArr.length; i+=3){
          loop_interpolates.push(
            {
              spline: new DeCastlejau(loopRotArr[i],loopRotArr[i+1],loopRotArr[i+2],loopRotArr[i+3] )//,
            }
          );
        }

        looping_transforms[bone] = looping_transforms[bone] || {};
        looping_transforms[bone].rotation = _.clone(loop_interpolates);
      }
      else {
        let transArr = [];
        let i = 0;

        /* store the times */
        if(times.length === 0){
          times = track.times.slice(0,33);//.map(function(x) { return x * 10 });
          looping_times = track.times.slice(15,33);//.map(function(x) { return x * 10 });
          /* normalize the values to start at the next time step after the animation loop*/
          looping_times = _.map(looping_times, function(time){return time - looping_times[0]});
        }

        if(track.values.length === 6){
          let T = new THREE.Vector3(track.values[0], track.values[1],track.values[2]);
          transformations_static[bone] = transformations_static[bone] || {};
          transformations_static[bone].translation = T;
          return;
        }

        /* iterate over the tracks and stores the rotations */
        for(i = 0; i < track.values.length; i+=3){
          transArr.push(new THREE.Vector3(track.values[i],track.values[i+1],track.values[i+2]));
        }
        transformations[bone] = transformations[bone] || {};
        looping_transforms[bone] = looping_transforms[bone] || {};
        transformations[bone].translation = _.clone(transArr).slice(0, 33);

        looping_transforms[bone].translation = _.clone(transArr).slice(15, 33);
        /* normalize the translations in regards to the first */
        looping_transforms[bone].translation = _.map(looping_transforms[bone].translation, function(pos){
          let addpos = new THREE.Vector3();
          addpos.subVectors(pos, looping_transforms[bone].translation[0]);
          return addpos;
        });
      }
    });
  }

  function setInitialSkeleton(){
    /* Set the initial transformation */
    _.toPairs(transformations_static).forEach(function(transform){

      if(transform[1].translation){
        _.get(boneMap, transform[0]).position
            .setX(transform[1].translation.x)
            .setY(transform[1].translation.y)
            .setZ(transform[1].translation.z)
      }

      if(transform[1].rotation){
        _.get(boneMap, transform[0]).quaternion
            .set(transform[1].rotation.x, transform[1].rotation.y,
                transform[1].rotation.z, transform[1].rotation.w);
      }
    });
  }

  function setupSkeleton(result) {
      skeletonHelper = new THREE.SkeletonHelper( result.skeleton.bones[ 0 ] );
      skeletonHelper.skeleton = result.skeleton;

      let boneContainer = new THREE.Group();
      boneContainer.add( result.skeleton.bones[ 0 ] );

      /* Setup a map of the bones */
      boneMap.bones =  _.keyBy(skeletonHelper.bones, "name");

      constructBSplines(result.clip.tracks);
      setInitialSkeleton();

      /* Add the skeleton and bone container */
      scene.add( skeletonHelper );
      scene.add( boneContainer );

    /* animate the scene */
    setAnimationIntervals(60, animate)
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

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 10000 );

    camera.position.set( 715, 390, 458 );
    camera.lookAt(new THREE.Vector3());
    controls = new THREE.OrbitControls( camera );
    controls.minDistance = 100;
    controls.maxDistance = 1500;

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xeeeeee );

    /* Load the BVH models*/
    loadBVH("models/bvh/Male_Running.bvh").then(function(result){
      /* Setup the model once the async data fetch resolves  */
      setupSkeleton(result);
    });

    let grid = new THREE.GridHelper( 400, 10 );
    grid.translateY(100);

    scene.add( grid );

    // renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    document.body.appendChild( renderer.domElement );

    window.addEventListener( 'resize', onWindowResize, false );
  }

  function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
  }

  /* start the application once the DOM is ready */
  document.addEventListener('DOMContentLoaded', init);

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
        pause = true;
        break;
      case 'g':
      case 'G':
        pause = false;
        break;
      case 'i':
      case 'I':
        iterate = true;
        break;
    }

  }, false);

})();