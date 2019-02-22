
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

	map = new google.maps.Map(document.getElementById('rdrRegional'), {
		center: {lat: lat, lng: lon},
		zoom: 7,
		zoomControl: false,
		mapTypeControl: false,
		scaleControl: false,
		streetViewControl: false,
		rotateControl: false,
		fullscreenControl: false,
		gestureHandling: 'none',
		mapTypeId: 'hybrid'
	});
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
	var timerId;
	
	console.log("loading radar");
	map.overlayMapTypes.setAt("0",tileAeris25);
	map.overlayMapTypes.setAt("1",tileAeris20);
	map.overlayMapTypes.setAt("2",tileAeris15);
	map.overlayMapTypes.setAt("3",tileAeris10);
	map.overlayMapTypes.setAt("4",tileAeris5);
	map.overlayMapTypes.setAt("5",tileAeris);

	mapLocal.overlayMapTypes.setAt("0",tileAeris25);
	mapLocal.overlayMapTypes.setAt("1",tileAeris20);
	mapLocal.overlayMapTypes.setAt("2",tileAeris15);
	mapLocal.overlayMapTypes.setAt("3",tileAeris10);
	mapLocal.overlayMapTypes.setAt("4",tileAeris5);
	mapLocal.overlayMapTypes.setAt("5",tileAeris);
	
	console.log("start animation");
	animateRadar();
	
	setInterval(updateRadar(), 300000);  // update radar loop every 5 minutes


	function animateRadar() {
		timerId = window.setInterval(function () {
			for (i = 0;i < 6;i++) {
				if (i == radarFrame) {
					map.overlayMapTypes.getAt(i).setOpacity(.6);
				} else {
					map.overlayMapTypes.getAt(i).setOpacity(0);
				}
			}
			// console.log("Animation frame : " + radarFrame);
			
			radarFrame++;

			if (radarFrame >= 6) {
				radarFrame = 0;
			} 
		}, 1000);
	}


	function updateRadar(){
		
		console.log("update tile # " + tileIndex);
		map.overlayMapTypes.setAt(tileIndex,null);
		map.overlayMapTypes.setAt(tileIndex,tileAeris);
	
		mapLocal.overlayMapTypes.setAt(tileIndex,null);
		mapLocal.overlayMapTypes.setAt(tileIndex,tileAeris);
	
		tileIndex++;
		if (tileIndex > 5) {
			tileIndex=0;
		}
	}
}


if (backgroundImg !="") {
	mainDiv = document.getElementById("main");
	mainDiv.style.backgroundImage = "url("+backgroundImg+")";
	mainDiv.style.backgroundSize ="cover";
	mainDiv.style.color = imgFontColor;
}

updateClock();
updateCur();
updateForecast();
updateAlerts();

if (clockType=="digital") { setInterval(updateClock, 1000)}; // tick the
// clock every
// second
setInterval(updateCur, 10000); // every ten seconds update current conditions
// from cache
setInterval(updateForecast, 600000) // update the forecast every 10 min
setInterval(updateAlerts,60000);  // update alerts every minute

function updateClock() {
	// update date string
	var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: tz };
	var date = new Intl.DateTimeFormat('en-us',options).format(timeStamp);
	document.getElementById("date").textContent = date;

	// depending on analog vs digital, update clock
	if (clockType=="digital") {
		var timeStamp = new Date();
		var time = new Date().toLocaleTimeString("en-us", {
			hour : '2-digit',
			minute : '2-digit',
			hour12 : 'true',
			timeZone : tz
		});
		document.getElementById("time").textContent = time;
	} else {
		// insert analog script here. Thinking I might move that off of
		// index.html for sanity
		var clock = document.createElement('iframe');
		clock.src = "clock.html";
		clock.setAttribute("id","analogClock");
		clock.setAttribute("scrolling","no");
		document.getElementById("time").appendChild(clock);
	}



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
		for (var i=0;i < data.list.length;i++) {		
			// create a container for the forecast
			var forecastBlock = document.createElement("div");
			forecastBlock.setAttribute("class","forecastBlock");
			forecastBlock.setAttribute("id","block"+i);

			// create the image container
			var forecastImage = document.createElement("div");
			forecastImage.setAttribute("class","forecastImage");
			forecastImage.setAttribute("id","imgDiv"+i);
			if (nightMode == true) {
				forecastImage.style.opacity = '.5';
			}

			// create the text container
			var forecastText = document.createElement("div");
			forecastText.setAttribute("class","forecastText");
			forecastText.setAttribute("id","forecast"+i);

			// populate the forecast icon with the image
			var image = document.createElement("img");
			image.setAttribute("src",data.list[i].icon);
			image.setAttribute("style","height:100%;");

			// populate the forecast text
			forecastText.innerHTML=data.list[i].name + '<br />' + data.list[i].temp + '<br />' + data.list[i].short;

			// put the image in the div
			forecastImage.appendChild(image);

			// put the image + text into the block
			forecastBlock.appendChild(forecastImage);
			forecastBlock.appendChild(forecastText);

			// put the block into the parent div
			content.appendChild(forecastBlock);

		};
		// put populated block into the column
		document.getElementById("col_3").innerHTML = "";
		document.getElementById("col_3").appendChild(content);
	})
	.catch(function(error){
		alert(error);
	});

};

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
