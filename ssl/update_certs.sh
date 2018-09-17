#!/bin/bash


cp /etc/letsencrypt/live/moreillon.duckdns.org/fullchain.pem fullchain.pem
cp /etc/letsencrypt/live/moreillon.duckdns.org/privkey.pem privkey.pem

chown moreillon:moreillon fullchain.pem
chown moreillon:moreillon privkey.pem
