const express = require('express');
const router = express.Router();

// يمكنك إضافة مسارات المستخدمين هنا لاحقًا
router.get('/', (req, res) => {
  res.json({ message: 'Users routes - to be implemented' });
});

module.exports = router;
