#!/bin/bash
echo "Installing dependencies..."
cd /home/ec2-user/shopapi/shopapi
npm install --omit=dev
echo "Dependencies installed."
