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
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching history:', error);
    return { dailyRecords: [], weeklyAverage: null };
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

  // คำนวณค่าเฉลี่ยรายวัน
  const dailyRecords = Object.entries(grouped).map(([date, values]) => {
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

  // คำนวณค่าเฉลี่ย 7 วัน (จากค่าเฉลี่ยรายวันที่คำนวณแล้ว)
  let weeklyAverage = null;
  if (dailyRecords.length > 0) {
    const totalSystolic = dailyRecords.reduce((sum, record) => sum + record.avgSystolic, 0);
    const totalDiastolic = dailyRecords.reduce((sum, record) => sum + record.avgDiastolic, 0);
    const avgSystolic = Math.round(totalSystolic / dailyRecords.length);
    const avgDiastolic = Math.round(totalDiastolic / dailyRecords.length);
    const analysis = analyzeBP(avgSystolic, avgDiastolic);

    weeklyAverage = {
      avgSystolic,
      avgDiastolic,
      level: analysis.level,
      risk: analysis.risk,
      color: analysis.color,
      daysCount: dailyRecords.length
    };
  }

  return { dailyRecords, weeklyAverage };
}

module.exports = { saveBPRecord, getDailyHistory };