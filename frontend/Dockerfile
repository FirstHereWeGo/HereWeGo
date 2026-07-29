# frontend/Dockerfile (프로덕션용 - Vite 빌드 후 nginx로 정적 파일 서빙)

FROM node:20-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
