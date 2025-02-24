#!/bin/bash
set -e

# Init keychain
./keychain.sh

# Remove any stale X display lock file and socket directory
sudo rm -f /tmp/.X0-lock
sudo rm -rf /tmp/.X11-unix
mkdir -p /tmp/.X11-unix
chmod 1777 /tmp/.X11-unix

# Start the virtual X server (Xvfb) on display :0
Xvfb :0 -screen 0 1024x768x24 &
sleep 1  # Allow Xvfb time to initialize

# Launch a DBus session (required for XFCE)
if [ -z "$DBUS_SESSION_BUS_ADDRESS" ]; then
    eval "$(dbus-launch --sh-syntax)"
fi

# Start the XFCE desktop environment
startxfce4 &

# Start x11vnc to expose the virtual display (listening on localhost)
x11vnc -display :0 -forever -noxdamage -nopw -listen localhost &

# Start websockify to bridge between VNC (port 5900) and WebSocket (port 6080)
websockify --web=/opt/novnc/ 6080 localhost:5900 &

# Start the FastAPI server with uvicorn on port 8000 (runs in the foreground)
DISPLAY=:0 exec uvicorn main:app --host 0.0.0.0 --port 8000
