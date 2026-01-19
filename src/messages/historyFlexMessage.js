function createHistoryFlexMessage(historyData) {
  const { dailyRecords, weeklyAverage } = historyData;

  // สร้าง daily list contents
  const dailyContents = dailyRecords.map((record) => ({
    type: "box",
    layout: "horizontal",
    contents: [
      {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: record.date,
            size: "xs",
            weight: "bold",
          },
          {
            type: "text",
            text: `${record.count} ครั้ง`,
            size: "xxs",
            color: "#8B8B8B",
          },
        ],
        flex: 2,
      },
      {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: `${record.avgSystolic}/${record.avgDiastolic}`,
            size: "sm",
            weight: "bold",
            align: "end",
            color: record.color,
          },
          {
            type: "text",
            text: "ค่าเฉลี่ย",
            size: "xxs",
            color: "#8B8B8B",
            align: "end",
          },
        ],
        flex: 1,
      },
    ],
    margin: "sm",
  }));

  // สร้าง body contents
  const bodyContents = [];

  // เริ่มด้วย Daily Records Header
  bodyContents.push({
    type: "text",
    text: "สรุปรายวัน (7 วันล่าสุด)",
    size: "xs",
    color: "#8B8B8B",
    weight: "bold",
    margin: "none",
  });

  // เพิ่ม daily records
  if (dailyContents.length > 0) {
    bodyContents.push(...dailyContents);
  } else {
    bodyContents.push({
      type: "text",
      text: "ยังไม่มีข้อมูลการวัดความดัน",
      size: "sm",
      color: "#8B8B8B",
      align: "center",
      margin: "md",
    });
  }

  // ถ้ามีข้อมูลค่าเฉลี่ย 7 วัน ใส่ไว้ด้านล่างสุด
  if (weeklyAverage) {
    bodyContents.push(
      // Separator
      {
        type: "separator",
        margin: "lg",
      },
      // ค่าเฉลี่ย 7 วัน
      {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "text",
            text: "ค่าเฉลี่ยความดันโลหิต",
            size: "xs",
            color: "#8B8B8B",
            flex: 1,
          },
          {
            type: "text",
            text: `${weeklyAverage.avgSystolic}/${weeklyAverage.avgDiastolic}`,
            size: "sm",
            weight: "bold",
            align: "end",
            color: weeklyAverage.color,
            flex: 2,
          },
        ],
        margin: "md",
      },
      // เกณฑ์ระดับ
      {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "text",
            text: "เกณฑ์ระดับ",
            size: "xs",
            color: "#8B8B8B",
            flex: 2,
          },
          {
            type: "text",
            text: weeklyAverage.level,
            size: "sm",
            weight: "bold",
            align: "end",
            color: weeklyAverage.color,
            flex: 3,
          },
        ],
        margin: "sm",
      },
    );
  }

  return {
    type: "flex",
    altText: "ประวัติการวัดความดันโลหิต",
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "📋 ประวัติการวัดความดันโลหิต",
            color: "#FFFFFF",
            size: "md",
            weight: "bold",
          },
        ],
        backgroundColor: "#4A90E2",
        paddingAll: "15px",
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: bodyContents,
        paddingAll: "15px",
      },
    },
  };
}

module.exports = { createHistoryFlexMessage };
