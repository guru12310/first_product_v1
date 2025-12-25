const axios = require('axios');
const { FB_API, API_VER } = require('./facebook_service');

async function createMediaContainer({ igUserId, accessToken, postType, mediaUrl, caption }) {
  const url = `${FB_API}/${API_VER}/${igUserId}/media`;
  const params = { access_token: accessToken, caption: caption || '' };

  console.log("========param",params)

  if (postType === 'reels') {
    params.media_type = 'REELS';
    params.video_url = mediaUrl;
  } else if (postType === 'post') {
    // choose image or video depending on extension
    if (mediaUrl.match(/\.(mp4|mov|m4v)(\?|$)/i)) {
      params.media_type = 'VIDEO';
      params.video_url = mediaUrl;
    } else {
      params.media_type = 'IMAGE';
      params.image_url = mediaUrl;
    }
  } else if (postType === 'story') {
    // Story posting via content publishing might be similar
    if (mediaUrl.match(/\.(mp4|mov|m4v)(\?|$)/i)) {
      params.media_type = 'VIDEO';
      params.video_url = mediaUrl;
    } else {
      params.media_type = 'IMAGE';
      params.image_url = mediaUrl;
    }
  }

  const res = await axios.post(url, null, { params });
  return res.data; // { id: creation_id }
}

async function publishMedia({ igUserId, accessToken, creationId }) {
  const url = `${FB_API}/${API_VER}/${igUserId}/media_publish`;
  const res = await axios.post(url, null, {
    params: { creation_id: creationId, access_token: accessToken }
  });
  return res.data;
}

module.exports = { createMediaContainer, publishMedia };
