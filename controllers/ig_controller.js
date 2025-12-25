const db = require('../db/db');
const facebookService = require('../services/facebook_service');

// exports.startConnect = async (req, res) => {
//   // Redirect user to FB OAuth
//   try {
//     const redirectUri = process.env.FB_REDIRECT_URI;
//     console.log('redirectUri',redirectUri)
//     const apiVer = process.env.IG_API_VERSION || 'v17.0';
//     console.log('apiVer',apiVer)
//     console.log('process.env.FB_APP_ID',process.env.FB_APP_ID)

//     const fbAuthUrl = `https://www.facebook.com/${apiVer}/dialog/oauth` +
//       `?client_id=${process.env.FB_APP_ID}` +
//       `&redirect_uri=${encodeURIComponent(redirectUri)}` +
//       `&scope=instagram_basic,instagram_content_publish,pages_show_list`;
      
//     // Option A: redirect directly
//     return res.json({ success: true, message: 'Use this URL to connect Instagram', data: { url: fbAuthUrl }, error: null });
//     // If you prefer to redirect: res.redirect(fbAuthUrl)
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ success: false, message: 'Error creating auth URL', data: null, error: err.message });
//   }
// };


exports.startConnect = async (req, res) => {
  try {
    const redirectUri = process.env.FB_REDIRECT_URI;
    const apiVer = process.env.IG_API_VERSION || 'v19.0';

    const scopes = [
      'email',
      'public_profile',
      'pages_show_list',
      'pages_read_engagement',
      'business_management',
      'instagram_basic',
      'instagram_content_publish'
    ].join(',');

    const fbAuthUrl =
      `https://www.facebook.com/${apiVer}/dialog/oauth` +
      `?client_id=${process.env.FB_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&auth_type=rerequest` +
      `&scope=${scopes}`;

    return res.json({
      success: true,
      message: 'Use this URL to connect Instagram',
      data: { url: fbAuthUrl },
      error: null
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Error creating auth URL',
      data: null,
      error: err.message
    });
  }
};


// exports.callback = async (req, res) => {
//   // FB will redirect here with ?code=...
//   try {
//     console.log("inside the call back-1")
//     const code = req.query.code;
//     if (!code) return res.status(400).send('Missing code');
//     console.log("inside the call back-2")

//     const redirect_uri = process.env.FB_REDIRECT_URI;
//     // Exchange code for short token
//     const short = await facebookService.exchangeCodeForToken(code, redirect_uri);
//     console.log("inside the call back-3")

//     // Exchange for long-lived token
//     const long = await facebookService.getLongLivedToken(short.access_token);
//     console.log("inside the call back-4")

//     // Get pages for user
//     console.log("-------long.access_token------",long.access_token)

    
//     const pages = await facebookService.getPages(long.access_token);
//     if (!pages || !pages.data || pages.data.length === 0) {
//       return res.status(400).send('No Facebook pages found or none linked to IG account');
//     }
// CMB
//     console.log("inside the call back-5")

//     // For MVP, pick the first page
//     const page = pages.data[0];
//     const pageAccessToken = page.access_token;
//     const pageDetails = await facebookService.getInstagramAccountId(page.id, pageAccessToken);
//     const igAccount = pageDetails.connected_instagram_account;
//     if (!igAccount || !igAccount.id) return res.status(400).send('No Instagram account connected to the selected Facebook Page');

//     console.log("inside the call back-6")

//     // IMPORTANT: For production you must link to logged-in user. For MVP we use a placeholder user or accept a query param user_id.
//     // If frontend passes `state` param with user_id, parse here. Let's support state=userId
//     const state = req.query.state;
//     let userId = null;
//     if (state) {
//       // state could be userId
//     console.log("inside the call back-7")

//       userId = parseInt(state, 10);
//     } else {
//     console.log("inside the call back-8")

//       // fallback: attach to first user (DEV) -> change for real system
//       const ures = await db.query('SELECT id FROM tbl_users ORDER BY id LIMIT 1');
//       if (ures.rows.length === 0) {
//     console.log("inside the call back-9")

//         // create a dummy user to attach
//         const created = await db.query('INSERT INTO tbl_users (name,email,password) VALUES ($1,$2,$3) RETURNING id', ['MVP User', 'mvp@local', 'mvp-pass']);
//         userId = created.rows[0].id;
//       } else userId = ures.rows[0].id;
//     }

//     console.log("inside the call back-10")

//     // Save ig_account to DB
//     const insert = await db.query(
//       `INSERT INTO tbl_ig_accounts (user_id, ig_user_id, fb_page_id, access_token, token_expires_at)
//        VALUES ($1,$2,$3,$4,$5) RETURNING id,ig_user_id,fb_page_id,created_at`,
//       [userId, igAccount.id, page.id, long.access_token, new Date(Date.now() + (long.expires_in * 1000))]
//     );

//     // redirect to frontend or return JSON
//     // Prefer redirect back to FRONTEND_URL with ig_account_id
//     console.log("inside the call back-11")

//     const igAcc = insert.rows[0];
//     const redirectTo = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/?ig_account_id=${igAcc.id}`;
//     return res.redirect(redirectTo);
//   } catch (err) {
//     console.error('IG callback err', err.response ? err.response.data : err.message);
//     return res.status(500).send('IG callback error: ' + (err.message || 'unknown'));
//   }
// };



exports.callback = async (req, res) => {
  try {
    console.log("inside the callback-1");

    const code = req.query.code;
    if (!code) return res.status(400).send('Missing code');

    const redirect_uri = process.env.FB_REDIRECT_URI;

    // 1️⃣ Short token
    const short = await facebookService.exchangeCodeForToken(code, redirect_uri);

    // 2️⃣ Long-lived token
    const long = await facebookService.getLongLivedToken(short.access_token);
    console.log("Long token generated:", long.access_token);

    // 3️⃣ Get pages WITH IG info
    const pages = await facebookService.getPages(long.access_token);

    if (!pages?.data?.length) {
      return res.status(400).send('No Facebook Pages found for this user');
    }

    // 4️⃣ Find page linked to Instagram
    const page = pages.data.find(
      p => p.instagram_business_account && p.instagram_business_account.id
    );

    if (!page) {
      return res.status(400).send(
        'Facebook Page exists but no Instagram Business account is linked'
      );
    }

    console.log("Page found:", page.name);
    console.log("IG Business ID:", page.instagram_business_account.id);

    const igAccountId = page.instagram_business_account.id;
    const pageId = page.id;

    // 5️⃣ Resolve user
    let userId;
    const state = req.query.state;

    if (state) {
      userId = parseInt(state, 10);
    } else {
      const ures = await db.query(
        'SELECT id FROM tbl_users ORDER BY id LIMIT 1'
      );

      if (ures.rows.length === 0) {
        const created = await db.query(
          'INSERT INTO tbl_users (name,email,password) VALUES ($1,$2,$3) RETURNING id',
          ['MVP User', 'mvp@local', 'mvp-pass']
        );
        userId = created.rows[0].id;
      } else {
        userId = ures.rows[0].id;
      }
    }
    console.log("-------userId-----",userId)
    console.log("-------igAccountId-----",igAccountId)
    console.log("-------pageId-----",pageId)
    console.log("-------long.access_token-----",long.access_token)
    console.log("-------long.access_token-----",new Date(Date.now() + long.expires_in * 1000))
    const expiresIn = Number(long.expires_in); // convert to number
const expiryDate = isNaN(expiresIn)
  ? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // fallback: 60 days
  : new Date(Date.now() + expiresIn * 1000);
    // 6️⃣ Save IG account
    const insert = await db.query(
      `INSERT INTO tbl_ig_accounts 
       (user_id, ig_user_id, fb_page_id, access_token, token_expires_at)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, ig_user_id, fb_page_id, created_at`,
      [
        userId,
        igAccountId,
        pageId,
        long.access_token,
        expiryDate
        // new Date(Date.now() + long.expires_in * 1000)
        // '2025-12-14'
      ]
    );

    console.log("IG account saved:", insert.rows[0]);

    // 7️⃣ Redirect
    // const redirectTo =
    //   `${process.env.FRONTEND_URL || 'http://localhost:3000'}` +
    //   `/?ig_account_id=${insert.rows[0].id}`;

    // return res.redirect(redirectTo);
    return res.status(200).send('success');


  } catch (err) {
    console.error(
      'IG callback error:',
      err.response?.data || err.message
    );
    return res.status(500).send('IG callback error');
  }
};


exports.listAccounts = async (req, res) => {
  try {
    const uid = req.user.id;
    const q = 'SELECT id,ig_user_id,fb_page_id,created_at FROM ig_accounts WHERE user_id=$1';
    const r = await db.query(q, [uid]);
    return res.json({ success: true, message: 'Connected Instagram accounts', data: r.rows, error: null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal error', data: null, error: err.message });
  }
};

exports.disconnectAccount = async (req, res) => {
  try {
    const uid = req.user.id;
    const accId = parseInt(req.params.id, 10);
    // ensure account belongs to user
    const check = await db.query('SELECT id FROM ig_accounts WHERE id=$1 AND user_id=$2', [accId, uid]);
    if (check.rows.length === 0) return res.status(404).json({ success: false, message: 'Account not found', data: null, error: 'Not found' });

    await db.query('DELETE FROM ig_accounts WHERE id=$1', [accId]);
    return res.json({ success: true, message: 'Account disconnected', data: null, error: null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal error', data: null, error: err.message });
  }
};
