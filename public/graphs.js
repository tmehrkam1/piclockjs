var timestampArray = [];
var tempArray = [];
var pressureArray = [];
var humidityArray = [];

window.moment = moment;

updateCoords(); // grab map coords from backend.
updateValues(); // grab stored values from backend.

// restyle column width
var col2Div = document.getElementById("col_2");
var dateDiv = document.getElementById("date");
var timeDiv = document.getElementById("time");


col2Div.style.width = "79vw"; 
dateDiv.style.float = "left";
dateDiv.style.fontFamily = "orbitron";
dateDiv.style.padding = "5px 0px 0px 0px";
timeDiv.style.height = "10vh";
timeDiv.style.fontSize = "7vh";
timeDiv.style.lineHeight = "7vh";
timeDiv.style.overflow = "hidden";
timeDiv.style.float = "left";
timeDiv.style.padding = "5px 0px 0px 50px";


updateClock();
updateCur();
updateForecast();

setInterval(updateClock, 1000); // tick the clock every second
setInterval(updateCur, 10000); // every ten seconds update current conditions
setInterval(updateValues, 2 * 60 *1000); // update values every 2 minutes
setInterval(updateForecast,4*60*60*1000) // update forcast block every 4
											// hours
// from cache


function updateCoords() {
	url = "coords";
	var xhr = new XMLHttpRequest(); // need a sync call to initialize Maps
	xhr.open("GET", url, false);
	xhr.send(null);
	var obj = JSON.parse(xhr.responseText);
	lat = obj.lat;
	lon = obj.lon;
	lat = parseFloat(lat);
	lon = parseFloat(lon);
	gMapKey = obj.gMapKey;
	clockType = obj.clock;
	backgroundImg = obj.backgroundImg;
	imgFontColor = obj.imgFontColor;
	tz = obj.tz;
}

function updateValues() {
	url = "store";
	var xhr = new XMLHttpRequest(); // need a sync call
	xhr.open("GET", url, false);
	xhr.send(null);
	var obj = JSON.parse(xhr.responseText);

	obj.timestamp.forEach(function(element, i) {
		
		tempArray[i] = [ element * 1000, obj.temp[i] ];
		pressureArray[i] = [ element * 1000, obj.pressure[i] ];
		humidityArray[i] = [ element * 1000, obj.humidity[i] ];
	});
	tempGraph();
	pressGraph();
	humidityGraph();
}

function tempGraph() {
	Highcharts.setOptions({
		time : {
			timezone : tz
		}
	});
	
	var chart = {
		zoomType : 'x'
	};
	var title = {
		text : 'Temperature over the last 48 hours'
	};

	var xAxis = {
		type : 'datetime',
		dateTimeLabelFormats : {
			day : '%e %b - %H'
		}
	};
	var yAxis = {
		title : {
			text : 'Temperature'
		},
		plotBands : [{
			color : '#94b7cf',
			from : '-210',  // arbitrary low. not sure if there is an auto
							// option
			to : '29'
		},
		{
			color : '#00A4E8',
			from : '30',
			to : '39'
		},
		{
			color : '#2D3389',
			from : '40',
			to : '49'
		},
		{
			color : '#128A43',
			from : '50',
			to : '59'
		},
		{
			color : '#76BD43',
			from : '60',
			to : '69'
		},
		{
			color : '#FBD905',
			from : '70',
			to : '79'
		},
		{
			color : '#F58322',
			from : '80',
			to : '89'
		},
		{
			color : '#E91E24',
			from : '90',
			to : '210'  // arbitrary high. not sure if there is an auto option
		}]
	};
	var legend = {
		enabled : false
	};
	var series = [ {
		type : 'line',
		name : 'temp',
		color : '#000000',
		data : tempArray,
		pointInterval : 3 * 3600 * 1000
	// every 3 hours
	} ];

	var json = {};
	json.chart = chart;
	json.title = title;
	json.legend = legend;
	json.xAxis = xAxis;
	json.yAxis = yAxis;
	json.series = series;
	$('#temp').highcharts(json);
}

function pressGraph() {
	Highcharts.setOptions({
		time : {
			timezone : tz
		}
	});

	var chart = {
		zoomType : 'x'
	};
	var title = {
		text : 'Pressure over the last 48 hours'
	};

	var xAxis = {
		type : 'datetime',
		dateTimeLabelFormats : {
			day : '%e %b - %H'
		}
	};
	var yAxis = {
		title : {
			text : 'Pressure'
		}
	};
	var legend = {
		enabled : false
	};
	var series = [ {
		type : 'line',
		name : 'mbar',
		data : pressureArray,
		pointInterval : 3 * 3600 * 1000
	// every 3 hours
	} ];

	var json = {};
	json.chart = chart;
	json.title = title;
	json.legend = legend;
	json.xAxis = xAxis;
	json.yAxis = yAxis;
	json.series = series;
	$('#pressure').highcharts(json);
}

function humidityGraph() {
	Highcharts.setOptions({
		time : {
			timezone : tz
		}
	});

	var chart = {
		zoomType : 'x'
	};
	var title = {
		text : 'Humidity over the last 48 hours'
	};

	var xAxis = {
		type : 'datetime',
		dateTimeLabelFormats : {
			day : '%e %b - %H'
		}
	};
	var yAxis = {
		title : {
			text : 'Humidity',
			min : 0,
			max : 100,
		}
	};
	var legend = {
		enabled : false
	};
	var series = [ {
		type : 'line',
		name : 'humidity',
		data : humidityArray,
		pointInterval : 3 * 3600 * 1000
	// every 3 hours
	} ];

	var json = {};
	json.chart = chart;
	json.title = title;
	json.legend = legend;
	json.xAxis = xAxis;
	json.yAxis = yAxis;
	json.series = series;
	$('#humidity').highcharts(json);
}

function updateClock() {
	// update date string
	var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: tz };
	var date = new Intl.DateTimeFormat('en-us',options).format(timeStamp);
	document.getElementById("date").textContent = date;

		var timeStamp = new Date();
		var time = new Date().toLocaleTimeString("en-us", {
			hour : '2-digit',
			minute : '2-digit',
			hour12 : 'true',
			timeZone : tz
		});
		document.getElementById("time").textContent = time;
}

function updateCur() {
	url="current";
	fetch(url)
	.then((resp) => resp.json())
	.then(function(data){
		var sunrise = new Date(data.sunrise).toLocaleTimeString("en-us",{
			hour : '2-digit',
			minute : '2-digit',
			hour12 : 'true',
			timeZone : tz
		});
		var sunset = new Date(data.sunset).toLocaleTimeString("en-us",{
			hour : '2-digit',
			minute : '2-digit',
			hour12 : 'true',
			timeZone : tz
		});

		if (data.pressureTrend == 1 || data.pressureTrend == null) {
			presTrendIcon = '<i class="fas fa-circle"></i>';
		} else if (data.pressureTrend < 1) {
			presTrendIcon = '<i class="fas fa-chevron-down"></i>';
		} else {
			presTrendIcon = '<i class="fas fa-chevron-up"></i>';
		}
		document.getElementById("curIcon").innerHTML = data.curIcon;
		document.getElementById("curHum").innerHTML = 'Humidity : ' + parseInt(data.humidity) + ' %';
		document.getElementById("curTemp").innerHTML = data.tempF + ' &deg;F';
		document.getElementById("curDesc").innerHTML = data.curDesc;
		document.getElementById("curPres").innerHTML = 'pressure ' + data.pressure + ' mbar ' + presTrendIcon;
		document.getElementById("curWind").innerHTML = 'wind ' + data.windSpeed + ' mph from ' + data.windDir;
		updateBackground(data.tempF.toString());

		if (data.feelsLike != null) {
			document.getElementById("curFeels").innerHTML = 'Feels like ' + data.feelsLike + ' &deg;F';
		} else {
			document.getElementById("curFeels").innerHTML = null;
		}

	})
	.catch(function(error){
		alert(error);
	})
	updateAlerts();
}

// change background color based on temp
function updateBackground(temp) {
	if (temp < 30 ){
		document.body.style.backgroundColor = "#94b7cf";
		document.body.style.color = "#fce8dd";
	} else if (temp>=90) {
		document.body.style.backgroundColor = "#E91E24";
		document.body.style.color = "#ffffff";
	} else if (temp>=30 && temp<40){
		document.body.style.backgroundColor = "#00A4E8";
		document.body.style.color = "#ffe3df";
	} else if (temp>=40 && temp<50){
		document.body.style.backgroundColor = "#2D3389";
		document.body.style.color = "#ffe3cc";
	} else if(temp>=50 && temp<60){
		document.body.style.backgroundColor = "#128A43";
		document.body.style.color = "#8a1e12";
	} else if (temp>=60 && temp<70){
		document.body.style.backgroundColor = "#76BD43";
		document.body.style.color = "#002B49";
	}else if (temp>=70 && temp<80){
		document.body.style.backgroundColor = "#FBD905";
		document.body.style.color = '#002B49';
	} else if (temp>=80 && temp<90){
		document.body.style.backgroundColor = "#F58322";
		document.body.style.color = '#002B49';
	}
}

function reloadMain() {
	window.location = "/";
}

function updateForecast() {
	// setup a container for the entire forcast contents
	var content = document.createElement("div");

	url="forecast";
	fetch(url)
	.then((resp) => resp.json())
	.then(function(data){
		if (typeof data.list ==="undefined") {
			data.list = [];
		}
		// create a container for the forecast
		var forecastBlock = document.createElement("div");
		forecastBlock.setAttribute("class","forecastBlock");
		forecastBlock.setAttribute("id","block");
		
		var forecastImage = document.createElement("div");
		forecastImage.setAttribute("class","forecastImage");
		forecastImage.setAttribute("id","imgDiv");
		
		// populate the forecast icon with the image
		var image = document.createElement("img");
		image.setAttribute("src",data.list[0].icon);
		image.setAttribute("style","height:100%;");
				
		var forecastText = document.createElement("div");
		forecastText.setAttribute("class","forecastText");
		forecastText.setAttribute("id","forecast");
		
		// populate the forecast text
		forecastText.innerHTML=data.list[0].name + '<br />' + '<span id="curTemp" >' + data.list[0].temp + ' &deg;F</span><br />' + data.list[0].detailed;
		
		// put the image in the div
		forecastImage.appendChild(image);

		// put the image + text into the block
		forecastBlock.appendChild(forecastImage);
		forecastBlock.appendChild(forecastText);

		// put the block into the parent div
		content.appendChild(forecastBlock);
		
		// put populated block into the column
		document.getElementById("curForecast").innerHTML = "";
		document.getElementById("curForecast").appendChild(content);
	})
	.catch(function(error){
		alert(error);
	});

}

function updateAlerts(){
	var alertDiv = document.getElementById("alerts");
	alertDiv.textContent="";

	url="alerts";
	fetch(url)
	.then((resp) => resp.json())
	.then(function(data){
		for (var i=0;i < data.features.length;i++) {		
			// create a container for the forecast
			var alertBlock = document.createElement("div");
			alertBlock.setAttribute("class","alertBlock");
			alertBlock.setAttribute("id","alert"+i);

			// populate the forecast text
			alertBlock.innerHTML=data.features[i].headline;

			// put the block into the parent div
			alertDiv.appendChild(alertBlock);				
		};

	})
	.catch(function(error){
		alert(error);
	});
}
