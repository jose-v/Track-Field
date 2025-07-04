#!/usr/bin/env node

/**
 * Clear Orphaned Workout Data Script
 * 
 * This script helps clear any cached workout data that might be causing 
 * phantom workouts to appear for athletes with no assignments.
 * 
 * Usage: node scripts/clear-orphaned-data.js
 */

console.log('🧹 Clear Orphaned Workout Data');
console.log('================================');
console.log('');
console.log('If you\'re seeing phantom workouts (like generic "Warm-up", "Main workout", "Cool-down"');
console.log('exercises) for athletes who have no actual assignments, this might be cached data.');
console.log('');
console.log('To fix this issue:');
console.log('');
console.log('1. 🌐 Clear Browser Cache:');
console.log('   - Open browser Developer Tools (F12)');
console.log('   - Go to Application/Storage tab');
console.log('   - Clear Local Storage for your app domain');
console.log('   - Clear Session Storage for your app domain');
console.log('   - Refresh the page');
console.log('');
console.log('2. 🔄 Hard Refresh:');
console.log('   - Press Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)');
console.log('   - This forces a complete reload');
console.log('');
console.log('3. 🚪 Logout and Login:');
console.log('   - Log out of the application');
console.log('   - Log back in to reset the session');
console.log('');
console.log('4. 🔍 Check Database:');
console.log('   - Verify no orphaned records in athlete_workouts table');
console.log('   - Verify no orphaned records in training_plan_assignments table');
console.log('');
console.log('✅ The phantom workout issue has been fixed in the code.');
console.log('   Athletes with no assignments will now see an empty state');
console.log('   instead of fake placeholder workouts.');
console.log(''); 