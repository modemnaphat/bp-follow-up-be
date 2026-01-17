function createHistoryFlexMessage(historyData) {
  const contents = historyData.map(record => ({
    type: 'box',
    layout: 'horizontal',
    contents: [
      {
        type: 'box',
        layout: 'vertical',
        size: 'mega',
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
        contents: [
          {
            type: 'text',
            text: 'สรุปรายวัน (7 วันล่าสุด)',
            size: 'xs',
            color: '#8B8B8B',
            margin: 'sm'
          },
          ...contents
        ],
        paddingAll: '15px'
      }
    }
  };
}

module.exports = { createHistoryFlexMessage };