const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  clientId: { type: DataTypes.INTEGER, allowNull: false },
  commerceId: { type: DataTypes.INTEGER, allowNull: false },
  deliveryId: { type: DataTypes.INTEGER, allowNull: true },
  addressId: { type: DataTypes.INTEGER, allowNull: false },
  status: { 
    type: DataTypes.ENUM('pending', 'in_process', 'completed'), 
    allowNull: false, 
    defaultValue: 'pending' 
  },
  subtotal: { type: DataTypes.FLOAT, allowNull: false },
  itbisAmount: { type: DataTypes.FLOAT, allowNull: false },
  total: { type: DataTypes.FLOAT, allowNull: false },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
});

module.exports = Order;