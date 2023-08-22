# Overview

Track Visualizer provides the ability to control Wu281x addressable RGB LEDs via a web server hosted on a Raspberry Pi. A variety of light effects can be selected from the web page. Additionally, there is integration with Spotify's API to enable synchronizing the light effects with the playing track.

![Example of Installation](https://github.com/mfinnessey/track-visualizer/assets/15825352/cb0997ca-7daf-4cda-90b2-982149d55323)

https://github.com/mfinnessey/track-visualizer/assets/15825352/b4d18057-d375-4c96-b9bb-7922abb23868


# Installation and Running
## Acknowledgements
    This project very much depends on ExpressJS(https://expressjs.com) and the [RPi WS281x Python bindings](https://github.com/rpi-ws281x/rpi-ws281x-python).

## Instructions


You must have relatively recent versions of `python3`, `node`, and `npm` installed on the Raspberry Pi. If running Raspbian, `sudo apt update && sudo apt install python3 nodejs` should be sufficient to get you going.

First, clone the repository.
```sh
git clone https://github.com/mfinnessey/track-visualizer
```
Next, install the necessary `node` and `python`dependencies.
```sh
sudo pip install rpi_ws281x
cd track-visualizer
cd express
npm install
```

Finally, launch the light control script and web server (note that both must be running at the same time - for testing this is most easily done from separate shells, but in the long run I would recommend using something like `screen` or `tmux`).

```sh
sudo node app.js
sudo ../lights.py
```

If you want to take advantage of the integration with Spotify's API, then modify the `client_id`, `client_secret`, and `redirect_uri` to the values provided by Spotify and the URI of the Raspberry Pi on your local network (probably `http://raspberrypi.lan` or `http://raspberrypi.local` depending on your router's manufacturer). Note that you will have to restart the web server and light control script for this to take effect.

# Architecture

The Raspberry Pi hosts a web server running on ExpressJS, a NodeJS derivative. The web server accepts user requests for light patterns which it then relays to the Python script that controls the LEDs via a named pipe. This sometimes requires the web server to make requests to Spotify's API as well. The light control script is composed of two threads - one for processing the incoming IPC messages and another for actually controlling the lights. The multithreading is perhaps a bit gratuitous considering the GIL, but there's always PEP 703 to get ready for :)
