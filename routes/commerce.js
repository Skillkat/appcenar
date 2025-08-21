const express = require('express');
const router = express.Router();
const commerceController = require('../controllers/commerceController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const { check } = require('express-validator');

router.use(authMiddleware);
router.use(roleMiddleware(['commerce']));

router.get('/home', commerceController.getHome);
router.get('/profile', commerceController.getProfile);
router.post('/profile', [
  check('name').notEmpty().withMessage('Name is required'),
  check('phone').notEmpty().withMessage('Phone is required'),
  check('openHour').notEmpty().withMessage('Open hour is required'),
  check('closeHour').notEmpty().withMessage('Close hour is required')
], commerceController.postProfile);
router.get('/categories', commerceController.getCategories);
router.get('/category/new', commerceController.getNewCategory);
router.post('/category/new', [
  check('name').notEmpty().withMessage('Name is required'),
  check('description').notEmpty().withMessage('Description is required')
], commerceController.postNewCategory);
router.get('/category/edit/:id', commerceController.getEditCategory);
router.post('/category/edit/:id', [
  check('name').notEmpty().withMessage('Name is required'),
  check('description').notEmpty().withMessage('Description is required')
], commerceController.postEditCategory);
router.get('/category/delete/:id', commerceController.getDeleteCategory);
router.post('/category/delete/:id', commerceController.postDeleteCategory);
router.get('/products', commerceController.getProducts);
router.get('/product/new', commerceController.getNewProduct);
router.post('/product/new', [
  check('name').notEmpty().withMessage('Name is required'),
  check('description').notEmpty().withMessage('Description is required'),
  check('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  check('categoryId').notEmpty().withMessage('Category is required')
], commerceController.postNewProduct);
router.get('/product/edit/:id', commerceController.getEditProduct);
router.post('/product/edit/:id', [
  check('name').notEmpty().withMessage('Name is required'),
  check('description').notEmpty().withMessage('Description is required'),
  check('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  check('categoryId').notEmpty().withMessage('Category is required')
], commerceController.postEditProduct);
router.get('/product/delete/:id', commerceController.getDeleteProduct);
router.post('/product/delete/:id', commerceController.postDeleteProduct);
router.get('/order/:id', commerceController.getOrderDetail);
router.post('/order/:id/assign-delivery', commerceController.assignDelivery);

module.exports = router;