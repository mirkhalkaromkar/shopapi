#!/bin/bash
echo "Starting shopapi services..."
systemctl daemon-reload
systemctl start shopapi
systemctl start shopapi-worker
echo "Services started."
