#!/bin/bash
tmux kill-server
git pull
tmux my-docker-session
docker-compose down
docker-compose up
tmux detach