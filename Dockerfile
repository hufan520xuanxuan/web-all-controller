FROM ubuntu:16.04

WORKDIR /tmp

ADD . /tmp
#ADD ./ccp /tmp
#ADD ./package.json /tmp/package.json
RUN mkdir /tmp/phantomjs
COPY ./phantomjs-2.1.1-linux-x86_64.tar.bz2 /tmp/phantomjs/

RUN sed -i "s/archive.ubuntu./mirrors.aliyun./g" /etc/apt/sources.list
RUN sed -i "s/deb.debian.org/mirrors.aliyun.com/g" /etc/apt/sources.list
RUN sed -i "s/security.debian.org/mirrors.aliyun.com\/debian-security/g" /etc/apt/sources.list

RUN apt-get update
RUN apt-get -y install wget python build-essential
RUN apt-get -y install libzmq3-dev libprotobuf-dev git graphicsmagick yasm sudo curl make g++

#RUN curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
#RUN apt-get install -y nodejs

RUN wget --progress=dot:mega https://cdn.npm.taobao.org/dist/node/v8.11.3/node-v8.11.3-linux-x64.tar.xz
RUN tar -xJf node-v*.tar.xz --strip-components 1 -C /usr/local
RUN apt-get clean && rm -rf /var/cache/apt/* /var/lib/apt/lists/*
RUN node -v
RUN npm -v

CMD cd /tmp
RUN tar -xvf /tmp/phantomjs/phantomjs-2.1.1-linux-x86_64.tar.bz2
#RUN sudo ln -sf /tmp/phantomjs/phantomjs-2.1.1-linux-x86_64/bin/phantomjs /usr/local/bin/phantomjs
#RUN npm i log4js
RUN npm config set registry https://registry.npm.taobao.org
RUN npm cache clean --force
#RUN npm i bower -g
RUN npm i
#RUN bower install --allow-root

ENTRYPOINT ["sh","-c","node ./start.js params=$PARAMS"]
