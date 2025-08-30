FROM alpine:3.18

# Install required packages
RUN apk add --no-cache \
    openssl \
    ca-certificates \
    bash \
    curl \
    jq

# Create working directory
WORKDIR /cert-manager

# Copy certificate generation script
COPY generate-certs.sh /usr/local/bin/generate-certs.sh
RUN chmod +x /usr/local/bin/generate-certs.sh

# Create certificate directory
RUN mkdir -p /certs

# Set up cron for certificate renewal (if using Let's Encrypt)
RUN echo "0 2 * * * /usr/local/bin/generate-certs.sh" > /var/spool/cron/crontabs/root

# Default command
CMD ["/usr/local/bin/generate-certs.sh"]
