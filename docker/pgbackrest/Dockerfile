FROM debian:bullseye-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    wget \
    gnupg2 \
    lsb-release \
    apt-transport-https \
    postgresql-client \
  && rm -rf /var/lib/apt/lists/*

# Install pgBackRest from backports or official repo if available
# Fallback: download prebuilt binary tarball if available. For now, install from apt if present.
RUN set -ex \
  && echo 'deb http://deb.debian.org/debian bullseye-backports main' > /etc/apt/sources.list.d/backports.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends pgbackrest || true \
  && rm -rf /var/lib/apt/lists/*

COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["pgbackrest", "--help"]
