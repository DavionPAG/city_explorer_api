'use strict';

//dependencies

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');

//App setup

const app = express();
const PORT = process.env.PORT || 3000;
const client = new pg.Client(process.env.DATABASE_URL);
app.use(cors());



client.on('error', err => {
  throw err;
});



//Routes
app.get('/', homeHndlr);
app.get('/location', locationHandler);
app.get('/weather', wtrHandler);


function homeHndlr(request, response) {
  response.send('Hellooo Folks');
}

function locationHandler(request, response) {
  const key = process.env.GEOCODE_API_KEY;
  const city = request.query.city;
  const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`;


  let SQL = 'SELECT * FROM search WHERE search_query = $1';
  let safeValues = ['search_query'];

  client.query(SQL, safeValues)
    .then(results => {
      if (results.rowCount > 0) {
        response.send(results.rowCount);
      }

      else {
        superagent.get(url)
          .then(data => {

            const locData = data.body[0];
            const loc = new Location(city, locData);

            let SQL = 'INSERT INTO search (search_query, latitude, longitude, formatted_query) VALUES ($1,$2,$3,$4) RETURNING *';
            let safeValues = [loc.search_query, loc.latitude, loc.longitude, loc.formatted_query];

            client.query(SQL, safeValues)
              .then( results => console.log('Saved to DB'));

            response.status(200).send(loc);
            console.log(loc);
          })
          .catch(error => {
            response.status(500).send('Something went worng');
            console.log(error);
          });
      }
    });
}

//location constructor
function Location(city, locData) {
  this.search_query = city;
  this.formatted_query = locData.display_name;
  this.latitude = locData.lat;
  this.longitude = locData.lon;
}

function wtrHandler(request, response) {
  const key = process.env.WEATHER_API_KEY;
  let lon = request.query.longitude;
  let lat = request.query.latitude;
  let url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&key=${key}&days=5`;

  superagent.get(url)
    .then(data => {
      let wtrDataArr = data.body.data.map(wtrData => {
        return new Weather(wtrData);
      });
      response.status(200).send(wtrDataArr);
      console.log(wtrDataArr);
    })
    .catch(error => {
      response.status(500).send('Something went worng');
      console.log(error);
    });
}

//Weather Constructor
function Weather(wtr) {
  this.forecast = wtr.weather.description;
  this.time = new Date(wtr.datetime).toDateString();
}

// ***error Handler***
app.use('*', (request, response) => {
  response.status(404).send(`Sorry, something went wrong`);
});



//Connect Database => start server

client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`PORT => ${PORT}`);
      console.log(`Database => ${client.connectionParameters.database}`);
    });
  });
