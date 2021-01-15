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
app.get('/movies', moviesHandler);
app.get('/yelp', yelpHandler);


function homeHndlr(req, res) {
  res.send('Hellooo Folks');
}

function locationHandler(req, res) {
  const key = process.env.GEOCODE_API_KEY;
  const city = req.query.city;
  const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`;

  let SQL = 'SELECT * FROM search WHERE search_query = $1';
  let safeValues = ['search_query'];

  client.query(SQL, safeValues)
    .then(results => {
      if (results.rowCount > 0) {
        res.send(results.rowCount);
      }

      else {
        superagent.get(url)
          .then(data => {

            const locData = data.body[0];
            const loc = new Location(city, locData);

            let SQL = 'INSERT INTO search (search_query, latitude, longitude, formatted_query) VALUES ($1,$2,$3,$4) RETURNING *';
            let safeValues = [loc.search_query, loc.latitude, loc.longitude, loc.formatted_query];

            client.query(SQL, safeValues)
              .then(results => console.log('Saved to DB'));
            res.status(200).send(loc);
          })
          .catch(error => {
            res.status(500).send('Something went worng');
            console.log(error);
          });
      }
    });
}

function wtrHandler(req, res) {
  const key = process.env.WEATHER_API_KEY;
  let lon = req.query.longitude;
  let lat = req.query.latitude;
  let url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&key=${key}&days=7`;

  superagent.get(url)
    .then(data => {
      let wtrDataArr = data.body.data.map(wtrData => {
        return new Weather(wtrData);
      });
      res.status(200).send(wtrDataArr);
    })
    .catch(error => {
      res.status(500).send('Something went worng');
      console.log(error);
    });
}

function yelpHandler(req, res) {
  const key = process.env.YELP_API_KEY;
  let city = req.query.search_query;
  let pageNow = 5;
  let page = req.query.page || 1;
  let offSet = ((page - 1) * pageNow + 1);
  let url = `https://api.yelp.com/v3/businesses/search?`;

  superagent.get(url)
    .auth(key, { type: 'bearer' })
    .query({
      location: city,
      offset: offSet,
      limit: 5
    })
    .then(data => {
      let yelpArr = data.body.businesses.map(yelpData => {
        return new Yelp(yelpData);
      });
      res.status(200).json(yelpArr);
      console.log(yelpArr);
    })
    .catch(error => {
      res.status(500).send('Something went worng');
      console.log(error);
    });

}

function moviesHandler(req, res) {
  const key = process.env.MOVIE_API_KEY;
  let city = req.query.search_query;
  let url = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${city}`;

  superagent.get(url)
    .then(data => {
      console.log(city);
      let movieArr = data.body.results.map(movie => {
        let baseUrl = 'https://image.tmdb.org/t/p/w200'; //baseURL + fileSize
        let filePath = movie.poster_path;
        let imageUrl = baseUrl + filePath;

        return new Movies(movie, imageUrl);
      });
      res.status(200).json(movieArr);
    })
    .catch(error => {
      res.status(500).send('Muchas problemas');
      console.log(error);
    });
}


//Yelp Constructor
function Yelp(y) {
  this.name = y.name;
  this.image_url = y.image_url;
  this.price = y.price;
  this.rating = y.rating;
  this.url = y.url;
}

//location constructor
function Location(city, locData) {
  this.search_query = city;
  this.formatted_query = locData.display_name;
  this.latitude = locData.lat;
  this.longitude = locData.lon;
}

//Weather Constructor
function Weather(wtr) {
  this.forecast = wtr.weather.description;
  this.time = new Date(wtr.datetime).toDateString();
}

//Movies Constructor
function Movies(movie, imageUrl) {
  this.title = movie.original_title;
  this.overview = movie.overview;
  this.average_votes = movie.vote_average;
  this.total_votes = movie.vote_count;
  this.image_url = imageUrl;
  this.popularity = movie.popularity;
  this.released_on = movie.release_date;
}

// ***error Handler***
app.use('*', (req, res) => {
  res.status(404).send(`Sorry, something went wrong`);
});

//Connect Database => start server
client.connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`PORT => ${PORT}`);
      console.log(`Database => ${client.connectionParameters.database}`);
    });
  });
