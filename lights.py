#!/bin/python3

import os
import errno
import time
from rpi_ws281x import PixelStrip, Color

LED_COUNT = 50
LED_PIN = 18 # GPIO pins are not necessarily the same as physical pins
LED_FREQ_HZ = 800000
LED_DMA = 10
LED_BRIGHTNESS = 255
LED_INVERT = False
LED_CHANNEL = 0

def bpm_pulse(strip, color, bpm):
    beat_length_ms = 60000 / bpm
    for i in range(strip.numPixels()):
        strip.setPixelColor(i, color)
    strip.show()
    while True:
        strip.setBrightness(0)
        time.sleep(beat_length_ms)
        strip.setBrightness(255)

if __name__ == "__main__":
    print("starting!")
    pipe_name = "./track-visualizer"
    try:
        os.mkfifo(pipe_name)
    except OSError as e:
        print("error")
        # don't raise error for already existing pipe
        if e.errno != errno.EEXIST:
            raise e
        else:
            print("pipe exists, things are fine")

    pipe = os.open(pipe_name, os.O_RDONLY | os.O_NONBLOCK)

    # begin strip operations
    strip = PixelStrip(LED_COUNT, LED_PIN, LED_FREQ_HZ, LED_DMA, LED_INVERT, LED_BRIGHTNESS, LED_CHANNEL)
    strip.begin()
    bpm_pulse(strip, Color(0, 0, 255), 120) # blue @ 120 bpm

    print("Ready to process messages!")
    # process messages
    try:
        while True:
            # read at most 24 bytes in a message
            msg = os.read(pipe, 24)
            # wait 1 second after an unsuccessful read attempt
            if not msg:
                time.sleep(1)
            else:
                print("Read msg: " + str(msg))
    finally:
        os.close(pipe)
        os.remove(pipe_name)

