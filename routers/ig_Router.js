const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth_middleware');
const igController = require('../controllers/ig_controller');

router.get('/ig/connect', igController.startConnect); // returns redirect URL or redirects
router.get('/ig/callback', igController.callback); // FB redirects here

router.get('/ig/accounts', auth, igController.listAccounts); // list connected IG accounts for user
router.delete('/ig/disconnect/:id', auth, igController.disconnectAccount);

module.exports = router;
