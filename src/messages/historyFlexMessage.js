function createHistoryFlexMessage(historyData) {
  const { dailyRecords, weeklyAverage } = historyData;

  // สร้าง daily list contents
  const dailyContents = dailyRecords.map(record => ({
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
            size: 'xs',
            weight: 'bold'
          },
          {
            type: 'text',
            text: `${record.count} ครั้ง`,
            size: 'xxs',
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
            size: 'sm',
            weight: 'bold',
            align: 'end',
            color: record.color
          },
          {
            type: 'text',
            text: 'ค่าเฉลี่ย',
            size: 'xxs',
            color: '#8B8B8B',
            align: 'end'
          }
        ],
        flex: 1
      }
    ],
    margin: 'sm'
  }));

  // สร้าง weekly summary section
  const bodyContents = [];

  // ถ้ามีข้อมูลค่าเฉลี่ย 7 วัน
  if (weeklyAverage) {
    bodyContents.push(
      // Weekly Summary Card
      {
        type: 'box',
        layout: 'vertical',
        contents: [
          // แถวบน: หัวข้อ
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: `ค่าเฉลี่ย ${weeklyAverage.daysCount} วัน`,
                size: 'xs',
                color: '#FFFFFF',
                weight: 'bold',
                flex: 1
              },
              {
                type: 'text',
                text: 'เกณฑ์ระดับ',
                size: 'xs',
                color: '#FFFFFF',
                weight: 'bold',
                align: 'end',
                flex: 1
              }
            ]
          },
          // แถวล่าง: ค่าจริง
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  {
                    type: 'text',
                    text: `${weeklyAverage.avgSystolic}/${weeklyAverage.avgDiastolic}`,
                    size: 'xxl',
                    weight: 'bold',
                    color: '#FFFFFF',
                    flex: 0
                  },
                  {
                    type: 'text',
                    text: 'mmHg',
                    size: 'xs',
                    color: '#FFFFFF',
                    margin: 'sm',
                    flex: 0
                  }
                ],
                flex: 1
              },
              {
                type: 'text',
                text: weeklyAverage.level,
                size: 'xxl',
                weight: 'bold',
                color: '#FFFFFF',
                align: 'end',
                flex: 1
              }
            ],
            margin: 'md'
          }
        ],
        backgroundColor: weeklyAverage.color,
        cornerRadius: 'lg',
        paddingAll: '15px',
        margin: 'none'
      },
      // Separator
      {
        type: 'separator',
        margin: 'lg'
      },
      // Daily Records Header
      {
        type: 'text',
        text: 'สรุปรายวัน',
        size: 'xs',
        color: '#8B8B8B',
        weight: 'bold',
        margin: 'lg'
      }
    );
  }

  // เพิ่ม daily records
  bodyContents.push(...dailyContents);

  return {
    type: 'flex',
    altText: 'ประวัติการวัดความดันโลหิต',
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📊 ประวัติการวัดความดันโลหิต',
            color: '#FFFFFF',
            size: 'md',
            weight: 'bold'
          }
        ],
        backgroundColor: '#4A90E2',
        paddingAll: '15px'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: bodyContents.length > 0 ? bodyContents : [
          {
            type: 'text',
            text: 'ยังไม่มีข้อมูลการวัดความดัน',
            size: 'sm',
            color: '#8B8B8B',
            align: 'center',
            margin: 'lg'
          }
        ],
        paddingAll: '15px'
      }
    }
  };
}

module.exports = { createHistoryFlexMessage };