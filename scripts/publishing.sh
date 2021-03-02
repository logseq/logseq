#!/bin/sh
yarn clean && yarn release-publishing
/usr/bin/rm -rf /tmp/publishing
mkdir /tmp/publishing
cp -R ./static /tmp/publishing/
cp ./static/404.html /tmp/publishing/
/usr/bin/rm -rf /tmp/publishing/static/node_modules/
/usr/bin/rm /tmp/publishing/static/electron*
/usr/bin/rm /tmp/publishing/static/forge.config.js
/usr/bin/rm /tmp/publishing/static/package.json
/usr/bin/rm /tmp/publishing/static/yarn.lock
/usr/bin/rm /tmp/publishing/static/index.html
/usr/bin/rm /tmp/publishing/static/404.html
/usr/bin/rm /tmp/publishing/static/public.css
cd /tmp/publishing/
mv ./static/js/publishing/code-editor.js ./static/js/
tar -zcvf /tmp/logseq_publishing.tar.gz ./
