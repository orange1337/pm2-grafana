# pm2-grafana

Made with ♥ by [orange1337](https://github.com/orange1337)

## Dependencies

 - [docker](https://www.docker.com/)
 - [influxDB](https://www.influxdata.com/)
 - [grafana](https://grafana.com/)

## Setup Instructions

Install, docker and start influxDb && grafana containers
```
// create user influxDB
curl -XPOST "http://localhost:8086/query" --data-urlencode "q=CREATE USER ${userName} WITH PASSWORD '${yourpass}' WITH ALL PRIVILEGES"
// create influxDB database
create database 'PM2_MONITORING';
```

#### 1. Clone & Install packages
```
git clone https://github.com/orange1337/pm2-grafana.git
cd pm2-grafana
```

#### 1. Docker compose example
```
version: "3"

services:
  
  mongodb:
    image: mongo:4.0
    restart: always
    volumes:
      - ./mongo:/data/db
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=secretsecret

  yourwebservice:
    build:
      context: ./yourwebservice
      dockerfile: Dockerfile
    ports:
      - ${your_port}:${your_port}
      - 4030:9615 #export pm2-http-interface
    links:
      - mongodb

  influxdb:
    image: influxdb:1.5
    container_name: influxdb
    ports:
      - "8083:8083"
      - "8086:8086"
      - "8090:8090"
    volumes:
      - ./influxdb:/var/lib/influxdb

  grafana:
    image: grafana/grafana:5.1.0
    container_name: grafana
    ports:
      - "3001:3000"
    links:
      - influxdb
    volumes:
      - ./grafana:/var/lib/grafana

  metrics:
    build:
      context: ./pm2-grafana
      dockerfile: Dockerfile
    restart: always
    ports:
      - 3088:3088
    links:
      - yourwebservice
    volumes:
      - ./metrics.config.js:/home/pm2_grafana/config.js
```

#### 2. Create config
```
let config = {};

config.DB_HOST      = 'localhost'; // influxDb
config.DB_PORT      = 8086; // influxDb
config.DB_USER      = 'admin'; // influxDb
config.DB_PASS      = 'admin1337'; // influxDb
config.DB_NAME      = 'PM2_MONITORING'; // influxDb
config.PM2_HOSTS    = ['http://localhost:9615/']; // list of hosts where (pm2 web) started
config.TIME_TO_UPDATE   = 1000; // period of updates 

module.exports = config;
```

#### 3. Starting
```
// Build docker containers
docker-compose up -d --build
```


