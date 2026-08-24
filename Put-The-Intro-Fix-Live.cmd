@echo off
title Put the shift9.dev intro fix live
echo.
echo   This sends the finished fix to GitHub. Vercel then puts it on
echo   shift9.dev on its own, usually within a couple of minutes.
echo.
echo   Nothing else is sent. The work is already saved and checked.
echo.
pause
cd /d "C:\Users\Kariim\Dev\shift9-studio"
git push origin main
echo.
echo   Done. Give it two minutes, then reload shift9.dev.
echo.
pause
