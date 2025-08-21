const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AdminProfile = sequelize.define('AdminProfile', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  firstName: { type: DataTypes.STRING, allowNull: false },
  lastName: { type: DataTypes.STRING, allowNull: false },
  idCard: { type: DataTypes.STRING, allowNull: false }
});

module.exports = AdminProfile;