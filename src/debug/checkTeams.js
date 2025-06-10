// Quick debug script to check teams in database
// Run this in browser console on any authenticated page

async function checkTeams() {
  console.log('🔍 Checking teams in database...');
  
  const { data: teams, error } = await window.supabase
    .from('teams')
    .select('id, name, invite_code, is_active, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('❌ Error fetching teams:', error);
    return;
  }
  
  if (!teams || teams.length === 0) {
    console.log('📭 No teams found in database');
    console.log('💡 Create a team first as a team manager to get invite codes');
    return;
  }
  
  console.log(`✅ Found ${teams.length} teams:`);
  teams.forEach(team => {
    console.log(`📋 ${team.name}: ${team.invite_code} (ID: ${team.id})`);
  });
  
  console.log('🎯 Use any of the above invite codes to test joining');
}

// Run the check
checkTeams(); 