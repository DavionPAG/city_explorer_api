'use strict';

//dependencies

require('dotenv').config();
const express = require('express');
const cors = require('cors');

//App setup

const app = express();
const PORT= process.env.PORT;
app.use(cors());

//Routes

app.get('/', (request, response) => {
  response.send('Hellooo Folks');
});

app.get('/location', locationHandler);
app.get('/weather', wtrHandler);
app.use('*', errorHandler);

function errorHandler(request, response){
  response.send({
    status: 500,
    responseText: 'Sorry, something went wrong'
  });
}

function locationHandler(request, response) {
  // response.send('I work'); ***Test***
  const locationData = require('./data/location.json');

  //get data that was input in search field
  const city = request.query.city;
  const sendData = new Location(city, locationData);

  response.send(sendData);
}

function wtrHandler(request, response){
  const weatherData = require('./data/weather.json');
  let wtrDataArr = [];
  weatherData.data.forEach(wtrData => {
    wtrDataArr.push(new Weather(wtrData));
  });
  response.send(wtrDataArr);
}


//location constructor

function Location(city, locationData) {
  this.search_query = city;
  this.format_query = locationData[0].display_name;
  this.latitude = locationData[0].lat;
  this.longitude = locationData[0].lon;
}

//Weather Constructor

function Weather(data){
  this.forcast = data.weather.description;
  this.date = data.datetime;
}

//start server

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
