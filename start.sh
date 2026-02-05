#!/bin/bash
# Use polling for file watching to avoid EMFILE errors
# This is slower but works when file descriptor limits are low
export CHOKIDAR_USEPOLLING=true
export WATCHPACK_POLLING=true
exec react-scripts start
