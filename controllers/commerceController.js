const { User, CommerceProfile, Category, Product, Order, OrderProduct, DeliveryProfile } = require('../models');
const { validationResult } = require('express-validator');

exports.getHome = async (req, res) => {
  const orders = await Order.findAll({
    where: { commerceId: req.session.userId },
    include: [{ model: CommerceProfile, as: 'Commerce' }],
    order: [['createdAt', 'DESC']]
  });
  res.render('commerce/home', { orders, bodyMenu: 'menuCommerce' });
};

exports.getProfile = async (req, res) => {
  const profile = await CommerceProfile.findOne({ where: { userId: req.session.userId } });
  res.render('commerce/profile', { profile, errors: [], bodyMenu: 'menuCommerce' });
};

exports.postProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('commerce/profile', { profile: req.body, errors: errors.array(), bodyMenu: 'menuCommerce' });
  }
  const { name, phone, openHour, closeHour } = req.body;
  const logo = req.file ? req.file.filename : null;
  await CommerceProfile.update(
    { name, phone, openHour, closeHour, ...(logo && { logo }) },
    { where: { userId: req.session.userId } }
  );
  res.redirect('/commerce/home');
};

exports.getCategories = async (req, res) => {
  const categories = await Category.findAll({
    where: { commerceId: req.session.userId },
    include: [{ model: Product, attributes: ['id'] }]
  });
  res.render('commerce/categories', { categories, bodyMenu: 'menuCommerce' });
};

exports.getNewCategory = (req, res) => {
  res.render('commerce/categoryForm', { category: {}, errors: [], bodyMenu: 'menuCommerce' });
};

exports.postNewCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('commerce/categoryForm', { category: req.body, errors: errors.array(), bodyMenu: 'menuCommerce' });
  }
  const { name, description } = req.body;
  await Category.create({ commerceId: req.session.userId, name, description });
  res.redirect('/commerce/categories');
};

exports.getEditCategory = async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  res.render('commerce/categoryForm', { category, errors: [], bodyMenu: 'menuCommerce' });
};

exports.postEditCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('commerce/categoryForm', { category: req.body, errors: errors.array(), bodyMenu: 'menuCommerce' });
  }
  const { name, description } = req.body;
  await Category.update({ name, description }, { where: { id: req.params.id } });
  res.redirect('/commerce/categories');
};

exports.getDeleteCategory = async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  res.render('commerce/deleteCategory', { category, bodyMenu: 'menuCommerce' });
};

exports.postDeleteCategory = async (req, res) => {
  await Category.destroy({ where: { id: req.params.id } });
  res.redirect('/commerce/categories');
};

exports.getProducts = async (req, res) => {
  const products = await Product.findAll({
    where: { '$Category.commerceId$': req.session.userId },
    include: [{ model: Category }]
  });
  res.render('commerce/products', { products, bodyMenu: 'menuCommerce' });
};

exports.getNewProduct = async (req, res) => {
  const categories = await Category.findAll({ where: { commerceId: req.session.userId } });
  res.render('commerce/productForm', { product: {}, categories, errors: [], bodyMenu: 'menuCommerce' });
};

exports.postNewProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const categories = await Category.findAll({ where: { commerceId: req.session.userId } });
    return res.render('commerce/productForm', { product: req.body, categories, errors: errors.array(), bodyMenu: 'menuCommerce' });
  }
  const { name, description, price, categoryId } = req.body;
  const photo = req.file ? req.file.filename : null;
  await Product.create({ categoryId, name, description, price, photo });
  res.redirect('/commerce/products');
};

exports.getEditProduct = async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  const categories = await Category.findAll({ where: { commerceId: req.session.userId } });
  res.render('commerce/productForm', { product, categories, errors: [], bodyMenu: 'menuCommerce' });
};

exports.postEditProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const categories = await Category.findAll({ where: { commerceId: req.session.userId } });
    return res.render('commerce/productForm', { product: req.body, categories, errors: errors.array(), bodyMenu: 'menuCommerce' });
  }
  const { name, description, price, categoryId } = req.body;
  const photo = req.file ? req.file.filename : null;
  await Product.update(
    { name, description, price, categoryId, ...(photo && { photo }) },
    { where: { id: req.params.id } }
  );
  res.redirect('/commerce/products');
};

exports.getDeleteProduct = async (req, res) => {
  const product = await Product.findByPk(req.params.id);
  res.render('commerce/deleteProduct', { product, bodyMenu: 'menuCommerce' });
};

exports.postDeleteProduct = async (req, res) => {
  await Product.destroy({ where: { id: req.params.id } });
  res.redirect('/commerce/products');
};

exports.getOrderDetail = async (req, res) => {
  const order = await Order.findByPk(req.params.id, {
    include: [
      { model: CommerceProfile, as: 'Commerce' },
      { model: OrderProduct, include: [Product] },
      { model: DeliveryProfile, as: 'Delivery' }
    ]
  });
  res.render('commerce/orderDetail', { order, bodyMenu: 'menuCommerce' });
};

exports.assignDelivery = async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  if (order.status !== 'pending') {
    return res.redirect('/commerce/home');
  }
  const delivery = await DeliveryProfile.findOne({ where: { available: true } });
  if (!delivery) {
    return res.render('commerce/orderDetail', { order, errors: [{ msg: 'No delivery available' }], bodyMenu: 'menuCommerce' });
  }
  await Order.update({ deliveryId: delivery.userId, status: 'in_process' }, { where: { id: order.id } });
  await DeliveryProfile.update({ available: false }, { where: { userId: delivery.userId } });
  res.redirect('/commerce/home');
};