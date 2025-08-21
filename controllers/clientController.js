const { User, CommerceType, CommerceProfile, Category, Product, Address, Favorite, Order, OrderProduct, Configuration } = require('../models');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');

exports.getHome = async (req, res) => {
  const commerceTypes = await CommerceType.findAll();
  res.render('client/home', { commerceTypes, bodyMenu: 'menuClient' });
};

exports.getCommerceList = async (req, res) => {
  const { typeId } = req.params;
  const search = req.query.search || '';
  const commerces = await CommerceProfile.findAll({
    where: { commerceTypeId: typeId, [Op.or]: [{ name: { [Op.like]: `%${search}%` } }] },
    include: [{ model: User, where: { active: true } }]
  });
  const favorites = await Favorite.findAll({ where: { clientId: req.session.userId } });
  res.render('client/commerceList', { commerces, typeId, favorites, bodyMenu: 'menuClient' });
};

exports.getCatalog = async (req, res) => {
  const { commerceId } = req.params;
  const categories = await Category.findAll({ where: { commerceId } });
  const products = await Product.findAll({ where: { categoryId: categories.map(c => c.id) } });
  const cart = req.session.cart || [];
  res.render('client/catalog', { commerce: await CommerceProfile.findByPk(commerceId), categories, products, cart, bodyMenu: 'menuClient' });
};

exports.addToCart = async (req, res) => {
  const { productId } = req.body;
  const product = await Product.findByPk(productId);
  req.session.cart = req.session.cart || [];
  if (!req.session.cart.find(item => item.productId == productId)) {
    req.session.cart.push({ productId, name: product.name, price: product.price });
  }
  res.redirect(`/client/catalog/${req.params.commerceId}`);
};

exports.removeFromCart = async (req, res) => {
  const { productId } = req.body;
  req.session.cart = (req.session.cart || []).filter(item => item.productId != productId);
  res.redirect(`/client/catalog/${req.params.commerceId}`);
};

exports.getSelectAddress = async (req, res) => {
  const { commerceId } = req.params;
  const addresses = await Address.findAll({ where: { clientId: req.session.userId } });
  const cart = req.session.cart || [];
  const config = await Configuration.findOne();
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const itbisAmount = subtotal * (config.itbis / 100);
  const total = subtotal + itbisAmount;
  res.render('client/selectAddress', { commerce: await CommerceProfile.findByPk(commerceId), addresses, cart, subtotal, itbisAmount, total, bodyMenu: 'menuClient' });
};

exports.postSelectAddress = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const { commerceId } = req.params;
    const addresses = await Address.findAll({ where: { clientId: req.session.userId } });
    const cart = req.session.cart || [];
    const config = await Configuration.findOne();
    const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
    const itbisAmount = subtotal * (config.itbis / 100);
    const total = subtotal + itbisAmount;
    return res.render('client/selectAddress', { errors: errors.array(), commerce: await CommerceProfile.findByPk(commerceId), addresses, cart, subtotal, itbisAmount, total, bodyMenu: 'menuClient' });
  }
  const { commerceId } = req.params;
  const { addressId } = req.body;
  const cart = req.session.cart || [];
  const config = await Configuration.findOne();
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const itbisAmount = subtotal * (config.itbis / 100);
  const total = subtotal + itbisAmount;
  const order = await Order.create({
    clientId: req.session.userId,
    commerceId,
    addressId,
    status: 'pending',
    subtotal,
    itbisAmount,
    total,
    createdAt: new Date()
  });
  for (const item of cart) {
    await OrderProduct.create({ orderId: order.id, productId: item.productId, quantity: 1, price: item.price });
  }
  req.session.cart = [];
  res.redirect('/client/home');
};

exports.getProfile = async (req, res) => {
  const profile = await ClientProfile.findOne({ where: { userId: req.session.userId } });
  res.render('client/profile', { profile, errors: [], bodyMenu: 'menuClient' });
};

exports.postProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('client/profile', { profile: req.body, errors: errors.array(), bodyMenu: 'menuClient' });
  }
  const { firstName, lastName, phone } = req.body;
  const photo = req.file ? req.file.filename : null;
  await ClientProfile.update(
    { firstName, lastName, phone, ...(photo && { photo }) },
    { where: { userId: req.session.userId } }
  );
  res.redirect('/client/home');
};

exports.getOrders = async (req, res) => {
  const orders = await Order.findAll({
    where: { clientId: req.session.userId },
    include: [{ model: CommerceProfile, as: 'Commerce' }],
    order: [['createdAt', 'DESC']]
  });
  res.render('client/orders', { orders, bodyMenu: 'menuClient' });
};

exports.getOrderDetail = async (req, res) => {
  const order = await Order.findByPk(req.params.id, {
    include: [
      { model: CommerceProfile, as: 'Commerce' },
      { model: OrderProduct, include: [Product] }
    ]
  });
  res.render('client/orderDetail', { order, bodyMenu: 'menuClient' });
};

exports.getAddresses = async (req, res) => {
  const addresses = await Address.findAll({ where: { clientId: req.session.userId } });
  res.render('client/addresses', { addresses, bodyMenu: 'menuClient' });
};

exports.getNewAddress = (req, res) => {
  res.render('client/addressForm', { address: {}, errors: [], bodyMenu: 'menuClient' });
};

exports.postNewAddress = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('client/addressForm', { address: req.body, errors: errors.array(), bodyMenu: 'menuClient' });
  }
  const { name, description } = req.body;
  await Address.create({ clientId: req.session.userId, name, description });
  res.redirect('/client/addresses');
};

exports.getEditAddress = async (req, res) => {
  const address = await Address.findByPk(req.params.id);
  res.render('client/addressForm', { address, errors: [], bodyMenu: 'menuClient' });
};

exports.postEditAddress = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('client/addressForm', { address: req.body, errors: errors.array(), bodyMenu: 'menuClient' });
  }
  const { name, description } = req.body;
  await Address.update({ name, description }, { where: { id: req.params.id } });
  res.redirect('/client/addresses');
};

exports.getDeleteAddress = async (req, res) => {
  const address = await Address.findByPk(req.params.id);
  res.render('client/deleteAddress', { address, bodyMenu: 'menuClient' });
};

exports.postDeleteAddress = async (req, res) => {
  await Address.destroy({ where: { id: req.params.id } });
  res.redirect('/client/addresses');
};

exports.getFavorites = async (req, res) => {
  const favorites = await Favorite.findAll({
    where: { clientId: req.session.userId },
    include: [{ model: CommerceProfile, as: 'Commerce' }]
  });
  res.render('client/favorites', { favorites, bodyMenu: 'menuClient' });
};

exports.addFavorite = async (req, res) => {
  await Favorite.create({ clientId: req.session.userId, commerceId: req.params.commerceId });
  res.redirect(`/client/commerce-list/${(await CommerceProfile.findByPk(req.params.commerceId)).commerceTypeId}`);
};

exports.removeFavorite = async (req, res) => {
  await Favorite.destroy({ where: { clientId: req.session.userId, commerceId: req.params.commerceId } });
  res.redirect('/client/favorites');
};