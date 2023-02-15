const config = require('../config/environment');

module.exports = {
	PORT: config.PORT,
	API_URI: config.API_URI,
	WEATHER_API_KEY: config.WEATHER_API_KEY,
	WEATHER_URI: config.WEATHER_URI,
	DATABASE: config.DATABASE,
	ACCESS_TOKEN_SECRET: config.ACCESS_TOKEN_SECRET,
	REFRESH_TOKEN_SECRET: config.REFRESH_TOKEN_SECRET,
	ACCESS_TOKEN_EXPIRATION: config.ACCESS_TOKEN_EXPIRATION,
	REFRESH_TOKEN_EXPIRATION: config.REFRESH_TOKEN_EXPIRATION,
	COLLECTIONS: {
		USER: 'User',
	},
};
