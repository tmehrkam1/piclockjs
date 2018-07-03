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

Ok - no warranty, may cause universe implosion.  Use at your own risk.  standard GPL.  

Here is my extremely early work.  This project is in early hacker mode, and is no where near stable enough to attempt without decent system knowledge.  If you are looking for a more mature project, MagicMirror is much more mature.

install instructions (wholly untested):  
1 - install chromium-broswer  
2 - install node.js  
3 - npm install request cron  
4 - modify settings-example.json and save as settings.json  
5 - node piclock.js   
6 - nohup chromium-browser --kiosk http://localhost:8081 &  

"should work"
radar images are CONUS only as far as I can tell.  Direct pulls from weather.gov included way too much radar noise.  Resolution is less than optimal.  Animation is not implemented yet.  I just refresh current every 5 minutes.
![2018-06-19-155046_800x480_scrot](https://user-images.githubusercontent.com/8691286/41620765-b491af4c-73d8-11e8-8f87-5b3ecf280aad.png)

Install doc is still a work in progress, but this is a start :

get your pi networked with a lite distribution.  I used stretch-lite

then ..

apt-get install chromium-browser unclutter xinit

curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install -y nodejs

npm install http request fs path degrees-to-direction util winston
npm install electron

https://www.raspberrypi.org/forums/viewtopic.php?t=42888

vi .xinitrc
exec /usr/bin/chromium-browser

vi .xinitrc
#!/bin/sh
xset s off
xset -dpms
xset s noblank
exec /home/pi/kiosk.sh
exec /usr/bin/chromium-browser


