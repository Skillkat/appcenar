const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { check } = require('express-validator');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

router.use(authMiddleware);
router.use(roleMiddleware(['client']));

router.get('/home', clientController.getHome);
router.get('/client/commerce-list', clientController.getCommerceList);
router.get('/catalog/:commerceId', clientController.getCatalog);
router.post('/catalog/:commerceId/add-to-cart', clientController.addToCart);
router.post('/catalog/:commerceId/remove-from-cart', clientController.removeFromCart);
router.get('/select-address/:commerceId', clientController.getSelectAddress);
router.post('/select-address/:commerceId', [
  check('addressId').notEmpty().withMessage('Address is required')
], clientController.postSelectAddress);
router.get('/profile', clientController.getProfile);
router.post('/profile', upload.single('file'), [
  check('firstName').notEmpty().withMessage('First name is required'),
  check('lastName').notEmpty().withMessage('Last name is required'),
  check('phone').notEmpty().withMessage('Phone is required')
], clientController.postProfile);
router.get('/orders', clientController.getOrders);
router.get('/order/:id', clientController.getOrderDetail);
router.get('/addresses', clientController.getAddresses);
router.get('/address/new', clientController.getNewAddress);
router.post('/address/new', [
  check('name').notEmpty().withMessage('Name is required'),
  check('description').notEmpty().withMessage('Description is required')
], clientController.postNewAddress);
router.get('/address/edit/:id', clientController.getEditAddress);
router.post('/address/edit/:id', [
  check('name').notEmpty().withMessage('Name is required'),
  check('description').notEmpty().withMessage('Description is required')
], clientController.postEditAddress);
router.get('/address/delete/:id', clientController.getDeleteAddress);
router.post('/address/delete/:id', clientController.postDeleteAddress);
router.get('/favorites', clientController.getFavorites);
router.post('/favorite/:commerceId', clientController.addFavorite);
router.post('/unfavorite/:commerceId', clientController.removeFavorite);


module.exports = router;
