
var lat;
var lon;
var gMapKey;
var tz;
var tileIndex = 0;

updateCoords();  // grab map coords from backend.

if (aerisID != "") {
	radarURL = "https://maps.aerisapi.com/"+aerisID+"_"+aerisSecret+"/radar";
} else {
	//radarURL = "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913";
	radarURL = "http://realearth.ssec.wisc.edu/tiles/globalir-rr/";
}

//shift clock into day mode
url="http://127.0.0.1:8081/day";
var xhttp = new XMLHttpRequest();
xhttp.open("GET", url, true);
xhttp.onerror = function () {
	console.log("no response on 127.0.0.1:8081");
};
xhttp.send();

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

//restyle column width
var col2Div = document.getElementById("col_2");
var radarDiv = document.getElementById("rdrLocal");
var dateDiv = document.getElementById("date");
var timeDiv = document.getElementById("time");

col2Div.style.width = "79vw"; 
radarDiv.style.height = "75vh";
dateDiv.style.float = "left";
dateDiv.style.fontFamily = "orbitron";
dateDiv.style.padding = "5px 0px 0px 0px";
timeDiv.style.height = "10vh";
timeDiv.style.fontSize = "7vh";
timeDiv.style.lineHeight = "7vh";
timeDiv.style.overflow = "hidden";
timeDiv.style.float = "left";
timeDiv.style.padding = "5px 0px 0px 50px";


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
	
    var marker = new google.maps.Marker({
        position: {lat: lat, lng: lon},
        map: mapLocal,
        title: 'map center'
      });
    
    //pulling an array of times for animation
    url="http://realearth.ssec.wisc.edu/api/times?products=globalir-rr";
    
    var xhr = new XMLHttpRequest();  // need a sync call to initialize Maps
	xhr.open("GET",url,false);
	xhr.send(null);
	var obj = JSON.parse(xhr.responseText);
	var times = obj['globalir-rr'];
    var strTime;
    
	radarURLsuffix = ".png"; 
	
	strTime = times.pop();
	strTime = strTime.replace(".","/");
	strTime = "/" + strTime + "/";
	
	tileAeris = new google.maps.ImageMapType({
		getTileUrl: function(tile, zoom) {
			return radarURL + strTime + zoom + "/" + tile.x + "/" + tile.y + radarURLsuffix; 
		},
		tileSize: new google.maps.Size(256, 256),
		opacity:0.60,
		name : 'current',
		isPng: true
	});
	
	radarURL5suffix = ".png";
	strTime = times.pop();
	strTime = strTime.replace(".","/");
	strTime = "/" + strTime + "/";
	
	tileAeris5 = new google.maps.ImageMapType({
		getTileUrl: function(tile, zoom) {
			return radarURL + strTime + zoom + "/" + tile.x + "/"+ tile.y + radarURL5suffix; 
		},
		tileSize: new google.maps.Size(256, 256),
		opacity:0,
		name : '-5min',
		isPng: true
	});

	radarURL10suffix = ".png";
	
	strTime = times.pop();
	strTime = strTime.replace(".","/");
	strTime = "/" + strTime + "/";
		
	tileAeris10 = new google.maps.ImageMapType({
		getTileUrl: function(tile, zoom) {
			return radarURL + strTime + zoom + "/"+ tile.x + "/"+ tile.y + radarURL10suffix; 
		},
		tileSize: new google.maps.Size(256, 256),
		opacity:0,
		name : '-10min',
		isPng: true
	});
	
	radarURL15suffix = ".png";
	
	strTime = times.pop();
	strTime = strTime.replace(".","/");
	strTime = "/" + strTime + "/";
	
	tileAeris15 = new google.maps.ImageMapType({
		getTileUrl: function(tile, zoom) {
			return radarURL + strTime + zoom + "/"+ tile.x + "/"+ tile.y + radarURL15suffix; 
		},
		tileSize: new google.maps.Size(256, 256),
		opacity:0,
		name : '-15min',
		isPng: true
	});
	
	radarURL20suffix = ".png";
	
	strTime = times.pop();
	strTime = strTime.replace(".","/");
	strTime = "/" + strTime + "/";
	
	tileAeris20 = new google.maps.ImageMapType({
		getTileUrl: function(tile, zoom) {
			return radarURL + strTime + zoom + "/"+ tile.x + "/"+ tile.y + radarURL20suffix;
		},
		tileSize: new google.maps.Size(256, 256),
		opacity:0,
		name : '-20min',
		isPng: true
	});
	
	radarURL25suffix = ".png";
	
	strTime = times.pop();
	strTime = strTime.replace(".","/");
	strTime = "/" + strTime + "/";
	
	tileAeris25 = new google.maps.ImageMapType({
		getTileUrl: function(tile, zoom) {
			return radarURL + strTime + zoom + "/"+ tile.x + "/"+ tile.y + radarURL25suffix; 
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
			
		if (diffM >= 60) {

			radarURLsuffix = ".png";
			
			tileAeris = new google.maps.ImageMapType({
				getTileUrl: function(tile, zoom) {
					return radarURL + "/" + zoom + "/" + tile.x + "/" + tile.y + radarURLsuffix + "?"+ (new Date()).getTime();
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

updateClock();
updateCur();
updateForecast();

setInterval(updateClock, 1000); // tick the clock every second
setInterval(updateCur, 10000); // every ten seconds update current conditions
setInterval(updateForecast,4*60*60*1000) //update forcast block every 4 hours

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
		document.body.style.backgroundColor = data.bg;
		document.body.style.color = data.color;
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