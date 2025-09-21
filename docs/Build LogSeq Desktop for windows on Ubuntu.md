# Building Logseq Desktop app for Windows on Ubuntu
## Intro
My Logseq dev machine is on Ubuntu 18.x and my production machine is running Windows 10, I needed a way to compile the Logseq desktop APP for Windows.
I tried & failed to make the "build" run on my windows machine but I did, however, succeed in letting my Ubuntu machine make Windows x64 files
## Pre-requisites
These are the steps I took to make it work on my Ubuntu machine, sharing them hoping it helps someone else. I assume you have all the basic pre-requisites for Logseq, if not you can find them at https://github.com/logseq/logseq#1-requirements
1. clone Logseq repo if you haven't already
`git clone https://github.com/logseq/logseq/`
1. Install wine
```shell
sudo dpkg --add-architecture i386
sudo apt update
sudo apt install wine64 wine32
```
1. Install winetricks & install dotnet using winetricks
```shell
sudo apt install winetricks

winetricks dotnet46
```
1. Install nuget and mono (N.B. I had to install mono-complete for it to work)
```shell
sudo apt install nuget

sudo apt-get install mono-complete
```
1. in `~/logseq/resources/package.json` line 10 `"electron:make": "electron-forge make --platform=win32 --arch=x64 --asar",`
1. Compile using
```shell
cd logseq
yarn
yarn release
yarn release-electron
```
the executable should be in the `static/out/make/squirrel.windows/x64/` folder
