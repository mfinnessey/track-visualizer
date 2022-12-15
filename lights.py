#!/bin/python3

import os
import errno
import time

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

