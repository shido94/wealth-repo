const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const commonUtils = require('../utils/common');
const userService = require('./user.service');
const tokenService = require('./token.service');
const constMsg = require('../utils/response.message');
const adminService = require('./admin.service');
const otpService = require('./otp.service');
const notificationService = require('./notification.service');

/**
 * Login with mobile and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUserWithMobileAndPassword = async (mobile, password) => {
	Logger.info('Inside loginUserWithMobileAndPassword');
	const user = await userService.getUserByMobile(mobile);

	if (!user) {
		Logger.error(constMsg.INCORRECT_MOBILE);
		throw new ApiError(httpStatus.UNAUTHORIZED, constMsg.INCORRECT_MOBILE);
	}
	if (user.isBlocked) {
		Logger.error(constMsg.BLOCKED_USER);
		throw new ApiError(httpStatus.NOT_ACCEPTABLE, constMsg.BLOCKED_USER);
	}
	if (!user.isMobileVerified) {
		Logger.error(constMsg.UNVERIFIED_MOBILE);
		throw new ApiError(httpStatus.UNAUTHORIZED, constMsg.UNVERIFIED_MOBILE);
	}
	if (!(await user.isPasswordMatch(password))) {
		Logger.error(constMsg.INCORRECT_PASSWORD);
		throw new ApiError(
			httpStatus.UNAUTHORIZED,
			constMsg.INCORRECT_PASSWORD
		);
	}
	return user;
};

/**
 * Login with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUserWithEmailAndPassword = async (email, password) => {
	Logger.info('Inside loginUserWithEmailAndPassword');
	const user = await userService.getUserByEmail(email);

	if (!user) {
		Logger.error(constMsg.INCORRECT_EMAIL);
		throw new ApiError(httpStatus.UNAUTHORIZED, constMsg.INCORRECT_EMAIL);
	}
	if (user.isBlocked) {
		Logger.error(constMsg.BLOCKED_USER);
		throw new ApiError(httpStatus.NOT_ACCEPTABLE, constMsg.BLOCKED_USER);
	}
	if (!user.isEmailVerified) {
		Logger.error(constMsg.UNVERIFIED_EMAIL);
		throw new ApiError(httpStatus.UNAUTHORIZED, constMsg.UNVERIFIED_EMAIL);
	}
	if (!(await user.isPasswordMatch(password))) {
		Logger.error(constMsg.INCORRECT_PASSWORD);
		throw new ApiError(
			httpStatus.UNAUTHORIZED,
			constMsg.INCORRECT_PASSWORD
		);
	}
	return user;
};

/**
 * Admin Login with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const adminLoginUserWithEmailAndPassword = async (email, password) => {
	Logger.info('Inside adminLoginUserWithEmailAndPassword');
	const user = await userService.getUserByEmail(email);

	if (!user) {
		throw new ApiError(httpStatus.UNAUTHORIZED, constMsg.ADMIN_LOGIN_ERROR);
	}
	if (!(await user.isPasswordMatch(password)) || !(user.role === 'admin')) {
		throw new ApiError(httpStatus.UNAUTHORIZED, constMsg.ADMIN_LOGIN_ERROR);
	}
	return user;
};

/**
 * forgot password
 * @param {string} email
 * @param {string} mobile
 * @returns {Promise<User>}
 */
const forgotPassword = async (email, mobile) => {
	Logger.info('Inside forgotPassword ' + email + ' ' + mobile);
	const user = await userService.getUserByEmailOrMobile(email, mobile);
	if (!user) {
		Logger.error('User not found');
		throw new ApiError(httpStatus.NOT_FOUND, constMsg.NO_USER_FOUND);
	}

	if (user.role !== 'user') {
		Logger.error('Not a user account');
		throw new ApiError(httpStatus.BAD_REQUEST, constMsg.INVALID_USER);
	}

	const payload = {
		sub: user._id,
	};

	if (mobile) {
		let otp = commonUtils.randomNumberGenerator(4); // Pass OTP Length

		await otpService.forgotPasswordOtp(mobile, otp);
		payload.otp = otp;
		payload.mobile = mobile;
	} else {
		payload.email = email;
	}

	const resetPasswordToken = await tokenService.generateResetPasswordToken(
		payload
	);
	return { resetPasswordToken, userId: user._id };
};

/**
 * admin forgot password
 * @param {string} email
 * @returns {Promise<User>}
 */
const adminForgotPassword = async (email) => {
	Logger.info('Inside adminForgotPassword ' + email);
	const user = await userService.getUserByEmail(email);
	if (!user) {
		throw new ApiError(httpStatus.NOT_FOUND, constMsg.NO_USER_FOUND);
	}

	if (user.role !== 'admin') {
		throw new ApiError(httpStatus.UNAUTHORIZED, constMsg.INCORRECT_EMAIL);
	}

	const payload = {
		sub: user._id,
	};

	const resetPasswordToken = await tokenService.generateResetPasswordToken(
		payload
	);
	return { resetPasswordToken, userId: user._id };
};

/**
 * Verify Otp
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const verifyOtp = async (payloadOtp, otp) => {
	Logger.info('Inside verifyOtp');

	if (payloadOtp == otp) {
		return;
	}
	throw new ApiError(httpStatus.BAD_REQUEST, constMsg.INCORRECT_OTP);
};

/**
 * Get user with email or mobile
 * @param {string} email
 * @param {string} mobile
 * @returns true/false
 */
const checkUserWithEmailOrMobile = async (email, mobile) => {
	Logger.debug(
		'Inside checkUserWithEmailOrMobile, Email = ' +
			email +
			' and Mobile = ' +
			mobile
	);

	const user = await userService.getUserByEmailOrMobile(email, mobile);
	if (user) {
		throw new ApiError(httpStatus.CONFLICT, constMsg.USER_ALREADY_EXIST);
	}

	Logger.info('User not found inside checkUserWithEmailOrMobile ');
	return true;
};

/**
 * Check if user is invited via email
 * @param {string} email
 * @param {string} mobile
 * @returns true/false
 */
const checkIfUserIsInvited = async ({ email }) => {
	Logger.debug('Inside CheckIfUserIsInvited');

	const user = await userService.getUserByEmail(email);
	if (!user) {
		Logger.error(`This email is not invited, Please enter the valid email`);
		throw new ApiError(httpStatus.NOT_FOUND, constMsg.EMAIL_NOT_INVITED);
	}

	Logger.info('User found with the given email');

	if (!user.invitedByEmail) {
		Logger.error(`This email is not invited, Please enter the valid email`);
		throw new ApiError(httpStatus.BAD_REQUEST, constMsg.EMAIL_NOT_INVITED);
	}

	Logger.info('This email is invited');

	if (user.invitationAccepted) {
		Logger.error(`You've already created your account with this email`);
		throw new ApiError(
			httpStatus.BAD_REQUEST,
			constMsg.INVITATION_ALREADY_ACCEPTED
		);
	}

	return user;
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
const refreshAuth = async (refreshToken) => {
	try {
		const refreshTokenDoc = await tokenService.verifyRefreshToken(
			refreshToken
		);

		Logger.info('refreshTokenDoc ' + refreshTokenDoc);
		const user = await userService.getUserById(refreshTokenDoc.sub);
		if (!user) {
			throw new Error();
		}
		return tokenService.generateAuthTokens(user._id);
	} catch (error) {
		throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
	}
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @returns {Promise}
 */
const resetPassword = async (resetPasswordToken, newPassword) => {
	const payload = await tokenService.verifyAccessToken(resetPasswordToken);
	Logger.info('ResetPassword Payload ', payload);

	const user = await userService.getUserById(payload.sub);
	if (!user) {
		Logger.info('User not found to reset password');
		throw new ApiError(httpStatus.BAD_REQUEST, constMsg.INVALID_LINK);
	}
	if (!user.token || user.token != resetPasswordToken) {
		Logger.info('Token not match in reset password');
		throw new ApiError(httpStatus.BAD_REQUEST, constMsg.EXPIRED_LINK);
	}
	await userService.updateUserById(user._id, { password: newPassword });
	Logger.info('Password Updated successfully');
	await updateTokenInDB(user._id, '');
	return user;
};

/**
 * verify reset otp
 * @param {string} resetPasswordToken
 * @param {string} otp
 * @returns {Promise}
 */
const verifyResetOtp = async (resetPasswordToken, otp) => {
	const payload = await tokenService.verifyAccessToken(resetPasswordToken);
	Logger.info('verifyResetOtp Payload ', payload);

	if (!payload || payload.otp != otp) {
		Logger.error('verifyResetOtp error');
		throw new ApiError(httpStatus.BAD_REQUEST, 'Incorrect otp');
	}

	const user = await userService.getUserById(payload.sub);
	if (!user) {
		throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid Request');
	}
	const resetToken = await tokenService.generateResetPasswordToken({
		sub: user._id,
	});

	Logger.info('Reset Token Generated');

	return { resetToken, userId: user._id };
};

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise}
 */
const verifyEmail = async (verifyEmailToken) => {
	const payload = await tokenService.verifyAccessToken(verifyEmailToken);
	Logger.info('Token verified');

	let token;
	if (payload && payload.email) {
		const userFromDb = await userService.getUserByEmail(payload.email);
		if (userFromDb) {
			Logger.error('Link has been expired');
			throw new ApiError(httpStatus.BAD_REQUEST, constMsg.EXPIRED_LINK);
		}
		Logger.info('New Account created with email');

		const data = {
			email: payload.email,
			password: payload.password,
			isEmailVerified: true,
		};

		/**
		 * Add Approval Status
		 */
		const adminSetting = await adminService.getSetting();
		if (adminSetting && adminSetting.autoApproved) {
			data.approvalStatus = 2;
		}

		let user = await userService.createUser(data);

		return user;
	} else {
		throw new ApiError(httpStatus.BAD_REQUEST, constMsg.EXPIRED_LINK);
	}
};

/**
 * Accept Invitation
 * @param {string} userId
 * @param {Object} body
 * @returns {Promise}
 */
const acceptInvitation = async (userId, body) => {
	Logger.info('Inside acceptInvitation');
	await userService.updateUserById(userId, {
		email: body.email,
		password: body.password,
		mobile: body.mobile,
		isEmailVerified: true,
		invitationAccepted: true,
		invitationAcceptedOn: new Date(),
	});
};

/**
 * Update Token In DB
 * @param {string} userId
 * @param {Object} token
 * @returns {Promise}
 */
const updateTokenInDB = async (userId, token) => {
	Logger.info('Inside updateTokenInDB', token);
	await userService.updateUserById(userId, {
		token: token,
	});
};

/**
 * Add delete comp notification
 * @param {Object} comp
 * @param {Object} userData
 * @returns {Promise<Comp>}
 */
const sendInvitationNotification = async (user) => {
	Logger.info('Inside sendInvitationNotification');

	const receivers = [user.invitedBy];

	Logger.info('invitation Receiver ids fetched');
	Logger.debug(receivers);

	if (receivers.length) {
		Logger.info('Sending invitation accepted notification');

		const notificationBody = {
			receiverIds: receivers,
			type: 5, // invitation accepted
			title: constMsg.INVITATION_ACCEPTED,
			description: `${user.name} has on-boarded using your invitation link.`,
			userId: user.invitedBy,
		};

		await notificationService.saveGeneratedNotifications(
			user._id,
			notificationBody,
			userService.getUsersDeviceToken
		);

		Logger.info('Delete Notification has been sent');
	}
};

module.exports = {
	loginUserWithEmailAndPassword,
	loginUserWithMobileAndPassword,
	adminLoginUserWithEmailAndPassword,
	checkUserWithEmailOrMobile,
	checkIfUserIsInvited,
	verifyOtp,
	resetPassword,
	verifyResetOtp,
	forgotPassword,
	adminForgotPassword,
	refreshAuth,
	verifyEmail,
	acceptInvitation,
	updateTokenInDB,
	sendInvitationNotification,
};
