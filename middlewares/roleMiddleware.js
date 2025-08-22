const { User } = require('../models');

module.exports = (roles) => async (req, res, next) => {
  console.log('Role middleware called for roles:', roles, 'userId:', req.session.userId);
  try {
    const user = await User.findByPk(req.session.userId);
    if (!user) {
      console.log('User not found for userId:', req.session.userId);
      return res.redirect('/auth/login');
    }
    if (!roles.includes(user.role)) {
      console.log('Unauthorized role:', user.role, 'expected:', roles);
      return res.status(403).render('error', { error: 'Access denied', bodyMenu: '' });
    }
    req.session.role = user.role; // Actualizar session.role por si acaso
    console.log('Role authorized:', user.role);
    next();
  } catch (error) {
    console.error('Error in roleMiddleware:', error.message, error.stack);
    res.status(500).render('error', { error: 'Something went wrong!', bodyMenu: '' });
  }
};