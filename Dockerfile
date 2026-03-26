FROM mcr.microsoft.com/playwright:v1.58.2-noble

LABEL org.opencontainers.image.title="WhatsApp Admin Assistant" \
  org.opencontainers.image.description="WhatsApp assistant (brain) with Playwright, ffmpeg, and yt-dlp"

# Install ffmpeg, yt-dlp, and cloudflared
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends ffmpeg && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared && \
    chmod a+rx /usr/local/bin/cloudflared && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN chown pwuser:pwuser /app

COPY --chown=pwuser:pwuser package.json package-lock.json ./

USER pwuser
RUN npm ci

COPY --chown=pwuser:pwuser . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]
