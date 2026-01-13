require("dotenv").config();
const express = require("express");
const line = require("@line/bot-sdk");
const { createClient } = require("@supabase/supabase-js");

const app = express();

// LINE Configuration
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};

const client = new line.Client(config);

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ฟังก์ชันวิเคราะห์ความดัน
function analyzeBP(systolic, diastolic) {
  let level, risk, color, advice;
  
  if (systolic < 90 || diastolic < 60) {
    level = 'ความดันต่ำ';
    risk = 'ควรพบแพทย์';
    color = '#9E9E9E';
    advice = '⚠️ ควรพักผ่อน ดื่มน้ำเพิ่ม และหากมีอาการวิงเวียนควรพบแพทย์';
  } else if (systolic < 120 && diastolic < 80) {
    level = 'ปกติ';
    risk = 'เสี่ยงต่ำ';
    color = '#4CAF50';
    advice = '✅ ความดันอยู่ในเกณฑ์ปกติ รักษาสุขภาพดีต่อไป';
  } else if (systolic < 130 && diastolic < 80) {
    level = 'ค่อนข้างสูง';
    risk = 'เสี่ยงปานกลาง';
    color = '#FFC107';
    advice = '⚡ เริ่มควบคุมอาหารรสจัด ออกกำลังกายสม่ำเสมอ';
  } else if (systolic < 140 || diastolic < 90) {
    level = 'ความดันสูง ระดับ 1';
    risk = 'เสี่ยงสูง';
    color = '#FF9800';
    advice = '⚠️ ควรปรึกษาแพทย์ เลี่ยงอาหารเค็ม ลดความเครียด';
  } else if (systolic < 180 && diastolic < 120) {
    level = 'ความดันสูง ระดับ 2';
    risk = 'เสี่ยงสูงมาก';
    color = '#F44336';
    advice = '🚨 ควรพบแพทย์โดยเร็ว อาจต้องใช้ยาควบคุม';
  } else {
    level = 'วิกฤต';
    risk = 'อันตราย';
    color = '#D32F2F';
    advice = '🆘 ต้องพบแพทย์ทันที! อาจเกิดภาวะแทรกซ้อนได้';
  }
  
  return { level, risk, color, advice };
}

// สร้าง Flex Message
function createBPFlexMessage(systolic, diastolic, analysis, date) {
  return {
    type: 'flex',
    altText: `ผลการวัดความดัน ${systolic}/${diastolic}`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'ผลการวัดความดัน',
            color: '#FFFFFF',
            size: 'sm',
            weight: 'bold'
          },
          {
            type: 'text',
            text: date,
            color: '#FFFFFF',
            size: 'xl',
            weight: 'bold',
            margin: 'sm'
          }
        ],
        backgroundColor: analysis.color,
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '🩺 ความดันโลหิต',
                size: 'sm',
                color: '#8B8B8B',
                flex: 0
              }
            ]
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: `${systolic}/${diastolic}`,
                size: 'xxl',
                weight: 'bold',
                color: analysis.color
              },
              {
                type: 'text',
                text: 'mmHg',
                size: 'sm',
                color: '#8B8B8B',
                gravity: 'bottom',
                margin: 'sm'
              }
            ],
            margin: 'xs'
          },
          {
            type: 'separator',
            margin: 'xl'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: 'เกณฑ์ระดับ',
                    size: 'sm',
                    color: '#8B8B8B'
                  },
                  {
                    type: 'text',
                    text: analysis.level,
                    size: 'sm',
                    weight: 'bold',
                    align: 'end',
                    color: analysis.color
                  }
                ]
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: 'ความเสี่ยง',
                    size: 'sm',
                    color: '#8B8B8B'
                  },
                  {
                    type: 'text',
                    text: analysis.risk,
                    size: 'sm',
                    weight: 'bold',
                    align: 'end',
                    color: analysis.color
                  }
                ],
                margin: 'md'
              }
            ],
            margin: 'xl'
          },
          {
            type: 'separator',
            margin: 'xl'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'คำแนะนำ',
                size: 'sm',
                color: '#8B8B8B',
                margin: 'md'
              },
              {
                type: 'text',
                text: analysis.advice,
                size: 'sm',
                wrap: true,
                color: '#666666',
                margin: 'sm'
              }
            ],
            margin: 'xl'
          }
        ],
        paddingAll: '20px'
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'message',
              label: 'ดูประวัติ',
              text: 'ประวัติ'
            },
            style: 'primary',
            color: analysis.color
          }
        ]
      }
    }
  };
}

// สร้าง Flex Message สำหรับประวัติ
function createHistoryFlexMessage(historyData) {
  const contents = historyData.map(record => ({
    type: 'box',
    layout: 'horizontal',
    contents: [
      {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: record.date,
            size: 'sm',
            weight: 'bold'
          },
          {
            type: 'text',
            text: `${record.count} ครั้ง`,
            size: 'xs',
            color: '#8B8B8B'
          }
        ],
        flex: 2
      },
      {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `${record.avgSystolic}/${record.avgDiastolic}`,
            size: 'md',
            weight: 'bold',
            align: 'end',
            color: record.color
          },
          {
            type: 'text',
            text: 'ค่าเฉลี่ย',
            size: 'xs',
            color: '#8B8B8B',
            align: 'end'
          }
        ],
        flex: 1
      }
    ],
    margin: 'lg'
  }));

  return {
    type: 'flex',
    altText: 'ประวัติการวัดความดัน',
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📊 ประวัติการวัดความดัน',
            color: '#FFFFFF',
            size: 'lg',
            weight: 'bold'
          }
        ],
        backgroundColor: '#4A90E2',
        paddingAll: '20px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'สรุปรายวัน (7 วันล่าสุด)',
            size: 'sm',
            color: '#8B8B8B',
            margin: 'md'
          },
          ...contents
        ],
        paddingAll: '20px'
      }
    }
  };
}

// บันทึกข้อมูล
async function saveBPRecord(userId, systolic, diastolic) {
  const { data, error } = await supabase
    .from('bp_records')
    .insert([
      {
        user_id: userId,
        systolic: systolic,
        diastolic: diastolic,
        created_at: new Date().toISOString()
      }
    ]);
  
  if (error) {
    console.error('Error saving BP record:', error);
    throw error;
  }
  
  return data;
}

// ดึงประวัติ
async function getDailyHistory(userId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: records, error } = await supabase
    .from('bp_records')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching history:', error);
    return [];
  }

  const grouped = {};
  records.forEach(record => {
    const date = new Date(record.created_at).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: '2-digit'
    });
    
    if (!grouped[date]) {
      grouped[date] = {
        systolic: [],
        diastolic: []
      };
    }
    grouped[date].systolic.push(record.systolic);
    grouped[date].diastolic.push(record.diastolic);
  });

  return Object.entries(grouped).map(([date, values]) => {
    const avgSystolic = Math.round(
      values.systolic.reduce((a, b) => a + b, 0) / values.systolic.length
    );
    const avgDiastolic = Math.round(
      values.diastolic.reduce((a, b) => a + b, 0) / values.diastolic.length
    );
    const analysis = analyzeBP(avgSystolic, avgDiastolic);
    
    return {
      date,
      count: values.systolic.length,
      avgSystolic,
      avgDiastolic,
      color: analysis.color
    };
  });
}

// Webhook endpoint
app.post('/webhook', line.middleware(config), async (req, res) => {
  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});

// จัดการ Events
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return null;
  }

  const userId = event.source.userId;
  const text = event.message.text.trim();

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
}

// Health check
app.get("/", (req, res) => {
  res.send("Blood Pressure LINE Bot is running!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
