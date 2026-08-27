const express = require('express');
const { getConfig, updateConfig } = require('../controllers/configController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', getConfig);
router.put('/', protect, updateConfig);

module.exports = router;
