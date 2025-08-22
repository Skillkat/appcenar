const { User, ClientProfile, DeliveryProfile, CommerceProfile } = require('../models');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const sendEmail = require('../utils/email');
const { Op } = require('sequelize');

exports.getLogin = (req, res) => {
    console.log('GET /auth/login called');
    if (req.session.userId) {
      console.log('User already logged in, redirecting to:', `/${req.session.role}/home`);
      return res.redirect(`/${req.session.role}/home`);
    }
    res.render('auth/login', { errors: [], bodyMenu: '' });
  };
  
  exports.postLogin = async (req, res, next) => {
    try {
      console.log('POST /auth/login called with:', req.body);
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.render('auth/login', { errors: errors.array(), bodyMenu: '' });
      }
      const { emailOrUsername, password } = req.body;
      console.log('Searching for user with emailOrUsername:', emailOrUsername);
      const user = await User.findOne({ where: { [Op.or]: [{ email: emailOrUsername }, { username: emailOrUsername }] } });
      if (!user) {
        console.log('User not found for:', emailOrUsername);
        return res.render('auth/login', { errors: [{ msg: 'Invalid credentials' }], bodyMenu: '' });
      }
      console.log('User found:', { id: user.id, username: user.username, role: user.role });
      const isValidPassword = await user.validPassword(password);
      console.log('Password valid:', isValidPassword);
      if (!isValidPassword) {
        console.log('Invalid password for user:', user.id);
        return res.render('auth/login', { errors: [{ msg: 'Invalid credentials' }], bodyMenu: '' });
      }
      if (!user.active) {
        console.log('Account inactive for user:', user.id);
        return res.render('auth/login', { errors: [{ msg: 'Account inactive. Check email or contact admin.' }], bodyMenu: '' });
      }
      req.session.userId = user.id;
      req.session.role = user.role;
      console.log('Session set:', { userId: user.id, role: user.role });
      res.redirect(`/${user.role}/home`);
    } catch (error) {
      console.error('Error in postLogin:', error);
      next(error);
    }
  };
exports.getRegisterClientDelivery = async (req, res) => {
  try {
    res.render('auth/registerClientDelivery', { errors: [], bodyMenu: '' });
  } catch (error) {
    console.error('Error in getRegisterClientDelivery:', error);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: '' });
  }
};

exports.postRegisterClientDelivery = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('auth/registerClientDelivery', { errors: errors.array(), bodyMenu: '' });
    }
    const { firstName, lastName, phone, email, username, role, password } = req.body;
    const existingUser = await User.findOne({ where: { [Op.or]: [{ email }, { username }] } });
    if (existingUser) {
      return res.render('auth/registerClientDelivery', { errors: [{ msg: 'Email or username already exists' }], bodyMenu: '' });
    }
    const user = await User.create({ email, username, password, role, activationToken: uuidv4() });
    const photo = req.file ? req.file.filename : null;
    if (role === 'client') {
      await ClientProfile.create({ userId: user.id, firstName, lastName, phone, photo });
    } else {
      await DeliveryProfile.create({ userId: user.id, firstName, lastName, phone, photo });
    }
    await sendEmail(user.email, 'Activate Account', `<a href="${process.env.APP_URL}/auth/activate/${user.activationToken}">Activate</a>`);
    res.render('auth/login', { errors: [{ msg: 'Registration successful. Check email to activate.' }], bodyMenu: '' });
  } catch (error) {
    console.error('Error in postRegisterClientDelivery:', error);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: '' });
  }
};

exports.getRegisterCommerce = async (req, res) => {
  try {
    res.render('auth/registerCommerce', {
      user: {},
      errors: [],
      bodyMenu: ''
    });
  } catch (error) {
    console.error('Error in getRegisterCommerce:', error);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: '' });
  }
};

exports.postRegisterCommerce = async (req, res) => {
  console.log('POST /auth/register-commerce received:', JSON.stringify(req.body, null, 2));
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', JSON.stringify(errors.array(), null, 2));
    return res.render('auth/registerCommerce', {
      user: req.body,
      errors: errors.array(),
      bodyMenu: ''
    });
  }

  const { name, phone, email, openHour, closeHour, password, confirmPassword } = req.body;

  try {
    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      return res.render('auth/registerCommerce', {
        user: req.body,
        errors: [{ msg: 'Passwords do not match' }],
        bodyMenu: ''
      });
    }

    // Crear usuario con rol 'commerce'
    const user = await User.create({
      username: name,
      email,
      password,
      role: 'commerce',
      active: false,
      activationToken: require('crypto').randomBytes(20).toString('hex')
    });

    // Crear perfil del comercio
    console.log('Creating CommerceProfile with:', {
      userId: user.id,
      name,
      phone,
      openHour,
      closeHour
    });
    await CommerceProfile.create({
      userId: user.id,
      name,
      phone,
      openHour,
      closeHour,
      logo: req.file ? req.file.filename : null
    });

    res.redirect('/auth/login');
  } catch (error) {
    console.error('Error in postRegisterCommerce:', error);
    res.render('auth/registerCommerce', {
      user: req.body,
      errors: [{ msg: error.message || 'Registration failed' }],
      bodyMenu: ''
    });
  }
};

exports.getResetRequest = (req, res) => {
  res.render('auth/resetPasswordRequest', { errors: [], bodyMenu: '' });
};

exports.postResetRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('auth/resetPasswordRequest', { errors: errors.array(), bodyMenu: '' });
    }
    const { emailOrUsername } = req.body;
    const user = await User.findOne({ where: { [Op.or]: [{ email: emailOrUsername }, { username: emailOrUsername }] } });
    if (!user) {
      return res.render('auth/resetPasswordRequest', { errors: [{ msg: 'User not found' }], bodyMenu: '' });
    }
    user.resetToken = uuidv4();
    await user.save();
    await sendEmail(user.email, 'Reset Password', `<a href="${process.env.APP_URL}/auth/reset-password/${user.resetToken}">Reset Password</a>`);
    res.render('auth/resetPasswordRequest', { errors: [{ msg: 'Reset link sent to email' }], bodyMenu: '' });
  } catch (error) {
    console.error('Error in postResetRequest:', error);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: '' });
  }
};

exports.getReset = async (req, res) => {
  try {
    const user = await User.findOne({ where: { resetToken: req.params.token } });
    if (!user) {
      return res.render('auth/resetPassword', { errors: [{ msg: 'Invalid or expired token' }], bodyMenu: '' });
    }
    res.render('auth/resetPassword', { errors: [], token: req.params.token, bodyMenu: '' });
  } catch (error) {
    console.error('Error in getReset:', error);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: '' });
  }
};

exports.postReset = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('auth/resetPassword', { errors: errors.array(), token: req.params.token, bodyMenu: '' });
    }
    const { password } = req.body;
    const user = await User.findOne({ where: { resetToken: req.params.token } });
    if (!user) {
      return res.render('auth/resetPassword', { errors: [{ msg: 'Invalid or expired token' }], token: req.params.token, bodyMenu: '' });
    }
    user.password = await bcrypt.hash(password, 10);
    user.resetToken = null;
    await user.save();
    res.render('auth/login', { errors: [{ msg: 'Password reset successful. Please login.' }], bodyMenu: '' });
  } catch (error) {
    console.error('Error in postReset:', error);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: '' });
  }
};

exports.activate = async (req, res) => {
  try {
    const user = await User.findOne({ where: { activationToken: req.params.token } });
    if (user) {
      user.active = true;
      user.activationToken = null;
      await user.save();
      res.render('auth/activate', { message: 'Account activated successfully', bodyMenu: '' });
    } else {
      res.render('auth/activate', { message: 'Invalid or expired token', bodyMenu: '' });
    }
  } catch (error) {
    console.error('Error in activate:', error);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: '' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/auth/login');
};
