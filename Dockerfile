FROM prefecthq/prefect:1.2.2-python3.8

ARG TARGETVERSION=v0.16.4
ARG TARGETOS=linux
ARG TARGETARCH=amd64

RUN mkdir -p /opt/proton/modules
ADD ./flows /opt/proton/flows
ADD ./tasks /opt/proton/tasks
ADD ./files /opt/proton/files
ADD ./*.py /opt/proton/

# Modules and files are copied into each image as needed (reduce bloat)
# RUN find /opt/proton/modules/ /opt/proton/files/ ! -name '__init__.py' -type f -exec rm -f {} +

RUN pip install -e /opt/proton

ENV CRIBL_ENDPOINT="http://cribl-json-tcp:10070/cribl/_bulk"

# add a non-root 'steampipe' user
RUN adduser --system --disabled-login --ingroup 0 --gecos "steampipe user" --shell /bin/false --uid 9193 steampipe

# updates and installs - 'wget' for downloading steampipe, 'less' for paging in 'steampipe query' interactive mode
RUN apt-get update -y && apt-get install -y wget less

# download the release as given in TARGETVERSION, TARGETOS and TARGETARCH
RUN echo \
    && cd /tmp \
    && wget -nv https://github.com/turbot/steampipe/releases/download/${TARGETVERSION}/steampipe_${TARGETOS}_${TARGETARCH}.tar.gz \
    && tar xzf steampipe_${TARGETOS}_${TARGETARCH}.tar.gz \
    && mv steampipe /usr/local/bin/ \
    && rm -rf /tmp/steampipe_${TARGETOS}_${TARGETARCH}.tar.gz 

RUN mkdir -p /opt/prefect/
RUN mkdir /steampipe
RUN chown -R steampipe:0 /steampipe

# Change user to non-root
USER steampipe:0

# Use a constant workspace directory that can be mounted to
WORKDIR /steampipe

# disable auto-update
ENV STEAMPIPE_UPDATE_CHECK=false

# disable telemetry
ENV STEAMPIPE_TELEMETRY=none
# Run --version
RUN steampipe --version
RUN steampipe plugin install steampipe aws azure gcp azuread

# Run steampipe service once
# RUN steampipe service start --dashboard
# Run steampipe query to install db and fdw (they are installed on the first run)
RUN steampipe query "select * from steampipe_mod"
# and stop it
# RUN steampipe service stop

# AWS config directory
RUN mkdir -p /home/steampipe/.aws/

# remove the generated service .passwd file from this image, so that it gets regenerated in the container
RUN rm -f /home/steampipe/.steampipe/internal/.passwd
