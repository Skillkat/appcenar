const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Configuration = sequelize.define('Configuration', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  itbis: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 18.0
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Configurations'
});

module.exports = Configuration;