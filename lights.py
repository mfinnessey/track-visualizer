#!/bin/python3
"""Control ws2812 LEDs from RPi based off of incoming control messages."""
import os
import errno
import time
import threading
from rpi_ws281x import PixelStrip, Color

# globals (for shared state between threads)
# shared state to notify light control thread of a newly arrived msg
new_msg = True
new_msg_lock = threading.Lock()
# results of parsing a message
data = None


# light constants
# GPIO pin number not physical
# uses PCM to avoid conflict with analog audio out
# (see https://github.com/rpi-ws281x/rpi-ws281x-python/tree/master/library)
LED_PIN = 21
LED_COUNT = 294
LED_FREQ_HZ = 800000
LED_DMA = 10
LED_BRIGHTNESS = 255
LED_INVERT = False
LED_CHANNEL = 0

# communication constants

# messages are padded to this length to prevent concatenation of multiple
# messages
MAX_MSG_LENGTH = 100


def solid_color(strip, color):
    """Make the entire LED strip one color."""
    for i in range(strip.numPixels()):
        strip.setPixelColor(i, color)
    strip.setBrightness(255)
    strip.show()
    while True:
        # end if new message arrived
        if new_msg:
            return


def snake(strip, color, bpm):
    """Create a snake effect on LED strips."""
    beat_length = 60.0 / bpm
    strip.setBrightness(255)
    head = 12
    tail = 0
    while True:
        # end if new message arrived
        if new_msg:
            return
        for i in range(strip.numPixels()):
            # snake not wrapped
            if head > tail:
                if i >= tail and i <= head:
                    strip.setPixelColor(i, color)
                else:
                    strip.setPixelColor(i, Color(0, 0, 0))
            # snake wrapped at end
            else:
                if i <= head or i >= tail:
                    strip.setPixelColor(i, color)
                else:
                    strip.setPixelColor(i, Color(0, 0, 0))
        strip.show()
        time.sleep(beat_length)
        head = (head + 1) % strip.numPixels()
        tail = (tail + 1) % strip.numPixels()


def two_color_cycle(strip, color_1, color_2, bpm):
    """Alternate between two colors on LED strips."""
    beat_length = 60.0 / bpm
    strip.setBrightness(255)
    while True:
        # end if new message arrived
        if new_msg:
            return
        for i in range(strip.numPixels()):
            strip.setPixelColor(i, color_1)
        strip.show()
        time.sleep(beat_length)
        for i in range(strip.numPixels()):
            strip.setPixelColor(i, color_2)
        strip.show()
        time.sleep(beat_length)


def bpm_pulse(strip, color, bpm):
    """Pulse LED strip on and off on a singular color."""
    beat_length = 60.0 / bpm
    for i in range(strip.numPixels()):
        strip.setPixelColor(i, color)
    while True:
        # end if new message arrived
        if new_msg:
            return
        strip.setBrightness(0)
        strip.show()
        time.sleep(beat_length)
        strip.setBrightness(255)
        strip.show()
        time.sleep(beat_length)


def __color_from_list(list):
    return Color(int(list[0]), int(list[1]), int(list[2]))


def __parse_msg(msg):
    # no checking for malformed messages as sensible recovery
    # is likely impossible

    # format of msg is effect|color1;(color2)|bpm
    # colors are specified as RRR,GGG,BBB
    components = msg.split('|')
    # process colors
    components[1] = components[1].split(';')
    colors_lists = [color.split(',') for color in components[1]]
    components[1] = [__color_from_list(color) for color in colors_lists]
    components[2] = int(components[2])
    return components


def __light_control_thread(strip):
    global new_msg
    while True:
        # acknowledge new msg
        new_msg_lock.acquire()
        new_msg = False
        new_msg_lock.release()

        effect = data[0]
        colors = data[1]
        bpm = data[2]

        # carry out requested effect
        if effect == "two_color_cycle":
            two_color_cycle(strip, colors[0], colors[1], bpm)
        elif effect == "snake":
            snake(strip, colors[0], bpm)
        elif effect == "solid_color":
            solid_color(strip, colors[0])
        # default to bpm pulsing
        else:
            bpm_pulse(strip, colors[0], bpm)


if __name__ == "__main__":
    pipe_name = "./track-visualizer"
    try:
        os.mkfifo(pipe_name)
    except OSError as e:
        # don't raise error for already existing pipe
        if e.errno != errno.EEXIST:
            raise e

    pipe = os.open(pipe_name, os.O_RDONLY | os.O_NONBLOCK)

    # begin strip operations
    strip = PixelStrip(LED_COUNT, LED_PIN, LED_FREQ_HZ, LED_DMA, LED_INVERT,
                       LED_BRIGHTNESS, LED_CHANNEL)
    strip.begin()

    # process messages
    try:
        # spawn light control thread, defaulting to bpm pulsing blue @ 120
        msg = "bpm_pulse|000,000,255|120"
        data = __parse_msg(msg)
        lights = threading.Thread(target=__light_control_thread, args=(strip,))
        lights.start()
        while True:
            # retry to avoid weird edge case around node startup
            while True:
                try:
                    msg = os.read(pipe, MAX_MSG_LENGTH)
                except BlockingIOError:
                    time.sleep(0.1)
                    continue
                break
            # wait 1 second after an unsuccessful read attempt
            if not msg:
                time.sleep(1)
            else:
                data = __parse_msg(str(msg)[2:-1])
                # notify light control thread of new message
                new_msg_lock.acquire()
                new_msg = True
                new_msg_lock.release()
    finally:
        os.close(pipe)
        os.remove(pipe_name)
