const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CommerceProfile = sequelize.define('CommerceProfile', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: false },
    logo: { type: DataTypes.STRING, allowNull: true },
    openHour: { type: DataTypes.STRING, allowNull: false },
    closeHour: { type: DataTypes.STRING, allowNull: false },
    commerceTypeId: { type: DataTypes.INTEGER, allowNull: false }
  });
  
  module.exports = CommerceProfile;