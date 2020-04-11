#!/bin/sh
cd web
yarn clean && yarn release
cd ../
aws s3 sync ./resources/static/ s3://logseq-site/static/
