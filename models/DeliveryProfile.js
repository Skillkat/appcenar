const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DeliveryProfile = sequelize.define('DeliveryProfile', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  photo: { type: DataTypes.STRING, allowNull: true },
  available: { type: DataTypes.BOOLEAN, defaultValue: true }
});

module.exports = DeliveryProfile;