const sequelize = require('../config/database');
const User = require('./user');
const ClientProfile = require('./ClientProfile');
const DeliveryProfile = require('./DeliveryProfile');
const CommerceProfile = require('./CommerceProfile');
const AdminProfile = require('./AdminProfile');
const CommerceType = require('./CommerceType');
const Category = require('./Category');
const Product = require('./Product');
const Address = require('./Address');
const Favorite = require('./Favorite');
const Order = require('./Order');
const OrderProduct = require('./OrderProduct');
const Configuration = require('./Configuration');

// Associations
User.hasOne(ClientProfile, { foreignKey: 'userId', as: 'ClientProfile' });
ClientProfile.belongsTo(User, { foreignKey: 'userId', as: 'User' });

User.hasOne(DeliveryProfile, { foreignKey: 'userId', as: 'DeliveryProfile' });
DeliveryProfile.belongsTo(User, { foreignKey: 'userId', as: 'User' });

User.hasOne(CommerceProfile, { foreignKey: 'userId', as: 'CommerceProfile' });
CommerceProfile.belongsTo(User, { foreignKey: 'userId', as: 'User' });

User.hasOne(AdminProfile, { foreignKey: 'userId', as: 'AdminProfile' });
AdminProfile.belongsTo(User, { foreignKey: 'userId', as: 'User' });

CommerceProfile.belongsTo(CommerceType, { foreignKey: 'commerceTypeId', as: 'CommerceType' });
CommerceType.hasMany(CommerceProfile, { foreignKey: 'commerceTypeId', as: 'CommerceProfiles' });

Category.belongsTo(CommerceProfile, { foreignKey: 'commerceId', as: 'Commerce' });
CommerceProfile.hasMany(Category, { foreignKey: 'commerceId', as: 'Categories' });

Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'Category' });
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'Products' });

Address.belongsTo(ClientProfile, { foreignKey: 'clientId', as: 'Client' });
ClientProfile.hasMany(Address, { foreignKey: 'clientId', as: 'Addresses' });

Favorite.belongsTo(ClientProfile, { foreignKey: 'clientId', as: 'Client' });
ClientProfile.hasMany(Favorite, { foreignKey: 'clientId', as: 'Favorites' });

Favorite.belongsTo(CommerceProfile, { foreignKey: 'commerceId', as: 'Commerce' });
CommerceProfile.hasMany(Favorite, { foreignKey: 'commerceId', as: 'FavoritedBy' });

Order.belongsTo(ClientProfile, { foreignKey: 'clientId', as: 'Client' });
ClientProfile.hasMany(Order, { foreignKey: 'clientId', as: 'ClientOrders' });

Order.belongsTo(CommerceProfile, { foreignKey: 'commerceId', as: 'Commerce' });
CommerceProfile.hasMany(Order, { foreignKey: 'commerceId', as: 'CommerceOrders' });

Order.belongsTo(DeliveryProfile, { foreignKey: 'deliveryId', as: 'Delivery' });
DeliveryProfile.hasMany(Order, { foreignKey: 'deliveryId', as: 'DeliveryOrders' });

Order.belongsTo(Address, { foreignKey: 'addressId', as: 'Address' });
Address.hasMany(Order, { foreignKey: 'addressId', as: 'Orders' });

Order.hasMany(OrderProduct, { foreignKey: 'orderId', as: 'OrderProducts' });
OrderProduct.belongsTo(Order, { foreignKey: 'orderId', as: 'Order' });

Product.hasMany(OrderProduct, { foreignKey: 'productId', as: 'OrderProducts' });
OrderProduct.belongsTo(Product, { foreignKey: 'productId', as: 'Product' });

module.exports = {
  sequelize,
  User,
  ClientProfile,
  DeliveryProfile,
  CommerceProfile,
  AdminProfile,
  CommerceType,
  Category,
  Product,
  Address,
  Favorite,
  Order,
  OrderProduct,
  Configuration
};