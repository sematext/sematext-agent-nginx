FROM mhart/alpine-node:6
RUN apk update && apk add --update procps git curl coreutils && rm -rf /var/cache/apk/*
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
COPY . /usr/src/app
RUN ls lib
RUN npm install -g
RUN chmod +x docker-run.sh

CMD /usr/src/app/docker-run.sh
