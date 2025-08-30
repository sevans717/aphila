FROM alpine:3.18

# Install dependencies
RUN apk add --no-cache \
    bash \
    curl \
    dcron \
    postgresql-client \
    jq \
    netcat-openbsd \
    && rm -rf /var/cache/apk/*

# Install pgbackrest
RUN apk add --no-cache pgbackrest

# Create directories
RUN mkdir -p /var/log/backups /etc/pgbackrest /var/spool/pgbackrest

# Copy scripts
COPY scripts/ /usr/local/bin/
RUN chmod +x /usr/local/bin/*

# Copy crontab
COPY crontab /etc/crontabs/root

# Set up log rotation
COPY logrotate.conf /etc/logrotate.d/backups

EXPOSE 8080

CMD ["/usr/local/bin/backup-scheduler-entrypoint.sh"]
