/**
 * Monitoring metrics of PM2, created by orange1337
 */

const request = require('request-promise')
const Influx  = require('influx');
const config  = require('./config'); 
const URL     = require('url').URL;

const influxModel = new Influx.InfluxDB({
    host: config.DB_HOST,
    port: config.DB_PORT,
    username: config.DB_USER,
    password: config.DB_PASS,
    database: config.DB_NAME,
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
async function startMetricsWorker(host){
  let url = new URL(host);
  let dateStart = +new Date();
  let options = {
      uri: host,
      method: 'GET',
      json: true
  }

  let [errReq, pm2Res] = await to(request(options));
  if (errReq){
     console.error(errReq);
     return wait(startMetricsWorker, host);
  }
  if (!pm2Res.processes){
     console.error(`pm2Res.processes error`, pm2Res.processes);
     return wait(startMetricsWorker, host);
  }

  let influxInput = [];
  let counterCluster = 0;
  for(let elem of pm2Res.processes){
       if (elem){
        let processObj = {};
        let uniqueClusterId = '';
        if (elem.pm2_env.exec_mode === 'cluster_mode'){
            uniqueClusterId = `_${counterCluster += 1}`;
        }
        processObj['measurement'] = 'pm2-node';
        processObj['tags'] = {
          "host": `${elem.name}_${url.hostname}${uniqueClusterId}` || null
        };
        processObj['fields'] = {
          "NAME": elem.name || null,
          "CPU": elem.monit.cpu || 0,
          "MEM": elem.monit.memory || 0,
          "PROCESS_ID": elem.pid || 0
        };
        influxInput.push(processObj);
      }
  }
  let [errDb, opEnd] = await to(influxModel.writePoints(influxInput));
  if (errDb){
      console.error(`Write point fail :(,  ${errDb.message}`);
      return wait(startMetricsWorker, host);
  }
  let performance = +new Date() - dateStart;
  console.log(`[Success ${host}] op time: ${performance.toFixed()} msec`);
  wait(startMetricsWorker, host);
}

function wait(func, host){
    setTimeout(() => { func(host) }, config.TIME_TO_UPDATE);
}

/**
 * Start Metrics Workers
 */
config.PM2_HOSTS.forEach(host => {
    startMetricsWorker(host);
});




