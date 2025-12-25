// require('dotenv').config();
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// const axios = require('axios');
// const db = require('../db/db');
// const igService = require('../services/ig_service');




// exports.postImageToInstagram = async (req, res) => {
//   try {
//     const { ig_account_id, caption } = req.body;

//     console.log("--req-",req.file)
//     console.log("--req-",req.body)
//     console.log("==========")

//     const file =
//       req.file ||
//       (req.files && req.files.image && req.files.image[0]);

//     if (!file) {
//       return res.status(400).json({
//         success: false,
//         message: 'Image file required'
//       });
//     }

//     const localImagePath = req.file.path;

//     // 1️⃣ Fetch IG account
//     const igRes = await db.query(
//       'SELECT ig_user_id, access_token FROM tbl_ig_accounts WHERE id = $1',
//       [ig_account_id]
//     );

//     if (!igRes.rows.length) {
//       return res.status(404).json({
//         success: false,
//         message: 'IG account not found'
//       });
//     }

//     const { ig_user_id, access_token } = igRes.rows[0];

//     // 2️⃣ Upload local image to Cloudinary (or ngrok public URL)
//     // const uploadRes = await cloudinary.uploadLocalFile(localImagePath);
//     // const imageUrl = uploadRes.secure_url;

// //     const fileName = path.basename(localImagePath);

// // const imageUrl = `${process.env.PUBLIC_BASE_URL}/uploads/${fileName}`;


//     // 3️⃣ Create IG media container
//     // const container = await igService.createMediaContainer({
//     //   igUserId: ig_user_id,
//     //   accessToken: access_token,
//     //   mediaUrl: imageUrl,
//     //   caption: caption || ''
//     // });


//     // const path = require('path');

// // ...

// // const localImagePath = file.path;
// const fileName = path.basename(localImagePath);

// // 🔥 PUBLIC HTTPS URL VIA NGROK
// const imageUrl = `${process.env.PUBLIC_BASE_URL}/tmp_uploads/${fileName}`;

// // 3️⃣ Create IG media container
// const container = await igService.createMediaContainer({
//   igUserId: ig_user_id,
//   accessToken: access_token,
//    postType: 'post', 
//   mediaUrl: imageUrl,
//   caption: caption || ''
// });


//     // 4️⃣ Publish to Instagram
//     const publish = await igService.publishMedia({
//       igUserId: ig_user_id,
//       accessToken: access_token,
//       creationId: container.id
//     });

//     // 5️⃣ Cleanup temp file
//     fs.unlink(localImagePath, () => {});

//     return res.json({
//       success: true,
//       message: 'Posted to Instagram successfully',
//       data: publish
//     });

//   } catch (err) {
//     console.error('IG post error', err.response?.data || err.message);
//     return res.status(500).json({
//       success: false,
//       message: 'Instagram post failed',
//       error: err.message
//     });
//   }
// };




require('dotenv').config();
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const db = require('../db/db');
const igService = require('../services/ig_service');

exports.postImageToInstagram = async (req, res) => {
  try {
    console.log('BODY =>', req.body);
    console.log('FILE =>', req.file);

    const { ig_account_id, caption } = req.body;

    // 🔴 1. Validate image upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file required'
      });
    }

    const localImagePath = req.file.path;
    const fileName = path.basename(localImagePath);

    // 🔴 2. Validate IG account
    if (!ig_account_id) {
      return res.status(400).json({
        success: false,
        message: 'ig_account_id is required'
      });
    }

    const igRes = await db.query(
      'SELECT ig_user_id, access_token FROM tbl_ig_accounts WHERE id = $1',
      [ig_account_id]
    );

    if (!igRes.rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Instagram account not found'
      });
    }

    const { ig_user_id, access_token } = igRes.rows[0];

    // 🔴 3. Build PUBLIC HTTPS image URL (ngrok)
    if (!process.env.PUBLIC_BASE_URL) {
      throw new Error('PUBLIC_BASE_URL missing in .env');
    }

    const imageUrl = `${process.env.PUBLIC_BASE_URL}/tmp_uploads/${fileName}`;
    console.log('PUBLIC IMAGE URL =>', imageUrl);

    // 🔴 4. Verify Facebook can access image
    const testFetch = await axios.get(imageUrl);
    console.log('IMAGE FETCH STATUS =>', testFetch.status);

    // 🔴 5. Create IG media container (IMAGE ONLY)
    const container = await igService.createMediaContainer({
      igUserId: ig_user_id,
      accessToken: access_token,
      postType:'post',
      mediaUrl: imageUrl,
      caption: caption || ''
    });

    console.log('CONTAINER =>', container);

    // 🔴 6. Publish media
    const publish = await igService.publishMedia({
      igUserId: ig_user_id,
      accessToken: access_token,
      creationId: container.id
    });

    console.log('PUBLISHED =>', publish);

    // 🔴 7. Cleanup local file (optional)
    fs.unlink(localImagePath, () => {});

    return res.json({
      success: true,
      message: 'Instagram post published successfully',
      data: publish
    });

  } catch (err) {
    console.error('IG POST ERROR =>', err.response?.data || err.message);

    return res.status(500).json({
      success: false,
      message: 'Instagram post failed',
      error: err.response?.data || err.message
    });
  }
};
