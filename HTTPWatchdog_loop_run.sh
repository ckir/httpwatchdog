#!/bin/bash
 
while true
do
   node HTTPWatchdog.js --port=${PORT:-9999} --timeout=300000
   sleep 1
done