var imgFontColor;
var tz;
updateCoords();  // grab map coords from backend.


function updateCoords() {
	url="coords";
	var xhr = new XMLHttpRequest();  // need a sync call to initialize Maps
	xhr.open("GET",url,false);
	xhr.send(null);
	var obj = JSON.parse(xhr.responseText);
	imgFontColor = obj.imgFontColor;
	tz = obj.tz;
}

document.body.style.color = imgFontColor;

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var radius = canvas.height / 2;
ctx.translate(radius, radius);
radius = radius * 0.90
setInterval(drawClock, 1000);

function drawClock() {
	drawFace(ctx, radius);
	drawNumbers(ctx, radius);
	drawTime(ctx, radius);
}

function drawFace(ctx, radius) {
	ctx.clearRect(0,0,canvas.width,canvas.height);
}

function drawNumbers(ctx, radius) {
	var ang;
	var num;
	ctx.font = radius*0.15 + "px arial";
	ctx.fillStyle = imgFontColor;
	ctx.textBaseline="middle";
	ctx.textAlign="center";
	for(num = 1; num < 13; num++){
		ang = num * Math.PI / 6;
		ctx.rotate(ang);
		ctx.translate(0, -radius*0.85);
		ctx.rotate(-ang);
		ctx.fillText(num.toString(), 0, 0);
		ctx.rotate(ang);
		ctx.translate(0, radius*0.85);
		ctx.rotate(-ang);
	}
}

function drawTime(ctx, radius){
	  var now = new Date().toLocaleString("en-US", {timeZone: tz});
	  console.log(now);
	  var date = new Date(now);
	  console.log(date);

	
	var hour = date.getHours();
	var minute = date.getMinutes();
	var second = date.getSeconds();
	//hour
	hour=hour%12;
	hour=(hour*Math.PI/6)+
	(minute*Math.PI/(6*60))+
	(second*Math.PI/(360*60));
	drawHand(ctx, hour, radius*0.5, radius*0.07);
	//minute
	minute=(minute*Math.PI/30)+(second*Math.PI/(30*60));
	drawHand(ctx, minute, radius*0.8, radius*0.07);
	// second
	second=(second*Math.PI/30);
	drawHand(ctx, second, radius*0.9, radius*0.02);
}

function drawHand(ctx, pos, length, width) {
	ctx.beginPath();
	ctx.lineWidth = width;
	ctx.lineCap = "round";
	ctx.moveTo(0,0);
	ctx.rotate(pos);
	ctx.lineTo(0, -length);
	ctx.stroke();
	ctx.rotate(-pos);
}