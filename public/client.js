
var lat;
var lon;
var gMapKey;
var clockType;
var nightMode;
var backgroundImg;
var imgFontColor;

updateCoords();  //grab map coords from backend.

function updateCoords() {
	url="coords";
	var xhr = new XMLHttpRequest();  //need a sync call to initialize Maps
	xhr.open("GET",url,false);
	xhr.send(null);
	var obj = JSON.parse(xhr.responseText);
	lat = obj.lat;
	lon = obj.lon;
	gMapKey = obj.gMapKey;
	clockType = obj.clock;
	backgroundImg = obj.backgroundImg;
	imgFontColor = obj.imgFontColor;
}

//used to load the script and variablize the mapkey
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

	tileNEX = new google.maps.ImageMapType({
		getTileUrl: function(tile, zoom) {
			return "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/" + zoom + "/" + tile.x + "/" + tile.y +".png?"+ (new Date()).getTime(); 
		},
		tileSize: new google.maps.Size(256, 256),
		opacity:0.60,
		name : 'NEXRAD',
		isPng: true
	});

	tileNEX5 = new google.maps.ImageMapType({
		getTileUrl: function(tile, zoom) {
			return "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913-m05m/" + zoom + "/" + tile.x + "/" + tile.y +".png?"+ (new Date()).getTime(); 
		},
		tileSize: new google.maps.Size(256, 256),
		opacity:0.60,
		name : 'NEXRAD',
		isPng: true
	});

	tileNEX10 = new google.maps.ImageMapType({
		getTileUrl: function(tile, zoom) {
			return "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913-m10m/" + zoom + "/" + tile.x + "/" + tile.y +".png?"+ (new Date()).getTime(); 
		},
		tileSize: new google.maps.Size(256, 256),
		opacity:0.60,
		name : 'NEXRAD',
		isPng: true
	});

	tileNEX15 = new google.maps.ImageMapType({
		getTileUrl: function(tile, zoom) {
			return "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913-m15m/" + zoom + "/" + tile.x + "/" + tile.y +".png?"+ (new Date()).getTime(); 
		},
		tileSize: new google.maps.Size(256, 256),
		opacity:0.60,
		name : 'NEXRAD',
		isPng: true
	});

	tileNEX20 = new google.maps.ImageMapType({
		getTileUrl: function(tile, zoom) {
			return "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913-m20m/" + zoom + "/" + tile.x + "/" + tile.y +".png?"+ (new Date()).getTime(); 
		},
		tileSize: new google.maps.Size(256, 256),
		opacity:0.60,
		name : 'NEXRAD',
		isPng: true
	});

	goes = new google.maps.ImageMapType({
		getTileUrl: function(tile, zoom) {
			return "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/q2-n1p-900913/" + zoom + "/" + tile.x + "/" + tile.y +".png?"+ (new Date()).getTime(); 
		},
		tileSize: new google.maps.Size(256, 256),
		opacity:0.60,
		name : 'GOES East Vis',
		isPng: true
	});

	var radarFrame = 0;
	var timerId;
	updateRadar();
	setInterval(updateRadar, 300000);  //update radar loop every 5 minutes
	

	function animateRadar() {
		timerId = window.setInterval(function () {
			console.log("update radar frame " + radarFrame);
			for (i = 0;i < map.overlayMapTypes.getLength() - 1;i++) {
				if (i == radarFrame) {
					console.log("show " + i);
					map.overlayMapTypes.getAt(i).setOpacity(.6);
				} else {
					console.log("hide " + i);
					map.overlayMapTypes.getAt(i).setOpacity(0);
				}
			}
			if (radarFrame >= map.overlayMapTypes.getLength()) {
				console.log("reset radar frame")
				radarFrame = 0;
			} else {
				console.log("increment radar frame");
				radarFrame++;
			}
		}, 400);
	}
	
	function updateRadar(){
		clearInterval(timerId);
		
		map.overlayMapTypes.push(null); // create empty overlay entry
		map.overlayMapTypes.setAt("4",tileNEX);
		map.overlayMapTypes.push(null); // create empty overlay entry
		map.overlayMapTypes.setAt("3",tileNEX5);
		map.overlayMapTypes.push(null); // create empty overlay entry
		map.overlayMapTypes.setAt("2",tileNEX10);
		map.overlayMapTypes.push(null); // create empty overlay entry
		map.overlayMapTypes.setAt("1",tileNEX15);
		map.overlayMapTypes.push(null); // create empty overlay entry
		map.overlayMapTypes.setAt("0",tileNEX20);
		
		mapLocal.overlayMapTypes.push(null); // create empty overlay entry
		mapLocal.overlayMapTypes.setAt("0",goes);
		mapLocal.overlayMapTypes.push(null); // create empty overlay entry
		mapLocal.overlayMapTypes.setAt("1",tileNEX);
		animateRadar();
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

if (clockType=="digital") { setInterval(updateClock, 1000)}; // tick the clock every second
setInterval(updateCur, 10000); // every ten seconds update current conditions from cache
setInterval(updateForecast, 600000) //update the forecast every 10 min
setInterval(updateAlerts,60000);  //update alerts every minute

function updateClock() {
	//update date string
	var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
	var date = new Intl.DateTimeFormat('en-us',options).format(timeStamp);
	document.getElementById("date").textContent = date;

	//depending on analog vs digital, update clock
	if (clockType=="digital") {
		var timeStamp = new Date();
		var time = new Date().toLocaleTimeString("en-us", {
			hour : '2-digit',
			minute : '2-digit',
			hour12 : 'true'
		});
		document.getElementById("time").textContent = time;
	} else {
		//insert analog script here.  Thinking I might move that off of index.html for sanity
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
			hour12 : 'true'
		});
		var sunset = new Date(data.sunset).toLocaleTimeString("en-us",{
			hour : '2-digit',
			minute : '2-digit',
			hour12 : 'true'
		});
		document.getElementById("curIcon").src = data.curIcon;
		document.getElementById("curHum").innerHTML = 'Humidity : ' + data.humidity + ' %';
		document.getElementById("curTemp").innerHTML = data.tempF + ' &deg;F';
		document.getElementById("curDesc").innerHTML = data.curDesc;
		document.getElementById("curPres").innerHTML = 'pressure ' + data.pressure + ' mbar';
		document.getElementById("curWind").innerHTML = 'wind ' + data.windSpeed + ' mph from ' + data.windDir;
		document.getElementById("sun_moon").innerHTML = 'Sunrise : ' + sunrise + '  Sunset : ' + sunset + '   Moon Phase : ' + data.moonPhase;
		updateBackground(data.tempF.toString());


	})
	.catch(function(error){
		alert(error);
	})
}

function updateForecast() {
	//setup a container for the entire forcast contents
	var content = document.createElement("div");

	url="forecast";
	fetch(url)
	.then((resp) => resp.json())
	.then(function(data){
		for (var i=0;i < data.list.length;i++) {		
			//create a container for the forecast
			var forecastBlock = document.createElement("div");
			forecastBlock.setAttribute("class","forecastBlock");
			forecastBlock.setAttribute("id","block"+i);

			//create the image container
			var forecastImage = document.createElement("div");
			forecastImage.setAttribute("class","forecastImage");
			forecastImage.setAttribute("id","imgDiv"+i);
			if (nightMode == true) {
				forecastImage.style.opacity = '.5';
			}

			//create the text container
			var forecastText = document.createElement("div");
			forecastText.setAttribute("class","forecastText");
			forecastText.setAttribute("id","forecast"+i);

			//populate the forecast icon with the image
			var image = document.createElement("img");
			image.setAttribute("src",data.list[i].icon);
			image.setAttribute("style","height:100%;");

			//populate the forecast text
			forecastText.innerHTML=data.list[i].name + '<br />' + data.list[i].temp + '<br />' + data.list[i].short;

			//put the image in the div
			forecastImage.appendChild(image);

			//put the image + text into the block
			forecastBlock.appendChild(forecastImage);
			forecastBlock.appendChild(forecastText);

			//put the block into the parent div
			content.appendChild(forecastBlock);

		};
		//put populated block into the column	
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
			//create a container for the forecast
			var alertBlock = document.createElement("div");
			alertBlock.setAttribute("class","alertBlock");
			alertBlock.setAttribute("id","alert"+i);

			//populate the forecast text
			alertBlock.innerHTML=data.features[i].headline;

			//put the block into the parent div
			alertDiv.appendChild(alertBlock);				
		};

	})
	.catch(function(error){
		alert(error);
	});
}
//change background color based on temp
function updateBackground(temp) {
	if (temp < 30 ){
		document.body.style.backgroundColor = "#00A4E8";
		document.body.style.color = "#FF5B17";
	} else if (temp>=90) {
		document.body.style.backgroundColor = "#E91E24";
		document.body.style.color = "#ffffff";
	} else if (temp>=30 && temp<40){
		document.body.style.backgroundColor = "#00A4E8";
		document.body.style.color = "#FF5B17";
	} else if (temp>=40 && temp<50){
		document.body.style.backgroundColor = "#2D3389";
		document.body.style.color = "#D2CC76";
	} else if(temp>=50 && temp<60){
		document.body.style.backgroundColor = "#128A43";
		document.body.style.color = "#ED75BC";
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

		var y = mainDiv.getElementsByClassName("forecastImage");

		for (var i = 0; i < y.length; i++) {
			y[i].style.opacity = "1";
		} 

	} else {
		nightMode = true;

		mainDiv.style.backgroundColor = 'black';
		mainDiv.style.backgroundImage ='';
		mainDiv.style.color = 'darkgray';

		radarDiv.style.opacity ='.5';
		iconDiv.style.opacity = '.5';

		var y = mainDiv.getElementsByClassName("forecastImage");

		for (var i = 0; i < y.length; i++) {
			y[i].style.opacity = ".5";
		} 
	}

}