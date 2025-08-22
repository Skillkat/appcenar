const { User, ClientProfile, DeliveryProfile, CommerceProfile, Category, Product, Address, Favorite, Order, OrderProduct, Configuration } = require('../models');const { Op } = require('sequelize');
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
    try {
      console.log('getCategories called, userId:', req.session.userId);
      const commerce = await CommerceProfile.findOne({ where: { userId: req.session.userId } });
      if (!commerce) {
        console.log('CommerceProfile not found for userId:', req.session.userId);
        return res.status(404).render('error', { error: 'Commerce profile not found', bodyMenu: 'menuCommerce' });
      }
      const categories = await Category.findAll({
        where: { commerceId: commerce.id },
        include: [{ model: Product, as: 'Products', attributes: ['id'] }]
      });
      const plainCategories = categories.map(category => category.get({ plain: true }));
      console.log('Categories found:', plainCategories.length, 'Details:', JSON.stringify(plainCategories, null, 2));
      res.render('commerce/categories', { categories: plainCategories, bodyMenu: 'menuCommerce' });
    } catch (error) {
      console.error('Error in getCategories:', error);
      res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuCommerce' });
    }
  };

exports.getNewCategory = (req, res) => {
  res.render('commerce/categoryForm', { category: {}, errors: [], bodyMenu: 'menuCommerce' });
};

exports.postNewCategory = async (req, res) => {
    try {
      console.log('postNewCategory called, userId:', req.session.userId, 'body:', req.body);
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        return res.render('commerce/categoryForm', { category: req.body, errors: errors.array(), bodyMenu: 'menuCommerce' });
      }
      const { name, description } = req.body;
      const commerce = await CommerceProfile.findOne({ where: { userId: req.session.userId } });
      if (!commerce) {
        console.log('CommerceProfile not found for userId:', req.session.userId);
        return res.status(404).render('error', { error: 'Commerce profile not found', bodyMenu: 'menuCommerce' });
      }
      await Category.create({ commerceId: commerce.id, name, description });
      console.log('Category created successfully for commerceId:', commerce.id);
      res.redirect('/commerce/categories');
    } catch (error) {
      console.error('Error in postNewCategory:', error);
      res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuCommerce' });
    }
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
    try {
      console.log('getProducts called, userId:', req.session.userId);
      const commerce = await CommerceProfile.findOne({ where: { userId: req.session.userId } });
      if (!commerce) {
        console.log('CommerceProfile not found for userId:', req.session.userId);
        return res.status(404).render('error', { error: 'Commerce profile not found', bodyMenu: 'menuCommerce' });
      }
      const products = await Product.findAll({
        where: { categoryId: { [Op.in]: (await Category.findAll({ where: { commerceId: commerce.id } })).map(c => c.id) } },
        include: [{ model: Category, as: 'Category', attributes: ['id', 'name'] }]
      });
      const plainProducts = products.map(product => product.get({ plain: true }));
      console.log('Products found:', plainProducts.length, 'Details:', JSON.stringify(plainProducts, null, 2));
      res.render('commerce/products', { products: plainProducts, bodyMenu: 'menuCommerce' });
    } catch (error) {
      console.error('Error in getProducts:', error);
      res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuCommerce' });
    }
  };

  exports.getNewProduct = async (req, res) => {
    try {
      console.log('getNewProduct called, userId:', req.session.userId);
      const commerce = await CommerceProfile.findOne({ where: { userId: req.session.userId } });
      if (!commerce) {
        console.log('CommerceProfile not found for userId:', req.session.userId);
        return res.status(404).render('error', { error: 'Commerce profile not found', bodyMenu: 'menuCommerce' });
      }
      const categories = await Category.findAll({ where: { commerceId: commerce.id } });
      const plainCategories = categories.map(category => category.get({ plain: true }));
      console.log('Categories for new product:', plainCategories.length, 'Details:', JSON.stringify(plainCategories, null, 2));
      res.render('commerce/productForm', { product: {}, categories: plainCategories, bodyMenu: 'menuCommerce' });
    } catch (error) {
      console.error('Error in getNewProduct:', error);
      res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuCommerce' });
    }
  };

  exports.postNewProduct = async (req, res) => {
    try {
      console.log('postNewProduct called, userId:', req.session.userId, 'body:', req.body, 'file:', req.file);
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        const commerce = await CommerceProfile.findOne({ where: { userId: req.session.userId } });
        const categories = await Category.findAll({ where: { commerceId: commerce.id } });
        const plainCategories = categories.map(category => category.get({ plain: true }));
        return res.render('commerce/productForm', {
          product: req.body,
          categories: plainCategories,
          errors: errors.array(),
          bodyMenu: 'menuCommerce'
        });
      }
      const { name, description, price, categoryId } = req.body;
      const commerce = await CommerceProfile.findOne({ where: { userId: req.session.userId } });
      if (!commerce) {
        console.log('CommerceProfile not found for userId:', req.session.userId);
        return res.status(404).render('error', { error: 'Commerce profile not found', bodyMenu: 'menuCommerce' });
      }
      const category = await Category.findOne({ where: { id: categoryId, commerceId: commerce.id } });
      if (!category) {
        console.log('Category not found for id:', categoryId, 'commerceId:', commerce.id);
        return res.status(400).render('commerce/productForm', {
          product: req.body,
          categories: (await Category.findAll({ where: { commerceId: commerce.id } })).map(c => c.get({ plain: true })),
          errors: [{ msg: 'Invalid category' }],
          bodyMenu: 'menuCommerce'
        });
      }
      const productData = {
        categoryId,
        name,
        description,
        price: parseFloat(price),
        photo: req.file ? req.file.filename : null
      };
      await Product.create(productData);
      console.log('Product created successfully:', productData);
      res.redirect('/commerce/products');
    } catch (error) {
      console.error('Error in postNewProduct:', error);
      res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuCommerce' });
    }
  };

exports.getEditProduct = async (req, res) => {
    try {
      console.log('getEditProduct called, productId:', req.params.id, 'userId:', req.session.userId);
      const commerce = await CommerceProfile.findOne({ where: { userId: req.session.userId } });
      if (!commerce) {
        console.log('CommerceProfile not found for userId:', req.session.userId);
        return res.status(404).render('error', { error: 'Commerce profile not found', bodyMenu: 'menuCommerce' });
      }
      const product = await Product.findOne({
        where: { id: req.params.id, categoryId: { [Op.in]: (await Category.findAll({ where: { commerceId: commerce.id } })).map(c => c.id) } },
        include: [{ model: Category, as: 'Category', attributes: ['id', 'name'] }]
      });
      if (!product) {
        console.log('Product not found for id:', req.params.id);
        return res.status(404).render('error', { error: 'Product not found', bodyMenu: 'menuCommerce' });
      }
      const categories = await Category.findAll({ where: { commerceId: commerce.id } });
      const plainProduct = product.get({ plain: true });
      const plainCategories = categories.map(category => category.get({ plain: true }));
      console.log('Product:', JSON.stringify(plainProduct, null, 2));
      console.log('Categories:', plainCategories.length, 'Details:', JSON.stringify(plainCategories, null, 2));
      res.render('commerce/productForm', { product: plainProduct, categories: plainCategories, bodyMenu: 'menuCommerce' });
    } catch (error) {
      console.error('Error in getEditProduct:', error);
      res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuCommerce' });
    }
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