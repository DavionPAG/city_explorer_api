'use strict'

//dependencies

require('dotenv').config();

const express = require('express');

const cors = require('cors');
const { response } = require('express');


//App setup

const app = express()
const PORT= process.env.PORT;
app.use(cors());

//Route

app.get('/', (request, response) => {
  response.send('Hellooo Folks')
})

app.get('/location', locationHandler)

app.use('*', (request, response) => {
  response.send('Nonexistent');
})

function locationHandler(request, response) {
  // response.send('I work'); ***Test*** 
  const locationData = require('./lab/data/location.json')
  
  //get data that was input in search field
  const city = request.query.city;


}


//location constructor

function Location(city, locationData)

//start server

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
})
