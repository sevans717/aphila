FROM postgres:15

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    gnupg2 \
    lsb-release \
    ca-certificates \
    apt-transport-https \
  && echo 'deb http://deb.debian.org/debian bullseye-backports main' > /etc/apt/sources.list.d/backports.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends pgbackrest || true \
  && rm -rf /var/lib/apt/lists/*

COPY init-scripts/chown-data.sh /usr/local/bin/chown-data.sh
RUN chmod +x /usr/local/bin/chown-data.sh || true

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["postgres"]
