FROM ubuntu:20.04
ENV DEBIAN_FRONTEND=noninteractive

# Labels
LABEL name="@cuse-dev/cuse/linux"
LABEL version="0.1.0"
LABEL description="Ubuntu computer with Python and noVNC"

# Set the working directory
WORKDIR /home/user

# Install essential packages for the desktop environment and API runtime
RUN apt-get update && apt-get upgrade -y && apt-get install -y \
    git \
    xvfb \
    x11vnc \
    xfce4 \
    xfce4-terminal \
    websockify \
    python3 \
    python3-pip \
    dbus-x11 \
    # Keychain requirements
    pass \
    gpg \
 && rm -rf /var/lib/apt/lists/*

# Clone the noVNC repository (shallow clone) into /opt/novnc
RUN git clone --depth=1 https://github.com/novnc/noVNC.git /opt/novnc

# Install applications
RUN apt-get update && apt-get upgrade -y && apt-get install -y \
    firefox \
    libreoffice \
    gimp \
    galculator \
    && rm -rf /var/lib/apt/lists/*

ENV BROWSER=firefox

# Install pyautogui dependencies
RUN apt-get update && apt-get install -y \
    python3-tk \
    python3-xlib \
    gnome-screenshot \
 && rm -rf /var/lib/apt/lists/*

# Copy the API code into the image and install its Python dependencies
COPY api .
RUN python3 -m pip install --no-cache-dir -r requirements.txt
RUN python3 -m pip freeze > requirements.txt

# Create Xauthority file
RUN touch .Xauthority

# Copy the startup script into the image and make it executable
COPY keychain.sh .
RUN chmod +x ./keychain.sh

# Copy the startup script into the image and make it executable
COPY start.sh .
RUN chmod +x ./start.sh

# Expose ports for noVNC (6080) and the FastAPI (8000)
EXPOSE 6080 8000

# Run the startup script when the container launches
CMD ["./start.sh"]
