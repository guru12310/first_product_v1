// require('dotenv').config();
// const { Worker } = require('bullmq');
// const path = require('path');
// const fs = require('fs');
// const db = require('../db/db');
// const driveService = require('../services/drive.service');
// const cloudinary = require('../services/cloudinary.service');
// const igService = require('../services/ig.service');

// const connection = { connection: process.env.REDIS_URL || 'redis://127.0.0.1:6379' };

// const worker = new Worker('publishQueue', async job => {
//   const { media_id } = job.data;
//   console.log('Processing job for media', media_id);

//   // Fetch media and its IG account
//   const q = 'SELECT m.*, ia.access_token, ia.ig_user_id FROM media_items m LEFT JOIN ig_accounts ia ON m.ig_account_id = ia.id WHERE m.id=$1';
//   const r = await db.query(q, [media_id]);
//   if (!r.rows.length) throw new Error('Media not found');
//   const media = r.rows[0];

//   if (!media.ig_account_id || !media.access_token || !media.ig_user_id) {
//     // can't publish without IG account
//     await db.query('UPDATE media_items SET status=$1, updated_at=NOW() WHERE id=$2', ['FAILED', media_id]);
//     await db.query('INSERT INTO job_logs (media_item_id, job_type, status, response) VALUES ($1,$2,$3,$4)', [media_id, 'publish', 'failed', { reason: 'IG account/token missing' }]);
//     throw new Error('IG account/token missing');
//   }

//   try {
//     await db.query('UPDATE media_items SET status=$1, updated_at=NOW() WHERE id=$2', ['PROCESSING', media_id]);

//     // download file from Drive to temp
//     const tmpDir = path.join(__dirname, '..', 'tmp_uploads');
//     if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
//     const localPath = path.join(tmpDir, `${media_id}_${Date.now()}`);
//     await driveService.downloadFileToLocal(media.drive_file_id, localPath);

//     // upload to Cloudinary to produce public URL (more reliable than Drive direct for IG)
//     const uploadRes = await cloudinary.uploadLocalFile(localPath);
//     const publicUrl = uploadRes.secure_url;

//     // create media container
//     const createRes = await igService.createMediaContainer({
//       igUserId: media.ig_user_id,
//       accessToken: media.access_token,
//       postType: media.post_type,
//       mediaUrl: publicUrl,
//       caption: media.caption || ''
//     });

//     // publish
//     const publishRes = await igService.publishMedia({ igUserId: media.ig_user_id, accessToken: media.access_token, creationId: createRes.id });

//     // update DB
//     await db.query('UPDATE media_items SET status=$1, cloudinary_url=$2, creation_response=$3, updated_at=NOW() WHERE id=$4',
//       ['SUCCESS', publicUrl, JSON.stringify(publishRes), media_id]);
//     await db.query('INSERT INTO job_logs (media_item_id, job_type, status, response) VALUES ($1,$2,$3,$4)', [media_id, 'publish', 'success', publishRes]);

//     // cleanup local
//     fs.unlink(localPath, () => {});
//     console.log('Publish success for media', media_id);
//     return { ok: true, publishRes };
//   } catch (err) {
//     console.error('Publish failed', err.response ? err.response.data : err.message);
//     await db.query('UPDATE media_items SET status=$1, updated_at=NOW() WHERE id=$2', ['FAILED', media_id]);
//     await db.query('INSERT INTO job_logs (media_item_id, job_type, status, response) VALUES ($1,$2,$3,$4)', [media_id, 'publish', 'failed', { error: err.message }]);
//     throw err;
//   }
// }, connection);

// worker.on('completed', job => console.log('Job completed', job.id));
// worker.on('failed', (job, err) => console.error('Job failed', job.id, err.message));
