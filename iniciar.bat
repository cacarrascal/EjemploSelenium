@echo off
REM ==============================================================
REM  iniciar.bat - Levanta el formulario del Restaurante El Fogon Dorado
REM
REM  Que hace:
REM   1. Inicia un servidor web local con Python en una ventana
REM      de comandos MINIMIZADA (queda en segundo plano).
REM   2. Abre el navegador predeterminado con el proyecto.
REM
REM  Para detener el servidor: cerrar la ventana minimizada
REM  "Servidor Restaurante" que queda en la barra de tareas.
REM ==============================================================

REM Ir a la carpeta donde esta este archivo (funciona desde cualquier lugar)
cd /d "%~dp0"

set PUERTO=8085
set URL=http://localhost:%PUERTO%/

REM --- 1. Si el servidor ya esta encendido, solo se abre el navegador ---
REM     (LISTENING en Windows en ingles, ESCUCHANDO en Windows en espanol)
netstat -an | findstr /c:":%PUERTO% " | findstr /c:"LISTENING" /c:"ESCUCHANDO" >nul
if %errorlevel%==0 (
  echo El servidor ya estaba encendido en el puerto %PUERTO%.
  goto abrir
)

REM --- 2. Buscar Python: primero "py" y si no existe, "python" ---
set PYTHON=
py --version >nul 2>&1 && set PYTHON=py
if not defined PYTHON (
  python --version >nul 2>&1 && set PYTHON=python
)

REM Sin Python: el proyecto igual funciona abriendo index.html directamente
if not defined PYTHON (
  echo No se encontro Python. Se abrira index.html directamente en el navegador.
  start "" "%~dp0index.html"
  pause
  exit /b
)

REM --- 3. Iniciar el servidor en una ventana minimizada ---
REM     --bind 127.0.0.1: solo se puede abrir desde este computador
echo Iniciando servidor en %URL% ...
start "Servidor Restaurante" /min cmd /k "%PYTHON% -m http.server %PUERTO% --bind 127.0.0.1"

REM Esperar unos 2 segundos a que el servidor arranque
ping -n 3 127.0.0.1 >nul

REM --- 4. Abrir el navegador con el proyecto ---
:abrir
start "" "%URL%"
exit /b
