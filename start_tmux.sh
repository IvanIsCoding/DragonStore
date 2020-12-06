#!/bin/bash
echo 'Cleaning Tmux Sessions'
tmux kill-server
echo 'Done Cleaning Tmux Sessions'
echo 'Pulling Latest Changes'
git pull
echo 'Done Pulling Latest Changes'
echo 'Starting Tmux Session'
tmux new -d -s myDockerSession
echo 'Starting Docker in Background'
tmux send-keys -t myDockerSession.0 "./start_server.sh" ENTER