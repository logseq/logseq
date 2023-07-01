#!/bin/bash

set -e

if uname -s | grep -q Darwin; then
  SED=gsed
else
  SED=sed
fi

NOW="$(date +'%B %d, %Y')"
RED="\033[1;31m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
BLUE="\033[1;34m"
PURPLE="\033[1;35m"
CYAN="\033[1;36m"
WHITE="\033[1;37m"
RESET="\033[0m"

QUESTION_FLAG="${GREEN}?"
WARNING_FLAG="${YELLOW}!"
NOTICE_FLAG="${CYAN}❯"

LATEST_HASH=`git log --pretty=format:'%h' -n 1`

BASE_VERSION=$(cat resources/package.json | jq '.version' | tr -d '"')
VERSION_CODE=$(cat android/app/build.gradle | grep -oh 'versionCode [[:digit:]]*' | awk '{print $2}')

BASE_LIST=(`echo $BASE_VERSION | tr '.' ' '`)
V_MAJOR=${BASE_LIST[0]}
V_MINOR=${BASE_LIST[1]}
V_PATCH=${BASE_LIST[2]}

echo -e "${NOTICE_FLAG} Current version: ${WHITE}$BASE_VERSION"
echo -e "${NOTICE_FLAG} Latest commit hash: ${WHITE}$LATEST_HASH"
echo -e "${NOTICE_FLAG} Current versionCode(Android) / buildVersion(MacOS): ${WHITE}$VERSION_CODE"

# V_MINOR=$((V_MINOR + 1))
# V_PATCH=0
V_PATCH=$((V_PATCH + 1))

SUGGESTED_VERSION="$V_MAJOR.$V_MINOR.$V_PATCH"

echo -e "${QUESTION_FLAG} ${CYAN}Enter a version number [${WHITE}$SUGGESTED_VERSION${CYAN}]: "
read INPUT_STRING
if [ "$INPUT_STRING" = "" ]; then
  INPUT_STRING=$SUGGESTED_VERSION
fi
NEW_VERSION_CODE=$(($VERSION_CODE + 1))

echo -e "${NOTICE_FLAG} Will set new version to be ${WHITE}$INPUT_STRING"
echo -e "${NOTICE_FLAG} Will set new versionCode to be ${WHITE}$NEW_VERSION_CODE"

NEW_VERSION=$INPUT_STRING

$SED -i 's/defonce version ".*"/defonce version "'${NEW_VERSION}'"/g' src/main/frontend/version.cljs
$SED -i 's/"version": ".*"/"version": "'${NEW_VERSION}'"/g' resources/package.json
$SED -i 's/versionName ".*"/versionName "'${NEW_VERSION}'"/g' android/app/build.gradle
$SED -i 's/versionCode .*/versionCode '${NEW_VERSION_CODE}'/g' android/app/build.gradle
$SED -i 's/buildVersion: .*/buildVersion: '${NEW_VERSION_CODE}',/g' resources/forge.config.js
$SED -i 's/MARKETING_VERSION = .*;/MARKETING_VERSION = '${NEW_VERSION}';/g' ios/App/App.xcodeproj/project.pbxproj

git --no-pager diff -U0

echo -e "${NOTICE_FLAG} Finished."
