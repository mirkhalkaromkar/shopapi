#!/bin/bash
echo "Validating deployment..."
sleep 5

# Check if service is running
if ! systemctl is-active --quiet shopapi; then
  echo "ERROR: shopapi service is not running"
  exit 1
fi

# Check health endpoint
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
if [ "$RESPONSE" != "200" ]; then
  echo "ERROR: Health check failed with status $RESPONSE"
  exit 1
fi

echo "Validation passed — shopapi is healthy"
