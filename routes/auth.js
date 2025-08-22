const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { check } = require('express-validator');
const multer = require('multer');
const path = require('path');

// Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

router.get('/login', authController.getLogin);
router.post('/login', [
  check('emailOrUsername').notEmpty().withMessage('Email or username is required'),
  check('password').notEmpty().withMessage('Password is required')
], authController.postLogin);

router.get('/register-client-delivery', authController.getRegisterClientDelivery);
router.post('/register-client-delivery', upload.single('file'), [
  check('firstName').notEmpty().withMessage('First name is required'),
  check('lastName').notEmpty().withMessage('Last name is required'),
  check('phone').notEmpty().withMessage('Phone is required'),
  check('email').isEmail().withMessage('Valid email is required'),
  check('username').notEmpty().withMessage('Username is required'),
  check('role').isIn(['client', 'delivery']).withMessage('Invalid role'),
  check('password').notEmpty().withMessage('Password is required'),
  check('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords must match')
], authController.postRegisterClientDelivery);

router.get('/register-commerce', authController.getRegisterCommerce);
router.post('/register-commerce', upload.single('file'), [
  check('name').notEmpty().withMessage('Commerce name is required'),
  check('phone').notEmpty().withMessage('Phone is required'),
  check('email').isEmail().withMessage('Valid email is required'),
  check('openHour').notEmpty().withMessage('Open hour is required'),
  check('closeHour').notEmpty().withMessage('Close hour is required'),
  check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  check('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
], authController.postRegisterCommerce);

router.get('/reset-password-request', authController.getResetRequest);
router.post('/reset-password-request', [
  check('emailOrUsername').notEmpty().withMessage('Email or username is required')
], authController.postResetRequest);

router.get('/reset-password/:token', authController.getReset);
router.post('/reset-password/:token', [
  check('password').notEmpty().withMessage('Password is required'),
  check('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords must match')
], authController.postReset);

router.get('/activate/:token', authController.activate);
router.get('/logout', (req, res, next) => {
  console.log('GET /auth/logout called');
  next();
}, authController.logout);

module.exports = router;
