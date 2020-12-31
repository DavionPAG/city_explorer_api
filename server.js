'use strict';

//dependencies

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');

//App setup

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());

//Routes

app.get('/', homeHndlr);
app.get('/location', locationHandler);
app.get('/weather', wtrHandler);
app.use('*', errorHandler);

function homeHndlr(request, response) {
  response.send('Hellooo Folks');
}

function locationHandler(request, response) {
  const key = process.env.GEOCODE_API_KEY;
  const city = request.query.city;
  const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`;

  superagent.get(url)
    .then(data => {

      const locData = data.body[0];
      const loc = new Location(city, locData);
      response.status(200).send(loc);
      console.log(loc);
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
    });
}

//Weather Constructor
function Weather(wtr) {
  this.forecast = wtr.weather.description;
  this.time = new Date(wtr.datetime).toDateString();
}

function errorHandler(request, response) {
  response.status(500).send(`Sorry, something went wrong`);
}

//start server

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
