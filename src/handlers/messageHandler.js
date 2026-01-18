const { client } = require("../config/line");
const { getOrCreateUser } = require("../services/userService");
const { saveBPRecord, getDailyHistory } = require("../services/bpService");
const { analyzeBP } = require("../utils/bpAnalyzer");
const { createBPFlexMessage } = require("../messages/bpFlexMessage");
const { createHistoryFlexMessage } = require("../messages/historyFlexMessage");

async function handleEvent(event) {
  // ตรวจสอบว่าเป็น message
  if (event.type !== "message") {
    return null;
  }

  const lineUserId = event.source.userId;

  // ถ้าส่งรูปภาพมา → แจ้ง error
  if (event.message.type === "image") {
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: '❌ ขออภัย รูปแบบข้อมูลไม่ถูกต้อง\n\nกรุณาระบุค่าความดันโลหิตในรูปแบบตัวเลข เช่น:\n"120/80"\n\nหรือพิมพ์คำว่า "ประวัติ" เพื่อดูประวัติการบันทึกข้อมูล',
    });
  }

  // ถ้าไม่ใช่ text message → ไม่ตอบ
  if (event.message.type !== "text") {
    return null;
  }

  const text = event.message.text.trim();

  try {
    // fetch profile
    let profile;
    try {
      profile = await client.getProfile(lineUserId);
    } catch (err) {
      console.error("Error getting profile:", err);
      profile = null;
    }

    // find or create user
    const userId = await getOrCreateUser(lineUserId, profile);

    // ตรวจสอบ Rich Menu - ไม่ตอบ
    if (
      text === "ระดับค่าความดันโลหิต" ||
      text === "ปัจจัยเสี่ยง" ||
      text === "วิธีการป้องกัน"
    ) {
      return null;
    }

    // คำสั่ง "ประวัติ"
    const historyKeywords = [
      "ประวัติ",
      "ประวัติการวัด",
      "ประวัติการวัดความดันโลหิต",
      "history",
    ];

    if (
      historyKeywords.some((keyword) =>
        text.toLowerCase().includes(keyword.toLowerCase()),
      )
    ) {
      const history = await getDailyHistory(userId);

      if (!history || history.length === 0) {
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: 'ยังไม่มีประวัติการบันทึกความดัน\n\nส่งค่าความดันในรูปแบบ "120/80" เพื่อเริ่มบันทึก',
        });
      }

      const flexMessage = createHistoryFlexMessage(history);
      return client.replyMessage(event.replyToken, flexMessage);
    }

    // ตรวจสอบว่า user พยายามพิมพ์ตัวเลขหรือไม่
    // const attemptedBPInput = /\d/.test(text) && /[\/\-]/.test(text);
    const attemptedBPInput = /\d+\s*[^\d\s]+\s*\d+/.test(text);

    // ตรวจสอบรูปแบบที่ถูกต้อง: 120/80
    const bpMatch = text.match(/^(\d{2,3})\s*\/\s*(\d{2,3})$/);

    // ถ้าพยายามพิมพ์ตัวเลขแต่รูปแบบผิด
    if (attemptedBPInput && !bpMatch) {
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: '❌ รูปแบบไม่ถูกต้อง\n\nกรุณาส่งค่าความดันในรูปแบบ:\n"120/80"\n\n(ใช้เครื่องหมาย / เท่านั้น และใส่ค่าเพียง 2 ตัว)\n\nหรือพิมพ์ "ประวัติ" เพื่อดูประวัติการบันทึก',
      });
    }

    // ถ้าไม่ใช่รูปแบบที่ถูกต้อง และไม่ได้พยายามพิมพ์ตัวเลข = ไม่ตอบ
    if (!bpMatch) {
      return null;
    }

    const systolic = parseInt(bpMatch[1]);
    const diastolic = parseInt(bpMatch[2]);

    // ตรวจสอบค่าในช่วงที่เป็นไปได้
    if (systolic < 50 || systolic > 250 || diastolic < 30 || diastolic > 150) {
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: "⚠️ ค่าความดันไม่อยู่ในช่วงที่เป็นไปได้\n\n✅ ค่าปกติควรอยู่ในช่วง:\n• ตัวบน (Systolic): 50-250\n• ตัวล่าง (Diastolic): 30-150\n\nโปรดตรวจสอบค่าที่วัดได้อีกครั้ง",
      });
    }

    // วิเคราะห์และบันทึก
    const analysis = analyzeBP(systolic, diastolic);
    await saveBPRecord(userId, systolic, diastolic);

    const date = new Date().toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Bangkok",
    });

    const flexMessage = createBPFlexMessage(
      systolic,
      diastolic,
      analysis,
      date,
    );

    return client.replyMessage(event.replyToken, flexMessage);
  } catch (error) {
    console.error("Error handling event:", error);

    try {
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: "ขออภัย เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง",
      });
    } catch (replyError) {
      console.error("Cannot send error reply:", replyError);
      return null;
    }
  }
}

module.exports = { handleEvent };
