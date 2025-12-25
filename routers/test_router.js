const igTestPostController = require('../controllers/test_controller');

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(process.cwd(), 'tmp_uploads'));
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    }
  })
});

// const igController = require('../controllers/ig.controller');

router.post(
  '/test-post',
  upload.single('image'),
  igTestPostController.postImageToInstagram
);

module.exports = router;
