#!/bin/bash
set -e

echo "starting tint2 on display :$DISPLAY_NUM ..."

# Function to check if X server is ready
wait_for_x() {
    local timeout=30
    local start_time=$(date +%s)
    while ! xdpyinfo >/dev/null 2>&1; do
        if [ $(($(date +%s) - start_time)) -gt $timeout ]; then
            echo "X server not ready within $timeout seconds" >&2
            return 1
        fi
        sleep 1
    done
    return 0
}

# Wait for X server to be ready
if ! wait_for_x; then
    echo "Failed to connect to X server on $DISPLAY" >&2
    exit 1
fi

# Ensure DISPLAY is properly set
if [ -z "$DISPLAY" ]; then
    echo "DISPLAY environment variable is not set" >&2
    exit 1
fi

# Start tint2 and capture its output
tint2 -c $HOME/.config/tint2/tint2rc > /tmp/tint2_stdout.log 2>/tmp/tint2_stderr.log &
TINT2_PID=$!

# Wait for tint2 window properties to appear
timeout=60  # Increased timeout
while [ $timeout -gt 0 ]; do
    if xdotool search --class "tint2" >/dev/null 2>&1; then
        echo "tint2 started successfully"
        exit 0
    fi
    # Check if tint2 process is still running
    if ! kill -0 $TINT2_PID 2>/dev/null; then
        echo "tint2 process died unexpectedly" >&2
        echo "stdout:" >&2
        cat /tmp/tint2_stdout.log >&2
        echo "stderr:" >&2
        cat /tmp/tint2_stderr.log >&2
        exit 1
    fi
    sleep 1
    ((timeout--))
done

echo "tint2 failed to start within timeout period" >&2
echo "stdout:" >&2
cat /tmp/tint2_stdout.log >&2
echo "stderr:" >&2
cat /tmp/tint2_stderr.log >&2
kill $TINT2_PID 2>/dev/null || true
exit 1
