// Require the module
const FitParser = require('fit-file-parser').default;
const fs = require('fs');
const path = require('node:path');

// Call start
(async () => {
  const readFitFile = async (filePath) => {
    // Try reading the file
    try {
      const data = await fs.readFileSync(filePath);

      console.log('Reading Fit file...');

      return data;
    } catch (err) {
      console.error(err);
    }
  };

  const tranformFitData = async (fitData) => {
    console.log('Parsing Fit data...');

    let fitJson = '';

    // Create instance of FitParser
    var fitParser = new FitParser({
      force: true,
      speedUnit: 'km/h',
      lengthUnit: 'km',
      temperatureUnit: 'celsius',
      elapsedRecordField: true,
      mode: 'both',
    });

    const data = await fitParser.parse(fitData, function(error, data) {
      if (error) {
        console.log(error);
      } else {
        console.log('Converted the Fit file to JSON');
        fitJson = data;
      }
    });

    return fitJson;
  };

  const saveFitJsonFile = async (fitJson, filename) => {
    console.log('Attempting to save fit.json file...');

    try {
      await fs.writeFileSync('./export/' + filename + '-fit.json', JSON.stringify(fitJson));
      console.log('Saved Fit file as JSON');
      return fitJson;
    } catch (err) {
      console.error(err);
    }
  };

  const createGeoJson = async (fitJson, filename) => {
    
    console.log('Transforming json to GeoJson...');
    
    let geo = {};

    geo.type = 'FeatureCollection';
    geo.features = [{
      type: 'Feature',
      properties: {
        name: filename,
        time: fitJson.activity.timestamp.toJSON(),
        sport: fitJson.sessions[0].sport,
        distance: fitJson.sessions[0].total_distance,
        time: fitJson.sessions[0].total_timer_time,
        avg_speed: fitJson.sessions[0].avg_speed,
        max_speed: fitJson.sessions[0].max_speed,
        avg_heart_rate: fitJson.sessions[0].avg_heart_rate,
        max_heart_rate: fitJson.sessions[0].max_heart_rate,
        avg_cadence: fitJson.sessions[0].avg_cadence,
        max_cadence: fitJson.sessions[0].max_cadence,
        avg_power: fitJson.sessions[0].avg_power,
        max_power: fitJson.sessions[0].max_power,
        total_calories: fitJson.sessions[0].total_calories
      },
      geometry: {
        type: 'LineString',
        coordinates: []
      }
    }];

    if (fitJson && fitJson.records) {

      let idx_records = 0;

      for (idx_records = 0; idx_records < fitJson.records.length; idx_records++) {
        const lnglat = [fitJson.records[idx_records].position_long, fitJson.records[idx_records].position_lat];
        geo.features[0].geometry.coordinates.push(lnglat);
      }
    }

    try {
      await fs.writeFileSync('./export/' + filename + '.geojson', JSON.stringify(geo));
      console.log('Saved GeoJSON file.');
    } catch (err) {
      console.error(err);
    }
    return geo;
  };

  const createDocument = async (fitJSON, filename) => {
    
    console.log('Starting to create MarkDown document...');

    var fileContent = [];

    const title = fitJSON.workout.wkt_name ? fitJSON.workout.wkt_name : filename;
    const distance = fitJSON.sessions[0].total_distance ? fitJSON.sessions[0].total_distance : 'Unknown';
    const time = fitJSON.sessions[0].total_timer_time ? fitJSON.sessions[0].total_timer_time : 'Unknown';
    const avg_speed = fitJSON.sessions[0].avg_speed ? fitJSON.sessions[0].avg_speed : 'Unknown';
    const max_speed = fitJSON.sessions[0].max_speed ? fitJSON.sessions[0].max_speed : 'Unknown';
    const avg_heart_rate = fitJSON.sessions[0].avg_heart_rate ? fitJSON.sessions[0].avg_heart_rate : 'Unknown';
    const max_heart_rate = fitJSON.sessions[0].max_heart_rate ? fitJSON.sessions[0].max_heart_rate : 'Unknown';
    const avg_cadence = fitJSON.sessions[0].avg_cadence ? fitJSON.sessions[0].avg_cadence : 'Unknown';
    const max_cadence = fitJSON.sessions[0].max_cadence ? fitJSON.sessions[0].max_cadence : 'Unknown';
    const avg_power = fitJSON.sessions[0].avg_power ? fitJSON.sessions[0].avg_power : 'Unknown';
    const max_power = fitJSON.sessions[0].max_power ? fitJSON.sessions[0].max_power : 'Unknown';
    const total_calories = fitJSON.sessions[0].total_calories ? fitJSON.sessions[0].total_calories : 'Unknown';

    fileContent.push('---');
    fileContent.push('date: ' + fitJSON.activity.timestamp.toJSON()); //dateString);
    fileContent.push('title: ' + title);
    fileContent.push('latitude: ' + fitJSON.records[0].position_lat);
    fileContent.push('longitude: ' + fitJSON.records[0].position_long);
    fileContent.push('sport: ' + fitJSON.sessions[0].sport);
    fileContent.push('distance: ' + distance);
    fileContent.push('time: ' + time);
    fileContent.push('avgSpeed: ' + avg_speed);
    fileContent.push('maxSpeed: ' + max_speed);
    fileContent.push('avgHr: ' + avg_heart_rate);
    fileContent.push('maxHr: ' + max_heart_rate);
    fileContent.push('avgCadence: ' + avg_cadence);
    fileContent.push('maxCadence: ' + max_cadence);
    fileContent.push('avgPower: ' + avg_power);
    fileContent.push('maxPower: ' + max_power);
    fileContent.push('calories: ' + total_calories);
    fileContent.push('geojson: /geojson/' + filename + '.geojson');
    fileContent.push('category: exercise');
    fileContent.push('---');
    
    const mdContents = fileContent.join('\n').toString('base64');

    fs.writeFile('./export/' + filename + '.md', mdContents, (err) => {
      if (err) {
        console.error(err);
      } else {
        // file written successfully
        console.log('Written Markdown File');
      }
    });
  };

  const filepath = './import/test.fit';
  const filename = 'test';

  const fitFileContents = await readFitFile(filepath);
  const fitJson = await tranformFitData(fitFileContents);
  const jsonFile = await saveFitJsonFile(fitJson, filename);
  const markdown = await createDocument(fitJson, filename);
  const geoJson = await createGeoJson(fitJson, filename);

})();