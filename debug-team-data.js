// Debug script to check team data
// Run this in browser console on your app

async function debugTeamData() {
  console.log('🔍 Debugging Vtribe team data...');
  
  try {
    // Get Vtribe team info
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .eq('name', 'Vtribe');
    
    if (teamsError) throw teamsError;
    
    if (teams.length === 0) {
      console.log('❌ No team named "Vtribe" found');
      return;
    }
    
    const vtribe = teams[0];
    console.log('✅ Vtribe team:', vtribe);
    
    // Check team_members for this team
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select(`
        *,
        profiles (
          first_name,
          last_name,
          email,
          role
        )
      `)
      .eq('team_id', vtribe.id)
      .eq('status', 'active');
    
    if (membersError) throw membersError;
    
    console.log('👥 Team members:', members);
    
    // Count by role
    const roleCount = members.reduce((acc, member) => {
      acc[member.role] = (acc[member.role] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📊 Members by role:', roleCount);
    
    // Check athletes specifically
    const athletes = members.filter(m => m.role === 'athlete');
    console.log('🏃‍♀️ Athletes in team:', athletes);
    
    // Check if there are any legacy athletes.team_id entries
    const { data: legacyAthletes, error: legacyError } = await supabase
      .from('athletes')
      .select(`
        id,
        team_id,
        profiles (
          first_name,
          last_name,
          email
        )
      `)
      .eq('team_id', vtribe.id);
    
    if (legacyError) {
      console.warn('Could not check legacy athletes:', legacyError);
    } else {
      console.log('🔄 Legacy athletes.team_id entries:', legacyAthletes);
    }
    
    // Test the getTeamAthletes function
    console.log('🧪 Testing getTeamAthletes function...');
    
    // This should be available if you're on a page that imports teamService
    if (typeof getTeamAthletes !== 'undefined') {
      const teamAthletes = await getTeamAthletes(vtribe.id);
      console.log('📋 getTeamAthletes result:', teamAthletes);
    } else {
      console.log('⚠️ getTeamAthletes function not available in this context');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugTeamData(); 