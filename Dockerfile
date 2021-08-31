
FROM golang:1.16.0-buster as builder

ENV STEAMPIPE_DIR=/opt/steampipe
WORKDIR $STEAMPIPE_DIR

ADD . $STEAMPIPE_DIR

RUN CGO_ENABLE=1 GOOS=linux go build -o steampipe .

FROM debian:buster-slim
LABEL maintainer="Turbot Support <help@turbot.com>"

ENV STEAMPIPE_DIR=/opt/steampipe

#  'wget' for downloading steampipe, 'less' for paging in the UI
RUN apt-get update -y \
 && apt-get install -y wget less \
 && adduser --system --disabled-login --ingroup 0 --gecos "steampipe user" --shell /bin/false --uid 9193 steampipe

# downlaod the published image
COPY --from=builder $STEAMPIPE_DIR/steampipe /usr/local/bin

RUN chmod +x /usr/local/bin/steampipe

# Change user to non-root
USER steampipe:0

# Use a constant workspace directory that can be mounted to
WORKDIR /workspace

# disable auto-update
ENV STEAMPIPE_UPDATE_CHECK=false

# Run --version
RUN steampipe --version

# Run steampipe query to install db and fdw (they are installed on the first run)
RUN steampipe query "select * from steampipe_mod"

EXPOSE 9193
COPY docker-entrypoint.sh /usr/local/bin
ENTRYPOINT [ "docker-entrypoint.sh" ]
CMD [ "steampipe"]
