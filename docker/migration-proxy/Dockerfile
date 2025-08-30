FROM nginx:1.24-alpine

# Install required packages
RUN apk add --no-cache \
    curl \
    bash

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY proxy-switch.sh /usr/local/bin/proxy-switch.sh

# Make scripts executable
RUN chmod +x /usr/local/bin/proxy-switch.sh

# Create log directory
RUN mkdir -p /var/log/nginx

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Expose ports
EXPOSE 5432 8080

CMD ["nginx", "-g", "daemon off;"]
