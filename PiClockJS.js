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
var trend = require('trend');
var getPromise = util.promisify(request.get);
const { exec } = require('child_process');

//Read settings
const settings = JSON.parse(fs.readFileSync('./settings.json'))

//Express app
var express = require('express');
var bodyParser = require('body-parser')
const appl = express();
appl.use(bodyParser.json());
appl.use(express.static("public"));

//Logging
var winston = require('winston');
const NODE_ENV = process.env.NODE_ENV;
const myFormat = winston.format.printf(info => {
	return `${info.timestamp} ${info.level}: ${info.message}`;
});
const logger = winston.createLogger({
	level: NODE_ENV === "production" ? 'warn' : 'info',
			transports: [
				//
				// - Write to all logs with level `info` and below to `PiClock.log`
				//
				new winston.transports.File({
					format: winston.format.combine(
							winston.format.timestamp({
								format: 'YYYY-MM-DD hh:mm:ss A ZZ'
							}),
							winston.format.json()
					),
					handleExceptions: true,
					filename: 'PiClock.log',
				})
				]
});


//If we're not in production then log to the `console` with the format:
//`${info.level}: ${info.message} JSON.stringify({ ...rest }) `


if (NODE_ENV !== 'production') {
	logger.add(new winston.transports.Console({
		format: winston.format.combine(
				winston.format.timestamp({
					format: 'YYYY-MM-DD hh:mm:ss A ZZ'
				}),
				winston.format.colorize({ all: true }),
				winston.format.simple(),
				myFormat
		),
		handleExceptions: true
	}));
}


//Handle uncaught handleExceptions
process.on('unhandledRejection', (reason, p) => {
	logger.error('Unhandled Rejection: ' + reason.stack);
	// application specific logging, throwing an error, or other logic here
});

//get current weather conditions
var cur={};
var forecasts = {};
var alerts = {};
var pressureTrend = [];
var nightMode = false;

cur.dt=0;

if (settings.mode == "local" || settings.mode == "server") {
	//start server backend
	
	currentOwObs();
	moonPhase();
	getWgovGridP();
	wgAlerts();
	
	appl.get("/togglenight",(req,res) => {
		if (nightMode = false) {
			exec('sudo bash -c  "echo 17 > /sys/class/backlight/rpi_backlight/brightness"');
			nightMode = true;
			res.status(200);
		} else {
			exec('sudo bash -c  "echo 255 > /sys/class/backlight/rpi_backlight/brightness"');
			nightMode = false;
			res.status(200);
		}
		logger.info("toggle night mode : "+ nightMode);
	});
	
	
	appl.get("/current", (req,res) => {
		res.status(200).json(cur);
	});

	appl.get("/forecast", (req,res) => {
		res.status(200).json(forecasts);
	});

	appl.get("/alerts", (req,res) => {
		res.status(200).json(alerts);
	});

	appl.get("/coords", (req,res) => {
		res.status(200).json({
			lat: settings.lat,
			lon: settings.lon,
			clock: settings.clock,
			gMapKey: settings.gMapKey,
			backgroundImg : settings.backgroundImg,
			imgFontColor : settings.imgFontColor
		})
	});

	appl.get('/', (req,res) => {
		res.sendFile(__dirname + '/public/index.html');
	})

	appl.listen(8081, () => logger.info('Example app listening on port 8081!'))

	//update current observations every 2 min
	setInterval(function() {
		currentOwObs();
		wgAlerts();
	}, settings.currentConditionsInterval * 1000);

	//update forecast every 6 hrs
	setInterval(function() {
		getWgovGridP();
	}, settings.forecastInterval * 1000);

	//update moon phase every 12 hrs
	setInterval(function(){
		moonPhase();
	}, 43200000);
	
}

if (settings.mode =="local") {
	settings.servIP = "http://127.0.0.1:8081"
}

if (settings.mode == "local" || settings.mode == "client") {
	
	//fire up the electron broswer.
	const {app, BrowserWindow} = require('electron')


	function createWindow () {
	  // Create the browser window.
	  win = new BrowserWindow({width: 800, height: 600, frame: false})

	  // and load the index.html of the app.
	  win.loadURL(settings.servIP)
	  win.maximize()
	}

	app.on('ready', createWindow)	
}




async function currentOwObs(){
	var url = 'http://api.openweathermap.org/data/2.5/weather?lat='+settings.lat+'&lon='+settings.lon+'&appid='+settings.owAppId+'&units=imperial'
	logger.info(url);

	var { body } = await getPromise({
		url: url,
		json: true,
		headers: {'User-Agent': 'piclockjs'}
	});
	parseOW(body);
}

async function moonPhase () {
	//fugly date mangling
	var url = 'http://api.usno.navy.mil/rstt/oneday?date=now&coords=' + settings.lat +',' + settings.lon;
	logger.info(url);
	try {
		var { body } = await getPromise({
			url: url,
			json: true,
			headers: {'User-Agent': 'piclockjs'}
		});
		parseMoonPhase(body);
	}
	catch(e) {
		logger.error(e);
	}
}

async function getWgovGridP(){
	var url = 'https://api.weather.gov/points/' + settings.lat + ',' + settings.lon;
	logger.info(url);
	try {
		var { body } = await getPromise({
			url: url,
			json: true,
			headers: {'User-Agent': 'piclockjs'}
		});
		wgForecast(body.properties.forecast);
	}
	catch(e) {
		logger.error(e)
	}
}

async function wgForecast(url){
	logger.info(url);
	try {
		var { body } = await getPromise({
			url: url,
			json: true,
			headers: {'User-Agent': 'piclockjs'}
		});
		parseWgForecast(body);
	}
	catch(e) {
		logger.error(e);
	}
}

async function wgAlerts(){
	var url = "https://api.weather.gov/alerts/active?point=" + settings.lat + "," + settings.lon;
	logger.info(url);
	try {
		var { body } = await getPromise({
			url: url,
			json: true,
			headers: {'User-Agent': 'piclockjs'}
		});
		parseWgAlert(body);
	}
	catch(e) {
		logger.error(e)
	}
}

function parseOW(observation){
	var now = new Date();
		
	if (observation.dt <= cur.dt)
	{
		var update = new Date(0);
		var current = new Date(0);
		
		update.setUTCSeconds(observation.dt);
		current.setUTCSeconds(cur.dt);
		
		var diffMs = (now - update); //diff in MS
		var diffMins = Math.round(diffMs / 1000 / 60); // minutes
		
		var diffCur = (current - update);
		var diffCurMins = (diffCur / 1000 / 60);
		
		logger.info('stale update detected with timestamp : ' + update + " behind current timestamp by : " + diffCurMins + " behind now by : "+ diffMins + " minutes");
		return;
	}

	var sunriseEpoch = new Date(0);
	var sunsetEpoch = new Date(0);


	
	sunriseEpoch.setUTCSeconds(observation.sys.sunrise);
	sunsetEpoch.setUTCSeconds(observation.sys.sunset);

	if ((now > sunsetEpoch ) || (now < sunriseEpoch)) {
		cur.curIcon = '<i class="wi wi-owm-night-' + observation.weather[0].id +'"></i>';
	} else {
		cur.curIcon = '<i class="wi wi-owm-day-' + observation.weather[0].id +'"></i>';
	}
	
	cur.tempF = observation.main.temp;
	cur.pressure = observation.main.pressure;
	cur.humidity = observation.main.humidity;
	cur.windSpeed = observation.wind.speed;
	cur.windDir = d2d(observation.wind.deg);
	cur.curDesc = observation.weather[0].main;
	cur.sunrise = sunriseEpoch.toString();
	cur.sunset = sunsetEpoch.toString();
	cur.dt = observation.dt;
	
	pressureTrend.push(cur.pressure);
	
	if (pressureTrend.length > 15) {
		logger.info("shift array at length  " + pressureTrend.length)
		pressureTrend.shift();
	}
	
	cur.pressureTrend = trend(pressureTrend,{lastpoints:3});
	logger.info(pressureTrend.length + " elements in array. pressure direction : " + cur.pressureTrend);
}

function parseMoonPhase(observation) {
	cur.moonPhase = observation.closestphase.phase;
	if (typeof observation.curphase != "undefined") {
		cur.moonPhase = observation.curphase;  //use more accurate phase string
	}
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
		
		if (data.features[i].properties.event == "Special Weather Statement") {
			alert.headline = data.features[i].properties.parameters.NWSheadline[0];
		} else {
			alert.headline = data.features[i].properties.headline;
		}
		alert.areaDesc = data.features[i].properties.areaDesc;
		alert.severity = data.features[i].properties.severity;
		
		alert.description - data.features[i].properties.description;
		array.push(alert);
	}
	alerts.features = array;
}
