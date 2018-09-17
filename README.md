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

radar images are US only as far as I can tell.  
Background color changes depending on the temp.  
takes feeds from openweather for current conditions and US NWS for forecast.  This currently limits the forecast to US only.  

The design allows you to view the interface from either a directly attached monitor, or any browser like an iPad.  Clicking the interface switches from day to night modes.  If you are using the PI 7" LCD, it also dims the display in night mode.

![2018-06-19-155046_800x480_scrot](https://user-images.githubusercontent.com/8691286/41620765-b491af4c-73d8-11e8-8f87-5b3ecf280aad.png)  

Install doc is still a work in progress, but this is a start :  
(https://github.com/merky1/PiClock/blob/master/INSTALL.md)  
