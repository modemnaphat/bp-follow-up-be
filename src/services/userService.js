const supabase = require('../config/superbase');

async function getOrCreateUser(lineUserId, profile) {
  try {
    // ลองหา user ก่อน
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('line_user_id', lineUserId)
      .single();

    if (existingUser) {
      return existingUser.id;
    }

    // ถ้าไม่เจอ ให้สร้างใหม่
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([
        {
          line_user_id: lineUserId,
          display_name: profile?.displayName || 'Unknown',
          picture_url: profile?.pictureUrl || null
        }
      ])
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      throw createError;
    }

    return newUser.id;
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    throw error;
  }
}

module.exports = { getOrCreateUser };