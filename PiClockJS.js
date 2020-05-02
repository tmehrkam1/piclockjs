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

cur.dt=0;
alerts.features =[];

if (settings.mode == "local" || settings.mode == "server") {
	// start server backend

	if (settings.curProvider=="darksky") {
			currentDsObs();
	} else if (settings.curProvider=="openweather"){
			currentOwObs();
	} else if (settings.curProvider=="climacell"){
			currentCcObs();
	}
	moonPhase();
	getWgovGridP();
	wgAlerts();

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

	// update current observations every 2 min
	setInterval(function() {
		if (settings.curProvider=="darksky") {
			currentDsObs();
		} else if (settings.curProvider=="openweather"){
			currentOwObs();
		} else if (settings.curProvider=="climacell"){
			currentCcObs();
		}
		//pull any US weather alerts		
		wgAlerts();
	}, settings.currentConditionsInterval * 1000);

	// update forecast every 6 hrs
	setInterval(function() {
		getWgovGridP();
	}, settings.forecastInterval * 1000);

	// update moon phase every 12 hrs
	setInterval(function(){
		moonPhase();
	}, 43200000);

}

if (settings.mode =="local") {
	settings.servIP = "http://127.0.0.1:8081"
}

if (settings.mode == "local" || settings.mode == "client") {
	
	//add methods to dim display
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
	//start node app to listen for display dim event
	appl.listen(8081, () => logger.info('PiClock listening on port 8081 in client mode'))
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
		wgForecast(body.properties.forecast);
		settings.wgStaID = body.properties.observationStations;
	}
	catch(e) {
		logger.error(e)
	}
}

async function getWgovObs(wgovObsSta){
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

async function wgCurrent(staId) {
	var url = "https://w1.weather.gov/xml/current_obs/" + staId + ".xml";
	logger.info(url);

	try {
		var { body } = await getPromise({
			url: url,
			json: false,
			headers: {'User-Agent': 'piclockjs'}
		});
		
		
		parser = new DOMParser();
		xmlDoc = parser.parseFromString(body,'text/xml');
				
		var current = new Date(0);
		current.setUTCSeconds(cur.dt);
		var obsTime = xmlDoc.getElementsByTagName("observation_time_rfc822")[0].childNodes[0].nodeValue;
		var update = new Date(obsTime);
		
		if (update > current) {
			logger.info("wg update is fresher " + update);
		} else {
			logger.info("wg update is older " + update);
			return;
		}
		
		//get heat index temp
		var x = xmlDoc.getElementsByTagName("heat_index_f")[0];
		if (x) { 
		var y = x.childNodes[0];
			logger.info("heat index : " + y.nodeValue);
			cur.feelsLike = y.nodeValue;
		}
		
		//get wind chill temp
		x = xmlDoc.getElementsByTagName("windchill_f")[0];
		if (x) { 
		var y = x.childNodes[0];
			logger.info("windchill : " + y.nodeValue);
			cur.feelsLike = y.nodeValue;
		}
		
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

		logger.info('stale update detected with timestamp : ' + update + " behind current timestamp by : " + diffCurMins + " behind now by : "+ diffMins + " minutes");
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
			//myRegex = /.*/g;
			myRegex = /\* WHAT\.*([\s\S]*)\* WHERE[\s\S]*\* WHEN\.*([\s\S]*)\*/g;
			//myRegex = /WHAT([\s\S]*)/g;
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
		//alert.areaDesc = data.features[i].properties.areaDesc;
		alert.severity = data.features[i].properties.severity;
		alert.description = data.features[i].properties.description;
		array.push(alert);
	}
	alerts.features = array;
}

function parseCC(body){
	
	var sunriseEpoch = new Date(body.sunrise.value);
	var sunsetEpoch = new Date(body.sunset.value);
	cur.sunrise = sunriseEpoch.toString();
	cur.sunset = sunsetEpoch.toString();

	var desc=ccIcon(body.weather_code.value);

	cur.curIcon = desc.icon;
	cur.tempF = Math.round(parseFloat(body.temp.value));
	cur.pressure = Math.round(parseFloat(body.baro_pressure.value * 33.86));
	cur.humidity = Math.round(parseFloat(body.humidity.value));
	cur.windSpeed = body.wind_speed.value;
	cur.windDir = d2d(body.wind_direction.value);
	cur.curDesc = desc.text;
	cur.dt = new Date(body.observation_time.value).getTime() / 1000;
	cur.feelsLike = Math.round(parseFloat(body.feels_like.value));
	cur.moonPhase = body.moon_phase.value;
	
	storeValues(cur.dt,cur.tempF,cur.pressure,cur.humidity);

}

function ccIcon(description){

	var now = new Date();
	var day;
	
	logger.info(now + ' : ' + cur.sunset + ' : ' + cur.sunrise);
	
	if ((now < cur.sunset ) && (now > cur.sunrise)) {
		day = true;
	} else {
		day = false;
	}
	
	logger.info(day);

	if (description == "rain_heavy"){
	} else if (description == "rain_heavy") {
		return {
			icon: "",
			text: "Heavy Rain"
		};
	} else if (description == "rain") {
		return {
			icon: "",
			text: "Rain"
		};
	} else if (description == "rain_light") {
		return {
			icon: "",
			text: "Light Rain"
		};
	} else if (description == "freezing_rain_heavy") {
		return {
			icon: "",
			text: "Heavy Freezing Rain"
		};
	} else if (description == "freezing_rain") {
		return {
			icon: "",
			text: "Freezing Rain"
		};
	} else if (description == "freezing_rain_light") {
		return {
			icon: "",
			text: "Freezing Light Rain"
		};
	} else if (description == "freezing_drizzle") {
		return {
			icon: "",
			text: "Freezing Drizzle"
		};
	} else if (description == "drizzle") {
		return {
			icon: "",
			text: "Drizzle"
		};
	} else if (description == "ice_pellets_heavy") {
		return {
			icon: "",
			text: "Heavy Ice Pellets"
		};
	} else if (description == "ice_pellets") {
		return {
			icon: "",
			text: "Ice Pellets"
		};
	} else if (description == "ice_pellets_light") {
		return {
			icon: "",
			text: "Light Ice Pellets"
		};
	} else if (description == "snow_heavy") {
		return {
			icon: "",
			text: "Heavy Snow"
		};
	} else if (description == "snow") {
		return {
			icon: "",
			text: "Snow"
		};
	} else if (description == "snow_light") {
		return {
			icon: "",
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
			var icon = '<i class="wi wi-day-cloudy"></i>';
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
			var icon = '<i class="wi wi-night-partly-cloudy"></i>';
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

function storeValues(timestamp,temp,pressure,humidity) {
	if (store.timestamp.length > 1440 ) {
		logger.info("shift array at length  " + store.timestamp.length);
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