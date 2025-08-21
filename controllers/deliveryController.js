
const { User, DeliveryProfile, Order, OrderProduct, Product, Address, CommerceProfile } = require('../models');
const { validationResult } = require('express-validator');

exports.getHome = async (req, res) => {
  try {
    console.log('GET /delivery/home called for userId:', req.session.userId);
    const orders = await Order.findAll({
      where: { deliveryId: req.session.userId },
      include: [{ model: CommerceProfile, as: 'Commerce' }], // Corregido el alias a 'Commerce'
      order: [['createdAt', 'DESC']]
    });
    res.render('delivery/home', { orders, bodyMenu: 'menuDelivery' });
  } catch (error) {
    console.error('Error in getHome:', error);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuDelivery' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const profile = await DeliveryProfile.findOne({ where: { userId: req.session.userId } });
    res.render('delivery/profile', { profile, errors: [], bodyMenu: 'menuDelivery' });
  } catch (error) {
    console.error('Error in getProfile:', error);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuDelivery' });
  }
};

exports.postProfile = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error in postProfile:', error);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuDelivery' });
  }
};

exports.getOrderDetail = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: CommerceProfile, as: 'Commerce' }, // Corregido el alias a 'Commerce'
        { model: OrderProduct, include: [{ model: Product, as: 'Product' }] },
        { model: Address, as: 'Address' }
      ]
    });
    res.render('delivery/orderDetail', { order, bodyMenu: 'menuDelivery' });
  } catch (error) {
    console.error('Error in getOrderDetail:', error);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuDelivery' });
  }
};

exports.completeOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (order.status === 'in_process') {
      await Order.update({ status: 'completed' }, { where: { id: order.id } });
      await DeliveryProfile.update({ available: true }, { where: { userId: req.session.userId } });
    }
    res.redirect('/delivery/home');
  } catch (error) {
    console.error('Error in completeOrder:', error);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuDelivery' });
  }
};
