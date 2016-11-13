'use strict';

require('cesium/Source/Widgets/widgets.css');
const BuildModuleUrl = require('cesium/Source/Core/buildModuleUrl');
BuildModuleUrl.setBaseUrl('./');

const Viewer = require('cesium/Source/Widgets/Viewer/Viewer');
const BingMapsApi = require('cesium/Source/Core/BingMapsApi');

BingMapsApi.defaultKey = 'AtgzqCqqeK4kpcPUpKi0FPeadQaH_7iz62oOAk7PRsg_TDSrJNpOSIk-MO32Rd7J';

const WebGLGlobeDataSource = require('./WebGLGlobeDataSource');
const JulianDate = require('cesium/Source/Core/JulianDate');
const Clock = require('cesium/Source/Core/Clock');
const ClockRange = require('cesium/Source/Core/ClockRange');
const ClockStep = require('cesium/Source/Core/ClockStep');
const SkyBox = require('cesium/Source/Scene/Skybox');

//require('event-emitter-mixin');
require('./gamepad-api');


/**
 * Tables:
 */


 /** usa_population_final_cenus
 * gaz_counties_national_geo
 * usco2000_2015custom
 */

// axios.get('https://wtsang01.carto.com/api/v2/sql', {
//   params: {
//     q: `SELECT ST_AsGeoJSON(the_geom) AS "point" FROM ${COUNTIES_GEO} LIMIT 10`,
//     api_key: '266fb7024bc495397f0fe0d3d48a646648e781df'
//   }
// }).then((res) => {
//   const points = _.map(res.data.rows, (row) => {
//     const point = JSON.parse(row.point).coordinates;
//     point.push(5); // magnitude
//     return point;
//   });
//   console.log(_.flatten(points));
// });

//Now that we've defined our own DataSource, we can use it to load
//any JSON data formatted for WebGL Globe.
// var dataSource = new WebGLGlobeDataSource();
// dataSource.loadUrl('../../SampleData/population909500.json').then(function() {
//
//   //After the initial load, create buttons to let the user switch among series.
//   function createSeriesSetter(seriesName) {
//     return function() {
//       dataSource.seriesToDisplay = seriesName;
//     };
//   }
//
//   for (var i = 0; i < dataSource.seriesNames.length; i++) {
//     var seriesName = dataSource.seriesNames[i];
//     Sandcastle.addToolbarButton(seriesName, createSeriesSetter(seriesName));
//   }
// });


//Create a Viewer instances and add the DataSource.
let dataSource = new WebGLGlobeDataSource();
let clock = new Clock({
  startTime : JulianDate.fromIso8601("2017-01-01"),
  currentTime : JulianDate.fromIso8601("2017-01-01"),
  stopTime : JulianDate.fromIso8601("2025-01-01"),
  clockRange : ClockRange.LOOP_STOP,
  clockStep : ClockStep.SYSTEM_CLOCK_MULTIPLIER,
  multiplier : 15768000
});
let viewer = new Viewer('cesiumContainer', {
  animation : true,
  timeline : true,
  skyBox : new SkyBox({ show:false }),
  vrButton : true,
  shadows : false,
  clock
});
viewer.scene.sun.shadows = false;
viewer.scene.sun.show = false;
viewer.scene.moon.show = false;
//Set bounds of our simulation

//GAME PAD
var Gamepad = window.Gamepad;
var scene = viewer.scene;
var canvas = viewer.canvas;
canvas.setAttribute('tabindex', '0'); // needed to put focus on the canvas
canvas.onclick = function() {
  canvas.focus();
};
var ellipsoid = scene.globe.ellipsoid;
viewer.clock.onTick.addEventListener(function(clock) {
  var camera = viewer.camera;



  // Change movement speed based on the distance of the camera to the surface of the ellipsoid.
  var cameraHeight = ellipsoid.cartesianToCartographic(camera.position).height;
  var moveRate = cameraHeight / 500000.0;
  //console.log(moveRate);
  // Joysticks
  // ---------

  Gamepad.on('joystick:left', function (direction) {
    // console.log('move left joystick to', direction);
    if(direction.up){
      camera.moveRight(moveRate);


    }
    if(direction.down){
      camera.moveLeft(moveRate);
    }

    if(direction.left){
      camera.moveForward(moveRate);
    }

    if(direction.right){
      camera.moveBackward(moveRate);
    }



  });
  // Special
  // -------

  Gamepad.on('special:select', function () {
    console.warn('click select');
    camera.position = new Cesium.Cartesian3();
    camera.direction = Cesium.Cartesian3.negate(Cesium.Cartesian3.UNIT_Z, new Cesium.Cartesian3());
    camera.up = Cesium.Cartesian3.clone(Cesium.Cartesian3.UNIT_Y);
    camera.frustum.fov = Cesium.Math.PI_OVER_THREE;
    camera.frustum.near = 1.0;
    camera.frustum.far = 2.0;
  });

  Gamepad.on('special:start', function () {
    console.warn('click start');
    camera.position = new Cesium.Cartesian3();
    camera.direction = Cesium.Cartesian3.negate(Cesium.Cartesian3.UNIT_Z, new Cesium.Cartesian3());
    camera.up = Cesium.Cartesian3.clone(Cesium.Cartesian3.UNIT_Y);
    camera.frustum.fov = Cesium.Math.PI_OVER_THREE;
    camera.frustum.near = 1.0;
    camera.frustum.far = 2.0;
  });
});

//Make sure viewer is at the desired time.

viewer.dataSources.add(dataSource);
dataSource.makeRequest();