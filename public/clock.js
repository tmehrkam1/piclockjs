var imgFontColor;
var tz;
updateCoords();  // grab map coords from backend.

/*
 * Starts any clocks using the user's local time
 * From: cssanimation.rocks/clocks
 */
 initLocalClocks();
 
 var imgFontColor;
 var tz;
 updateCoords();  // grab map coords from backend.
 
 var hrDiv = document.getElementsByClassName('hours')[0];
 var minDiv = document.getElementsByClassName('minutes')[0];
 var secDiv = document.getElementsByClassName('seconds')[0];
 var clockDiv = document.getElementsByClassName('clock')[0];
  
 hrDiv.style.backgroundColor = imgFontColor;
 minDiv.style.backgroundColor = imgFontColor;
 secDiv.style.backgroundColor = imgFontColor;
 clockDiv.style.color = imgFontColor;
 
 function updateCoords() {
 	url="coords";
 	var xhr = new XMLHttpRequest();  // need a sync call to initialize Maps
 	xhr.open("GET",url,false);
 	xhr.send(null);
 	var obj = JSON.parse(xhr.responseText);
  	if (obj.imgFontColor){
  		imgFontColor = obj.imgFontColor;
  	} else {
  		url="current";
 		var xhr = new XMLHttpRequest();  // need a sync call to initialize Maps
 		xhr.open("GET",url,false);
 		xhr.send(null);
 		var obj = JSON.parse(xhr.responseText);
 		updateColor(obj.tempF);
  	}
 	tz = obj.tz;
 }
 
function initLocalClocks() {	
  var now = new Date().toLocaleString("en-US", {timeZone: tz});
  console.log(now);
  var date = new Date(now);
  console.log(date);
	
  var seconds = date.getSeconds();
  var minutes = date.getMinutes();
  var hours = date.getHours();
  // Create an object with each hand and it's angle in degrees
  var hands = [
    {
      hand: 'hours',
      angle: (hours * 30) + (minutes / 2)
    },
    {
      hand: 'minutes',
      angle: (minutes * 6)
    },
    {
      hand: 'seconds',
      angle: (seconds * 6)
    }
  ];
  // Loop through each of these hands to set their angle
  for (var j = 0; j < hands.length; j++) {
    var elements = document.querySelectorAll('.' + hands[j].hand);
    for (var k = 0; k < elements.length; k++) {
        elements[k].style.webkitTransform = 'rotateZ('+ hands[j].angle +'deg)';
        elements[k].style.transform = 'rotateZ('+ hands[j].angle +'deg)';
        // If this is a minute hand, note the seconds position (to calculate minute position later)
        if (hands[j].hand === 'minutes') {
          elements[k].parentNode.setAttribute('data-second-angle', hands[j + 1].angle);
        }
    }
  }
}

//change background color based on temp
function updateColor(temp) {
	if (temp < 30 ){
		document.body.style.color = "#fce8dd";
	} else if (temp>=90) {
		document.body.style.color = "#ffffff";
	} else if (temp>=30 && temp<40){
		document.body.style.color = "#ffe3df";
	} else if (temp>=40 && temp<50){
		document.body.style.color = "#ffe3cc";
	} else if(temp>=50 && temp<60){
		document.body.style.color = "#8a1e12";
	} else if (temp>=60 && temp<70){
		document.body.style.color = "#002B49";
	}else if (temp>=70 && temp<80){
		document.body.style.color = '#002B49';
	} else if (temp>=80 && temp<90){
		document.body.style.color = '#002B49';
	}
}
