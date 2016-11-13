const Event = require('cesium/Source/Core/Event');
const EntityCollection = require('cesium/Source/DataSources/EntityCollection');
const Entity = require('cesium/Source/DataSources/Entity');
const EntityCluster = require('cesium/Source/DataSources/EntityCluster');
const DeveloperError = require('cesium/Source/Core/DeveloperError');
const Color = require('cesium/Source/Core/Color');
const Cartesian3 = require('cesium/Source/Core/Cartesian3');
const PolylineGraphics = require('cesium/Source/DataSources/PolylineGraphics');
const ColorMaterialProperty = require('cesium/Source/DataSources/ColorMaterialProperty');
const ConstantProperty = require('cesium/Source/DataSources/ConstantProperty');
const SampledProperty = require('cesium/Source/DataSources/SampledProperty');
const JulianDate = require('cesium/Source/Core/JulianDate');

const _ = require('lodash');
const axios = require('axios');

const Table = {
  COUNTIES: 'gaz_counties_national_geo',
  POPULATION: 'usa_population_final_cenus'
};

/**
 * This class is an example of a custom DataSource.  It loads JSON data as
 * defined by Google's WebGL Globe, https://github.com/dataarts/webgl-globe.
 * @alias WebGLGlobeDataSource
 * @constructor
 *
 * @param {String} [name] The name of this data source.  If undefined, a name
 *                        will be derived from the url.
 *
 * @example
 * var dataSource = new Cesium.WebGLGlobeDataSource();
 * dataSource.loadUrl('sample.json');
 * viewer.dataSources.add(dataSource);
 */
function WebGLGlobeDataSource(name) {
  //All public configuration is defined as ES5 properties
  //These are just the "private" variables and their defaults.
  this._name = name;
  this._changed = new Event();
  this._error = new Event();
  this._isLoading = false;
  this._loading = new Event();
  this._entityCollection = new EntityCollection();
  this._seriesNames = [];
  this._seriesToDisplay = undefined;
  this._heightScale = 1e5;
  this._entityCluster = new EntityCluster();
}

Object.defineProperties(WebGLGlobeDataSource.prototype, {
  //The below properties must be implemented by all DataSource instances

  /**
   * Gets a human-readable name for this instance.
   * @memberof WebGLGlobeDataSource.prototype
   * @type {String}
   */
  name : {
    get : function() {
      return this._name;
    }
  },
  /**
   * Since WebGL Globe JSON is not time-dynamic, this property is always undefined.
   * @memberof WebGLGlobeDataSource.prototype
   * @type {DataSourceClock}
   */
  clock : {
    value : undefined,
    writable : false
  },
  /**
   * Gets the collection of Entity instances.
   * @memberof WebGLGlobeDataSource.prototype
   * @type {EntityCollection}
   */
  entities : {
    get : function() {
      return this._entityCollection;
    }
  },
  /**
   * Gets a value indicating if the data source is currently loading data.
   * @memberof WebGLGlobeDataSource.prototype
   * @type {Boolean}
   */
  isLoading : {
    get : function() {
      return this._isLoading;
    }
  },
  /**
   * Gets an event that will be raised when the underlying data changes.
   * @memberof WebGLGlobeDataSource.prototype
   * @type {Event}
   */
  changedEvent : {
    get : function() {
      return this._changed;
    }
  },
  /**
   * Gets an event that will be raised if an error is encountered during
   * processing.
   * @memberof WebGLGlobeDataSource.prototype
   * @type {Event}
   */
  errorEvent : {
    get : function() {
      return this._error;
    }
  },
  /**
   * Gets an event that will be raised when the data source either starts or
   * stops loading.
   * @memberof WebGLGlobeDataSource.prototype
   * @type {Event}
   */
  loadingEvent : {
    get : function() {
      return this._loading;
    }
  },

  //These properties are specific to this DataSource.

  /**
   * Gets the array of series names.
   * @memberof WebGLGlobeDataSource.prototype
   * @type {String[]}
   */
  seriesNames : {
    get : function() {
      return this._seriesNames;
    }
  },
  /**
   * Gets or sets the name of the series to display.  WebGL JSON is designed
   * so that only one series is viewed at a time.  Valid values are defined
   * in the seriesNames property.
   * @memberof WebGLGlobeDataSource.prototype
   * @type {String}
   */
  seriesToDisplay : {
    get : function() {
      return this._seriesToDisplay;
    },
    set : function(value) {
      this._seriesToDisplay = value;

      //Iterate over all entities and set their show property
      //to true only if they are part of the current series.
      var collection = this._entityCollection;
      var entities = collection.values;
      collection.suspendEvents();
      for (var i = 0; i < entities.length; i++) {
        var entity = entities[i];
        entity.show = value === entity.seriesName;
      }
      collection.resumeEvents();
    }
  },
  /**
   * Gets or sets the scale factor applied to the height of each line.
   * @memberof WebGLGlobeDataSource.prototype
   * @type {Number}
   */
  heightScale : {
    get : function() {
      return this._heightScale;
    },
    set : function(value) {
      if (value > 0) {
        throw new DeveloperError('value must be greater than 0');
      }
      this._heightScale = value;
    }
  },
  /**
   * Gets whether or not this data source should be displayed.
   * @memberof WebGLGlobeDataSource.prototype
   * @type {Boolean}
   */
  show : {
    get : function() {
      return this._entityCollection;
    },
    set : function(value) {
      this._entityCollection = value;
    }
  },
  /**
   * Gets or sets the clustering options for this data source. This object can be shared between multiple data sources.
   * @memberof WebGLGlobeDataSource.prototype
   * @type {EntityCluster}
   */
  clustering : {
    get : function() {
      return this._entityCluster;
    },
    set : function(value) {
      if (_.isUndefined(value)) {
        throw new DeveloperError('value must be defined.');
      }
      this._entityCluster = value;
    }
  }
});

/**
 * Asynchronously loads the GeoJSON at the provided url, replacing any existing data.
 * @param {Object} url The url to be processed.
 * @returns {Promise} a promise that will resolve when the GeoJSON is loaded.
 */
WebGLGlobeDataSource.prototype.makeRequest = function() {

  // //Create a name based on the url
  // var name = Cesium.getFilenameFromUri(url);
  //
  // //Set the name if it is different than the current name.
  // if (this._name !== name) {
  //   this._name = name;
  //   this._changed.raiseEvent(this);
  // }

  //Use 'when' to load the URL into a json object
  //and then process is with the `load` function.
  var that = this;
  window.axios = axios;
  axios.get('https://wtsang01.carto.com/api/v2/sql', {
    params: {
      q:
`
WITH distinct_pop AS (
  SELECT
    Id2,
    fomattedAddress
  FROM ${Table.POPULATION}
  GROUP BY Id2, fomattedAddress
),
counties_1 AS (
  SELECT 
    ST_AsGeoJSON(c.the_geom) AS "point",
    p.Id2 as "modfips",
    c.fomattedaddress,
    c.pop10 as "pop10"
  FROM ${Table.COUNTIES} c
  INNER JOIN distinct_pop p ON c.fomattedaddress = p.fomattedaddress
  ORDER BY p.Id2 DESC
), distinct_predicted_pop AS (
  SELECT ModFIPS, Year, Total FROM predicted_population GROUP BY ModFIPS, Year, Total ORDER BY ModFIPS, Year
), distinct_predicted_water AS (
  SELECT ModFIPS, Year, Water FROM predicted_water GROUP BY ModFIPS, Year, Water
), counties_with_predicted_population AS (
  SELECT 
    cc.point,
    cc.modfips,
    cc.pop10,
    pp.Total as "population",
    pp.year
  FROM distinct_predicted_pop pp
  JOIN counties_1 cc ON cc.modfips = pp.ModFIPS
  WHERE cc.modfips IS NOT NULL
  ORDER BY cc.modfips DESC, pp.year ASC
)
SELECT
  cpp.point,
  cpp.modfips,
  cpp.pop10,
  cpp.population,
  cpp.year,
  pw.water
FROM distinct_predicted_water pw
INNER JOIN counties_with_predicted_population cpp ON pw.modfips = cpp.modfips AND pw.year = cpp.year
ORDER BY cpp.modfips DESC, cpp.year ASC
`,
      api_key: '266fb7024bc495397f0fe0d3d48a646648e781df'
    }
  }).then((res) => {
    // cast types since everything comes in as a string
    const data = _.map(res.data.rows, (r) => {
      const point = JSON.parse(r.point).coordinates;
      let hand = point[0]; // need to swap lat and long
      point[0] = point[1];
      point[1] = hand;
      return {
        point,
        water: parseFloat(r.water),
        population: parseFloat(r.population),
        year: parseInt(r.year),
        county: r.modfips,
        pop10: parseFloat(r.pop10)
      }
    });
    // group by county
    let byCounty = _.map(_.groupBy(data, 'county'), (rows, county) => {
      return { county, rows };
    });

    let points = _.flatten(_.map(byCounty, (county) => {
      let ts = _.map(county.rows, (r) => {
        return {
          year: r.year,
          ratio: r.water/r.population
        }
      });

      return [county.rows[0].point[0], county.rows[0].point[1], ts];
    }));
    console.log(points);
    return that.load([["WaterUse",points]]);
  });
  // return Cesium.when(Cesium.loadJson(url), function(json) {
  //
  // }).otherwise(function(error) {
  //   //Otherwise will catch any errors or exceptions that occur
  //   //during the promise processing. When this happens,
  //   //we raise the error event and reject the promise.
  //   this._setLoading(false);
  //   that._error.raiseEvent(that, error);
  //   return Cesium.when.reject(error);
  // });
};

/**
 * Loads the provided data, replacing any existing data.
 * @param {Object} data The object to be processed.
 */
WebGLGlobeDataSource.prototype.load = function(data) {
  //>>includeStart('debug', pragmas.debug);
  if (_.isUndefined(data)) {
    throw new DeveloperError('data is required.');
  }
  //>>includeEnd('debug');

  //Clear out any data that might already exist.
  this._setLoading(true);
  this._seriesNames.length = 0;
  this._seriesToDisplay = undefined;

  var heightScale = this.heightScale;
  var entities = this._entityCollection;

  //It's a good idea to suspend events when making changes to a
  //large amount of entities.  This will cause events to be batched up
  //into the minimal amount of function calls and all take place at the
  //end of processing (when resumeEvents is called).
  entities.suspendEvents();
  entities.removeAll();

  //WebGL Globe JSON is an array of series, where each series itself is an
  //array of two items, the first containing the series name and the second
  //being an array of repeating latitude, longitude, height values.
  //
  //Here's a more visual example.
  //[["series1",[latitude, longitude, height, ... ]
  // ["series2",[latitude, longitude, height, ... ]]

  // Loop over each series
  for (var x = 0; x < data.length; x++) {
    var series = data[x];
    var seriesName = series[0];
    var coordinates = series[1];

    //Add the name of the series to our list of possible values.
    this._seriesNames.push(seriesName);

    //Make the first series the visible one by default
    var show = x === 0;
    if (show) {
      this._seriesToDisplay = seriesName;
    }

    //Now loop over each coordinate in the series and create
    // our entities from the data.


    for (var i = 0; i < coordinates.length; i += 3) {
      var latitude = coordinates[i];
      var longitude = coordinates[i + 1];
      var height = coordinates[i + 2];

      //Ignore lines of zero height.
      // if(height === 0) {
      //   continue;
      // }

      console.log('coords: ', longitude, latitude, height);

      //var color = Color.fromHsl((0.6 - (height * 0.5)), 1.0, 0.5);
      let color = new SampledProperty(Color);
      let minRatio = _.min(_.map(height, 'ratio'));
      let maxRatio = _.max(_.map(height, 'ratio'));
      _.each(height, (h) => {
        let r = (maxRatio - h.ratio)/(maxRatio-minRatio);
        let c = Color.fromHsl(r, 1.0, 0.5);
        color.addSample(JulianDate.fromIso8601(`${h.year}-01-01`), c);
      });
      // color.setInterpolationOptions({
      //   interpolationDegree : 3,
      //   interpolationAlgorithm : HermitePolynomialApproximation
      // });
      var surfacePosition = Cartesian3.fromDegrees(longitude, latitude, 0);
      var heightPosition = Cartesian3.fromDegrees(longitude, latitude, 1e6);

      //WebGL Globe only contains lines, so that's the only graphics we create.
      var polyline = new PolylineGraphics();
      polyline.material = new ColorMaterialProperty(color);
      polyline.width = new ConstantProperty(2);
      polyline.followSurface = new ConstantProperty(false);
      polyline.positions = new ConstantProperty([surfacePosition, heightPosition]);

      //The polyline instance itself needs to be on an entity.
      var entity = new Entity({
        id : seriesName + ' index ' + i.toString(),
        show : show,
        polyline : polyline,
        seriesName : seriesName //Custom property to indicate series name
      });

      //Add the entity to the collection.
      entities.add(entity);
    }
  }

  //Once all data is processed, call resumeEvents and raise the changed event.
  entities.resumeEvents();
  this._changed.raiseEvent(this);
  this._setLoading(false);
};

WebGLGlobeDataSource.prototype._setLoading = function(isLoading) {
  if (this._isLoading !== isLoading) {
    this._isLoading = isLoading;
    this._loading.raiseEvent(this, isLoading);
  }
};

module.exports = WebGLGlobeDataSource;

