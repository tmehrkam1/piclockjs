let map;

var lat;
var lon;
var gMapKey;
var clockType;
var nightMode;
var backgroundImg;
var imgFontColor;
var tz;

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
}

//used to load the script and variablize the mapkey
var addScript = document.createElement("script");
addScript.type = "text/javascript";
addScript.src = 'https://maps.googleapis.com/maps/api/js?key=' + gMapKey + '&callback=initMap&v=3.53';
//addScript.src = "https://polyfill.io/v3/polyfill.min.js?features=default"
addScript.async = true;
addScript.defer = true;
(document.getElementsByTagName("head")[0] || document.documentElement ).appendChild(addScript);
initMap();

async function initMap() {
	const { Map } = await google.maps.importLibrary("maps");

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
		mapTypeId: 'hybrid',
		key: gMapKey
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
		mapTypeId: 'hybrid',
		key: gMapKey
	});

	
    var marker = new google.maps.Marker({
        position: {lat: lat, lng: lon},
        map: mapLocal,
        title: 'map center'
      });

	tileAeris = new google.maps.ImageMapType({
		getTileUrl: function(tile, zoom) {
			return "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/" + zoom + "/" + tile.x + "/" + tile.y +".png?"+ (new Date()).getTime(); 
		},
		tileSize: new google.maps.Size(256, 256),
		opacity:0.60,
		name : 'current',
		isPng: true
	});

	tileAeris5 = new google.maps.ImageMapType({
		getTileUrl: function(tile, zoom) {
			return "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913-m05m/" + zoom + "/" + tile.x + "/" + tile.y +".png?"+ (new Date()).getTime();  
		},
		tileSize: new google.maps.Size(256, 256),
		opacity:0,
		name : '-5min',
		isPng: true
	});

	tileAeris10 = new google.maps.ImageMapType({
		getTileUrl: function(tile, zoom) {
			return "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913-m10m/" + zoom + "/" + tile.x + "/" + tile.y +".png?"+ (new Date()).getTime();  
		},
		tileSize: new google.maps.Size(256, 256),
		opacity:0,
		name : '-10min',
		isPng: true
	});

	tileAeris15 = new google.maps.ImageMapType({
		getTileUrl: function(tile, zoom) {
			return "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913-m15m/" + zoom + "/" + tile.x + "/" + tile.y +".png?"+ (new Date()).getTime(); 
		},
		tileSize: new google.maps.Size(256, 256),
		opacity:0,
		name : '-15min',
		isPng: true
	});

	tileAeris20 = new google.maps.ImageMapType({
		getTileUrl: function(tile, zoom) {
			return "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913-m20m/" + zoom + "/" + tile.x + "/" + tile.y +".png?"+ (new Date()).getTime();  
		},
		tileSize: new google.maps.Size(256, 256),
		opacity:0,
		name : '-20min',
		isPng: true
	});

	tilePrecip = new google.maps.ImageMapType({
		getTileUrl: function(tile, zoom) {
			return "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/q2-n1p-900913/" + zoom + "/" + tile.x + "/" + tile.y +".png?"+ (new Date()).getTime(); 
		},
		tileSize: new google.maps.Size(256, 256),
		opacity:0,
		name : '-25min',
		isPng: true
	});

	var radarFrame = 0;
	var timeStamp = new Date();
	var tileIndex =0;

	console.log("loading radar");
	map.overlayMapTypes.setAt("0",tileAeris20);
	map.overlayMapTypes.setAt("1",tileAeris15);
	map.overlayMapTypes.setAt("2",tileAeris10);
	map.overlayMapTypes.setAt("3",tileAeris5);
	map.overlayMapTypes.setAt("4",tileAeris);

	mapLocal.overlayMapTypes.setAt("0",tileAeris20);
	mapLocal.overlayMapTypes.setAt("1",tileAeris15);
	mapLocal.overlayMapTypes.setAt("2",tileAeris10);
	mapLocal.overlayMapTypes.setAt("3",tileAeris5);
	mapLocal.overlayMapTypes.setAt("4",tileAeris);
	mapLocal.overlayMapTypes.setAt("5",tilePrecip);

	// setInterval(updateRadar(), 10000); // update radar loop every 5 minutes

	timerId = window.setInterval(function () {
		var now = new Date();
		var diffMs = now - timeStamp;
		var diffM = Math.round(((diffMs % 86400000) % 3600000) / 60000);

		if (diffM >= 5) {

			tileAeris = new google.maps.ImageMapType({
				getTileUrl: function(tile, zoom) {
					return "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/" + zoom + "/" + tile.x + "/" + tile.y +".png?"+ (new Date()).getTime(); 
				},
				tileSize: new google.maps.Size(256, 256),
				opacity:0.60,
				name : 'current',
				isPng: true
			});

			tilePrecip = new google.maps.ImageMapType({
				getTileUrl: function(tile, zoom) {
					return "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/q2-n1p-900913/" + zoom + "/" + tile.x + "/" + tile.y +".png?"+ (new Date()).getTime(); 
				},
				tileSize: new google.maps.Size(256, 256),
				opacity:0,
				name : '-25min',
				isPng: true
			});

			console.log("update tile # " + tileIndex);
			map.overlayMapTypes.setAt(tileIndex,null);
			map.overlayMapTypes.setAt(tileIndex,tileAeris);

			mapLocal.overlayMapTypes.setAt(tileIndex,null);
			mapLocal.overlayMapTypes.setAt(tileIndex,tileAeris);

			mapLocal.overlayMapTypes.setAt(5,null);
			mapLocal.overlayMapTypes.setAt(5,tilePrecip);

			tileIndex++;
			timeStamp = now;
			console.log("tileIndex : " + tileIndex);
			if (tileIndex >= 5) {
				tileIndex=0;
			}

		}
		for (i = 0;i < 5;i++) {
			if (i == radarFrame) {
				map.overlayMapTypes.getAt(i).setOpacity(.6);
			} else {
				map.overlayMapTypes.getAt(i).setOpacity(0);
			}
		}
		// console.log("Animation frame : " + radarFrame);

		radarFrame++;
		google.maps.event.trigger(map, 'resize');
		if (radarFrame >= 4) {
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
updateForecast();
updateAlerts();

if (clockType=="digital") { setInterval(updateClock, 1000)}; // tick the
//clock every
//second
setInterval(updateCur, 10000); // every ten seconds update current conditions
//from cache
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
		//document.getElementById("analogClock").hidden = true;
		//var timearr	 = time.split(" ");
		//document.getElementById("time").textContent = timearr[0];
		document.getElementById("time").textContent = parseInt(time.getHours) + ":" + parseInt(time.getMinutes);
	} else {
	setInterval(() => {
	d = new Date(); //object of date()
	hr = d.getHours();
	min = d.getMinutes();
	sec = d.getSeconds();
	hr_rotation = 30 * hr + min / 2; //converting current time
	min_rotation = 6 * min;
	sec_rotation = 6 * sec;

	hour.style.transform = `rotate(${hr_rotation}deg)`;
	minute.style.transform = `rotate(${min_rotation}deg)`;
	second.style.transform = `rotate(${sec_rotation}deg)`;
}, 1000);


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
		
		var ss = new Date(data.sunset);
		var sr = new Date(data.sunrise);
		
		var daylight = ((ss.getTime() - sr.getTime()) / 1000 / 60 /60);
		var dlhrs = parseInt(daylight);
		var dlmin = Math.round((daylight - dlhrs) * 60);
		
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
		document.getElementById("sun_moon").innerHTML = 'Sunrise : ' + sunrise + '  Sunset : ' + sunset + '   Moon Phase : ' + data.moonPhase +"<p> Daylight: " + dlhrs + " hours " + dlmin + " minutes";
		
		document.body.style.backgroundColor = data.bg;
		document.body.style.color = data.color;

		if (data.feelsLike != null) {
			document.getElementById("curFeels").innerHTML = 'Feels like ' + data.feelsLike + ' &deg;F';
		} else {
			document.getElementById("curFeels").innerHTML = null;
		}

	})
	.catch(function(error){
		console.log(error);
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
			setTimeout(function(){
				updateForecast();
			}, 5000);
		return;
		}

		for (var i=0;i < 9 ;i++) {		
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
			
			if(data.list[i]){
				// populate the forecast icon with the image
				var image = document.createElement("img");
				image.setAttribute("src",data.list[i].icon);
				image.setAttribute("style","height:100%;");

				// populate the forecast text
				forecastText.innerHTML=data.list[i].name + '<br /><span class="forecastTemp">' + data.list[i].temp + '&deg;F</span><br />' + data.list[i].short;
			
				// put the image in the div
				forecastImage.appendChild(image);

				// put the image + text into the block
				forecastBlock.appendChild(forecastImage);
				forecastBlock.appendChild(forecastText);
			}
			
			// put the block into the parent div
			content.appendChild(forecastBlock);

		};
		// put populated block into the column
		document.getElementById("col_3").innerHTML = "";
		document.getElementById("col_3").appendChild(content);
	})
	.catch(function(error){
		console.log(error);
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
		console.log(error);
	});
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

		url="http://127.0.0.1:8081/day";
		var xhttp = new XMLHttpRequest();
		xhttp.open("GET", url, true);
		xhttp.onerror = function () {
			console.log("no response on 127.0.0.1:8081");
		};
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

		url="http://127.0.0.1:8081/night";
		var xhttp = new XMLHttpRequest();
		xhttp.open("GET", url, true);
		xhttp.onerror = function () {
			console.log("no response on 127.0.0.1:8081");
		};
		xhttp.send();
	}

}

function radarPage(e) {
	if (!e)
	      e = window.event;

	    //IE9 & Other Browsers
	    if (e.stopPropagation) {
	      e.stopPropagation();
	    }
	    //IE8 and Lower
	    else {
	      e.cancelBubble = true;
	    }
	    window.location = "/radar.html"
}

function moonPage(e) {
	if (!e)
	      e = window.event;

	    //IE9 & Other Browsers
	    if (e.stopPropagation) {
	      e.stopPropagation();
	    }
	    //IE8 and Lower
	    else {
	      e.cancelBubble = true;
	    }
	    window.location = "/moon.html"
}

function graphPage(e) {
	if (!e)
	      e = window.event;

	    //IE9 & Other Browsers
	    if (e.stopPropagation) {
	      e.stopPropagation();
	    }
	    //IE8 and Lower
	    else {
	      e.cancelBubble = true;
	    }
	    window.location = "/graphs.html"
}

function forecastPage(e) {
	if (!e)
	      e = window.event;

	    //IE9 & Other Browsers
	    if (e.stopPropagation) {
	      e.stopPropagation();
	    }
	    //IE8 and Lower
	    else {
	      e.cancelBubble = true;
	    }
	    window.location = "/forecast.html"
}

function alertPage(e) {
	if (!e)
	      e = window.event;

	    //IE9 & Other Browsers
	    if (e.stopPropagation) {
	      e.stopPropagation();
	    }
	    //IE8 and Lower
	    else {
	      e.cancelBubble = true;
	    }
	    window.location = "/alerts.html"
}


