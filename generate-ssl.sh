#!/bin/sh

SSL_DIR="./backend/ssl"
KEY_FILE="$SSL_DIR/key.pem"
CERT_FILE="$SSL_DIR/cert.pem"

mkdir -p "$SSL_DIR"

if [ -f "$KEY_FILE" ] && [ -f "$CERT_FILE" ]; then
    exit 0
fi

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$KEY_FILE" \
    -out "$CERT_FILE" \
    -subj "/C=FR/ST=France/L=Paris/O=Transcendence/CN=localhost" \
    2>/dev/null
