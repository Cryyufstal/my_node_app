const express = require('express');
const { body } = require('express-validator');
const {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost
} = require('../controllers/postController');
const { auth } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// تحقق من صحة بيانات المقال
const postValidation = [
  body('title')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('content')
    .isLength({ min: 50 })
    .withMessage('Content must be at least 50 characters long'),
  body('excerpt')
    .optional()
    .isLength({ max: 300 })
    .withMessage('Excerpt cannot exceed 300 characters')
];

// جميع المسارات تحتاج مصادقة ما عدا الجلب
router.post('/', auth, postValidation, handleValidationErrors, createPost);
router.get('/', getPosts);
router.get('/:slug', getPost);
router.put('/:slug', auth, postValidation, handleValidationErrors, updatePost);
router.delete('/:slug', auth, deletePost);

module.exports = router;