@echo off
setlocal
pushd "%~dp0"

if not exist package.json (
  echo ERROR: package.json was not found in this folder.
  goto error
)

if not exist node_modules (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 goto error
)

echo Starting TheroIncrementalTD at http://127.0.0.1:8000/ ...
echo The browser will refresh automatically when game files change.
call npm run dev -- --open
if errorlevel 1 goto error

popd
exit /b 0

:error
echo.
echo Browser dev launcher failed. Review the message above.
pause
popd
exit /b 1
