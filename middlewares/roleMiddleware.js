    module.exports = (roles) => (req, res, next) => {
        console.log('Role middleware called for roles:', roles, 'user role:', req.session.role);
        if (req.session.role && roles.includes(req.session.role)) {
          next();
        } else {
          console.log('Unauthorized role, redirecting to /auth/login');
          res.redirect('/auth/login');
        }
      };