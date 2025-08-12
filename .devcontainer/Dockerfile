# syntax=docker/dockerfile:1.6

FROM mcr.microsoft.com/devcontainers/javascript-node:22 AS base

FROM ghcr.io/foundry-rs/foundry:latest AS foundry

# Final image = base + foundry binaries
FROM base

COPY --from=foundry /root/.foundry /root/.foundry
ENV PATH="/root/.foundry/bin:${PATH}"

RUN apt-get update && \
    apt-get install -y --no-install-recommends jq ripgrep fd-find build-essential && \
    rm -rf /var/lib/apt/lists/*

RUN corepack enable && npm i -g --no-fund --no-audit zetachain@latest
