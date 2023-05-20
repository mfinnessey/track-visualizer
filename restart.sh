#!/bin/sh

cd /home/led/track-visualizer
git checkout rainbow-rotate
git pull origin

screen -X -S server quit
screen -X -S control_script quit
screen -S control_script -d -m sudo ./lights.py
cd express
screen -S server -d -m sudo node app
