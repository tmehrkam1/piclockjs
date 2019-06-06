updateValues();  // grab map coords from backend.
tempGraph();

var timestampArray=[];
var tempArray=[];
var pressureArray=[];
var humidityArray=[];

function updateValues() {
	url="store";
	var xhr = new XMLHttpRequest();  // need a sync call to initialize Maps
	xhr.open("GET",url,false);
	xhr.send(null);
	var obj = JSON.parse(xhr.responseText);
	timestampArray=obj.timestamp;
	tempArray=obj.temp;
	pressureArray=obj.pressure;
	humidityArray=obj.humidity;
}

function tempGraph(){
	//var tempDiv=document.getElementById("temp");
	
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
	$('#temp').highcharts(json);
}