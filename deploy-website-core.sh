#!/bin/bash

scp -r ./website/style.css root@midicatch.com:/var/www/midicatch/public/style.css && scp -r ./website/index.html root@midicatch.com:/var/www/midicatch/public/index.html