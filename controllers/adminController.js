const { User, ClientProfile, DeliveryProfile, CommerceProfile, AdminProfile, Order, Product, Configuration } = require('../models');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

exports.getDashboard = async (req, res) => {
  try {
    console.log('GET /admin/home called for userId:', req.session.userId);
    const totalOrders = await Order.count();
    const todayOrders = await Order.count({ where: { createdAt: { [Op.gte]: new Date().setHours(0, 0, 0, 0) } } });
    const activeCommerces = await CommerceProfile.count({ include: [{ model: User, as: 'User', where: { active: true } }] });
    const inactiveCommerces = await CommerceProfile.count({ include: [{ model: User, as: 'User', where: { active: false } }] });
    const activeClients = await ClientProfile.count({ include: [{ model: User, as: 'User', where: { active: true } }] });
    const inactiveClients = await ClientProfile.count({ include: [{ model: User, as: 'User', where: { active: false } }] });
    const activeDeliveries = await DeliveryProfile.count({ include: [{ model: User, as: 'User', where: { active: true } }] });
    const inactiveDeliveries = await DeliveryProfile.count({ include: [{ model: User, as: 'User', where: { active: false } }] });
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
  } catch (error) {
    console.error('Error in getDashboard:', error.message, error.stack);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuAdmin' });
  }
};

exports.getClients = async (req, res) => {
  try {
    console.log('GET /admin/clients called for userId:', req.session.userId);
    const clients = await ClientProfile.findAll({
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'email', 'active'],
          include: [
            { model: Order, as: 'Orders', attributes: ['id'], required: false }
          ]
        }
      ]
    });
    res.render('admin/clients', { clients: clients.map(client => client.get({ plain: true })), bodyMenu: 'menuAdmin' });
  } catch (error) {
    console.error('Error in getClients:', error.message, error.stack);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuAdmin' });
  }
};

exports.toggleClientActive = async (req, res) => {
  try {
    console.log('POST /admin/client/:id/toggle-active called, clientId:', req.params.id);
    const client = await ClientProfile.findByPk(req.params.id, { include: [{ model: User, as: 'User' }] });
    if (!client) {
      console.log('Client not found for id:', req.params.id);
      return res.status(404).render('error', { error: 'Client not found', bodyMenu: 'menuAdmin' });
    }
    await User.update({ active: !client.User.active }, { where: { id: client.userId } });
    console.log('Client active status toggled:', client.userId, 'new active:', !client.User.active);
    res.redirect('/admin/clients');
  } catch (error) {
    console.error('Error in toggleClientActive:', error.message, error.stack);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuAdmin' });
  }
};

exports.getDeliveries = async (req, res) => {
  try {
    console.log('GET /admin/deliveries called for userId:', req.session.userId);
    const deliveries = await DeliveryProfile.findAll({
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'email', 'active'],
          include: [
            { model: Order, as: 'Delivery', attributes: ['id'], required: false }
          ]
        }
      ]
    });
    res.render('admin/deliveries', { deliveries: deliveries.map(delivery => delivery.get({ plain: true })), bodyMenu: 'menuAdmin' });
  } catch (error) {
    console.error('Error in getDeliveries:', error.message, error.stack);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuAdmin' });
  }
};

exports.toggleDeliveryActive = async (req, res) => {
  try {
    console.log('POST /admin/delivery/:id/toggle-active called, deliveryId:', req.params.id);
    const delivery = await DeliveryProfile.findByPk(req.params.id, { include: [{ model: User, as: 'User' }] });
    if (!delivery) {
      console.log('Delivery not found for id:', req.params.id);
      return res.status(404).render('error', { error: 'Delivery not found', bodyMenu: 'menuAdmin' });
    }
    await User.update({ active: !delivery.User.active }, { where: { id: delivery.userId } });
    console.log('Delivery active status toggled:', delivery.userId, 'new active:', !delivery.User.active);
    res.redirect('/admin/deliveries');
  } catch (error) {
    console.error('Error in toggleDeliveryActive:', error.message, error.stack);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuAdmin' });
  }
};

exports.getCommerces = async (req, res) => {
  try {
    console.log('GET /admin/commerces called for userId:', req.session.userId);
    const commerces = await CommerceProfile.findAll({
      include: [
        { model: User, as: 'User', attributes: ['id', 'email', 'active'] },
        { model: Order, as: 'Commerce', attributes: ['id'], required: false }
      ]
    });
    res.render('admin/commerces', { commerces: commerces.map(commerce => commerce.get({ plain: true })), bodyMenu: 'menuAdmin' });
  } catch (error) {
    console.error('Error in getCommerces:', error.message, error.stack);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuAdmin' });
  }
};

exports.toggleCommerceActive = async (req, res) => {
  try {
    console.log('POST /admin/commerce/:id/toggle-active called, commerceId:', req.params.id);
    const commerce = await CommerceProfile.findByPk(req.params.id, { include: [{ model: User, as: 'User' }] });
    if (!commerce) {
      console.log('Commerce not found for id:', req.params.id);
      return res.status(404).render('error', { error: 'Commerce not found', bodyMenu: 'menuAdmin' });
    }
    await User.update({ active: !commerce.User.active }, { where: { id: commerce.userId } });
    console.log('Commerce active status toggled:', commerce.userId, 'new active:', !commerce.User.active);
    res.redirect('/admin/commerces');
  } catch (error) {
    console.error('Error in toggleCommerceActive:', error.message, error.stack);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuAdmin' });
  }
};

exports.getNewCommerce = async (req, res) => {
  try {
    console.log('GET /admin/commerce/new called for userId:', req.session.userId);
    res.render('admin/commerceForm', { commerce: {}, errors: [], bodyMenu: 'menuAdmin' });
  } catch (error) {
    console.error('Error in getNewCommerce:', error.message, error.stack);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuAdmin' });
  }
};

exports.postNewCommerce = async (req, res) => {
  try {
    console.log('POST /admin/commerce/new called, body:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.render('admin/commerceForm', { commerce: req.body, errors: errors.array(), bodyMenu: 'menuAdmin' });
    }
    const { name, phone, email, openHour, closeHour, username, password } = req.body;
    const existingUser = await User.findOne({ where: { [Op.or]: [{ email }, { username }] } });
    if (existingUser) {
      console.log('User already exists:', email, username);
      return res.render('admin/commerceForm', { commerce: req.body, errors: [{ msg: 'Email or username already exists' }], bodyMenu: 'menuAdmin' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, username, password: hashedPassword, role: 'commerce', active: true, createdAt: new Date(), updatedAt: new Date() });
    await CommerceProfile.create({
      userId: user.id,
      name,
      phone,
      openHour,
      closeHour,
      logo: req.file ? req.file.filename : null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('New commerce created:', user.id);
    res.redirect('/admin/commerces');
  } catch (error) {
    console.error('Error in postNewCommerce:', error.message, error.stack);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuAdmin' });
  }
};

exports.getEditCommerce = async (req, res) => {
  try {
    console.log('GET /admin/commerce/edit/:id called, commerceId:', req.params.id);
    const commerce = await CommerceProfile.findByPk(req.params.id, { include: [{ model: User, as: 'User' }] });
    if (!commerce) {
      console.log('Commerce not found for id:', req.params.id);
      return res.status(404).render('error', { error: 'Commerce not found', bodyMenu: 'menuAdmin' });
    }
    res.render('admin/commerceForm', { commerce: { ...commerce.get({ plain: true }), ...commerce.User.get({ plain: true }) }, errors: [], bodyMenu: 'menuAdmin' });
  } catch (error) {
    console.error('Error in getEditCommerce:', error.message, error.stack);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuAdmin' });
  }
};

exports.postEditCommerce = async (req, res) => {
  try {
    console.log('POST /admin/commerce/edit/:id called, commerceId:', req.params.id, 'body:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.render('admin/commerceForm', { commerce: req.body, errors: errors.array(), bodyMenu: 'menuAdmin' });
    }
    const { name, phone, email, openHour, closeHour, username, password } = req.body;
    const commerce = await CommerceProfile.findByPk(req.params.id, { include: [{ model: User, as: 'User' }] });
    if (!commerce) {
      console.log('Commerce not found for id:', req.params.id);
      return res.status(404).render('error', { error: 'Commerce not found', bodyMenu: 'menuAdmin' });
    }
    await User.update(
      { email, username, ...(password && { password: await bcrypt.hash(password, 10) }) },
      { where: { id: commerce.userId } }
    );
    await CommerceProfile.update(
      { name, phone, openHour, closeHour, logo: req.file ? req.file.filename : commerce.logo },
      { where: { id: req.params.id } }
    );
    console.log('Commerce updated:', commerce.userId);
    res.redirect('/admin/commerces');
  } catch (error) {
    console.error('Error in postEditCommerce:', error.message, error.stack);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuAdmin' });
  }
};

exports.getConfig = async (req, res) => {
  try {
    console.log('GET /admin/config called for userId:', req.session.userId);
    const config = await Configuration.findOne();
    res.render('admin/config', { config: config ? config.get({ plain: true }) : null, errors: [], bodyMenu: 'menuAdmin' });
  } catch (error) {
    console.error('Error in getConfig:', error.message, error.stack);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuAdmin' });
  }
};

exports.postConfig = async (req, res) => {
  try {
    console.log('POST /admin/config called, body:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.render('admin/config', { config: req.body, errors: errors.array(), bodyMenu: 'menuAdmin' });
    }
    const { itbis } = req.body;
    await Configuration.update({ itbis }, { where: { id: 1 } });
    console.log('Configuration updated, itbis:', itbis);
    res.redirect('/admin/config');
  } catch (error) {
    console.error('Error in postConfig:', error.message, error.stack);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuAdmin' });
  }
};

exports.getAdmins = async (req, res) => {
  try {
    console.log('GET /admin/admins called for userId:', req.session.userId);
    const admins = await AdminProfile.findAll({ include: [{ model: User, as: 'User' }] });
    res.render('admin/admins', { admins: admins.map(admin => admin.get({ plain: true })), bodyMenu: 'menuAdmin' });
  } catch (error) {
    console.error('Error in getAdmins:', error.message, error.stack);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuAdmin' });
  }
};

exports.getNewAdmin = (req, res) => {
  console.log('GET /admin/admin/new called for userId:', req.session.userId);
  res.render('admin/adminForm', { admin: {}, errors: [], bodyMenu: 'menuAdmin' });
};

exports.postNewAdmin = async (req, res) => {
  try {
    console.log('POST /admin/admin/new called, body:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.render('admin/adminForm', { admin: req.body, errors: errors.array(), bodyMenu: 'menuAdmin' });
    }
    const { firstName, lastName, idCard, email, username, password } = req.body;
    const existingUser = await User.findOne({ where: { [Op.or]: [{ email }, { username }] } });
    if (existingUser) {
      console.log('User already exists:', email, username);
      return res.render('admin/adminForm', { admin: req.body, errors: [{ msg: 'Email or username already exists' }], bodyMenu: 'menuAdmin' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, username, password: hashedPassword, role: 'admin', active: true, createdAt: new Date(), updatedAt: new Date() });
    await AdminProfile.create({ userId: user.id, firstName, lastName, idCard, createdAt: new Date(), updatedAt: new Date() });
    console.log('New admin created:', user.id);
    res.redirect('/admin/admins');
  } catch (error) {
    console.error('Error in postNewAdmin:', error.message, error.stack);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuAdmin' });
  }
};

exports.getEditAdmin = async (req, res) => {
  try {
    console.log('GET /admin/admin/edit/:id called, adminId:', req.params.id);
    const admin = await AdminProfile.findByPk(req.params.id, { include: [{ model: User, as: 'User' }] });
    if (!admin) {
      console.log('Admin not found for id:', req.params.id);
      return res.status(404).render('error', { error: 'Admin not found', bodyMenu: 'menuAdmin' });
    }
    if (admin.userId === req.session.userId) {
      console.log('Cannot edit own admin profile:', req.session.userId);
      return res.redirect('/admin/admins');
    }
    res.render('admin/adminForm', { admin: { ...admin.get({ plain: true }), ...admin.User.get({ plain: true }) }, errors: [], bodyMenu: 'menuAdmin' });
  } catch (error) {
    console.error('Error in getEditAdmin:', error.message, error.stack);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuAdmin' });
  }
};

exports.postEditAdmin = async (req, res) => {
  try {
    console.log('POST /admin/admin/edit/:id called, adminId:', req.params.id, 'body:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.render('admin/adminForm', { admin: req.body, errors: errors.array(), bodyMenu: 'menuAdmin' });
    }
    const { firstName, lastName, idCard, email, username, password } = req.body;
    const admin = await AdminProfile.findByPk(req.params.id, { include: [{ model: User, as: 'User' }] });
    if (!admin) {
      console.log('Admin not found for id:', req.params.id);
      return res.status(404).render('error', { error: 'Admin not found', bodyMenu: 'menuAdmin' });
    }
    if (admin.userId === req.session.userId) {
      console.log('Cannot edit own admin profile:', req.session.userId);
      return res.redirect('/admin/admins');
    }
    await User.update(
      { email, username, ...(password && { password: await bcrypt.hash(password, 10) }) },
      { where: { id: admin.userId } }
    );
    await AdminProfile.update({ firstName, lastName, idCard }, { where: { id: req.params.id } });
    console.log('Admin updated:', admin.userId);
    res.redirect('/admin/admins');
  } catch (error) {
    console.error('Error in postEditAdmin:', error.message, error.stack);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuAdmin' });
  }
};

exports.toggleAdminActive = async (req, res) => {
  try {
    console.log('POST /admin/admin/:id/toggle-active called, adminId:', req.params.id);
    const admin = await AdminProfile.findByPk(req.params.id, { include: [{ model: User, as: 'User' }] });
    if (!admin) {
      console.log('Admin not found for id:', req.params.id);
      return res.status(404).render('error', { error: 'Admin not found', bodyMenu: 'menuAdmin' });
    }
    if (admin.userId === req.session.userId) {
      console.log('Cannot toggle own admin active status:', req.session.userId);
      return res.redirect('/admin/admins');
    }
    await User.update({ active: !admin.User.active }, { where: { id: admin.userId } });
    console.log('Admin active status toggled:', admin.userId, 'new active:', !admin.User.active);
    res.redirect('/admin/admins');
  } catch (error) {
    console.error('Error in toggleAdminActive:', error.message, error.stack);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuAdmin' });
  }
};