FROM node:20.20.2-bookworm AS builder

WORKDIR /app

COPY ./package.json .
COPY ./package-lock.json .

ENV PATH /app/node_modules/.bin:$PATH

RUN npm ci

COPY ./ .

ARG PRIMARY_COLOR
ARG SECONDARY_COLOR

ENV PRIMARY_COLOR=${PRIMARY_COLOR}
ENV SECONDARY_COLOR=${SECONDARY_COLOR}

RUN npm run build

FROM node:20.20.2-bookworm-slim AS runner

WORKDIR /app

COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV production


CMD ["node", "server.js"]
