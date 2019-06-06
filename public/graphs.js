updateValues();  // grab map coords from backend.
tempGraph();

function updateValues() {
	url="store";
	var xhr = new XMLHttpRequest();  // need a sync call to initialize Maps
	xhr.open("GET",url,false);
	xhr.send(null);
	var obj = JSON.parse(xhr.responseText);
	var timestampArray=obj.timestamp;
	var tempArray=obj.temp;
	var pressureArray=obj.pressure;
	var humidityArray=obj.humidity;
}

function tempGraph(){
	var chart = {
		zoomType : 'x'
	};
	var title = {
		text : 'Temperature over the last 24 hours'
	};

	var xAxis = {
		type : 'datetime',
		minRange : 14 * 24 * 3600000
	// fourteen days
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
		data : tempArray
	} ];

	var json = {};
	json.chart = chart;
	json.title = title;
	json.legend = legend;
	json.xAxis = xAxis;
	json.yAxis = yAxis;
	json.series = series;
	$('#container').highcharts(json);
}