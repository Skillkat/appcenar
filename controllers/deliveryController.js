const { User, DeliveryProfile, Order, OrderProduct, Product, Address, } = require('../models');
const { validationResult } = require('express-validator');

exports.getHome = async (req, res, next) => {
    try {
      if (!req.session.userId || req.session.role !== 'delivery') {
        console.log('Unauthorized access to /delivery/home, redirecting to /auth/login');
        return res.redirect('/auth/login');
      }
      console.log('GET /delivery/home called for userId:', req.session.userId);
      const deliveryProfile = await DeliveryProfile.findOne({ where: { userId: req.session.userId } });
      const commerces = await CommerceProfile.findAll();
      res.render('delivery/home', {
        title: 'Delivery - Home',
        bodyMenu: 'menuDelivery',
        deliveryProfile,
        commerces
      });
    } catch (error) {
      console.error('Error in getHome:', error);
      next(error);
    }
  };

exports.getProfile = async (req, res) => {
  const profile = await DeliveryProfile.findOne({ where: { userId: req.session.userId } });
  res.render('delivery/profile', { profile, errors: [], bodyMenu: 'menuDelivery' });
};

exports.postProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('delivery/profile', { profile: req.body, errors: errors.array(), bodyMenu: 'menuDelivery' });
  }
  const { firstName, lastName, phone } = req.body;
  const photo = req.file ? req.file.filename : null;
  await DeliveryProfile.update(
    { firstName, lastName, phone, ...(photo && { photo }) },
    { where: { userId: req.session.userId } }
  );
  res.redirect('/delivery/home');
};

exports.getOrderDetail = async (req, res) => {
  const order = await Order.findByPk(req.params.id, {
    include: [
      { model: CommerceProfile, as: 'CommerceProfile' },
      { model: OrderProduct, include: [Product] },
      { model: Address }
    ]
  });
  res.render('delivery/orderDetail', { order, bodyMenu: 'menuDelivery' });
};

exports.completeOrder = async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  if (order.status === 'in_process') {
    await Order.update({ status: 'completed' }, { where: { id: order.id } });
    await DeliveryProfile.update({ available: true }, { where: { userId: req.session.userId } });
  }
  res.redirect('/delivery/home');
};