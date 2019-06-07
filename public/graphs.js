var timestampArray = [];
var tempArray = [];
var pressureArray = [];
var humidityArray = [];

updateCoords();  // grab map coords from backend.
updateValues(); // grab stored values from backend.
tempGraph();
pressGraph();
humidityGraph();

function updateCoords() {
	url="coords";
	var xhr = new XMLHttpRequest();  // need a sync call to initialize Maps
	xhr.open("GET",url,false);
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
	var xhr = new XMLHttpRequest(); // need a sync call to initialize Maps
	xhr.open("GET", url, false);
	xhr.send(null);
	var obj = JSON.parse(xhr.responseText);

	obj.timestamp.forEach(function(element, i) {
		var date = new Date(element).toLocaleTimeString("en-us",{
			hour : '2-digit',
			minute : '2-digit',
			hour12 : 'true',
			timeZone : tz
		});
		tempArray[i] = [ date, obj.temp[i] ];
		pressureArray[i] = [ date, obj.pressure[i] ];
		humidityArray[i] = [ date, obj.humidity[i] ];
	});
}

function tempGraph() {
	Highcharts.setOptions({
	    time: {
	        timezone: tz
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
		}
	};
	var legend = {
		enabled : false
	};
	var series = [ {
		type : 'line',
		name : 'temp',
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
	    time: {
	        timezone: tz
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
		name : 'temp',
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
	    time: {
	        timezone: tz
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
			text : 'Humidity'
		}
	};
	var legend = {
		enabled : false
	};
	var series = [ {
		type : 'line',
		name : 'temp',
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