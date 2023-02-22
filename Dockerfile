FROM mongo:latest

WORKDIR /app/

RUN apt-get update \
    && apt-get install -y wget gnupg sudo

RUN mkdir -p /app/nodejs
RUN wget https://nodejs.org/download/release/v18.14.2/node-v18.14.2-linux-x64.tar.gz
RUN tar xzf node-v18.14.2-linux-x64.tar.gz -C /app/nodejs
ENV NODE=/app/nodejs/node-v18.14.2-linux-x64/bin/node
ENV NPM=/app/nodejs/node-v18.14.2-linux-x64/bin/npm
RUN ls -lahi /app/nodejs/node-v18.14.2-linux-x64/
RUN $NODE --version

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chromium that Puppeteer
# installs, work.
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Uncomment to skip the chromium download when installing puppeteer. If you do,
# you'll need to launch puppeteer with:
#     browser.launch({executablePath: 'google-chrome-stable'})
# ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser

COPY --chown=pptruser:pptruser dipiper /app/dipiper/
COPY --chown=pptruser:pptruser package.json /app/
COPY --chown=pptruser:pptruser *.js /app/
RUN ls -lahi /app/

ENV NODE_PATH=/app/nodejs/node-v18.14.2-linux-x64/bin
ENV http_proxy=http://r.chiro.work:14514
ENV https_proxy=http://r.chiro.work:14514
# Install puppeteer so it's available in the container.
RUN PATH=$PATH:$NODE_PATH $NPM config set http-proxy $http_proxy
RUN PATH=$PATH:$NODE_PATH $NPM config set https-proxy $http_proxy
RUN PATH=$PATH:$NODE_PATH $NPM config set proxy $http_proxy
RUN PATH=$PATH:$NODE_PATH $NPM i -g yarn
RUN PATH=$PATH:$NODE_PATH yarn

RUN echo '%sudo ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers
RUN usermod -a -G sudo pptruser
COPY --chown=pptruser:pptruser dipiper_start.sh /app/

# Run everything after as non-privileged user.
USER pptruser

CMD [ "sh", "dipiper_start.sh" ]
