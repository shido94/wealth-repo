const http = require('http');
const { axiosHandler } = require('../handlers');
const request = require('request');
const { constant } = require('../utils');

const getWeatherData = (locations, type) =>
	Promise.all(
		locations.map(
			(value) =>
				new Promise((resolve, reject) => {
					const query = `${type}=${value}`;
					const url = `${constant.WEATHER_URI}/weather?${query}&appid=${constant.WEATHER_API_KEY}`;
					return request.get(url, (err, data) => {
						if (err) return reject(err);
						return resolve(JSON.parse(data.body));
					});
				})
		)
	);

const getCities = async (filter) => {
	try {
		const cities = filter.city.split(',');
		if (filter.type === 'code') {
			filter.type = 'id';
		} else {
			filter.type = 'q';
		}
		const response = await getWeatherData(cities, filter.type);
		return response;
	} catch (error) {
		console.error(error);
		throw error;
	}
};

const getCityForecast = (locations, type, days) =>
	Promise.all(
		locations.map(
			(value) =>
				new Promise((resolve, reject) => {
					const query = `${type}=${value}`;
					const url = `${constant.WEATHER_URI}/forecast?${query}&appid=${constant.WEATHER_API_KEY}&cnt=${days}`;
					return request.get(url, (err, data) => {
						if (err) return reject(err);
						return resolve(JSON.parse(data.body));
					});
				})
		)
	);

const getCitiesForecast = async (filter) => {
	try {
		const cities = filter.city.split(',');
		if (filter.type === 'code') {
			filter.type = 'id';
		} else {
			filter.type = 'q';
		}
		const response = await getCityForecast(
			cities,
			filter.type,
			filter.days
		);

		return response.map((cityData) => {
			return {
				city: cityData.city,
				list: cityData.list.map((data) => {
					return { dt: data.dt, weather: data.weather };
				}),
			};
		});
	} catch (error) {
		console.error(error);
		throw error;
	}
};

module.exports = {
	getCities,
	getCitiesForecast,
};
