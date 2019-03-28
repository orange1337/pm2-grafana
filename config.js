let config = {};

config.DB_HOST 	 		= 'localhost';
config.DB_PORT 	 		= 8086;
config.DB_USER 	 		= 'admin';
config.DB_PASS 	 		= 'admin1337';
config.DB_NAME 	 		= 'PM2_MONITORING';
config.PM2_HOSTS 		= ['http://localhost:9615/'];
config.TIME_TO_UPDATE   = 1000;

module.exports = config;