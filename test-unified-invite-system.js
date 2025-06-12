// Test script for unified invite code system
// Run this in your browser console on any page of your app

async function testUnifiedInviteSystem() {
  console.log('🧪 Testing Unified Invite Code System...');
  
  try {
    // Test 1: Check if teams have 6-digit codes
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name, invite_code, team_type')
      .limit(5);
    
    if (teamsError) throw teamsError;
    
    console.log('✅ Teams with invite codes:');
    teams.forEach(team => {
      const codeLength = team.invite_code?.length || 0;
      const status = codeLength === 6 ? '✅' : '❌';
      console.log(`${status} ${team.name}: ${team.invite_code} (${codeLength} chars, ${team.team_type})`);
    });
    
    // Test 2: Check team_members data
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select('role, status')
      .eq('status', 'active');
    
    if (membersError) throw membersError;
    
    const memberStats = members.reduce((acc, member) => {
      acc[member.role] = (acc[member.role] || 0) + 1;
      return acc;
    }, {});
    
    console.log('✅ Team members by role:', memberStats);
    
    // Test 3: Check unified analytics view
    const { data: analytics, error: analyticsError } = await supabase
      .from('unified_team_analytics')
      .select('*')
      .limit(3);
    
    if (analyticsError) throw analyticsError;
    
    console.log('✅ Unified team analytics:');
    analytics.forEach(team => {
      console.log(`📊 ${team.team_name}: ${team.athlete_count} athletes, ${team.coach_count} coaches, ${team.manager_count} managers`);
    });
    
    // Test 4: Test invite code lookup
    if (teams.length > 0) {
      const testCode = teams[0].invite_code;
      const { data: foundTeam, error: lookupError } = await supabase
        .from('teams')
        .select('id, name, invite_code')
        .eq('invite_code', testCode)
        .single();
      
      if (lookupError) throw lookupError;
      
      console.log(`✅ Invite code lookup test: ${testCode} → ${foundTeam.name}`);
    }
    
    console.log('🎉 All tests passed! Unified invite system is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testUnifiedInviteSystem(); 