#!/bin/bash

if uname -s | grep -q Darwin; then
  SED=gsed
else
  SED=sed
fi

PROTOCOL="http"
IP=$(ipconfig getifaddr en0)
PORT="3001"
LOGSEQ_APP_SERVER_URL="${PROTOCOL}://${IP}:${PORT}"
echo -e "Server URL: ${LOGSEQ_APP_SERVER_URL}"

git checkout capacitor.config.ts
$SED -i 's#// , server:# , server:#g' capacitor.config.ts
$SED -i 's#//    url:#    url:#g' capacitor.config.ts
$SED -i 's#process.env.LOGSEQ_APP_SERVER_URL#"'${LOGSEQ_APP_SERVER_URL}'"#g' capacitor.config.ts
$SED -i 's#//    cleartext:#    cleartext:#g' capacitor.config.ts
$SED -i 's#// }# }#g' capacitor.config.ts
