/*
Name: Timothy Luciani
Class: CS527
File: utilities.js
Assignment 1
*/
"use strict";
const Utilities = function(){

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
            c += a[key] + b[key];
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

            });
          }
        }
    }()

  };

}();