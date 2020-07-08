#!/bin/sh
cd web
yarn clean && yarn release
NODE_ENV=production yarn postcss styles.src.css -o ../resources/static/css/tailwind.min.css
cd ../
cleancss -o ./resources/static/style.css ./resources/static/css/style.css
aws s3 sync ./resources/static/ s3://logseq-site/static/

aws cloudfront create-invalidation \
    --distribution-id $AWS_LOGSEQ_CLOUDFRONT_ID \
    --paths "/static/js/main.js" "/static/js/sci.min.js" "/static/js/mldoc.min.js" "/static/style.css" "/static/img/logo.png"
