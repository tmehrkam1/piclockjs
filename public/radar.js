
var lat;
var lon;
var gMapKey;
var clockType;
var nightMode;
var backgroundImg;
var imgFontColor;
var tz;
var tileIndex = 0;

updateCoords();  // grab map coords from backend.

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
	aerisID = obj.aerisID;
	aerisSecret = obj.aerisSecret;
}

// used to load the script and variablize the mapkey
var addScript = document.createElement("script");
addScript.type = "text/javascript";
addScript.src = "https://maps.googleapis.com/maps/api/js?key=" + gMapKey + "&callback=initMap";
addScript.async = true;
addScript.defer = true;
(document.getElementsByTagName("head")[0] || document.documentElement ).appendChild(addScript);


function initMap() {
	mapLocal = new google.maps.Map(document.getElementById('rdrLocal'), {
		center: {lat: lat, lng: lon},
		zoom: 11,
		zoomControl: false,
		mapTypeControl: false,
		scaleControl: false,
		streetViewControl: false,
		rotateControl: false,
		fullscreenControl: false,
		gestureHandling: 'none',
		mapTypeId: 'hybrid'
	});

	tileAeris = new google.maps.ImageMapType({
		getTileUrl: function(tile, zoom) {
			return "https://maps.aerisapi.com/"+aerisID+"_"+aerisSecret+"/radar/"+zoom+"/"+tile.x+"/"+tile.y+"/current.png?bogus="+Date(); 
		},
		tileSize: new google.maps.Size(256, 256),
		opacity:0.60,
		name : 'current',
		isPng: true
	});
	
	tileAeris5 = new google.maps.ImageMapType({
		getTileUrl: function(tile, zoom) {
			return "https://maps.aerisapi.com/"+aerisID+"_"+aerisSecret+"/radar/"+zoom+"/"+tile.x+"/"+tile.y+"/-5min.png"; 
		},
		tileSize: new google.maps.Size(256, 256),
		opacity:0,
		name : '-5min',
		isPng: true
	});

	tileAeris10 = new google.maps.ImageMapType({
		getTileUrl: function(tile, zoom) {
			return "https://maps.aerisapi.com/"+aerisID+"_"+aerisSecret+"/radar/"+zoom+"/"+tile.x+"/"+tile.y+"/-10min.png"; 
		},
		tileSize: new google.maps.Size(256, 256),
		opacity:0,
		name : '-10min',
		isPng: true
	});
	
	tileAeris15 = new google.maps.ImageMapType({
		getTileUrl: function(tile, zoom) {
			return "https://maps.aerisapi.com/"+aerisID+"_"+aerisSecret+"/radar/"+zoom+"/"+tile.x+"/"+tile.y+"/-15min.png"; 
		},
		tileSize: new google.maps.Size(256, 256),
		opacity:0,
		name : '-15min',
		isPng: true
	});
	
	tileAeris20 = new google.maps.ImageMapType({
		getTileUrl: function(tile, zoom) {
			return "https://maps.aerisapi.com/"+aerisID+"_"+aerisSecret+"/radar/"+zoom+"/"+tile.x+"/"+tile.y+"/-20min.png"; 
		},
		tileSize: new google.maps.Size(256, 256),
		opacity:0,
		name : '-20min',
		isPng: true
	});
	
	tileAeris25 = new google.maps.ImageMapType({
		getTileUrl: function(tile, zoom) {
			return "https://maps.aerisapi.com/"+aerisID+"_"+aerisSecret+"/radar/"+zoom+"/"+tile.x+"/"+tile.y+"/-25min.png"; 
		},
		tileSize: new google.maps.Size(256, 256),
		opacity:0,
		name : '-25min',
		isPng: true
	});
	
	var radarFrame = 0;
	var timeStamp = new Date();
	
	console.log("loading radar");

	mapLocal.overlayMapTypes.setAt("0",tileAeris25);
	mapLocal.overlayMapTypes.setAt("1",tileAeris20);
	mapLocal.overlayMapTypes.setAt("2",tileAeris15);
	mapLocal.overlayMapTypes.setAt("3",tileAeris10);
	mapLocal.overlayMapTypes.setAt("4",tileAeris5);
	mapLocal.overlayMapTypes.setAt("5",tileAeris);
	
	// setInterval(updateRadar(), 10000); // update radar loop every 5 minutes
	
	timerId = window.setInterval(function () {
		var now = new Date();
		var diffMs = now - timeStamp;
		var diffM = Math.round(((diffMs % 86400000) % 3600000) / 60000);
		
		if (diffM >= 5) {
			tileAeris = new google.maps.ImageMapType({
				getTileUrl: function(tile, zoom) {
					return "https://maps.aerisapi.com/"+aerisID+"_"+aerisSecret+"/radar/"+zoom+"/"+tile.x+"/"+tile.y+"/current.png?bogus="+Date(); 
				},
				tileSize: new google.maps.Size(256, 256),
				opacity:0.60,
				name : 'current' + now,
				isPng: true
			});
			
			console.log("update tile # " + tileIndex);
		
			mapLocal.overlayMapTypes.setAt(tileIndex,null);
			mapLocal.overlayMapTypes.setAt(tileIndex,tileAeris);
		
			tileIndex++;
			timeStamp = now;
			console.log("tileIndex : " + tileIndex);
			if (tileIndex >= 6) {
				tileIndex=0;
			}
			
		}
		for (i = 0;i < 6;i++) {
			if (i == radarFrame) {
				mapLocal.overlayMapTypes.getAt(i).setOpacity(.6);
			} else {
				mapLocal.overlayMapTypes.getAt(i).setOpacity(0);
			}
		}
		// console.log("Animation frame : " + radarFrame);
		
		radarFrame++;

		if (radarFrame >= 6) {
			radarFrame = 0;
		} 
	}, 1000);
}


if (backgroundImg !="") {
	mainDiv = document.getElementById("main");
	mainDiv.style.backgroundImage = "url("+backgroundImg+")";
	mainDiv.style.backgroundSize ="cover";
	mainDiv.style.color = imgFontColor;
}

updateClock();
updateCur();

if (clockType=="digital") { setInterval(updateClock, 1000)}; // tick the
// clock every
// second
setInterval(updateCur, 10000); // every ten seconds update current conditions
// from cache

function updateClock() {
	// update date string
	var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: tz };
	var date = new Intl.DateTimeFormat('en-us',options).format(timeStamp);
	document.getElementById("date").textContent = date;

	// depending on analog vs digital, update clock
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
		document.getElementById("sun_moon").innerHTML = 'Sunrise : ' + sunrise + '  Sunset : ' + sunset + '   Moon Phase : ' + data.moonPhase;
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

function toggleNight(){
	var mainDiv = document.getElementById("main");
	var radarDiv = document.getElementById("rdrStack");
	var iconDiv = document.getElementById("curIcon");
	var col3Div = document.getElementById("col_3");
	var col2Div = document.getElementById("col_2");
	var timeDiv = document.getElementById("time");

	if (nightMode == true) {
		nightMode = false;

		mainDiv.style.backgroundColor = '';
		if (backgroundImg == "") {
			mainDiv.style.color = '';
		} else {
			mainDiv.style.backgroundImage = "url("+backgroundImg+")";
			mainDiv.style.backgroundSize ="cover";
			mainDiv.style.color = imgFontColor;
		}


		radarDiv.style.opacity = '1';
		iconDiv.style.opacity = '1';
		col3Div.style.visibility = "";
		col2Div.style.width = "48vw";
		timeDiv.style.fontSize  = "15vh";

		url="day";
		var xhttp = new XMLHttpRequest();
		xhttp.open("GET", url, true);
		xhttp.send();


	} else {
		nightMode = true;

		mainDiv.style.backgroundColor = 'black';
		mainDiv.style.backgroundImage ='';
		mainDiv.style.color = 'darkgray';

		radarDiv.style.opacity ='.5';
		iconDiv.style.opacity = '.5';
		col3Div.style.visibility = "hidden";
		col2Div.style.width = "79vw";
		timeDiv.style.fontSize  = "27vh";

		url="night";
		var xhttp = new XMLHttpRequest();
		xhttp.open("GET", url, true);
		xhttp.send();
	}

}
