FROM alpine:3.18

RUN apk add --no-cache bash postgresql-client

COPY generate-userlist.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/generate-userlist.sh

CMD ["/usr/local/bin/generate-userlist.sh"]
