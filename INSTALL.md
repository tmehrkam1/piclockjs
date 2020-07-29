get your pi networked with a lite distribution.  I used stretch-lite

then ..
```
sudo apt-get install -y chromium-browser unclutter xinit libgconf-2-4 lightdm git chrony

sudo curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -  
sudo apt-get install -y nodejs  
git clone https://github.com/merky1/PiClock.git

npm install   
```
use raspi-config to boot into xwindows automatically.

```
  3 - Boot Options
    B1 Desktop / CLI 
      B4 Desktop Autologin
```
