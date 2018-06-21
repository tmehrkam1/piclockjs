# PiClock
A Fancy Clock built around a monitor and a Raspberry Pi

![PiClock Picture](https://raw.githubusercontent.com/n0bel/PiClock/master/Pictures/20150307_222711.jpg)

This project started out as a way to waste a Saturday afternoon.
I had a Raspberry Pi and an extra monitor and had just taken down an analog clock from my livingroom wall.
I was contemplating getting a radio sync'ed analog clock to replace it, so I didn't have to worry about
it being accurate.

But instead the PiClock was born.

The early days and evolution of it are chronicled on my blog http://n0bel.net/v1/index.php/projects/raspberry-pi-clock

Due to changes in Weather Underground, PiClock needed a new provider for weather information.  A decision
to build the project in JS was made, and PiClockJS was born.

Ok - no warranty, may cause universe implosion.  Use at your own risk.  standard GPL.  

Here is my extremely early work.  You will need to adjust the lat / lon in both the .js and index.html.  piclock.js will need your openweather api key.  index.html will need your google maps api.  Eventually I will clean up all the js in the index.html, but I only spent part of the weekend on it thanks to a sprained ankle.

install instructions (wholly untested):
1 - install chromium-broswer
2 - install node.js
3 - npm install request cron
4 - node piclock.js 
5 - nohup chromium-browser --kiosk http://localhost:8081 &

"should work"
radar images are CONUS only as far as I can tell.  Direct pulls from weather.gov included way too much radar noise.  Resolution is less than optimal.  Animation is not implemented yet.  I just refresh current every 5 minutes.
![2018-06-19-155046_800x480_scrot](https://user-images.githubusercontent.com/8691286/41620765-b491af4c-73d8-11e8-8f87-5b3ecf280aad.png)