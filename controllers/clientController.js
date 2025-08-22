const { User, ClientProfile, CommerceProfile, Category, Product, Address, Favorite, Order, OrderProduct, Configuration } = require('../models');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');

exports.getHome = async (req, res) => {
    try {
      console.log('getHome called, userId:', req.session.userId);
      const commerces = await CommerceProfile.findAll({
        include: [{ model: User, as: 'User', attributes: ['id', 'active'] }],
        attributes: ['id', 'name', 'phone', 'logo', 'openHour', 'closeHour']
      });
      const plainCommerces = commerces.map(commerce => commerce.get({ plain: true }));
      console.log('Commerces found:', plainCommerces.length);
      console.log('Commerce details:', JSON.stringify(plainCommerces, null, 2));
      res.render('client/home', { commerces: plainCommerces, search: req.query.search || '', bodyMenu: 'menuClient' });
    } catch (error) {
      console.error('Error in getHome:', error);
      res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuClient' });
    }
  };
exports.getCommerceList = async (req, res) => {
  try {
    console.log('getCommerceList called, userId:', req.session.userId, 'search:', req.query.search);
    const search = req.query.search || '';
    const commerces = await CommerceProfile.findAll({
        attributes: ['id', 'name', 'phone', 'logo', 'openHour', 'closeHour'],
        include: [{ model: User, as: 'User', where: { active: true }, attributes: ['id', 'active'] }]
        
    });
    res.render('client/home', { commerces, search: req.query.search || '', bodyMenu: 'menuClient' });
    const favorites = await Favorite.findAll({ where: { clientId: req.session.userId } });
    console.log('Commerces found:', commerces.length, 'Favorites found:', favorites.length);
    res.render('client/commerceList', { commerces, favorites, search, bodyMenu: 'menuClient' });
  } catch (error) {
    console.error('Error in getCommerceList:', error.message, error.stack);
    res.status(500).render('error', { error: error.message || 'Something went wrong!', bodyMenu: 'menuClient' });
  }
};



exports.getCatalog = async (req, res) => {
    try {
      console.log('getCatalog called, commerceId:', req.params.commerceId);
      const commerce = await CommerceProfile.findByPk(req.params.commerceId, {
        include: [{ model: User, as: 'User', attributes: ['id', 'active'] }]
      });
      if (!commerce) {
        console.log('Commerce not found for id:', req.params.commerceId);
        return res.status(404).render('error', { error: 'Commerce not found', bodyMenu: 'menuClient' });
      }
      const categories = await Category.findAll({
        where: { commerceId: commerce.id },
        include: [{ model: Product, as: 'Products', attributes: ['id', 'name', 'description', 'price', 'photo'] }]
      });
      const plainCommerce = commerce.get({ plain: true });
      const plainCategories = categories.map(category => category.get({ plain: true }));
      console.log('Commerce:', JSON.stringify(plainCommerce, null, 2));
      console.log('Categories found:', plainCategories.length, 'Products found:', plainCategories.reduce((sum, cat) => sum + cat.Products.length, 0));
      res.render('client/catalog', {
        commerce: plainCommerce,
        categories: plainCategories,
        cart: req.session.cart || [],
        cartMessage: req.session.cartMessage || null,
        bodyMenu: 'menuClient'
      });
      delete req.session.cartMessage; 
    } catch (error) {
      console.error('Error in getCatalog:', error);
      res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: 'menuClient' });
    }
  };
  exports.addToCart = async (req, res) => {
    try {
      console.log('addToCart called, userId:', req.session.userId, 'body:', req.body);
      const { productId, quantity } = req.body;
      if (!productId || !quantity || isNaN(quantity) || quantity < 1) {
        console.log('Invalid productId or quantity:', productId, quantity);
        req.session.cartMessage = 'Invalid product or quantity';
        return res.redirect(`/client/catalog/${req.params.commerceId}`);
      }
      const product = await Product.findByPk(productId, {
        include: [{ model: Category, as: 'Category', attributes: ['commerceId'] }]
      });
      if (!product || product.Category.commerceId != req.params.commerceId) {
        console.log('Invalid product or commerce:', productId, req.params.commerceId);
        req.session.cartMessage = 'Invalid product or commerce';
        return res.redirect(`/client/catalog/${req.params.commerceId}`);
      }
      req.session.cart = req.session.cart || [];
      const existingItem = req.session.cart.find(item => item.productId == productId);
      if (existingItem) {
        existingItem.quantity = parseInt(existingItem.quantity) + parseInt(quantity);
      } else {
        req.session.cart.push({
          productId: parseInt(productId),
          name: product.name,
          price: product.price,
          quantity: parseInt(quantity)
        });
      }
      req.session.cartMessage = `${product.name} añadido al carrito`;
      console.log('Cart updated:', req.session.cart);
      res.redirect(`/client/catalog/${req.params.commerceId}`);
    } catch (error) {
      console.error('Error in addToCart:', error.message, error.stack);
      req.session.cartMessage = 'Error al añadir al carrito';
      res.redirect(`/client/catalog/${req.params.commerceId}`);
    }
  };

  exports.removeFromCart = async (req, res) => {
    try {
      console.log('removeFromCart called, productId:', req.body.productId);
      const { productId } = req.body;
      req.session.cart = (req.session.cart || []).filter(item => item.productId != productId);
      req.session.cartMessage = 'Producto eliminado del carrito';
      console.log('Cart updated:', req.session.cart);
      res.redirect(`/client/catalog/${req.params.commerceId}`);
    } catch (error) {
      console.error('Error in removeFromCart:', error.message, error.stack);
      req.session.cartMessage = 'Error al eliminar del carrito';
      res.redirect(`/client/catalog/${req.params.commerceId}`);
    }
  };

  exports.getSelectAddress = async (req, res) => {
    try {
      console.log('getSelectAddress called, commerceId:', req.params.commerceId, 'userId:', req.session.userId, 'cart:', req.session.cart);
      const { commerceId } = req.params;
      const commerce = await CommerceProfile.findByPk(commerceId, { include: [{ model: User, as: 'User', attributes: ['id', 'active'] }] });
      if (!commerce) {
        console.log('Commerce not found for id:', commerceId);
        return res.status(404).render('error', { error: 'Commerce not found', bodyMenu: 'menuClient' });
      }
      console.log('Commerce found:', commerce.get({ plain: true }));
      const addresses = await Address.findAll({ where: { clientId: req.session.userId } });
      const cart = req.session.cart || [];
      console.log('Addresses found:', addresses.length, 'Cart items:', cart.length);
      if (cart.length === 0) {
        console.log('Cart is empty, redirecting to catalog');
        req.session.cartMessage = 'El carrito está vacío';
        return res.redirect(`/client/catalog/${commerceId}`);
      }
      for (const item of cart) {
        const product = await Product.findByPk(item.productId, {
          include: [{ model: Category, as: 'Category', attributes: ['commerceId'] }]
        });
        if (!product || product.Category.commerceId != commerceId) {
          console.log('Invalid product in cart:', item.productId, 'expected commerceId:', commerceId, 'found:', product?.Category?.commerceId);
          req.session.cartMessage = 'Productos inválidos en el carrito';
          return res.redirect(`/client/catalog/${commerceId}`);
        }
      }
      const itbis = 18; 
      const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const itbisAmount = subtotal * (itbis / 100);
      const total = subtotal + itbisAmount;
      console.log('Rendering selectAddress with:', { commerceId, addresses: addresses.length, cart: cart.length, subtotal, itbisAmount, total });
      res.render('client/selectAddress', {
        commerce: commerce.get({ plain: true }),
        addresses: addresses.map(address => address.get({ plain: true })),
        cart,
        subtotal,
        itbisAmount,
        total,
        bodyMenu: 'menuClient'
      });
    } catch (error) {
      console.error('Error in getSelectAddress:', error.message, error.stack);
      req.session.cartMessage = 'Error al cargar la página de selección de dirección: ' + error.message;
      res.redirect(`/client/catalog/${req.params.commerceId}`);
    }
  };

exports.postSelectAddress = async (req, res) => {
    try {
      console.log('postSelectAddress called, commerceId:', req.params.commerceId, 'body:', req.body, 'userId:', req.session.userId, 'cart:', req.session.cart);
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('Validation errors:', errors.array());
        const commerce = await CommerceProfile.findByPk(req.params.commerceId, { include: [{ model: User, as: 'User' }] });
        const addresses = await Address.findAll({ where: { clientId: req.session.userId } });
        const cart = req.session.cart || [];
        const itbis = 18; 
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const itbisAmount = subtotal * (itbis / 100);
        const total = subtotal + itbisAmount;
        return res.render('client/selectAddress', {
          errors: errors.array(),
          commerce,
          addresses,
          cart,
          subtotal,
          itbisAmount,
          total,
          bodyMenu: 'menuClient'
        });
      }
      const { commerceId } = req.params;
      const { addressId } = req.body;
      const cart = req.session.cart || [];
      if (!cart || cart.length === 0) {
        console.log('Cart is empty or undefined');
        req.session.cartMessage = 'El carrito está vacío';
        return res.redirect(`/client/catalog/${commerceId}`);
      }
      console.log('Validating addressId:', addressId);
      const address = await Address.findOne({ where: { id: addressId, clientId: req.session.userId } });
      if (!address) {
        console.log('Invalid address:', addressId, 'for clientId:', req.session.userId);
        const commerce = await CommerceProfile.findByPk(commerceId, { include: [{ model: User, as: 'User' }] });
        const addresses = await Address.findAll({ where: { clientId: req.session.userId } });
        const itbis = 18;
        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const itbisAmount = subtotal * (itbis / 100);
        const total = subtotal + itbisAmount;
        return res.render('client/selectAddress', {
          errors: [{ msg: 'Dirección inválida' }],
          commerce,
          addresses,
          cart,
          subtotal,
          itbisAmount,
          total,
          bodyMenu: 'menuClient'
        });
      }
      console.log('Validating cart products for commerceId:', commerceId);
      for (const item of cart) {
        const product = await Product.findByPk(item.productId, {
          include: [{ model: Category, as: 'Category', attributes: ['commerceId'] }]
        });
        if (!product || product.Category.commerceId != commerceId) {
          console.log('Invalid product in cart:', item.productId, 'expected commerceId:', commerceId, 'found:', product?.Category?.commerceId);
          req.session.cartMessage = 'Productos inválidos en el carrito';
          return res.redirect(`/client/catalog/${commerceId}`);
        }
      }
      const itbis = 18; 
      const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const itbisAmount = subtotal * (itbis / 100);
      const total = subtotal + itbisAmount;
      console.log('Creating order with:', { clientId: req.session.userId, commerceId, addressId, subtotal, itbisAmount, total });
      const order = await Order.create({
        clientId: req.session.userId,
        commerceId,
        addressId,
        status: 'pending',
        subtotal,
        itbisAmount,
        total,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Order created:', order.id);
      const orderProducts = cart.map(item => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      }));
      console.log('Creating OrderProducts:', orderProducts);
      await OrderProduct.bulkCreate(orderProducts);
      console.log('OrderProducts created:', orderProducts.length);
      req.session.cart = [];
      req.session.cartMessage = 'Pedido creado exitosamente';
      res.redirect('/client/orders');
    } catch (error) {
      console.error('Error in postSelectAddress:', error.message, error.stack);
      req.session.cartMessage = 'Error al crear el pedido: ' + error.message;
      res.redirect(`/client/catalog/${req.params.commerceId}`);
    }
  };
exports.getProfile = async (req, res) => {
  try {
    console.log('getProfile called, userId:', req.session.userId);
    const profile = await ClientProfile.findOne({ where: { userId: req.session.userId }, include: [{ model: User, as: 'User' }] });
    if (!profile) {
      return res.status(404).render('error', { error: 'Profile not found', bodyMenu: 'menuClient' });
    }
    res.render('client/profile', { profile, errors: [], bodyMenu: 'menuClient' });
  } catch (error) {
    console.error('Error in getProfile:', error.message, error.stack);
    res.status(500).render('error', { error: error.message || 'Something went wrong!', bodyMenu: 'menuClient' });
  }
};

exports.postProfile = async (req, res) => {
  try {
    console.log('postProfile called, body:', req.body);
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
  } catch (error) {
    console.error('Error in postProfile:', error.message, error.stack);
    res.status(500).render('error', { error: error.message || 'Something went wrong!', bodyMenu: 'menuClient' });
  }
};

exports.getOrders = async (req, res) => {
  try {
    console.log('getOrders called, userId:', req.session.userId);
    const orders = await Order.findAll({
      where: { clientId: req.session.userId },
      include: [{ model: CommerceProfile, as: 'Commerce' }],
      order: [['createdAt', 'DESC']]
    });
    console.log('Orders found:', orders.length);
    res.render('client/orders', { orders, bodyMenu: 'menuClient' });
  } catch (error) {
    console.error('Error in getOrders:', error.message, error.stack);
    res.status(500).render('error', { error: error.message || 'Something went wrong!', bodyMenu: 'menuClient' });
  }
};

exports.getOrderDetail = async (req, res) => {
  try {
    console.log('getOrderDetail called, orderId:', req.params.id);
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: CommerceProfile, as: 'Commerce' },
        { model: OrderProduct, include: [{ model: Product, as: 'Product' }] }
      ]
    });
    if (!order) {
      return res.status(404).render('error', { error: 'Order not found', bodyMenu: 'menuClient' });
    }
    res.render('client/orderDetail', { order, bodyMenu: 'menuClient' });
  } catch (error) {
    console.error('Error in getOrderDetail:', error.message, error.stack);
    res.status(500).render('error', { error: error.message || 'Something went wrong!', bodyMenu: 'menuClient' });
  }
};

exports.getAddresses = async (req, res) => {
  try {
    console.log('getAddresses called, userId:', req.session.userId);
    const addresses = await Address.findAll({ where: { clientId: req.session.userId }, include: [{ model: User, as: 'User' }] });
    console.log('Addresses found:', addresses.length);
    res.render('client/addresses', { addresses, bodyMenu: 'menuClient' });
  } catch (error) {
    console.error('Error in getAddresses:', error.message, error.stack);
    res.status(500).render('error', { error: error.message || 'Something went wrong!', bodyMenu: 'menuClient' });
  }
};

exports.getNewAddress = (req, res) => {
  try {
    console.log('getNewAddress called');
    res.render('client/addressForm', { address: {}, errors: [], bodyMenu: 'menuClient' });
  } catch (error) {
    console.error('Error in getNewAddress:', error.message, error.stack);
    res.status(500).render('error', { error: error.message || 'Something went wrong!', bodyMenu: 'menuClient' });
  }
};

exports.postNewAddress = async (req, res) => {
  try {
    console.log('postNewAddress called, body:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('client/addressForm', { address: req.body, errors: errors.array(), bodyMenu: 'menuClient' });
    }
    const { name, description } = req.body;
    await Address.create({ clientId: req.session.userId, name, description });
    res.redirect('/client/addresses');
  } catch (error) {
    console.error('Error in postNewAddress:', error.message, error.stack);
    res.status(500).render('error', { error: error.message || 'Something went wrong!', bodyMenu: 'menuClient' });
  }
};

exports.getEditAddress = async (req, res) => {
  try {
    console.log('getEditAddress called, addressId:', req.params.id);
    const address = await Address.findByPk(req.params.id, { include: [{ model: User, as: 'User' }] });
    if (!address) {
      return res.status(404).render('error', { error: 'Address not found', bodyMenu: 'menuClient' });
    }
    res.render('client/addressForm', { address, errors: [], bodyMenu: 'menuClient' });
  } catch (error) {
    console.error('Error in getEditAddress:', error.message, error.stack);
    res.status(500).render('error', { error: error.message || 'Something went wrong!', bodyMenu: 'menuClient' });
  }
};

exports.postEditAddress = async (req, res) => {
  try {
    console.log('postEditAddress called, addressId:', req.params.id, 'body:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('client/addressForm', { address: req.body, errors: errors.array(), bodyMenu: 'menuClient' });
    }
    const { name, description } = req.body;
    await Address.update({ name, description }, { where: { id: req.params.id } });
    res.redirect('/client/addresses');
  } catch (error) {
    console.error('Error in postEditAddress:', error.message, error.stack);
    res.status(500).render('error', { error: error.message || 'Something went wrong!', bodyMenu: 'menuClient' });
  }
};

exports.getDeleteAddress = async (req, res) => {
  try {
    console.log('getDeleteAddress called, addressId:', req.params.id);
    const address = await Address.findByPk(req.params.id, { include: [{ model: User, as: 'User' }] });
    if (!address) {
      return res.status(404).render('error', { error: 'Address not found', bodyMenu: 'menuClient' });
    }
    res.render('client/deleteAddress', { address, bodyMenu: 'menuClient' });
  } catch (error) {
    console.error('Error in getDeleteAddress:', error.message, error.stack);
    res.status(500).render('error', { error: error.message || 'Something went wrong!', bodyMenu: 'menuClient' });
  }
};

exports.postDeleteAddress = async (req, res) => {
  try {
    console.log('postDeleteAddress called, addressId:', req.params.id);
    await Address.destroy({ where: { id: req.params.id } });
    res.redirect('/client/addresses');
  } catch (error) {
    console.error('Error in postDeleteAddress:', error.message, error.stack);
    res.status(500).render('error', { error: error.message || 'Something went wrong!', bodyMenu: 'menuClient' });
  }
};

exports.getFavorites = async (req, res) => {
  try {
    console.log('getFavorites called, userId:', req.session.userId);
    const favorites = await Favorite.findAll({
      where: { clientId: req.session.userId },
      include: [{ model: CommerceProfile, as: 'Commerce' }]
    });
    console.log('Favorites found:', favorites.length);
    res.render('client/favorites', { favorites, bodyMenu: 'menuClient' });
  } catch (error) {
    console.error('Error in getFavorites:', error.message, error.stack);
    res.status(500).render('error', { error: error.message || 'Something went wrong!', bodyMenu: 'menuClient' });
  }
};

exports.addFavorite = async (req, res) => {
  try {
    console.log('addFavorite called, commerceId:', req.params.commerceId);
    await Favorite.create({ clientId: req.session.userId, commerceId: req.params.commerceId });
    res.redirect('/client/commerce-list');
  } catch (error) {
    console.error('Error in addFavorite:', error.message, error.stack);
    res.status(500).render('error', { error: error.message || 'Something went wrong!', bodyMenu: 'menuClient' });
  }
};

exports.removeFavorite = async (req, res) => {
  try {
    console.log('removeFavorite called, commerceId:', req.params.commerceId);
    await Favorite.destroy({ where: { clientId: req.session.userId, commerceId: req.params.commerceId } });
    res.redirect('/client/favorites');
  } catch (error) {
    console.error('Error in removeFavorite:', error.message, error.stack);
    res.status(500).render('error', { error: error.message || 'Something went wrong!', bodyMenu: 'menuClient' });
  }
};
