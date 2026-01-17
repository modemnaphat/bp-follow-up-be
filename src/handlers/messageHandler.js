const { client } = require("../config/line");
const { getOrCreateUser } = require("../services/userService");
const { saveBPRecord, getDailyHistory } = require("../services/bpService");
const { analyzeBP } = require("../utils/bpAnalyzer");
const { createBPFlexMessage } = require("../messages/bpFlexMessage");
const { createHistoryFlexMessage } = require("../messages/historyFlexMessage");

async function handleEvent(event) {
  console.log("📨 Event received:", JSON.stringify(event, null, 2));

  // ========================================
  // ตรวจสอบว่าเป็น message หรือไม่
  // ========================================
  if (event.type !== "message") {
    console.log("⏭️ Not a message event");
    return null;
  }

  const lineUserId = event.source.userId;
  console.log("👤 User ID:", lineUserId);

  // ========================================
  // ถ้าส่งรูปภาพมา → แจ้ง error
  // ========================================
  if (event.message.type === "image") {
    console.log("🖼️ Image received - replying with error");
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: '❌ ขออภัย รูปแบบข้อมูลไม่ถูกต้อง\n\nกรุณาระบุค่าความดันโลหิตในรูปแบบตัวเลข เช่น:\n"120/80"\n\nหรือพิมพ์คำว่า "ประวัติ" เพื่อดูประวัติการบันทึกข้อมูล',
    });
  }

  // ========================================
  // ถ้าไม่ใช่ text message → ไม่ตอบ
  // ========================================
  if (event.message.type !== "text") {
    console.log("⏭️ Not a text message");
    return null;
  }

  const text = event.message.text.trim();
  console.log("💬 Text received:", text);

  try {
    // ดึงข้อมูล profile
    let profile;
    try {
      profile = await client.getProfile(lineUserId);
      console.log("✅ Profile fetched:", profile?.displayName);
    } catch (err) {
      console.error("❌ Error getting profile:", err);
      profile = null;
    }

    // หาหรือสร้าง user
    console.log("🔍 Getting or creating user...");
    const userId = await getOrCreateUser(lineUserId, profile);
    console.log("✅ User ID from DB:", userId);

    // ========================================
    // 1. ตรวจสอบ Rich Menu - ไม่ตอบ
    // ========================================
    if (
      text === "ระดับค่าความดันโลหิต" ||
      text === "ปัจจัยเสี่ยง" ||
      text === "วิธีการป้องกัน"
    ) {
      console.log("⏭️ Rich menu command - ignoring");
      return null;
    }

    // ========================================
    // 2. คำสั่ง "ประวัติ"
    // ========================================
    const historyKeywords = [
      "ประวัติ",
      "ประวัติการวัด",
      "ประวัติการวัดความดันโลหิต",
      "history",
    ];
    if (
      historyKeywords.some((keyword) =>
        text.toLowerCase().includes(keyword.toLowerCase())
      )
    ) {
      console.log("📊 History request detected");
      
      try {
        const history = await getDailyHistory(userId);
        console.log("📊 History data:", history?.length || 0, "records");

        if (!history || history.length === 0) {
          console.log("⚠️ No history found");
          return client.replyMessage(event.replyToken, {
            type: "text",
            text: 'ยังไม่มีประวัติการบันทึกความดัน\n\nส่งค่าความดันในรูปแบบ "120/80" เพื่อเริ่มบันทึก',
          });
        }

        // เรียงจากเก่า → ใหม่ (เก่าขึ้นก่อน)
        history.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        console.log("✅ History sorted");

        const flexMessage = createHistoryFlexMessage(history);
        console.log("📤 Sending history flex message");
        
        return client.replyMessage(event.replyToken, flexMessage);
      } catch (historyError) {
        console.error("❌ History Error:", historyError);
        return client.replyMessage(event.replyToken, {
          type: "text",
          text: "เกิดข้อผิดพลาดในการดึงประวัติ: " + historyError.message,
        });
      }
    }

    // ========================================
    // 3. ตรวจสอบว่า user พยายามพิมพ์ตัวเลขหรือไม่
    // ========================================
    const attemptedBPInput = /\d/.test(text) && /[\/\-]/.test(text);
    console.log("🔢 Attempted BP input:", attemptedBPInput);

    // ========================================
    // 4. ตรวจสอบรูปแบบที่ถูกต้อง: 120/80
    // ========================================
    const bpMatch = text.match(/^(\d{2,3})\s*\/\s*(\d{2,3})$/);
    console.log("✅ BP Match:", bpMatch);

    // ถ้าพยายามพิมพ์ตัวเลขแต่รูปแบบผิด
    if (attemptedBPInput && !bpMatch) {
      console.log("⚠️ Invalid BP format");
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: '❌ รูปแบบไม่ถูกต้อง\n\nกรุณาส่งค่าความดันในรูปแบบ:\n"120/80"\n\n(ใช้เครื่องหมาย / เท่านั้น และใส่ค่าเพียง 2 ตัว)\n\nหรือพิมพ์ "ประวัติ" เพื่อดูประวัติการบันทึก',
      });
    }

    // ถ้าไม่ใช่รูปแบบที่ถูกต้อง และไม่ได้พยายามพิมพ์ตัวเลข = ไม่ตอบ
    if (!bpMatch) {
      console.log("⏭️ Not a BP input - ignoring");
      return null;
    }

    // ========================================
    // 5. บันทึกและตอบกลับค่าความดันโลหิต
    // ========================================
    const systolic = parseInt(bpMatch[1]);
    const diastolic = parseInt(bpMatch[2]);
    console.log("💉 BP values:", systolic, "/", diastolic);

    // ตรวจสอบค่าในช่วงที่เป็นไปได้
    if (systolic < 50 || systolic > 250 || diastolic < 30 || diastolic > 150) {
      console.log("⚠️ BP values out of range");
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: "⚠️ ค่าความดันไม่อยู่ในช่วงที่เป็นไปได้\n\n✅ ค่าปกติควรอยู่ในช่วง:\n• ตัวบน (Systolic): 50-250\n• ตัวล่าง (Diastolic): 30-150\n\nโปรดตรวจสอบค่าที่วัดได้อีกครั้ง",
      });
    }

    // วิเคราะห์และบันทึก
    console.log("🔬 Analyzing BP...");
    const analysis = analyzeBP(systolic, diastolic);
    console.log("✅ Analysis result:", analysis);

    console.log("💾 Saving BP record...");
    await saveBPRecord(userId, systolic, diastolic);
    console.log("✅ BP record saved");

    const date = new Date().toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Bangkok",
    });

    console.log("📤 Creating flex message...");
    const flexMessage = createBPFlexMessage(
      systolic,
      diastolic,
      analysis,
      date
    );
    
    console.log("📤 Sending BP flex message");
    return client.replyMessage(event.replyToken, flexMessage);
    
  } catch (error) {
    console.error("❌ Error handling event:", error);
    console.error("Stack trace:", error.stack);
    
    try {
      return client.replyMessage(event.replyToken, {
        type: "text",
        text: "ขออภัย เกิดข้อผิดพลาดในระบบ: " + error.message + "\n\nกรุณาลองใหม่อีกครั้ง",
      });
    } catch (replyError) {
      console.error("❌ Cannot send error reply:", replyError);
      return null;
    }
  }
}

module.exports = { handleEvent };