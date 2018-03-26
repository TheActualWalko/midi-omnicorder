#!/bin/bash

electron-packager . --platform=darwin --arch=x64 --out=packages --overwrite && electron-packager . --platform=win32 --arch=ia32 --out=packages --overwrite