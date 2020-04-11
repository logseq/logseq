#!/bin/sh
yarn clean && yarn release
aws s3 sync ./resources/static/ s3://logseq-site/static/
