FROM debian:bullseye-slim

USER root

LABEL org.opencontainers.image.source=https://github.com/tokyodrift1993/youversion

ARG PUSER=youversion
ARG PUID=1000
ARG PGID=1000
ENV LANG C.UTF-8
ENV LC_ALL C.UTF-8
ARG NODE_ENV=production

RUN groupadd -g ${PGID} -o ${PUSER}
RUN useradd -m -u ${PUID} -g ${PGID} -o -s /bin/bash ${PUSER}

RUN apt update && apt install --no-install-suggests -y curl wget

RUN apt install --no-install-recommends -y \
    nano

# install node
ENV NVM_DIR /usr/local/nvm
ENV NODE_VERSION=18.16.0

RUN mkdir -p ${NVM_DIR} \
  && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash \
  && . ${NVM_DIR}/nvm.sh \
  && nvm install ${NODE_VERSION} \
  && nvm alias default ${NODE_VERSION} \
  && nvm use default \
  && npm install --location=global pnpm@6

ENV NODE_PATH ${NVM_DIR}/versions/node/v${NODE_VERSION}/bin
ENV PATH ${NODE_PATH}:${PATH}

RUN node --version
RUN npm --version

USER ${PUSER}

WORKDIR /youversion

COPY --chown=${PUID}:${PGID} . .

USER ${PUSER}

RUN NODE_ENV=dev pnpm install
RUN pnpm build
RUN pnpm prune --production

USER ${PUSER}

CMD ["node", "./dist/index.js"]
