const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const responseHandler = require('../utils/responseHandler');
const commonUtils = require('../utils/common');

const { authService } = require('../services');

const constMsg = require('../utils/response.message');

const register = catchAsync(async (req, res) => {
	const body = req.body;

	/**
	 * Check If email is invited
	 */
	if (
		body.email &&
		(await userService.getUserByEmail(body.email)) &&
		(await authService.checkIfUserIsInvited(body))
	) {
		return acceptUserInvitation(req, res);
	}

	// Check if user already exist with email or mobile
	await authService.checkUserWithEmailOrMobile(body.email, body.mobile);

	/**
	 * Generate OTP
	 */
	body.otp = commonUtils.randomNumberGenerator(4); // Pass OTP Length
	const token = await tokenService.generatePayloadToken(body);

	/**
	 * User user has entered mobile then send the OTP
	 */
	if (body.mobile) {
		await otpService.sendVerificationOtp(body.mobile, body.otp);

		Logger.info('Otp has been sent successfully');
		return responseHandler.sendSuccess(
			res,
			httpStatus.OK,
			{ token },
			constMsg.OTP_SEND_MOBILE
		);
	}

	// Send Verification email to the user
	await emailService.sendRegistrationEmail(body.email, body.otp);
	Logger.info(`Otp has been send to your email =>  ${body.email}`);
	return responseHandler.sendSuccess(
		res,
		httpStatus.OK,
		{ token },
		constMsg.OTP_SEND_EMAIL
	);
});

const login = catchAsync(async (req, res) => {
	const { email, mobile, password } = req.body;

	let user = {};
	if (email) {
		user = await authService.loginUserWithEmailAndPassword(email, password);
	} else {
		user = await authService.loginUserWithMobileAndPassword(
			mobile,
			password
		);
	}

	Logger.info('User found');

	const tokens = await tokenService.generateAuthTokens(user._id);
	Logger.info('Token Generated');

	Logger.info('User has logged-in successfully');

	/**
	 * Update User device token
	 */
	await userService.updateDeviceToken(user._id, req.body);

	const securedUser = userService.removeExtraFields(user);

	return responseHandler.sendSuccess(
		res,
		httpStatus.OK,
		{ user: securedUser, tokens },
		'You have logged-in successfully'
	);
});

module.exports = {
	login,
	register,
};
