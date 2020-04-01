#!/bin/bash

cd api && yarn release
cd ../web
yarn clean && yarn release
cd ../
now
