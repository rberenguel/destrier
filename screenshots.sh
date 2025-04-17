#!/bin/bash

screenshot_interval=3
output_directory="$HOME/Screenshots/Destrier"
filename_prefix="game_screenshot_"
counter=1

mkdir -p "$output_directory"

echo "Starting automatic screenshots every $screenshot_interval seconds. Press Ctrl + C to stop."

while true; do
    timestamp=$(date +%Y%m%d_%H%M%S)
    filename="$output_directory/${filename_prefix}${timestamp}_${counter}.png"

    screencapture -x "$filename"

    echo "Screenshot saved to: $filename"
    counter=$((counter + 1))
    sleep "$screenshot_interval"
done
