"use strict";

const MeshLoader = function(){

  var onProgress = function( xhr ) {

    if ( xhr.lengthComputable ) {
      var percentComplete = xhr.loaded / xhr.total * 100;
      console.log( Math.round( percentComplete, 2 ) + '% downloaded' );
    }

  };

  var onError = function( xhr ) {
    console.error( xhr );
  };

  function colladaLoader(model, mixer, scene){
    let loader = new THREE.ColladaLoader();
    loader.options.convertUpAxis = true;
    loader.load( model, function ( collada ) {
      var animations = collada.animations;
      var avatar = collada.scene;
      mixer = new THREE.AnimationMixer( avatar );
      var action = mixer.clipAction( animations[ 0 ] ).play();
      scene.add( avatar );
    } );
  }

  function jsonLoader(model, mixers, scene) {

    return new Promise(function(resolve, reject){
      new THREE.JSONLoader().load( model, function ( geometry, materials ) {


        // var material = materials[ 0 ];
        //var obj = new THREE.Mesh( geometry, new THREE.MeshFaceMaterial(materials) );
        var obj = THREE.SceneUtils.createMultiMaterialObject( geometry, materials );
        resolve(obj);

        // obj.mixer = new THREE.AnimationMixer( obj.geometry );
        // mixers.push( obj.mixer );
        //
        // let action = obj.mixer.clipAction( obj.geometry.animations[ 0 ] );
        // obj.mixer.clipAction( obj.geometry.animations[ 0 ] ).play();
        // action.play();

        // if(scene){
        //   scene.add( obj );
        // }
      } );
    });

  }

  /* Load and return an FBX model */
  function fbxLoader(model, mixers, scene){

    /* simple progress manager*/
    let manager = new THREE.LoadingManager();
    manager.onProgress = function( item, loaded, total ) {  };
    /* load the model */
    let loader = new THREE.FBXLoader( manager );

    return new Promise(function(resolve, reject){
      loader.load(model, function(obj){
        // obj.mixer = new THREE.AnimationMixer( obj );
        //
        // mixers.push( obj.mixer );
        // let action = obj.mixer.clipAction( obj.animations[ 0 ] );
        // action.play();
        //
        // if(scene){
        //   scene.add(obj);
        // }
        resolve(obj);
      });

    });

  }

  function objLoader(path, mtl, obj, scene){
    let mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath( path );
    mtlLoader.load( mtl, function( materials ) {
      materials.preload();
      let objLoader = new THREE.OBJLoader();
      objLoader.setMaterials( materials );
      objLoader.setPath( path );
      objLoader.load( obj, function ( object ) {
        // object.position.y = - 95;
        scene.add( object );
      }, onProgress, onError );
    });
  }

  return {
     loadOBJ:objLoader,
     loadFBX:fbxLoader,
     loadCollada: colladaLoader,
     loadJSON: jsonLoader
  }

}();