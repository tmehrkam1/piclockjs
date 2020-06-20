#!/bin/sh
sleep 60
export DISPLAY=:0.0
cd ~/PiClock
unclutter &
xset s off -dpms && npm start
