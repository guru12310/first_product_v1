const axios = require('axios');
require('dotenv').config();

const FB_API = 'https://graph.facebook.com';
const API_VER = process.env.IG_API_VERSION || 'v17.0';

async function exchangeCodeForToken(code, redirect_uri) {
  const res = await axios.get(`${FB_API}/${API_VER}/oauth/access_token`, {
    params: {
      client_id: process.env.FB_APP_ID,
      client_secret: process.env.FB_APP_SECRET,
      redirect_uri,
      code
    }
  });
  return res.data;
}

async function getLongLivedToken(shortLivedToken) {
  const res = await axios.get(`${FB_API}/${API_VER}/oauth/access_token`, {
    params: {
      grant_type: 'fb_exchange_token',
      client_id: process.env.FB_APP_ID,
      client_secret: process.env.FB_APP_SECRET,
      fb_exchange_token: shortLivedToken
    }
  });
  return res.data;
}

// async function getPages(longToken) {
//   const res = await axios.get(`${FB_API}/${API_VER}/me/accounts`, {
//     params: { access_token: longToken }
//   });
//   return res.data;
// }


async function getPages(longToken) {
  const res = await axios.get(
    `${FB_API}/${API_VER}/me/accounts`,
    {
      params: {
        access_token: longToken,
        fields: 'id,name,access_token,instagram_business_account'
      }
    }
  );
  return res.data;
}


async function getInstagramAccountId(pageId, pageAccessToken) {
  const res = await axios.get(`${FB_API}/${API_VER}/${pageId}`, {
    params: { fields: 'connected_instagram_account', access_token: pageAccessToken }
  });
  return res.data;
}

module.exports = { exchangeCodeForToken, getLongLivedToken, getPages, getInstagramAccountId, FB_API, API_VER };
