var lat;
var lon;
var gMapKey;
var tz;
var moonTime = '';

updateCoords();  // grab map coords from backend.

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

//restyle column width
var col2Div = document.getElementById("col_2");
var dateDiv = document.getElementById("date");
var timeDiv = document.getElementById("time");
var moonDiv = document.getElementById("moon");

//var moonImg = document.getElementById("moonimg");
var moonImg = document.createElement("img");
moonDiv.appendChild(moonImg);

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
setInterval(updateForecast,4*60*60*1000) //update forcast block every 4 hours
// from cache

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

		/*
		//update moon image every 4 hours
		var diffMs = timeStamp - moonTime;
		var diffM = Math.round(((diffMs % 86400000) % 3600000) / 60000 );
		var diffH = parseInt(diffM / 60);
		
		if (diffH == 4 || moonTime == '') {
			moonTime = new Date();
			moonImg.src = "https://api.usno.navy.mil/imagery/moon.png?&ID=AA-URL";
			moonImg.style.height = "90vh";
			moonImg.style.width = "79vw";
			moonImg.style.objectFit = "contain";
		}
		*/
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
