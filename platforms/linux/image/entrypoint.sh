#!/bin/bash
set -e

# Initialize keychain
chmod +x ./init_keychain.sh
./init_keychain.sh

./start_all.sh
./novnc_startup.sh

echo "The VM is ready!"
echo "Connect to VNC at http://localhost:5900."
echo "Open the web interface at http://localhost:6080."

# Ensure DISPLAY is set for the Python process
export DISPLAY=:${DISPLAY_NUM}

# Run the API server
python -m uvicorn main:app --host 0.0.0.0 --port 8000
echo "API server is running on http://localhost:8000"

# Keep the container running
tail -f /dev/null
