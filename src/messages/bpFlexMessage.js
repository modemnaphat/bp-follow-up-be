function createBPFlexMessage(systolic, diastolic, analysis, date) {
  return {
    type: 'flex',
    altText: `ผลการวัดความดันโลหิต ${systolic}/${diastolic}`,
    contents: {
      type: 'bubble',
      size: 'kilo',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'ผลการวัดความดันโลหิต',
            color: '#FFFFFF',
            size: 'sm',
            weight: 'bold'
          },
          {
            type: 'text',
            text: date,
            color: '#FFFFFF',
            size: 'lg',
            weight: 'bold',
            margin: 'sm'
          }
        ],
        backgroundColor: analysis.color,
        paddingAll: '15px'
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
                size: 'xs',
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
                size: 'xl',
                weight: 'bold',
                color: analysis.color
              },
              {
                type: 'text',
                text: 'mmHg',
                size: 'xs',
                color: '#8B8B8B',
                gravity: 'bottom',
                margin: 'sm'
              }
            ],
            margin: 'xs'
          },
          {
            type: 'separator',
            margin: 'md'
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
                    size: 'xs',
                    color: '#8B8B8B'
                  },
                  {
                    type: 'text',
                    text: analysis.level,
                    size: 'xs',
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
                    size: 'xs',
                    color: '#8B8B8B'
                  },
                  {
                    type: 'text',
                    text: analysis.risk,
                    size: 'xs',
                    weight: 'bold',
                    align: 'end',
                    color: analysis.color
                  }
                ],
                margin: 'sm'
              }
            ],
            margin: 'md'
          },
          {
            type: 'separator',
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: 'คำแนะนำ',
                size: 'xs',
                color: '#8B8B8B',
                margin: 'sm'
              },
              {
                type: 'text',
                text: analysis.advice,
                size: 'xs',
                wrap: true,
                color: '#666666',
                margin: 'xs'
              }
            ],
            margin: 'md'
          }
        ],
        paddingAll: '15px'
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
            color: analysis.color,
            height: 'sm'
          }
        ],
        paddingAll: '10px'
      }
    }
  };
}

module.exports = { createBPFlexMessage };