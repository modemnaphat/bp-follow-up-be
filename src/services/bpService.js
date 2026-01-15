const supabase = require('../config/superbase');
const { analyzeBP } = require('../utils/bpAnalyzer');

async function saveBPRecord(userId, systolic, diastolic) {
  const { data, error } = await supabase
    .from('bp_records')
    .insert([
      {
        user_id: userId,
        systolic: systolic,
        diastolic: diastolic
      }
    ]);
  
  if (error) {
    console.error('Error saving BP record:', error);
    throw error;
  }
  
  return data;
}

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

  // จัดกลุ่มตามวัน
  const grouped = {};
  records.forEach(record => {
    const date = new Date(record.created_at).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
      timeZone: 'Asia/Bangkok',
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

  // คำนวณค่าเฉลี่ย
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

module.exports = { saveBPRecord, getDailyHistory };