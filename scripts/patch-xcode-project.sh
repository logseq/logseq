#!/bin/bash

# This script patches the iOS project to use the correct codesigning and provisioning profiles.

set -e
set -o pipefail

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

cd ${SCRIPT_DIR}/../ios/App

ls -lah App.xcodeproj/project.pbxproj

FILE="App.xcodeproj/project.pbxproj"

/usr/libexec/PlistBuddy -c 'Set :objects:504EC2FC1FED79650016851F:attributes:TargetAttributes:504EC3031FED79650016851F:ProvisioningStyle Manual' $FILE
/usr/libexec/PlistBuddy -c 'Set :objects:504EC2FC1FED79650016851F:attributes:TargetAttributes:5FFF7D6927E343FA00B00DA8:ProvisioningStyle Manual' $FILE

/usr/libexec/PlistBuddy -c 'Set :objects:504EC3171FED79650016851F:buildSettings:CODE_SIGN_STYLE Manual' $FILE
/usr/libexec/PlistBuddy -c 'Add :objects:504EC3171FED79650016851F:buildSettings:"CODE_SIGN_IDENTITY[sdk=iphoneos*]" String "iPhone Distribution"' $FILE
/usr/libexec/PlistBuddy -c 'Set :objects:504EC3171FED79650016851F:buildSettings:DEVELOPMENT_TEAM ""' $FILE
/usr/libexec/PlistBuddy -c 'Add :objects:504EC3171FED79650016851F:buildSettings:"DEVELOPMENT_TEAM[sdk=iphoneos*]" String K378MFWK59' $FILE
/usr/libexec/PlistBuddy -c 'Add :objects:504EC3171FED79650016851F:buildSettings:PROVISIONING_PROFILE_SPECIFIER String ""' $FILE
/usr/libexec/PlistBuddy -c 'Add :objects:504EC3171FED79650016851F:buildSettings:"PROVISIONING_PROFILE_SPECIFIER[sdk=iphoneos*]" String "match AppStore com.logseq.logseq"' $FILE

/usr/libexec/PlistBuddy -c 'Set :objects:504EC3181FED79650016851F:buildSettings:CODE_SIGN_STYLE Manual' $FILE
/usr/libexec/PlistBuddy -c 'Add :objects:504EC3181FED79650016851F:buildSettings:"CODE_SIGN_IDENTITY[sdk=iphoneos*]" String "iPhone Distribution"' $FILE
/usr/libexec/PlistBuddy -c 'Set :objects:504EC3181FED79650016851F:buildSettings:DEVELOPMENT_TEAM ""' $FILE
/usr/libexec/PlistBuddy -c 'Add :objects:504EC3181FED79650016851F:buildSettings:"DEVELOPMENT_TEAM[sdk=iphoneos*]" String K378MFWK59' $FILE
/usr/libexec/PlistBuddy -c 'Add :objects:504EC3181FED79650016851F:buildSettings:PROVISIONING_PROFILE_SPECIFIER String ""' $FILE
/usr/libexec/PlistBuddy -c 'Add :objects:504EC3181FED79650016851F:buildSettings:"PROVISIONING_PROFILE_SPECIFIER[sdk=iphoneos*]" String "match AppStore com.logseq.logseq"' $FILE

/usr/libexec/PlistBuddy -c 'Set :objects:5FFF7D7627E343FA00B00DA8:buildSettings:CODE_SIGN_STYLE Manual' $FILE
/usr/libexec/PlistBuddy -c 'Add :objects:5FFF7D7627E343FA00B00DA8:buildSettings:"CODE_SIGN_IDENTITY[sdk=iphoneos*]" String "iPhone Distribution"' $FILE
/usr/libexec/PlistBuddy -c 'Set :objects:5FFF7D7627E343FA00B00DA8:buildSettings:DEVELOPMENT_TEAM ""' $FILE
/usr/libexec/PlistBuddy -c 'Add :objects:5FFF7D7627E343FA00B00DA8:buildSettings:"DEVELOPMENT_TEAM[sdk=iphoneos*]" String K378MFWK59' $FILE
/usr/libexec/PlistBuddy -c 'Add :objects:5FFF7D7627E343FA00B00DA8:buildSettings:PROVISIONING_PROFILE_SPECIFIER String ""' $FILE
/usr/libexec/PlistBuddy -c 'Add :objects:5FFF7D7627E343FA00B00DA8:buildSettings:"PROVISIONING_PROFILE_SPECIFIER[sdk=iphoneos*]" String "match AppStore com.logseq.logseq.ShareViewController"' $FILE

/usr/libexec/PlistBuddy -c 'Set :objects:5FFF7D7727E343FA00B00DA8:buildSettings:CODE_SIGN_STYLE Manual' $FILE
/usr/libexec/PlistBuddy -c 'Add :objects:5FFF7D7727E343FA00B00DA8:buildSettings:"CODE_SIGN_IDENTITY[sdk=iphoneos*]" String "iPhone Distribution"' $FILE
/usr/libexec/PlistBuddy -c 'Set :objects:5FFF7D7727E343FA00B00DA8:buildSettings:DEVELOPMENT_TEAM ""' $FILE
/usr/libexec/PlistBuddy -c 'Add :objects:5FFF7D7727E343FA00B00DA8:buildSettings:"DEVELOPMENT_TEAM[sdk=iphoneos*]" String K378MFWK59' $FILE
/usr/libexec/PlistBuddy -c 'Add :objects:5FFF7D7727E343FA00B00DA8:buildSettings:PROVISIONING_PROFILE_SPECIFIER String ""' $FILE
/usr/libexec/PlistBuddy -c 'Add :objects:5FFF7D7727E343FA00B00DA8:buildSettings:"PROVISIONING_PROFILE_SPECIFIER[sdk=iphoneos*]" String "match AppStore com.logseq.logseq.ShareViewController"' $FILE

echo Patch OK!
