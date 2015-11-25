#!/bin/bash
# Restart Unicorn

project_home="/home/craig/www"
unicorn_pid=$(cat $project_home/var/run/unicorn.pid)
echo "Restarting Unicorn ($unicorn_pid)"
kill -HUP $unicorn_pid
