#!/bin/sh
cd web
yarn clean && yarn release
NODE_ENV=production yarn postcss styles.src.css -o ../resources/static/css/tailwind.min.css
cd ../
cleancss -o ./resources/static/style.css ./resources/static/css/style.css
