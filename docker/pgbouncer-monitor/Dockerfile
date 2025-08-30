FROM alpine:3.18

RUN apk add --no-cache \
    bash \
    postgresql-client \
    curl \
    jq \
    netcat-openbsd

COPY scripts/ /usr/local/bin/
RUN chmod +x /usr/local/bin/*

EXPOSE 8080

CMD ["/usr/local/bin/monitor-entrypoint.sh"]
