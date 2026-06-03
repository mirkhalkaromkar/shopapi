#!/bin/bash
echo "Stopping shopapi services..."
systemctl stop shopapi || true
systemctl stop shopapi-worker || true
echo "Services stopped."
