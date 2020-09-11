/**
 * replacement for piclock using node and html tmehrkam@gmail.com
 */
var http = require('http');
var request = require('request');
var fs = require("fs");
var path = require('path');
var d2d = require('degrees-to-direction')
var util = require('util');
var trend = require('trend');
var getPromise = util.promisify(request.get);
var DOMParser = require('xmldom').DOMParser;
var geoTz = require('geo-tz');
var SunCalc = require('suncalc');
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
require('winston-daily-rotate-file');
const NODE_ENV = process.env.NODE_ENV;
const myFormat = winston.format.printf(info => {
	return `${info.timestamp} ${info.level}: ${info.message}`;
});


var transport = new (winston.transports.DailyRotateFile)({
	filename: 'PiClock-%DATE%.log',
	datePattern: 'YYYY-MM-DD',
	zippedArchive: true,
	maxSize: '20m',
	maxFiles: '14d'
});

transport.on('rotate', function(oldFilename, newFilename) {
	// do something fun
});

const logger = winston.createLogger({
	level: NODE_ENV === "production" ? 'warn' : 'info',
			transports: [
				transport
				],
				format: winston.format.combine(
						winston.format.timestamp({
							format: 'YYYY-MM-DD hh:mm:ss A ZZ'
						}),
						winston.format.colorize({ all: true }),
						winston.format.simple(),
						myFormat
				),
});


//If we're not in production then log to the `console` with the format:
//`${info.level}: ${info.message} JSON.stringify({ ...rest }) `


if (NODE_ENV == 'development') {
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

//initialize default vars to store data about weather
//get current weather conditions
var cur={};
//initialize json of arrays
var store={};
store.timestamp=[];
store.temp=[];
store.pressure=[];
store.humidity=[];
var forecasts = {};
var alerts = {};
var nightMode = false;
//json to store timings for iterative loops
var timer={};
timer.cur=new Date(0);
timer.fore=new Date(0);
timer.alert=new Date(0);

cur.dt=0;
alerts.features =[];

if (settings.mode == "local" || settings.mode == "server") {
	// start server backend
	initLoop();

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
		var tz = geoTz(settings.lat, settings.lon);

		res.status(200).json({
			lat: settings.lat,
			lon: settings.lon,
			clock: settings.clock,
			gMapKey: settings.gMapKey,
			backgroundImg : settings.backgroundImg,
			imgFontColor : settings.imgFontColor,
			tz: tz,
			aerisID : settings.aerisID,
			aerisSecret : settings.aerisSecret
		})
	});

	appl.get("/store", (req,res) => {
		res.status(200).json(store);
	})

	appl.get('/', (req,res) => {
		res.sendFile(__dirname + '/public/index.html');
	})

	appl.listen(8081, () => logger.info('PiClock listening on port 8081 in server mode'))
}

if (settings.mode =="local") {
	settings.servIP = "http://127.0.0.1:8081"
}

if (settings.mode == "local" || settings.mode == "client") {

	// add methods to dim display
	appl.get("/day",(req,res) => {
		if (req.ip == '::ffff:127.0.0.1') {
			exec('sudo bash -c  "echo 255 > /sys/class/backlight/rpi_backlight/brightness"');
			nightMode = false;
			logger.info(req.ip + " toggle day mode : "+ nightMode);
		};
		res.status(200);
	});

	appl.get("/night", (req,res) => {
		if (req.ip == '::ffff:127.0.0.1') {
			exec('sudo bash -c  "echo 17 > /sys/class/backlight/rpi_backlight/brightness"');
			nightMode = true;
			logger.info(req.ip + " toggle night mode : "+ nightMode);
		}
		res.status(200);
	})

	// fire up the electron broswer.

	const electron = require('electron')
	const { app, BrowserWindow } = electron	
	let win

	app.on('ready', () => {
		const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize
		win = new BrowserWindow({ 
			width, 
			height, 
			frame: false, 
			webPreferences: {nodeIntegration: false}
		})
		win.loadURL(settings.servIP)
	})

}

if (settings.mode == "client") {
	// start node app to listen for display dim event
	appl.listen(8081, () => logger.info('PiClock listening on port 8081 in client mode'))
}

function initLoop(){
	// move the provider selection and loop start here
	var now = new Date();
	logger.info("initLoop")
	getWgovGridP();
	setInterval(function() {
		mainLoop();
	}, 1000);
}

function mainLoop(){
	// recurring function to kick off async calls to the various providers
	var now = new Date();
	// logger.info("mainLoop");
	// logger.info(Math.abs(now - timer.cur));

	if (Math.abs(now - timer.cur) > (settings.currentConditionsInterval * 1000)) {
		logger.info("update cur provider " + settings.curProvider);
		if (settings.curProvider=="darksky") {
			currentDsObs();
		} else if (settings.curProvider=="openweather"){
			currentOwObs();
		} else if (settings.curProvider=="climacell"){
			currentCcObs();
		} else if (settings.curProvider=="nws"){
			wgCurrent(settings.wgStaID)
		}
		timer.cur = now;
	}
	if (Math.abs(now - timer.alert) > (60 * 1000)) {
		logger.info("update NWS alerts");
		wgAlerts();
		timer.alert = now;
	}

	if (Math.abs(now - timer.fore) > (settings.forecastInterval * 1000)) {
		logger.info("update forecast provider");
		if ( settings.curProvider != "climacell") {
			// climacell passes moon phase, otherwise call USNO / suncalc
			moonPhase();
		}
		wgForecast(settings.wgForecast);
		timer.fore = now;
	}
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

async function currentDsObs(){
	var url = 'https://api.darksky.net/forecast/'+settings.dsAppId+'/'+settings.lat+','+settings.lon;
	logger.info(url);

	var { body } = await getPromise({
		url: url,
		json: true,
		headers: {'User-Agent': 'piclockjs'}
	});
	parseDS(body);
}

async function currentCcObs(){
	var url = 'https://api.climacell.co/v3/weather/realtime?lat=' + settings.lat + '&lon=' + settings.lon + '&unit_system=us&fields=temp%2Cfeels_like%2Chumidity%2Cwind_speed%2Cmoon_phase%2Cweather_code%2Csunrise%2Csunset%2Cwind_direction%2Cbaro_pressure'
	logger.info(url);

	var { body } = await getPromise({
		url: url,
		json: true,
		headers: {'User-Agent': 'piclockjs',
			'apikey' : settings.ccAppId,
			'accept' : 'application/json'
		}
	});
	parseCC(body);
}


async function moonPhase () {
	var url = 'https://api.usno.navy.mil/rstt/oneday?date=now&coords=' + settings.lat +',' + settings.lon;
	logger.info(url);
	try {
		var { body } = await getPromise({
			url: url,
			json: true,
			rejectUnauthorized: false,
			headers: {'User-Agent': 'piclockjs'}
		});
		parseMoonPhase(body);
	}
	catch(e) {
		logger.error(e);
		generateMoonPhase();
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
		settings.wgForecast = (body.properties.forecast);	
	}
	catch(e) {
		logger.error(e);
		await sleep (1000);
		logger.warn("retrying NWS gridpoint");
		getWgovGridP();
	}

	var obsurl = body.properties.observationStations;
	logger.info(obsurl);
	
	try {
		var { body } = await getPromise({
			url: obsurl,
			json: true,
			headers: {'User-Agent': 'piclockjs'}
		});
		settings.wgStaID = body.features[0].properties.stationIdentifier;
		logger.info("got NWS weather station " + body.features[0].properties.stationIdentifier);
	}
	catch(e) {
		logger.error(e);
		await sleep (1000);
		logger.warn("retrying NWS gridpoint");
		getWgovGridP();
	}
}

async function getWgovObs(wgovObsSta){
	if (wgovObsSta == null) {
		logger.warn("NWS observation gridpoint data not updated");
		return;
	}
	logger.info(wgovObsSta);
	try {
		var { body } = await getPromise({
			url: wgovObsSta,
			json: true,
			headers: {'User-Agent': 'piclockjs'}
		});
		wgCurrent(body.features[0].properties.stationIdentifier);
	}
	catch(e) {
		logger.error(e)
	}
}

async function wgForecast(url){
    if (url == null) {
    		logger.warn("forecast gridpoint data not updated");
    		var now = new Date();
		timer.fore = now - (settings.forecastInterval * 1000 + 60 * 1000);
		logger.warn("set next forecast poll to : " + timer.fore)
		return;
    }
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
		var now = new Date();
		timer.fore = now - (settings.forecastInterval * 1000 + 60 * 1000);
		logger.warn("set next forecast poll to : " + timer.fore)
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
		var now = new Date();
		timer.alert = now - (60 * 1000);
		logger.warn("set next forecast poll to : " + timer.alert)
	}
}

async function wgCurrent(staId) {
	// var url = "https://w1.weather.gov/xml/current_obs/" + staId + ".xml";
	// switching to newer json api
	var url = "https://api.weather.gov/stations/"+staId+"/observations/latest";
	logger.info(url);

	try {
		var { body } = await getPromise({
			url: url,
			json: false,
			headers: {'User-Agent': 'piclockjs'}
		});
		parsewgCurrent(body);
	}
	catch(e) {
		logger.error(e);
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

		var diffMs = (now - update); // diff in MS
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

	cur.tempF = Math.round(parseFloat(observation.main.temp));
	cur.feelsLike = Math.round(parseFloat(observation.main.feels_like));
	cur.pressure = observation.main.pressure;
	cur.humidity = observation.main.humidity;
	cur.windSpeed = observation.wind.speed;
	cur.windDir = d2d(observation.wind.deg);
	cur.curDesc = observation.weather[0].main;
	cur.sunrise = sunriseEpoch.toString();
	cur.sunset = sunsetEpoch.toString();
	cur.dt = observation.dt;

	storeValues(cur.dt,cur.tempF,cur.pressure,cur.humidity);
}

function parseDS(body){

	var observation = body.currently;
	var now = new Date();

	if (observation.time <= cur.dt)
	{
		var update = new Date(0);
		var current = new Date(0);

		update.setUTCSeconds(observation.time);
		current.setUTCSeconds(cur.dt);

		var diffMs = (now - update); // diff in MS
		var diffMins = Math.round(diffMs / 1000 / 60); // minutes

		var diffCur = (current - update);
		var diffCurMins = (diffCur / 1000 / 60);

		logger.warn('stale update detected with timestamp : ' + update + " behind current timestamp by : " + diffCurMins + " behind now by : "+ diffMins + " minutes");
		return;
	}

	var sunriseEpoch = new Date(0);
	var sunsetEpoch = new Date(0);

	sunriseEpoch.setUTCSeconds(body.daily.data[0].sunriseTime);
	sunsetEpoch.setUTCSeconds(body.daily.data[0].sunsetTime);
	cur.sunrise = sunriseEpoch.toString();
	cur.sunset = sunsetEpoch.toString();

	cur.curIcon = '<i class="wi wi-forecast-io-' + observation.icon +'"></i>';

	cur.tempF = Math.round(parseFloat(observation.temperature));
	cur.pressure = Math.round(parseFloat(observation.pressure));
	cur.humidity = Math.round(parseFloat(observation.humidity * 100));
	cur.windSpeed = observation.windSpeed;
	cur.windDir = d2d(observation.windBearing);
	cur.curDesc = observation.summary;
	cur.dt = observation.time;
	cur.feelsLike = Math.round(parseFloat(observation.apparentTemperature));

	storeValues(cur.dt,cur.tempF,cur.pressure,cur.humidity);
}


function parseMoonPhase(observation) {
	cur.moonPhase = observation.closestphase.phase;
	if (typeof observation.curphase != "undefined") {
		cur.moonPhase = observation.curphase;  // use more accurate phase
		// string
	}
}

function generateMoonPhase() {
	var timeAndDate = new Date();
	var phase = SunCalc.getMoonIllumination(timeAndDate).phase;
	logger.warn('generated moon phase with suncalc at '+phase);

	if (phase == 0)	{
		cur.moonPhase = "New Moon";
	} else if (phase>0 && phase <.25) {
		cur.moonPhase ="Waxing Crescent";
	} else if (phase == 0.25) {
		cur.moonPhase ="First Quarter";
	} else if (phase>.25&&phase<.5) {
		cur.moonPhase = "Waxing Gibbous";
	} else if (phase==0.5) {
		cur.moonPhase ="Full Moon";
	} else if (phase>.5&&phase<.75) {
		cur.moonPhase = "Waning Gibbous";
	} else if (phase==0.75) {
		cur.moonPhase ="Last Quarter";
	} else if (phase>.75) {
		cur.moonPhase ="Waning Crescent";
	} else {
		cur.moonPhase = "error calculating phase";
	}
}

function parseWgForecast(data) {
	// usg forecast has a tendancy to mess up now()
	var now = new Date();
	var end = new Date(data.properties.periods[0].endTime);
	while ( end < now ){
		data.properties.periods.shift();
		logger.warn("WG forecast array shifted")
		end = new Date(data.properties.periods[0].endTime);
	}
	var array = []
	for (var i =0; i < 9; i++) {
		var forecast ={};  // temp object to build json
		forecast.name = data.properties.periods[i].name;
		forecast.temp = data.properties.periods[i].temperature;
		forecast.short = data.properties.periods[i].shortForecast;
		forecast.icon = data.properties.periods[i].icon;
		forecast.detailed = data.properties.periods[i].detailedForecast;
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
		} else if (data.features[i].properties.event == "Winter Weather Advisory") {
			// myRegex = /.*/g;
			myRegex = /\* WHAT\.*([\s\S]*)\* WHERE[\s\S]*\* WHEN\.*([\s\S]*)\*/g;
			// myRegex = /WHAT([\s\S]*)/g;
			str = data.features[i].properties.description;
			try{
				match = myRegex.exec(str);
				alert.headline = match[1]+match[2];
			} catch(e) {
				console.log(e.message);
			}
		} else {
			alert.headline = data.features[i].properties.headline;
		}
		// alert.areaDesc = data.features[i].properties.areaDesc;
		alert.severity = data.features[i].properties.severity;
		alert.description = data.features[i].properties.description;
		alert.id = data.features[i].properties.id;
		array.push(alert);
	}
	alerts.features = array;
}

function parsewgCurrent(data) {
	body = JSON.parse(data);
	observation = body.properties;
	
	obsdt = new Date(observation.timestamp).getTime() / 1000;
	var now = new Date();
	
	//logger.info(observation);
	
	if (obsdt <= cur.dt)
	{
		var update = new Date(0);
		var current = new Date(0);

		update.setUTCSeconds(obsdt);
		current.setUTCSeconds(cur.dt);

		var diffMs = (now - update); // diff in MS
		var diffMins = Math.round(diffMs / 1000 / 60); // minutes

		var diffCur = (current - update);
		var diffCurMins = (diffCur / 1000 / 60);

		logger.warn('stale update detected with timestamp : ' + update + " behind current timestamp by : " + diffCurMins + " behind now by : "+ diffMins + " minutes");
		return;
	}

	cur.curDesc = observation.textDescription;
	cur.curIcon = '<img id="curImg" src="'+ observation.icon +'&size=small"></img>';

	if (observation.windChill.value) {
		cur.feelsLike = Math.round(parseFloat((observation.windChill.value * 9/5) + 32));
	}

	if (observation.heatIndex.value) {
		cur.feelsLike = Math.round(parseFloat((observation.heatIndex.value * 9/5) + 32));
	}

	cur.tempF = Math.round(parseFloat((observation.temperature.value * 9/5) + 32));
	cur.pressure = Math.round(parseFloat(observation.barometricPressure.value / 100));
	cur.humidity = Math.round(parseFloat(observation.relativeHumidity.value));
	cur.windSpeed = Math.round(parseFloat(observation.windSpeed.value / 1.609));
	cur.windDir = d2d(observation.windDirection.value)
	cur.dt = new Date(observation.timestamp).getTime() / 1000;

	storeValues(cur.dt,cur.tempF,cur.pressure,cur.humidity);
}

function parseCC(body){

	var sunriseEpoch = new Date(body.sunrise.value);
	var sunsetEpoch = new Date(body.sunset.value);
	cur.sunrise = sunriseEpoch.toString();
	cur.sunset = sunsetEpoch.toString();

	var desc=ccIcon(body.weather_code.value);
	var moon=ccMoon(body.moon_phase.value);

	cur.curDesc = desc.text;
	cur.curIcon = desc.icon;
	cur.moonPhase = moon.text;

	cur.tempF = Math.round(parseFloat(body.temp.value));
	cur.pressure = Math.round(parseFloat(body.baro_pressure.value * 33.86));
	cur.humidity = Math.round(parseFloat(body.humidity.value));
	cur.windSpeed = body.wind_speed.value;
	cur.windDir = d2d(body.wind_direction.value);
	cur.dt = new Date(body.observation_time.value).getTime() / 1000;
	cur.feelsLike = Math.round(parseFloat(body.feels_like.value));


	storeValues(cur.dt,cur.tempF,cur.pressure,cur.humidity);

}

function ccIcon(description){

	var now = new Date();
	var sunrise = new Date(cur.sunrise);
	var sunset = new Date(cur.sunset);

	var day;

	if (now > sunrise && now < sunset) {
		day = true;
	} else {
		day = false;
	}

	if (description == "rain_heavy"){
		if (day) {
			var icon = '<i class="wi wi-day-rain"></i>';
		} else {
			var icon = '<i class="wi wi-night-rain"></i>';
		}
	} else if (description == "rain_heavy") {
		return {
			icon: icon,
			text: "Heavy Rain"
		};
	} else if (description == "rain") {
		if (day) {
			var icon = '<i class="wi wi-day-rain"></i>';
		} else {
			var icon = '<i class="wi wi-night-rain"></i>';
		}
		return {
			icon: icon,
			text: "Rain"
		};
	} else if (description == "rain_light") {
		if (day) {
			var icon = '<i class="wi wi-day-sprinkle"></i>';
		} else {
			var icon = '<i class="wi wi-night-alt-sprinkle"></i>';
		}
		return {
			icon: icon,
			text: "Light Rain"
		};
	} else if (description == "freezing_rain_heavy") {
		if (day) {
			var icon = '<i class="wi wi-day-rain-mix"></i>';
		} else {
			var icon = '<i class="wi-night-rain-mix"></i>';
		}
		return {
			icon: icon,
			text: "Heavy Freezing Rain"
		};
	} else if (description == "freezing_rain") {
		if (day) {
			var icon = '<i class="wi wi-day-sleet"></i>';
		} else {
			var icon = '<i class="wi wi-night-sleet"></i>';
		}
		return {
			icon: icon,
			text: "Freezing Rain"
		};
	} else if (description == "freezing_rain_light") {
		if (day) {
			var icon = '<i class="wi wi-day-sleet"></i>';
		} else {
			var icon = '<i class="wi wi-night-sleet"></i>';
		}
		return {
			icon: icon,
			text: "Freezing Light Rain"
		};
	} else if (description == "freezing_drizzle") {
		if (day) {
			var icon = '<i class="wi wi-day-sleet"></i>';
		} else {
			var icon = '<i class="wi wi-night-alt-showers"></i>';
		}
		return {
			icon: icon,
			text: "Freezing Drizzle"
		};
	} else if (description == "drizzle") {
		if (day) {
			var icon = '<i class="wi wi-day-showers"></i>';
		} else {
			var icon = '<i class="wi wi-night-sprinkle"></i>';
		}
		return {
			icon: icon,
			text: "Drizzle"
		};
	} else if (description == "ice_pellets_heavy") {
		if (day) {
			var icon = '<i class="wi wi-day-hail"></i>';
		} else {
			var icon = '<i class="wi wi-night-hail"></i>';
		}
		return {
			icon: icon,
			text: "Heavy Ice Pellets"
		};
	} else if (description == "ice_pellets") {
		if (day) {
			var icon = '<i class="wi wi-day-hail"></i>';
		} else {
			var icon = '<i class="wi wi-night-hail"></i>';
		}
		return {
			icon: icon,
			text: "Ice Pellets"
		};
	} else if (description == "ice_pellets_light") {
		if (day) {
			var icon = '<i class="wi wi-day-snow"></i>';
		} else {
			var icon = '<i class="wi wi-night-snow"></i>';
		}
		return {
			icon: icon,
			text: "Light Ice Pellets"
		};
	} else if (description == "snow_heavy") {
		if (day) {
			var icon = '<i class="wi wi-day-snow"></i>';
		} else {
			var icon = '<i class="wi wi-night-snow"></i>';
		}
		return {
			icon: icon,
			text: "Heavy Snow"
		};
	} else if (description == "snow") {
		if (day) {
			var icon = '<i class="wi wi-day-snow"></i>';
		} else {
			var icon = '<i class="wi wi-night-snow"></i>';
		}
		return {
			icon: icon,
			text: "Snow"
		};
	} else if (description == "snow_light") {
		if (day) {
			var icon = '<i class="wi wi-day-snow"></i>';
		} else {
			var icon = '<i class="wi wi-night-snow"></i>';
		}
		return {
			icon: icon,
			text: "Light snow"
		};
	} else if (description == "flurries") {
		if (day) {
			var icon = '<i class="wi wi-day-snow"></i>';
		} else {
			var icon = '<i class="wi wi-night-snow"></i>';
		}
		return {
			icon: icon,
			text: "Flurries"
		};
	} else if (description == "tstorm") {
		if (day) {
			var icon = '<i class="wi wi-day-thunderstorm"></i>';
		} else {
			var icon = '<i class="wi wi-night-thunderstorm"></i>';
		}
		return {
			icon: icon,
			text: "Thunderstorm"
		};
	} else if (description == "fog_light") {
		if (day) {
			var icon = '<i class="wi wi-day-fog"></i>';
		} else {
			var icon = '<i class="wi wi-night-fog"></i>';
		}
		return {
			icon: icon,
			text: "Light Fog"
		};
	} else if (description == "fog") {
		if (day) {
			var icon = '<i class="wi wi-fog"></i>';
		} else {
			var icon = '<i class="wi wi-fog"></i>';
		}
		return {
			icon: icon,
			text: "Fog"
		};
	} else if (description == "cloudy") {
		if (day) {
			var icon = '<i class="wi wi-cloudy"></i>';
		} else {
			var icon = '<i class="wi wi-cloudy"></i>';
		}
		return {
			icon: icon,
			text: "Cloudy"
		};
	} else if (description == "mostly_cloudy") {
		if (day) {
			var icon = '<i class="wi wi-day-sunny-overcast"></i>';
		} else {
			var icon = '<i class="wi wi-night-partly-cloudy"></i>';
		}
		return {
			icon: icon,
			text: "Mostly Cloudy"
		};
	} else if (description == "partly_cloudy") {
		if (day) {
			var icon = '<i class="wi wi-day-cloudy"></i>';
		} else {
			var icon = '<i class="wi wi-night-alt-partly-cloudy"></i>';
		}
		return {
			icon: icon,
			text: "Partly Cloudy"
		};
	} else if (description == "mostly_clear") {
		if (day) {
			var icon = '<i class="wi wi-day-cloudy"></i>';
		} else {
			var icon = '<i class="wi wi-night-alt-cloudy"></i>';
		}
		return {
			icon: icon,
			text: "Mostly Clear"
		};
	} else if (description == "clear") {
		if (day) {
			var icon = '<i class="wi wi-day-sunny"></i>';
		} else {
			var icon = '<i class="wi wi-night-clear"></i>';
		}
		return {
			icon: icon,
			text: "Clear"
		};
	}
}

function ccMoon(phase) {
	if (phase=="new") {
		var txt = 'New Moon';
		var icon = '<i class="wi wi-moon-new"></i>';
	} else if (phase=="waxing_crescent") {
		var txt = 'Waxing Crescent';
		var icon = '<i class="wi wi-moon-waxing-crescent-1"></i>';
	} else if (phase=="waning_crescent") {
		var txt = 'Waning Crescent';
		var icon = '<i class="wi wi-moon-waning-crescent-1"></i>';
	} else if (phase=="first_quarter") {
		var txt = 'First Quarter';
		var icon = '<i class="wi wi-moon-first-quarter"></i>';
	} else if (phase=="last_quarter") {
		var txt = 'Last Quarter';
		var icon = '<i class="wi wi-moon-third-quarter"></i>';		
	} else if (phase=="waxing_gibbous") {
		var txt = 'Waxing Gibbous';
		var icon = '<i class="wi wi-moon-waxing-gibbous-1"></i>';
	} else if (phase=="waning_gibbous") {
		var txt = 'Waning Gibbous';
		var icon = '<i class="wi wi-moon-waning-gibbous-1"></i>';
	} else if (phase=="full") {
		var txt = 'Full Moon';
		var icon = '<i class="wi wi-moon-full"></i>';
	} else {
		var txt = phase;
	}
	return {
		icon: icon,
		text: txt
	};
}

function storeValues(timestamp,temp,pressure,humidity) {
	if (store.timestamp.length > 1440 ) {
		store.timestamp.shift();
		store.temp.shift();
		store.pressure.shift();
		store.humidity.shift();
	}

	store.timestamp.push(timestamp);
	store.temp.push(temp);
	store.pressure.push(pressure);
	store.humidity.push(humidity);

	logger.info('store has value count of :' + store.timestamp.length);

	cur.pressureTrend = trend(store.pressure,{lastpoints:5,avgPoints:60});
}