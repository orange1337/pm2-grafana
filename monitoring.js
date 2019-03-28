require('dotenv').config()
const cron    = require('node-cron')
const async   = require('async');
const request = require('request')
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

/*
* Node scheduler which runs on every 10 seconds.
*/
const indentify_node_process = cron.schedule(`*/${process.env.TIME_TO_UPDATE}} * * * * *`, () => {
  console.log("indentify_node_process called()");
  pm2Data().then( (pm2Response) => {
    let pm2DataResponse = JSON.parse(pm2Response);
    async.map(pm2DataResponse.processes, (process, callback) => {
      if (process) {
        let influx_input = {};
        influx_input['measurement'] = 'pm2-node';
        influx_input['tags'] = {
          "host": process.name || null
        };
        influx_input['fields'] = {
          "NAME": process.name || null,
          "CPU": process.monit.cpu || 0,
          "MEM": process.monit.memory || 0,
          "PROCESS_ID": process.pid || 0
        };
        callback(null, influx_input);
      } else {
        callback("Error", null);
      }
    }, (err, result) => {
      if (err) {
        console.log("Err :: ", err);
      } else {
        influxModel.writePoints(result)
          .then(() => {
              console.log('write point success');
          }).catch(err => console.error(`write point fail,  ${err.message}`));
      }
    });
  },  (rejectedValue) => {
      console.log("rejectedValue :: ", rejectedValue);
  }).catch((err) => {
      console.log(err);
  });

}, false);


/*
* this function make request to your pm2 microservices server and 
* get all the data of all microservices. 
*/
function pm2Data(){
  return new Promise((resolve, reject) => {
    request({
      method: "GET",
      url: `http://${process.env.PM2_HOST}/`
    }, function (error, response, body) {
      if (error) {
        reject();
      } else if (response && response.statusCode == 200) {
        resolve(body);
      } else {
        console.log("Did not get any response!");
        reject();
      }
    });
  });
};


indentify_node_process.start();


