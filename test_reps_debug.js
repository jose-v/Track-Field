// Test script to debug the reps tab issue
console.log('Testing reps tab data processing...');

// Simulate the data that might be causing the issue
const mockAllRuns = [
  {
    id: '1',
    exercise_name: '100m Sprint',
    created_at: '2025-07-30T10:00:00Z', // This is 3 days ago, not future
    time_minutes: 0,
    time_seconds: 12,
    time_hundredths: 45,
    has_time_data: true,
    notes: 'Set 1, Rep 1 Duration: 12.45'
  },
  {
    id: '2',
    exercise_name: '100m Sprint',
    created_at: '2025-07-30T10:05:00Z',
    time_minutes: 0,
    time_seconds: 12,
    time_hundredths: 30,
    has_time_data: true,
    notes: 'Set 1, Rep 2 Duration: 12.30'
  },
  {
    id: '3',
    exercise_name: '100m Sprint',
    created_at: '2025-07-30T10:10:00Z',
    time_minutes: 0,
    time_seconds: 12,
    time_hundredths: 15,
    has_time_data: true,
    notes: 'Set 1, Rep 3 Duration: 12.15'
  }
];

console.log('Mock data:', mockAllRuns);

// Simulate the filtering logic
const repAnalysisStartDate = '';
const repAnalysisEndDate = '';

const filteredRuns = mockAllRuns.filter(run => {
  const runDate = new Date(run.created_at);
  const runDateOnly = new Date(runDate);
  runDateOnly.setHours(0, 0, 0, 0);
  let dateFilter = true;
  
  if (repAnalysisStartDate && repAnalysisEndDate) {
    // Date filtering logic
    const [startYear, startMonth, startDay] = repAnalysisStartDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = repAnalysisEndDate.split('-').map(Number);
    
    const startDate = new Date(startYear, startMonth - 1, startDay);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(endYear, endMonth - 1, endDay);
    endDate.setHours(23, 59, 59, 999);
    
    dateFilter = runDateOnly >= startDate && runDateOnly <= endDate;
  } else {
    // If no specific dates selected, show only recent data (last 30 days) by default
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    dateFilter = runDateOnly >= thirtyDaysAgo && runDateOnly <= today;
  }
  
  console.log(`Run: ${run.exercise_name}, Date: ${runDateOnly.toLocaleDateString()}, DateFilter: ${dateFilter}, IsPast: ${runDateOnly <= new Date()}`);
  
  return dateFilter;
});

console.log('Filtered runs:', filteredRuns.length);
console.log('Filtered runs data:', filteredRuns);

// Check what the current date is
console.log('Current date:', new Date().toLocaleDateString());
console.log('Test data date:', new Date('2025-07-30T10:00:00Z').toLocaleDateString());
console.log('Is test data in the past?', new Date('2025-07-30T10:00:00Z') < new Date());

// Check 30 days ago
const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
console.log('30 days ago:', thirtyDaysAgo.toLocaleDateString());
console.log('Is test data within last 30 days?', new Date('2025-07-30T10:00:00Z') >= thirtyDaysAgo); 