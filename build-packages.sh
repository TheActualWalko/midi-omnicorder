#!/bin/bash

electron-packager ./app --platform=darwin --arch=x64 --out=packages --overwrite && electron-packager ./app --platform=win32 --arch=ia32 --out=packages --overwrite