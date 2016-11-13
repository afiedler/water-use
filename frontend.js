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
  startTime : JulianDate.fromIso8601("2000-01-01"),
  currentTime : JulianDate.fromIso8601("2000-01-01"),
  stopTime : JulianDate.fromIso8601("2050-01-01"),
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
viewer.scene.sun.show =false;
viewer.scene.moon.show =false;
//Set bounds of our simulation

//Make sure viewer is at the desired time.

viewer.dataSources.add(dataSource);
dataSource.makeRequest();