@echo off
title KUBIK HOME - Sistema de Gestao
cd /d "%~dp0"

echo ============================================================
echo   KUBIK HOME ^& LIFE FURNITURE - Sistema de Orcamentacao
echo ============================================================
echo.

:: 1. Verificar se o Node.js esta instalado
where node >nul 2>nul
if %errorlevel% equ 0 goto node_installed

echo [!] O 'NodeJS' nao foi detetado neste computador.
echo [i] O NodeJS e o motor obrigatorio para correr este software.
echo.
echo A tentar instalar o motor automaticamente (requer Internet)...

winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements --silent
if %errorlevel% neq 0 goto install_failed

echo.
echo [V] NodeJS instalado com sucesso!
echo.
echo ==========================================================
echo AVISO IMPORTANTE:
echo Como instalamos um motor novo, tem de reiniciar este script.
echo Prima qualquer tecla para fechar esta janela.
echo Depois, volte a dar duplo clique no 'INICIAR_KUBIK.bat'!
echo ==========================================================
pause
exit /b

:install_failed
echo.
echo [X] Nao foi possivel instalar automaticamente (Windows desatualizado).
echo Por favor, abra o seu navegador, va a: https://nodejs.org/
echo Descarregue a versao LTS, instale normalmente, e volte aqui.
pause
exit /b

:node_installed
echo [V] Motor NodeJS detetado e pronto.
echo A preparar o sistema... Mantenha esta janela preta aberta!
echo.

:: 2. Instalar dependencias se for a primeira vez nesse PC
if exist "node_modules" goto skip_install
echo [i] A descarregar componentes do software (so acontece 1x neste PC)...
call npm install
:skip_install

:: 3. Compilar se for a primeira vez
if exist ".next" goto skip_build
echo [i] A preparar os graficos e a interface...
call npm run build
:skip_build

:: 4. Abrir no navegador e ligar servidor
echo [V] A iniciar servidor... O navegador vai abrir em 3 segundos.
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"

call npm start
pause
