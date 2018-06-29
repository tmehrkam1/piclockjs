/**
 * replacement for piclock using node and html
 * tmehrkam@gmail.com
 */
var http = require('http');
var request = require('request');
var fs = require("fs");

var CronJob = require('cron').CronJob;

//get current weather conditions
var cur={};
var forecasts = {};
var alerts = {};

var lat,lon,owAppId,gMapKey;

var settings = JSON.parse(fs.readFileSync("settings.json",'utf8'));
lat = settings.lat
lon = settings.lon
owAppId = settings.owAppId;
gMapKey = settings.gMapKey;

currentOwObs(lat,lon,owAppId);
moonPhase();
getWgovGridP(lat,lon);
wgAlerts(lat,lon);

//create listener for html requests
http.createServer(function (req,res) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Request-Method', '*');
	res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
	res.setHeader('Access-Control-Allow-Headers', '*');

	if (req.url=="/current"){
		res.writeHead(200,{'Content-Type': 'application/json'});
		res.write(JSON.stringify(cur));
		res.end();
	} else if (req.url == "/forecast") {
		res.writeHead(200,{'Content-Type': 'application/json'});
		res.write(JSON.stringify(forecasts));
		res.end();
	} else if (req.url == "/coords") {
		res.writeHead(200, {'Content-Type': 'application/json'});
		//create object to pass settings as JSON
		var obj = {};
		obj.lat = lat;
		obj.lon = lon;
		obj.gMapKey = gMapKey;
		res.write(JSON.stringify(obj));
		res.end();
	} else if (req.url =="/alerts"){
		res.writeHead(200, {'Content-Type': 'application/json'});
		res.write(JSON.stringify(alerts));
		res.end();
	} else {
		fs.readFile("index.html", function(err, data){
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.write(data);
			res.end();
		});
	}
}).listen(8081);


//update current observations every 2 min
new CronJob('0 */2 * * * *', function() {
	currentOwObs(lat,lon,owAppId);
	wgAlerts(lat,lon);
}, null, true, 'America/New_York');

//update forecast every 6 hrs
new CronJob('0 0 */6 * * *', function() {
	getWgovGridP(lat,lon);
	moonPhase();
}, null, true, 'America/New_York');

function currentOwObs(lat,lon,owAppId){
	var url = 'http://api.openweathermap.org/data/2.5/weather?lat='+lat+'&lon='+lon+'&appid='+owAppId+'&units=imperial'
	console.log(url);

	request.get({
		url: url,
		json: true,
		headers: {'User-Agent': 'piclockjs'}
	}, (err, res, data) => {
		if (err) {
			console.log('Error:', err);
		} else if (res.statusCode !== 200) {
			console.log('Status:', res.statusCode);
		} else {
			parseOW(data);
		}
	});
}

function moonPhase () {
	//fugly date mangling
	var curDate = new Date();
	year = curDate.getFullYear();
	month = curDate.getMonth()+1;
	day = curDate.getDate();
	dateStr = month + '/' + day + '/' + year;

	console.log('http://api.usno.navy.mil/moon/phase?date='+dateStr+'&nump=1');
	
	request.get({
		url: 'http://api.usno.navy.mil/moon/phase?date='+dateStr+'&nump=1',
		json: true,
		headers: {'User-Agent': 'piclockjs'}
	}, (err, res, data) => {
		if (err) {
			console.log('Error:', err);
		} else if (res.statusCode !== 200) {
			console.log('Status:', res.statusCode);
		} else {
			parseMoonPhase(data);
		}
	});
}

function getWgovGridP(lat,lon){
	var url = 'https://api.weather.gov/points/' + lat + ',' + lon;
	console.log(url);
	request.get({ 
		url: url,
		json: true,
		headers: {'User-Agent': 'piclockjs'}
	}, (err, res, data) => {
		if (err) {
			console.log('Error:', err);
		} else if (res.statusCode !== 200) {
			console.log('Status:', res.statusCode);
		} else {
			wgForecast(data.properties.forecast);
		}
	});

}

function wgForecast(url){
	console.log(url);
	request.get({
		url: url,
		json: true,
		headers: {'User-Agent': 'piclockjs'}
	}, (err, res, data) => {
		if (err) {
			console.log('Error:', err);
		} else if (res.statusCode !== 200) {
			console.log('Status:', res.statusCode);
		} else {
			parseWgForecast(data);
		}
	});
}

function wgAlerts(lat,lon){
	var url = "https://api.weather.gov/alerts/active?point=" + lat + "," + lon;
	console.log(url);
	request.get({
		url: url,
		json: true,
		headers: {'User-Agent': 'piclockjs'}
	}, (err, res, data) => {
		if (err) {
			console.log('Error:', err);
		} else if (res.statusCode !== 200) {
			console.log('Status:', res.statusCode);
		} else {
			parseWgAlert(data);
		}
	});
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
	cur.windDir = degToCard(observation.wind.deg);
	cur.curIcon = 'http://openweathermap.org/img/w/'+observation.weather[0].icon+'.png';
	cur.curDesc = observation.weather[0].main;
	cur.sunrise = sunriseEpoch.toString();
	cur.sunset = sunsetEpoch.toString();
}

function parseMoonPhase(observation) {
	cur.moonPhase = observation.phasedata[0].phase;
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

function degToCard(deg){
	if (deg>11.25 && deg<33.75){
		return "NNE";
	}else if (deg>33.75 && deg<56.25){
		return "ENE";
	}else if (deg>56.25 && deg<78.75){
		return "E";
	}else if (deg>78.75 && deg<101.25){
		return "ESE";
	}else if (deg>101.25 && deg<123.75){
		return "ESE";
	}else if (deg>123.75 && deg<146.25){
		return "SE";
	}else if (deg>146.25 && deg<168.75){
		return "SSE";
	}else if (deg>168.75 && deg<191.25){
		return "S";
	}else if (deg>191.25 && deg<213.75){
		return "SSW";
	}else if (deg>213.75 && deg<236.25){
		return "SW";
	}else if (deg>236.25 && deg<258.75){
		return "WSW";
	}else if (deg>258.75 && deg<281.25){
		return "W";
	}else if (deg>281.25 && deg<303.75){
		return "WNW";
	}else if (deg>303.75 && deg<326.25){
		return "NW";
	}else if (deg>326.25 && deg<348.75){
		return "NNW";
	}else{
		return "N"; 
	}
}