#!/bin/sh
cd web
yarn clean && yarn release
cd ../
cleancss -o ./resources/static/style.css ./resources/static/css/style.css
aws s3 sync ./resources/static/ s3://logseq-site/static/
aws cloudfront create-invalidation \
    --distribution-id $AWS_LOGSEQ_CLOUDFRONT_ID \
    --paths "/static/js/main.js" "/static/js/mldoc.js" "/static/style.css" "/static/index.html"
