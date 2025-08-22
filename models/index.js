const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { Op } = Sequelize;

const User = require('./user');
const ClientProfile = require('./ClientProfile');
const DeliveryProfile = require('./DeliveryProfile');
const CommerceProfile = require('./CommerceProfile');
const Category = require('./Category');
const Product = require('./Product');
const Address = require('./Address');
const Favorite = require('./Favorite');
const Order = require('./Order');
const OrderProduct = require('./OrderProduct');
const Configuration = require('./Configuration');
const AdminProfile = require('./AdminProfile');

// Definir relaciones
User.hasOne(ClientProfile, { foreignKey: 'userId', as: 'ClientProfile' });
ClientProfile.belongsTo(User, { foreignKey: 'userId', as: 'User' });

User.hasOne(DeliveryProfile, { foreignKey: 'userId', as: 'DeliveryProfile' });
DeliveryProfile.belongsTo(User, { foreignKey: 'userId', as: 'User' });

User.hasOne(CommerceProfile, { foreignKey: 'userId', as: 'CommerceProfile' });
CommerceProfile.belongsTo(User, { foreignKey: 'userId', as: 'User' });

User.hasOne(AdminProfile, { foreignKey: 'userId', as: 'AdminProfile' });
AdminProfile.belongsTo(User, { foreignKey: 'userId', as: 'User' });

CommerceProfile.hasMany(Category, { foreignKey: 'commerceId', as: 'Categories' });
Category.belongsTo(CommerceProfile, { foreignKey: 'commerceId', as: 'Commerce' });

Category.hasMany(Product, { foreignKey: 'categoryId', as: 'Products' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'Category' });

User.hasMany(Address, { foreignKey: 'clientId', as: 'Addresses' });
Address.belongsTo(User, { foreignKey: 'clientId', as: 'User' });

User.hasMany(Favorite, { foreignKey: 'clientId', as: 'Favorites' });
Favorite.belongsTo(User, { foreignKey: 'clientId', as: 'User' });
Favorite.belongsTo(CommerceProfile, { foreignKey: 'commerceId', as: 'Commerce' });

User.hasMany(Order, { foreignKey: 'clientId', as: 'Orders' });
Order.belongsTo(User, { foreignKey: 'clientId', as: 'Client' });

User.hasMany(Order, { foreignKey: 'deliveryId', as: 'Delivery' });
Order.belongsTo(User, { foreignKey: 'deliveryId', as: 'Delivery' });

CommerceProfile.hasMany(Order, { foreignKey: 'commerceId', as: 'Commerce' });
Order.belongsTo(CommerceProfile, { foreignKey: 'commerceId', as: 'Commerce' });

Order.belongsTo(Address, { foreignKey: 'addressId', as: 'Address' });

Order.hasMany(OrderProduct, { foreignKey: 'orderId', as: 'OrderProducts' });
OrderProduct.belongsTo(Order, { foreignKey: 'orderId', as: 'Order' });
OrderProduct.belongsTo(Product, { foreignKey: 'productId', as: 'Product' });

module.exports = {
  sequelize,
  Op,
  User,
  ClientProfile,
  DeliveryProfile,
  CommerceProfile,
  Category,
  Product,
  Address,
  Favorite,
  Order,
  OrderProduct,
  Configuration,
  AdminProfile
};