require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const { config } = require('./config/line');
const { handleEvent } = require('./handlers/messageHandler');

const app = express();

// Webhook endpoint
app.post('/webhook', line.middleware(config), async (req, res) => {
  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.json({ success: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).end();
  }
});

// Health check
app.get('/', (req, res) => {
  res.send('Blood Pressure LINE Bot is running!');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// *TODO LIST
// - ui อินโฟ
// - ข้อมูล อินโฟ ที่แสดง
// - ประวัติ การวัดความดัน (last 7 days)
// - refactor code 
// - check table database (now working already)
// - ตกลงกันว่าจะกำหนด text ที่ line หรือ code 
// - ประวัติ การวัดความดัน 1วัน / หารเป็นค่าเฉลี่ย 
// - ui messaging not like text ??
// - reply แค่ text ที่เป็นรูปแบบความดัน / ประวัติ เท่านั้น