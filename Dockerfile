FROM node:10.15.3

ARG PORT=3088
ENV PORT=${PORT}

WORKDIR /home/pm2_grafana
COPY . /home/pm2_grafana

RUN cd /home/pm2_grafana && npm install

CMD ["node", "/home/pm2_grafana/monitoring.js"]

EXPOSE ${PORT}
