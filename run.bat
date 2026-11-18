@echo off
title Wedding Invitation Local Server
cd /d "%~dp0"
echo Starting Wedding Invitation on http://localhost:8080 ...
start "" http://localhost:8080/
node server.mjs
pause

