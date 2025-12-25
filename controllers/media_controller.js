const db = require('../db/db');
const fs = require('fs');
const path = require('path');
const driveService = require('../services/drive.service');
const cloudinary = require('../services/cloudinary.service');
const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const redisConnection = { connection: process.env.REDIS_URL || 'redis://127.0.0.1:6379' };
const publishQueue = new Queue('publishQueue', redisConnection);

// Upload endpoint: accepts file, uploads to Drive, creates media_items row, schedules job (delayed Bull job)
exports.upload = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!req.file) return res.status(400).json({ success: false, message: 'File required', data: null, error: 'Missing file' });

    const { post_type, caption, scheduled_time, ig_account_id } = req.body;
    const localPath = req.file.path;
    const filename = req.file.originalname;
    const mimeType = req.file.mimetype;

    // Upload to Drive
    const driveRes = await driveService.uploadFileToDrive({ localFilePath: localPath, filename, mimeType });

    // Insert into media_items
    const q = `INSERT INTO media_items (user_id, ig_account_id, post_type, caption, drive_file_id, drive_file_mime, scheduled_time, status)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`;
    const vals = [userId, ig_account_id ? parseInt(ig_account_id,10) : null, post_type, caption || null, driveRes.id, driveRes.mimeType, scheduled_time, 'PENDING'];
    const r = await db.query(q, vals);
    const media = r.rows[0];

    // Schedule Bull delayed job
    const delay = Math.max(0, new Date(scheduled_time).getTime() - Date.now());
    await publishQueue.add('publish-media', { media_id: media.id }, { delay, attempts: 3, backoff: { type: 'exponential', delay: 60000 } });

    // Delete local temp
    fs.unlink(localPath, () => {});

    return res.status(201).json({ success: true, message: 'File uploaded and scheduled', data: media, error: null });
  } catch (err) {
    console.error('upload err', err);
    return res.status(500).json({ success: false, message: 'Upload error', data: null, error: err.message });
  }
};

// schedule endpoint if media already exists and you want to set schedule only
exports.schedule = async (req, res) => {
  try {
    const userId = req.user.id;
    const { media_id, scheduled_time } = req.body;
    if (!media_id || !scheduled_time) return res.status(400).json({ success: false, message: 'media_id and scheduled_time required', data: null, error: 'Validation' });

    // Check ownership
    const chk = await db.query('SELECT id FROM media_items WHERE id=$1 AND user_id=$2', [media_id, userId]);
    if (!chk.rows.length) return res.status(404).json({ success: false, message: 'Media not found', data: null, error: 'Not found' });

    await db.query('UPDATE media_items SET scheduled_time=$1, status=$2, updated_at=NOW() WHERE id=$3', [scheduled_time, 'PENDING', media_id]);

    // schedule bull job
    const delay = Math.max(0, new Date(scheduled_time).getTime() - Date.now());
    await publishQueue.add('publish-media', { media_id }, { delay, attempts: 3, backoff: { type: 'exponential', delay: 60000 } });

    return res.json({ success: true, message: 'Media scheduled', data: { media_id, scheduled_time }, error: null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Scheduling error', data: null, error: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const userId = req.user.id;
    const r = await db.query('SELECT * FROM media_items WHERE user_id=$1 ORDER BY scheduled_time DESC', [userId]);
    return res.json({ success: true, message: 'Media list', data: r.rows, error: null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error fetching list', data: null, error: err.message });
  }
};

exports.publishNow = async (req, res) => {
  try {
    const userId = req.user.id;
    const mediaId = parseInt(req.params.id, 10);
    const chk = await db.query('SELECT * FROM media_items WHERE id=$1 AND user_id=$2', [mediaId, userId]);
    if (!chk.rows.length) return res.status(404).json({ success: false, message: 'Media not found', data: null, error: 'Not found' });

    // push immediate job (delay=0)
    await publishQueue.add('publish-media', { media_id: mediaId }, { attempts: 3, backoff: { type: 'exponential', delay: 60000 } });

    return res.json({ success: true, message: 'Publish queued', data: { media_id: mediaId }, error: null });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Publish error', data: null, error: err.message });
  }
};
