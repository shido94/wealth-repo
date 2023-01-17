const express = require('express');
const router = express.Router();
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const swaggerModelValidator = require('swagger-model-validator');
const constant = require('../utils/constant');

const directoryPath = path.join(__dirname, '../../api/routes/');
const paths = [];

const filesName = fs.readdirSync(directoryPath, (err, files) => {
	// handling error
	if (err) {
		return logger.error(`Unable to scan directory: ${err}`);
	}
	// listing all files using forEach
	return files.forEach((file) => paths.push(file));
});
function getFullPaths(names) {
	names.forEach((name) => {
		let customerPath;
		if (name !== 'index') {
			customerPath = `./src/api/routes/${name}`;
		}
		if (!_.isUndefined(name)) {
			paths.push(customerPath);
		}
	});
}

getFullPaths(filesName);

const options = {
	swaggerDefinition: {
		info: {
			title: 'BrokerToBroker',
			version: '1.0.0',
			description: 'BrokerToBroker,REST API with swagger doc',
			contact: {
				email: 'rupesh.yadav@appinventiv.com',
			},
		},
		tags: [
			// {
			// 	name: 'users',
			// 	description: 'Users API',
			// },
		],
		schemes: ['http', 'https'],
		host: `${constant.URI.BROKER_API_URI}`,
		basePath: '/api/v1',
		securityDefinitions: {
			Bearer: {
				type: 'apiKey',
				description: 'JWT authorization of an API',
				name: 'Authorization',
				in: 'header',
			},
		},
	},

	apis: paths,
};
const swaggerSpec = swaggerJSDoc(options);
swaggerModelValidator(swaggerSpec);

router.get('/json', (req, res) => {
	res.setHeader('Content-Type', 'application/json');
	res.send(swaggerSpec);
});

router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

function validateModel(name, model) {
	const responseValidation = swaggerSpec.validateModel(
		name,
		model,
		false,
		true
	);
	if (!responseValidation.valid) {
		throw new Error("Model doesn't match swagger contract");
	}
}

module.exports = {
	router,
	validateModel,
};
