#!/bin/bash
# add this to enable windows:
# && electron-packager ./app --platform=win32 --arch=x64 --out=packages --overwrite && zip -r website-downloads/MIDICatch-win32-x64.zip packages/MIDICatch-win32-x64

rm website-downloads/* && electron-packager ./app --platform=darwin --arch=x64 --out=packages --overwrite && zip -r website-downloads/MIDICatch-darwin-x64.zip packages/MIDICatch-darwin-x64