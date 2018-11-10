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
drawNumbers(ctx, radius);

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
