/**
 * Monitoring metrics of PM2, created by orange1337
 */

require('dotenv').config();
const async   = require('async');
const request = require('request-promise')
const Influx  = require('influx');

const influxModel = new Influx.InfluxDB({
    host: process.env.DB_HOST,
    port: 8086,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    schema: [
      {
        measurement: 'pm2-prod-node',
        fields: {
          NAME:Influx.FieldType.STRING,
          CPU:Influx.FieldType.FLOAT,
          MEM:Influx.FieldType.FLOAT,
          PROCESS_ID: Influx.FieldType.INTEGER
        },
        tags: [
          'host'
        ]
      }
    ]
});

const to = (promise) => {
    return promise.then(result => [null, result]).catch(err => [err, null]);
};

/*
* Node scheduler which runs on every 1sec.
*/
async function startMetricsWorker(){
  let dateStart = +new Date();
  let options = {
      uri: `http://${process.env.PM2_HOST}/`,
      method: 'GET',
      json: true
  }

  let [errReq, pm2Res] = await to(request(options));
  if (errReq){
     console.error(errReq);
     return wait(startMetricsWorker);
  }
  if (!pm2Res.processes){
     console.error(`pm2Res.processes error`, pm2Res.processes);
     return wait(startMetricsWorker);
  }

  let influxInput = [];
  for(let elem of pm2Res.processes){
        let processObj = {};
        processObj['measurement'] = 'pm2-node';
        processObj['tags'] = {
          "host": elem.name || null
        };
        processObj['fields'] = {
          "NAME": elem.name || null,
          "CPU": elem.monit.cpu || 0,
          "MEM": elem.monit.memory || 0,
          "PROCESS_ID": elem.pid || 0
        };
        influxInput.push(processObj);
  }
  let [errDb, opEnd] = await to(influxModel.writePoints(influxInput));
  if (errDb){
      console.error(`Write point fail :(,  ${errDb.message}`);
      return wait(startMetricsWorker);
  }
  
  let performance = +new Date() - dateStart;
  console.log(`Write point Success :) operation time: ${performance.toFixed()} msec`);
  wait(startMetricsWorker);
}

function wait(func){
    setTimeout(func, process.env.TIME_TO_UPDATE);
}

/**
 * Start Metrics Worker
 */
startMetricsWorker();


