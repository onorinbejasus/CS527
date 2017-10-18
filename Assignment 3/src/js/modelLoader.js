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

  /* Load and return an FBX model */
  function fbxLoader(model, mixers){

    /* simple progress manager*/
    let manager = new THREE.LoadingManager();
    manager.onProgress = function( item, loaded, total ) { console.log( item, loaded, total ); };
    /* load the model */
    let loader = new THREE.FBXLoader( manager );

    return new Promise(function(resolve, reject){
      loader.load(model, function(obj){
        obj.mixer = new THREE.AnimationMixer( obj );

        console.log(obj.animations);

        mixers.push( obj.mixer );
        let action = obj.mixer.clipAction( obj.animations[ 0 ] );
        action.play();
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
     loadFBX:fbxLoader
  }

}();