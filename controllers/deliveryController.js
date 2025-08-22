const { User, DeliveryProfile, Order, OrderProduct, Product, Address, CommerceProfile } = require('../models');
const { validationResult } = require('express-validator');

exports.getHome = async (req, res) => {
  try {
    console.log('GET /delivery/home called for userId:', req.session.userId);
    // Obtener comercios activos
    const commerces = await CommerceProfile.findAll({
      include: [{ model: User, as: 'User', attributes: ['id', 'active'], where: { active: true } }],
      attributes: ['id', 'name', 'phone', 'logo', 'openHour', 'closeHour']
    });
    // Obtener pedidos asignados al repartidor
    const orders = await Order.findAll({
      where: { deliveryId: req.session.userId },
      include: [
        { model: CommerceProfile, as: 'Commerce' },
        { model: OrderProduct, as: 'OrderProducts', include: [{ model: Product, as: 'Product' }] },
        { model: Address, as: 'Address' },
        { model: User, as: 'Delivery' }
      ],
      order: [['createdAt', 'DESC']]
    });
    // Obtener pedidos nuevos (pendientes, sin repartidor)
    const newOrders = await Order.findAll({
      where: { status: 'pending', deliveryId: null },
      include: [
        { model: CommerceProfile, as: 'Commerce' },
        { model: OrderProduct, as: 'OrderProducts', include: [{ model: Product, as: 'Product' }] },
        { model: Address, as: 'Address' }
      ],
      order: [['createdAt', 'DESC']]
    });
    const deliveryProfile = await DeliveryProfile.findOne({ where: { userId: req.session.userId } });
    console.log('Commerces found:', commerces.length, 'Assigned orders:', orders.length, 'New orders:', newOrders.length);
    res.render('delivery/home', {
      commerces: commerces.map(commerce => commerce.get({ plain: true })),
      orders: orders.map(order => order.get({ plain: true })),
      newOrders: newOrders.map(order => order.get({ plain: true })),
      deliveryProfile: deliveryProfile ? deliveryProfile.get({ plain: true }) : null,
      bodyMenu: 'menuDelivery'
    });
  } catch (error) {
    console.error('Error in getHome:', error.message, error.stack);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuDelivery' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    console.log('GET /delivery/profile called for userId:', req.session.userId);
    const profile = await DeliveryProfile.findOne({ where: { userId: req.session.userId } });
    if (!profile) {
      console.log('Profile not found for userId:', req.session.userId);
      return res.status(404).render('error', { error: 'Profile not found', bodyMenu: 'menuDelivery' });
    }
    res.render('delivery/profile', { profile: profile.get({ plain: true }), errors: [], bodyMenu: 'menuDelivery' });
  } catch (error) {
    console.error('Error in getProfile:', error.message, error.stack);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuDelivery' });
  }
};

exports.postProfile = async (req, res) => {
  try {
    console.log('POST /delivery/profile called, body:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.render('delivery/profile', { profile: req.body, errors: errors.array(), bodyMenu: 'menuDelivery' });
    }
    const { firstName, lastName, phone } = req.body;
    const photo = req.file ? req.file.filename : null;
    await DeliveryProfile.update(
      { firstName, lastName, phone, ...(photo && { photo }) },
      { where: { userId: req.session.userId } }
    );
    console.log('Profile updated for userId:', req.session.userId);
    res.redirect('/delivery/home');
  } catch (error) {
    console.error('Error in postProfile:', error.message, error.stack);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuDelivery' });
  }
};

exports.getOrderDetail = async (req, res) => {
  try {
    console.log('GET /delivery/order/:id called, orderId:', req.params.id, 'userId:', req.session.userId);
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: CommerceProfile, as: 'Commerce' },
        { model: OrderProduct, as: 'OrderProducts', include: [{ model: Product, as: 'Product' }] },
        { model: Address, as: 'Address' },
        { model: User, as: 'Delivery' }
      ]
    });
    if (!order) {
      console.log('Order not found for id:', req.params.id);
      return res.status(404).render('error', { error: 'Order not found', bodyMenu: 'menuDelivery' });
    }
    console.log('Order found:', order.id, 'Status:', order.status);
    res.render('delivery/orderDetail', { order: order.get({ plain: true }), bodyMenu: 'menuDelivery' });
  } catch (error) {
    console.error('Error in getOrderDetail:', error.message, error.stack);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuDelivery' });
  }
};

exports.acceptOrder = async (req, res) => {
  try {
    console.log('POST /delivery/order/:id/accept called, orderId:', req.params.id, 'userId:', req.session.userId);
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      console.log('Order not found for id:', req.params.id);
      return res.status(404).render('error', { error: 'Order not found', bodyMenu: 'menuDelivery' });
    }
    if (order.status !== 'pending' || order.deliveryId !== null) {
      console.log('Order cannot be accepted, status:', order.status, 'deliveryId:', order.deliveryId);
      return res.status(400).render('error', { error: 'Order cannot be accepted', bodyMenu: 'menuDelivery' });
    }
    const deliveryProfile = await DeliveryProfile.findOne({ where: { userId: req.session.userId } });
    if (!deliveryProfile.available) {
      console.log('Delivery not available, userId:', req.session.userId);
      return res.status(400).render('error', { error: 'You are not available to accept orders', bodyMenu: 'menuDelivery' });
    }
    await Order.update(
      { status: 'in_process', deliveryId: req.session.userId },
      { where: { id: req.params.id } }
    );
    await DeliveryProfile.update(
      { available: false },
      { where: { userId: req.session.userId } }
    );
    console.log('Order accepted:', order.id, 'by userId:', req.session.userId);
    res.redirect('/delivery/home');
  } catch (error) {
    console.error('Error in acceptOrder:', error.message, error.stack);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuDelivery' });
  }
};

exports.completeOrder = async (req, res) => {
  try {
    console.log('POST /delivery/order/:id/complete called, orderId:', req.params.id, 'userId:', req.session.userId);
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      console.log('Order not found for id:', req.params.id);
      return res.status(404).render('error', { error: 'Order not found', bodyMenu: 'menuDelivery' });
    }
    if (order.status !== 'in_process' || order.deliveryId !== req.session.userId) {
      console.log('Order cannot be completed, status:', order.status, 'deliveryId:', order.deliveryId);
      return res.status(400).render('error', { error: 'Order cannot be completed', bodyMenu: 'menuDelivery' });
    }
    await Order.update(
      { status: 'completed' },
      { where: { id: req.params.id } }
    );
    await DeliveryProfile.update(
      { available: true },
      { where: { userId: req.session.userId } }
    );
    console.log('Order completed:', order.id);
    res.redirect('/delivery/home');
  } catch (error) {
    console.error('Error in completeOrder:', error.message, error.stack);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuDelivery' });
  }
};