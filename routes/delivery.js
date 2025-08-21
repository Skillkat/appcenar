
const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { check } = require('express-validator');

router.use(authMiddleware);
router.use(roleMiddleware(['delivery']));

router.get('/home', deliveryController.getHome);
router.get('/profile', deliveryController.getProfile);
router.post('/profile', [
  check('firstName').notEmpty().withMessage('First name is required'),
  check('lastName').notEmpty().withMessage('Last name is required'),
  check('phone').notEmpty().withMessage('Phone is required')
], deliveryController.postProfile);
router.get('/order/:id', deliveryController.getOrderDetail);
router.post('/order/:id/complete', deliveryController.completeOrder);

module.exports = router;
