# syntax=docker/dockerfile:1.3-labs
FROM node:26-alpine as builder

WORKDIR /usr/src/app

RUN apk add g++ make py3-pip openssl

COPY package*.json .
RUN npm install --omit=dev --legacy-peer-deps --ignore-scripts --platform=linuxmusl
RUN npm rebuild bcrypt --build-from-source
RUN npm rebuild better-sqlite3 --build-from-source

COPY . .

# prisma generate requires DATABASE_URL to be resolvable via prisma.config.ts,
# but the build stage never connects to a database, so a placeholder is sufficient.
ENV DATABASE_URL="mysql://scholarsome:scholarsome@localhost:3306/scholarsome"

RUN npm run generate
RUN npm run build

FROM node:26-alpine

WORKDIR /usr/src/app

RUN apk add openssl

COPY . .
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/node_modules ./node_modules

CMD [ "npm", "run", "serve:node" ]
