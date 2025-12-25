const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/auth_controller');
const auth = require('../middleware/auth_middleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getMe);

module.exports = router;
