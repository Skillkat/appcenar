module.exports = (roles) => (req, res, next) => {
  if (roles.includes(req.session.role)) {
    next();
  } else {
    res.redirect('/login');
  }
};