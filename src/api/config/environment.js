const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const Environment = process.env.NODE_ENV;

// Load env file
if (fs.existsSync(path.join(process.cwd(), `/.env.${Environment}`))) {
	dotenv.config({
		path: `.env.${Environment}`,
	});
} else {
	process.exit(1);
}

module.exports = (function () {
	return {
		PORT: process.env.PORT,
		API_URI: process.env.API_URI,
		WEATHER_API_KEY: process.env.WEATHER_API_KEY,
		WEATHER_URI: process.env.WEATHER_URI,
		DATABASE: process.env.DATABASE,
	};
})();
