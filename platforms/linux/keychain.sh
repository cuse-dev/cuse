#!/bin/bash
set -e

# Generate a GPG key pair for the container instance
cat > /tmp/gpg_gen << EOF
%echo Generating GPG key pair for keychain
Key-Type: RSA
Key-Length: 2048
Name-Real: Cuse Keychain
Name-Email: keychain@cuse.dev
Expire-Date: 0
%no-protection
%commit
%echo Done
EOF

# Generate the key
gpg --batch --generate-key /tmp/gpg_gen

# Get the key ID
KEY_ID=$(gpg --list-secret-keys --keyid-format LONG | grep sec | cut -d'/' -f2 | cut -d' ' -f1)

# Initialize pass with the new key
pass init "$KEY_ID"

# Export the key ID as an environment variable for the keychain app
echo "export GPG_KEY_ID=$KEY_ID" >> ~/.bashrc

# Cleanup
rm -f /tmp/gpg_gen 