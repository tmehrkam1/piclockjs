get your pi networked with a lite distribution.  I used stretch-lite

then ..

apt-get install chromium-browser unclutter xinit

curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install -y nodejs

npm install 

(https://www.raspberrypi.org/forums/viewtopic.php?t=42888)

vi .xinitrc
exec /usr/bin/chromium-browser

vi .xinitrc
  #!/bin/sh
  xset s off
  xset -dpms
  xset s noblank
  exec /home/pi/kiosk.sh