const axios = require('axios');

const Table = {
  COUNTIES: 'gaz_counties_national_geo',
  POPULATION: 'usa_population_final_cenus'
};

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
ORDER BY cpp.modfips DESC, cpp.year ASC LIMIT 1000
`,
    api_key: '266fb7024bc495397f0fe0d3d48a646648e781df'
  }
}).then((res) => {
  console.log(res);
}).catch((err) => {
  console.err(err);
});

