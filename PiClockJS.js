/**
 * replacement for piclock using node and html
 * tmehrkam@gmail.com
 */
var http = require('http');
var request = require('request');
var fs = require("fs");
var path = require('path');
var d2d = require('degrees-to-direction')
var util = require('util');
var getPromise = util.promisify(request.get);

// Read settings
const settings = JSON.parse(fs.readFileSync('./settings.json'))
// Express app
var express = require('express');
var bodyParser = require('body-parser')
const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

//get current weather conditions
var cur={};
var forecasts = {};
var alerts = {};

currentOwObs();
moonPhase();
getWgovGridP();
wgAlerts();

app.get("/current", (req,res) => {
  res.status(200).json(cur);
});

app.get("/forecast", (req,res) => {
  res.status(200).json(forecasts);
});

app.get("/alerts", (req,res) => {
  res.status(200).json(alerts);
});

app.get("/coords", (req,res) => {
  res.status(200).json({
    lat: settings.lat,
    lon: settings.lon,
    gMapKey: settings.gMapKey
  })
});

app.get('/', (req,res) => {
  res.sendFile(__dirname + '/public/index.html');
})

app.listen(8081, () => console.log('Example app listening on port 8081!'))

//update current observations every 2 min
setInterval(function() {
  currentOwObs();
  wgAlerts();
}, settings.currentConditionsInterval * 1000);

//update forecast every 6 hrs
setInterval(function() {
  getWgovGridP();
  moonPhase();
}, settings.forecastInterval * 1000);

async function currentOwObs(){
  var url = 'http://api.openweathermap.org/data/2.5/weather?lat='+settings.lat+'&lon='+settings.lon+'&appid='+settings.owAppId+'&units=imperial'
  console.log(url);

  try {
    var { body } = await getPromise({
      url: url,
      json: true,
      headers: {'User-Agent': 'piclockjs'}
    });
    parseOW(body);
  }
  catch(e) {
    console.dir(e);
  }
}

async function moonPhase () {
  //fugly date mangling
  var url = 'http://api.usno.navy.mil/rstt/oneday?date=now&coords=' + settings.lat +',' + settings.lon;
  console.log(url);
  try {
    var { body } = await getPromise({
      url: url,
      json: true,
      headers: {'User-Agent': 'piclockjs'}
    });
    parseMoonPhase(body);
  }
  catch(e) {
    console.dir(e);
  }
}

async function getWgovGridP(){
  var url = 'https://api.weather.gov/points/' + settings.lat + ',' + settings.lon;
  console.log(url);
  try {
    var { body } = await getPromise({
      url: url,
      json: true,
      headers: {'User-Agent': 'piclockjs'}
    });
    wgForecast(body.properties.forecast);
  }
  catch(e) {
    console.dir(e)
  }
}

async function wgForecast(url){
  console.log(url);
  try {
    var { body } = await getPromise({
      url: url,
      json: true,
      headers: {'User-Agent': 'piclockjs'}
    });
    parseWgForecast(body);
  }
  catch(e) {
    cosole.dir(e);
  }
}

async function wgAlerts(){
  var url = "https://api.weather.gov/alerts/active?point=" + settings.lat + "," + settings.lon;
  console.log(url);
  try {
    var { body } = await getPromise({
      url: url,
      json: true,
      headers: {'User-Agent': 'piclockjs'}
    });
    parseWgAlert(body);
  }
  catch(e) {
    console.dir(e)
  }
}

function parseOW(observation){

  var sunriseEpoch = new Date(0);
  var sunsetEpoch = new Date(0);

  sunriseEpoch.setUTCSeconds(observation.sys.sunrise);
  sunsetEpoch.setUTCSeconds(observation.sys.sunset);

  cur.tempF = observation.main.temp;
  cur.pressure = observation.main.pressure;
  cur.humidity = observation.main.humidity;
  cur.windSpeed = observation.wind.speed;
  cur.windDir = d2d(observation.wind.deg);
  cur.curIcon = 'http://openweathermap.org/img/w/'+observation.weather[0].icon+'.png';
  cur.curDesc = observation.weather[0].main;
  cur.sunrise = sunriseEpoch.toString();
  cur.sunset = sunsetEpoch.toString();
}

function parseMoonPhase(observation) {
  cur.moonPhase = observation.curphase;
}

function parseWgForecast(data) {
  var array = []
  for (var i =0; i < 9; i++) {
    var forecast ={};  //temp object to build json
    forecast.name = data.properties.periods[i].name;
    forecast.temp = data.properties.periods[i].temperature;
    forecast.short = data.properties.periods[i].shortForecast;
    forecast.icon = data.properties.periods[i].icon;
    array.push(forecast);
  }
  forecasts.list = array;
}

function parseWgAlert(data) {
  var array = [];
  for (var i =0; i < data.features.length; i++) {
    var alert ={};
    alert.areaDesc = data.features[i].properties.areaDesc;
    alert.severity = data.features[i].properties.severity;
    alert.headline = data.features[i].properties.headline;
    alert.description - data.features[i].properties.description;
    array.push(alert);
  }
  alerts.features = array;
}
