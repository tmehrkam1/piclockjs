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
	tempArray=obj.temp;
	pressureArray=obj.pressure;
	humidityArray=obj.humidity;
	
	timestampArray.forEach(function(element, i) {
		  timeArray.push(element * 1000);
		});
}

function tempGraph(){
	//var tempDiv=document.getElementById("temp");
	
	var chart = {
		zoomType : 'x'
	};
	var title = {
		text : 'Temperature over the last 48 hours'
	};

	var xAxis = {
		type : 'datetime',
		dateTimeLabelFormats: {
            day: '%e %b - %H'
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
		data : [timeArray,tempArray],
		pointInterval: 3 * 3600 * 1000 // every 3 hours
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