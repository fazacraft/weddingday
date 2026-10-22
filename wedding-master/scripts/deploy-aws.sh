#!/bin/sh
# main'dagi oxirgi kodni AWS serverga chiqaradi (avval git push qiling):
#   sh scripts/deploy-aws.sh
# Serverda: /opt/beluga (git clone), wedding-master/.env (sirlar), docker compose (app + Caddy).
set -e

HOST="${DEPLOY_HOST:-ec2-user@3.107.42.27}"
KEY="${DEPLOY_KEY:-$HOME/Downloads/beluga.pem}"

ssh -i "$KEY" "$HOST" '
  set -e
  cd /opt/beluga
  git pull --ff-only -q
  echo "deploying $(git log --oneline -1)"
  cd wedding-master
  docker compose up -d --build
  docker image prune -f >/dev/null
  for i in $(seq 1 30); do
    [ "$(docker inspect -f "{{.State.Health.Status}}" wedding-master-app-1)" = healthy ] && break
    sleep 2
  done
  docker compose ps --format "table {{.Service}}\t{{.Status}}"
'
