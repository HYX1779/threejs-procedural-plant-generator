@echo off
title 植物生成器 · 一键启动
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [错误] 未检测到 Node.js，请先安装 https://nodejs.org/
  pause
  exit /b 1
)

if not exist "node_modules\vite\bin\vite.js" (
  echo [1/2] 首次运行，正在安装依赖，请稍候...
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo [错误] 依赖安装失败，请检查网络后重新运行。
    pause
    exit /b 1
  )
)

echo [2/2] 正在启动开发服务器，浏览器会自动打开...
echo 关闭本窗口即可停止服务。
call npm run dev -- --open
pause
