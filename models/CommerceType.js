const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CommerceType = sequelize.define('CommerceType', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  icon: { type: DataTypes.STRING, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: false }
});

module.exports = CommerceType;