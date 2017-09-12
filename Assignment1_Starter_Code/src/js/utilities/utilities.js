/*
Name: Timothy Luciani
Class: CS527
File: utilities.js
Assignment 1
*/
"use strict";
const Utilities = function(){

  let epsilon = 0.01;

  return {
    /* Vector Math Utilities */
    Vector_Utils: function() {
      return {

        /* Add all components of a and b*/
        add: function(a,b) {
          let c = {};
          _.keys(a).forEach(function(key){
            c[key] = a[key] + b[key]
          });
          return c;
        },

        /* Difference all components of a and b */
        subtract: function(a,b) {
          let c = {};
          _.keys(a).forEach(function(key){
            c[key] = a[key] - b[key]
          });
          return c;
        },

        /* Multiple all components of a with s */
        multiply: function(a,s) {
          let c = {};
          _.keys(a).forEach(function(key){
            c[key] = a[key] * s
          });
          return c;
        },

        /* Multiple all components of a with s */
        multiply_components: function(a,b) {
          let c = {};
          _.keys(a).forEach(function(key){
            c[key] = a[key] * b[key]
          });
          return c;
        },

        /* Divide all components of a by s */
        divide: function(a,s) {
          let c = {};
          _.keys(a).forEach(function(key){
            c[key] = a[key] / s
          });
          return c;
        },

        /* Zero out all values */
        zero: function(a) {
          let c = {};
          _.keys(a).forEach(function(key){
            c[key] = 0
          });
          return c;
        },

        /* Dot vectors a and b */
        dot: function(a,b) {
          let c = 0;
          _.keys(a).forEach(function(key){
            c += a[key] * b[key];
          });
          return c;
        },
      }
    }(),

    Model_Utils : function() {
        return {
          checkForIntersections: function(particle, objects) {
            /* Check for an intersection with any of the objects */
            objects.forEach(function(o){

              let e = particle.radius / 2.0,
              c = Utilities.Vector_Utils.dot(
                Utilities.Vector_Utils.subtract(particle.position, o.position),
                Utilities.Vector_Utils.multiply_components(o.normal, {x:1, y:Y_UP})),

              v = Utilities.Vector_Utils.dot(
                particle.velocity,
                Utilities.Vector_Utils.multiply_components(o.normal, {x:1, y:Y_UP}));

              /* Check if a collision occurred */
              if(c < e && v < 0) {

                particle.collision = true;
                particle.deformation = c;

                if(o.type === "wall") {
                  particle.velocity.y = -FLOOR_DAMPENING * particle.velocity.y;
                }

                // particle.motion = false;
              }

            });
          }
        }
    }()

  };

}();