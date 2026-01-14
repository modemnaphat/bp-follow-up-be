const { client } = require('../config/line');
const { getOrCreateUser } = require('../services/userService');
const { saveBPRecord, getDailyHistory } = require('../services/bpService');
const { analyzeBP } = require('../utils/bpAnalyzer');
const { createBPFlexMessage } = require('../messages/bpFlexMessage');
const { createHistoryFlexMessage } = require('../messages/historyFlexMessage');

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return null;
  }

  const lineUserId = event.source.userId;
  const text = event.message.text.trim();

  try {
    // ดึงข้อมูล profile
    let profile;
    try {
      profile = await client.getProfile(lineUserId);
    } catch (err) {
      console.error('Error getting profile:', err);
      profile = null;
    }

    // หาหรือสร้าง user
    const userId = await getOrCreateUser(lineUserId, profile);

    // คำสั่ง "ประวัติ"
    if (text === 'ประวัติ' || text.toLowerCase() === 'history') {
      const history = await getDailyHistory(userId);
      
      if (history.length === 0) {
        return client.replyMessage(event.replyToken, {
          type: 'text',
          text: 'ยังไม่มีประวัติการบันทึกความดันครับ\n\nส่งค่าความดันในรูปแบบ "120/80" เพื่อเริ่มบันทึก'
        });
      }

      const flexMessage = createHistoryFlexMessage(history);
      return client.replyMessage(event.replyToken, flexMessage);
    }

    // ตรวจสอบรูปแบบ 120/80
    const bpMatch = text.match(/^(\d{2,3})\s*\/\s*(\d{2,3})$/);
    
    if (!bpMatch) {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '❌ รูปแบบไม่ถูกต้อง\n\nกรุณาส่งค่าความดันในรูปแบบ:\n"120/80"\n\nหรือพิมพ์ "ประวัติ" เพื่อดูประวัติการบันทึก'
      });
    }

    const systolic = parseInt(bpMatch[1]);
    const diastolic = parseInt(bpMatch[2]);

    // ตรวจสอบค่า
    if (systolic < 50 || systolic > 250 || diastolic < 30 || diastolic > 150) {
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: '⚠️ ค่าความดันไม่อยู่ในช่วงที่เป็นไปได้\n\nโปรดตรวจสอบค่าที่วัดได้อีกครั้ง'
      });
    }

    // วิเคราะห์และบันทึก
    const analysis = analyzeBP(systolic, diastolic);
    await saveBPRecord(userId, systolic, diastolic);

    const date = new Date().toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const flexMessage = createBPFlexMessage(systolic, diastolic, analysis, date);
    return client.replyMessage(event.replyToken, flexMessage);

  } catch (error) {
    console.error('Error handling event:', error);
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'ขออภัยครับ เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง'
    });
  }
}

module.exports = { handleEvent };