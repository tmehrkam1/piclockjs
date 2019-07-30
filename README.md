# PiClock
A Fancy Clock built around a monitor and a Raspberry Pi

![PiClock Picture](https://raw.githubusercontent.com/n0bel/PiClock/master/Pictures/20150307_222711.jpg)

This project started out as a way to waste a Saturday afternoon.
I had a Raspberry Pi and an extra monitor and had just taken down an analog clock from my livingroom wall.
I was contemplating getting a radio sync'ed analog clock to replace it, so I didn't have to worry about
it being accurate.

But instead the PiClock was born.

The early days and evolution of it are chronicled on my blog http://n0bel.net/v1/index.php/projects/raspberry-pi-clock

-- n0bel

Due to changes in Weather Underground, PiClock needed a new provider for weather information.  I use JS during my day job, so I went from writing a few test scripts to a full blown backend.  Once I had the backend in place, I built a simple HTML front end to lay on top of it.

Current Weather is provided by [Darksky.net](http://darksky.net) - developer account required

Radar imgages are provided by [Iowa State Mesonet](http://mesonet.agron.iastate.edu/GIS/ridge.phtml)

Radar detail page provided by [Aeris Weather](https://www.aerisweather.com/) - developer account required

Maps provided by [Google](http://google.com) - Maps API key required

Forecast headlines and details provided by [NOAA](https://www.weather.gov/)

48 Hour graphs provided by [Highcharts](https://www.highcharts.com/)

Moon images provided by [US Naval Observatory](https://tycho.usno.navy.mil/)

Unfortunately, the design is US centric, but someone could hack on the code to give it an international source for Radar and Pull the forecasts in from Darksky.

The design allows you to view the interface from either a directly attached monitor, or any browser like an iPad.  Clicking the interface switches from day to night modes.  If you are using the PI 7" LCD, it also dims the display in night mode.

![daymodeus](https://user-images.githubusercontent.com/8691286/45634385-4619ce80-ba70-11e8-8213-bf31db8317a4.png)
![nightmode](https://user-images.githubusercontent.com/8691286/45634388-47e39200-ba70-11e8-851a-61ca9face4c8.png)


Install doc is still a work in progress, but this is a start :  
(https://github.com/merky1/PiClock/blob/master/INSTALL.md)  
