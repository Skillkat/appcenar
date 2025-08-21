const { User, ClientProfile, DeliveryProfile, CommerceProfile, AdminProfile, CommerceType, Order, Product, Configuration } = require('../models');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

exports.getDashboard = async (req, res) => {
  const totalOrders = await Order.count();
  const todayOrders = await Order.count({ where: { createdAt: { [Op.gte]: new Date().setHours(0, 0, 0, 0) } } });
  const activeCommerces = await CommerceProfile.count({ include: [{ model: User, where: { active: true } }] });
  const inactiveCommerces = await CommerceProfile.count({ include: [{ model: User, where: { active: false } }] });
  const activeClients = await ClientProfile.count({ include: [{ model: User, where: { active: true } }] });
  const inactiveClients = await ClientProfile.count({ include: [{ model: User, where: { active: false } }] });
  const activeDeliveries = await DeliveryProfile.count({ include: [{ model: User, where: { active: true } }] });
  const inactiveDeliveries = await DeliveryProfile.count({ include: [{ model: User, where: { active: false } }] });
  const totalProducts = await Product.count();
  res.render('admin/dashboard', {
    totalOrders,
    todayOrders,
    activeCommerces,
    inactiveCommerces,
    activeClients,
    inactiveClients,
    activeDeliveries,
    inactiveDeliveries,
    totalProducts,
    bodyMenu: 'menuAdmin'
  });
};

exports.getClients = async (req, res) => {
  const clients = await ClientProfile.findAll({
    include: [
      { model: User },
      { model: Order, as: 'ClientOrders', attributes: ['id'] }
    ]
  });
  res.render('admin/clients', { clients, bodyMenu: 'menuAdmin' });
};

exports.toggleClientActive = async (req, res) => {
  const client = await ClientProfile.findByPk(req.params.id, { include: [User] });
  await User.update({ active: !client.User.active }, { where: { id: client.userId } });
  res.redirect('/admin/clients');
};

exports.getDeliveries = async (req, res) => {
  const deliveries = await DeliveryProfile.findAll({
    include: [
      { model: User },
      { model: Order, as: 'DeliveryOrders', attributes: ['id'] }
    ]
  });
  res.render('admin/deliveries', { deliveries, bodyMenu: 'menuAdmin' });
};

exports.toggleDeliveryActive = async (req, res) => {
  const delivery = await DeliveryProfile.findByPk(req.params.id, { include: [User] });
  await User.update({ active: !delivery.User.active }, { where: { id: delivery.userId } });
  res.redirect('/admin/deliveries');
};

exports.getCommerces = async (req, res) => {
  const commerces = await CommerceProfile.findAll({
    include: [
      { model: User },
      { model: Order, as: 'CommerceOrders', attributes: ['id'] }
    ]
  });
  res.render('admin/commerces', { commerces, bodyMenu: 'menuAdmin' });
};

exports.toggleCommerceActive = async (req, res) => {
  const commerce = await CommerceProfile.findByPk(req.params.id, { include: [User] });
  await User.update({ active: !commerce.User.active }, { where: { id: commerce.userId } });
  res.redirect('/admin/commerces');
};

exports.getConfig = async (req, res) => {
  const config = await Configuration.findOne();
  res.render('admin/config', { config, errors: [], bodyMenu: 'menuAdmin' });
};

exports.postConfig = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('admin/config', { config: req.body, errors: errors.array(), bodyMenu: 'menuAdmin' });
  }
  const { itbis } = req.body;
  await Configuration.update({ itbis }, { where: { id: 1 } });
  res.redirect('/admin/config');
};

exports.getAdmins = async (req, res) => {
  const admins = await AdminProfile.findAll({ include: [User] });
  res.render('admin/admins', { admins, bodyMenu: 'menuAdmin' });
};

exports.getNewAdmin = (req, res) => {
  res.render('admin/adminForm', { admin: {}, errors: [], bodyMenu: 'menuAdmin' });
};

exports.postNewAdmin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('admin/adminForm', { admin: req.body, errors: errors.array(), bodyMenu: 'menuAdmin' });
  }
  const { firstName, lastName, idCard, email, username, password } = req.body;
  const existingUser = await User.findOne({ where: { [Op.or]: [{ email }, { username }] } });
  if (existingUser) {
    return res.render('admin/adminForm', { admin: req.body, errors: [{ msg: 'Email or username already exists' }], bodyMenu: 'menuAdmin' });
  }
  const user = await User.create({ email, username, password, role: 'admin', active: true });
  await AdminProfile.create({ userId: user.id, firstName, lastName, idCard });
  res.redirect('/admin/admins');
};

exports.getEditAdmin = async (req, res) => {
  const admin = await AdminProfile.findByPk(req.params.id, { include: [User] });
  if (admin.userId === req.session.userId) {
    return res.redirect('/admin/admins');
  }
  res.render('admin/adminForm', { admin: { ...admin, ...admin.User }, errors: [], bodyMenu: 'menuAdmin' });
};

exports.postEditAdmin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('admin/adminForm', { admin: req.body, errors: errors.array(), bodyMenu: 'menuAdmin' });
  }
  const { firstName, lastName, idCard, email, username, password } = req.body;
  const admin = await AdminProfile.findByPk(req.params.id, { include: [User] });
  if (admin.userId === req.session.userId) {
    return res.redirect('/admin/admins');
  }
  await User.update(
    { email, username, ...(password && { password: await bcrypt.hash(password, 10) }) },
    { where: { id: admin.userId } }
  );
  await AdminProfile.update({ firstName, lastName, idCard }, { where: { id: req.params.id } });
  res.redirect('/admin/admins');
};

exports.toggleAdminActive = async (req, res) => {
  const admin = await AdminProfile.findByPk(req.params.id, { include: [User] });
  if (admin.userId === req.session.userId) {
    return res.redirect('/admin/admins');
  }
  await User.update({ active: !admin.User.active }, { where: { id: admin.userId } });
  res.redirect('/admin/admins');
};

exports.getCommerceTypes = async (req, res) => {
  const commerceTypes = await CommerceType.findAll({
    include: [{ model: CommerceProfile, attributes: ['id'] }]
  });
  res.render('admin/commerceTypes', { commerceTypes, bodyMenu: 'menuAdmin' });
};

exports.getNewCommerceType = (req, res) => {
  res.render('admin/commerceTypeForm', { commerceType: {}, errors: [], bodyMenu: 'menuAdmin' });
};

exports.postNewCommerceType = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('admin/commerceTypeForm', { commerceType: req.body, errors: errors.array(), bodyMenu: 'menuAdmin' });
  }
  const { name, description } = req.body;
  const icon = req.file ? req.file.filename : null;
  await CommerceType.create({ name, description, icon });
  res.redirect('/admin/commerce-types');
};

exports.getEditCommerceType = async (req, res) => {
  const commerceType = await CommerceType.findByPk(req.params.id);
  res.render('admin/commerceTypeForm', { commerceType, errors: [], bodyMenu: 'menuAdmin' });
};

exports.postEditCommerceType = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('admin/commerceTypeForm', { commerceType: req.body, errors: errors.array(), bodyMenu: 'menuAdmin' });
  }
  const { name, description } = req.body;
  const icon = req.file ? req.file.filename : null;
  await CommerceType.update(
    { name, description, ...(icon && { icon }) },
    { where: { id: req.params.id } }
  );
  res.redirect('/admin/commerce-types');
};

exports.getDeleteCommerceType = async (req, res) => {
  const commerceType = await CommerceType.findByPk(req.params.id);
  res.render('admin/deleteCommerceType', { commerceType, bodyMenu: 'menuAdmin' });
};

exports.postDeleteCommerceType = async (req, res) => {
  await CommerceType.destroy({ where: { id: req.params.id } });
  res.redirect('/admin/commerce-types');
};