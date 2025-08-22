const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { check } = require('express-validator');

router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

router.get('/home', adminController.getDashboard);
router.get('/clients', adminController.getClients);
router.post('/client/:id/toggle-active', adminController.toggleClientActive);
router.get('/deliveries', adminController.getDeliveries);
router.post('/delivery/:id/toggle-active', adminController.toggleDeliveryActive);
router.get('/commerces', adminController.getCommerces);
router.post('/commerce/:id/toggle-active', adminController.toggleCommerceActive);
router.get('/config', adminController.getConfig);
router.post('/config', [
  check('itbis').isFloat({ min: 0 }).withMessage('Valid ITBIS percentage is required')
], adminController.postConfig);
router.get('/admins', adminController.getAdmins);
router.get('/admin/new', adminController.getNewAdmin);
router.post('/admin/new', [
  check('firstName').notEmpty().withMessage('First name is required'),
  check('lastName').notEmpty().withMessage('Last name is required'),
  check('idCard').notEmpty().withMessage('ID card is required'),
  check('email').isEmail().withMessage('Valid email is required'),
  check('username').notEmpty().withMessage('Username is required'),
  check('password').notEmpty().withMessage('Password is required'),
  check('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords must match')
], adminController.postNewAdmin);
router.get('/admin/edit/:id', adminController.getEditAdmin);
router.post('/admin/edit/:id', [
  check('firstName').notEmpty().withMessage('First name is required'),
  check('lastName').notEmpty().withMessage('Last name is required'),
  check('idCard').notEmpty().withMessage('ID card is required'),
  check('email').isEmail().withMessage('Valid email is required'),
  check('username').notEmpty().withMessage('Username is required')
], adminController.postEditAdmin);
router.post('/admin/:id/toggle-active', adminController.toggleAdminActive);
router.get('/commerce/new', adminController.getNewCommerce);
router.post('/commerce/new', [
  check('name').notEmpty().withMessage('Name is required'),
  check('phone').notEmpty().withMessage('Phone is required'),
  check('email').isEmail().withMessage('Valid email is required'),
  check('openHour').notEmpty().withMessage('Open hour is required'),
  check('closeHour').notEmpty().withMessage('Close hour is required'),
  check('username').notEmpty().withMessage('Username is required'),
  check('password').notEmpty().withMessage('Password is required'),
  check('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords must match')
], adminController.postNewCommerce);
router.get('/commerce/edit/:id', adminController.getEditCommerce);
router.post('/commerce/edit/:id', [
  check('name').notEmpty().withMessage('Name is required'),
  check('phone').notEmpty().withMessage('Phone is required'),
  check('email').isEmail().withMessage('Valid email is required'),
  check('openHour').notEmpty().withMessage('Open hour is required'),
  check('closeHour').notEmpty().withMessage('Close hour is required'),
  check('username').notEmpty().withMessage('Username is required')
], adminController.postEditCommerce);

module.exports = router;