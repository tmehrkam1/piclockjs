# Setup
get your pi networked with a lite distribution.  I used stretch-lite

then ..
```
sudo apt update
sudo apt install -y chromium-browser unclutter xinit libgconf-2-4 lightdm git chrony

sudo curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt install -y nodejs
git clone https://github.com/merky1/PiClock.git
cd PiClock
npm install
```

## Easy Config
use raspi-config to boot into xwindows automatically.

```
  3 - Boot Options
    B1 Desktop / CLI
      B4 Desktop Autologin
```
```
sudo cp piclock.service /etc/systemd/system/
sudo systemctl enable piclock
cp kiosk.sh ..
edit the settings.json (use settings-example.json as a template)
cd ~
chmod +x kiosk.sh
dos2unix kiosk.sh
```
remember, the clock sleeps for 2 minutes on startup to settle the network issues (name resolution/dhcp)


## Advanced Special-purpose Config
This setup removes the raspberry pi user interface and launches only the Xorg.  Since it uses triggers and starts Xorg manually, it expects the system to have at least a free core to perform tasks in the background. This provides the following benefits

- Loads the absolute minimum requirements. Just Xorg and NPM are required.
- Uses the entire screen regardless of screen size or status in Raspberry Pi OS
- starts and runs faster


Perform all steps above and ensure your system works as intended.  The following directions will disable Raspberry Pi OS if it is currently on your system.
```
sudo su
```
``` 
cd 
git clone https://github.com/merky1/PiClock.git
raspi-config
```

use raspi-config to boot into xwindows automatically.

```
  3 - Boot Options
    B1 Desktop / CLI
      B1 Console
```

The minimal system consists of three separate services. 
- xorg
- unclutter
- piclock

This setup requires setup as root user
### Contents of /etc/systemd/system/xorg.service
```
[Unit]
Description=Xorg Service
After=network.online.target

[Service]
Environment=DISPLAY=:0
Type=simple
ExecStart=/usr/bin/Xorg
Restart=always
User=root
Group=root

[Install]
WantedBy=default.target
```

### Contents of /etc/systemd/system/piclock.service
```
[Unit]
WantedBy=default.target

root@raspberrypi:~# cat /etc/systemd/system/unclutter.service
[Unit]
Description=Unclutter Service
After=network.online.target

[Service]
Environment=DISPLAY=:0
Type=simple
ExecStart=/usr/bin/unclutter
Restart=always
User=root
Group=root

[Install]
WantedBy=default.target
```

### Contents of /etc/systemd/system/piclock.service
```
[Unit]
Description=Node Kiosk
After=network.online.target

[Service]
Environment=DISPLAY=:0
Type=simple
ExecStart=/usr/bin/npm start --prefix /root/PiClock
Restart=always
User=root
Group=root

[Install]
WantedBy=default.target
```

Execute the following to enable the above services
```
sudo systemctl enable piclock
sudo systemctl enable piclock
sudo systemctl enable piclock
systemctl daemon-reload
reboot
```




