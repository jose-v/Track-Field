#!/usr/bin/env node

/**
 * 🧹 Cleanup Orphaned Athlete Workout Assignments
 * 
 * This script cleans up athlete_workouts assignments that point to deleted or non-existent workouts.
 * Run this after implementing the workout deletion fixes to clean up existing inconsistent data.
 * 
 * Usage:
 *   node scripts/cleanup-orphaned-assignments.js
 */

import { api } from '../src/services/api.js';

async function runCleanup() {
  console.log('🧹 Starting cleanup of orphaned athlete workout assignments...\n');
  
  try {
    // Run the cleanup
    const result = await api.workouts.cleanupOrphanedAssignments();
    
    if (result.removedCount === 0) {
      console.log('✅ Database is clean! No orphaned assignments found.');
    } else {
      console.log(`✅ Successfully cleaned up ${result.removedCount} orphaned assignments!\n`);
      
      console.log('📋 Details of removed assignments:');
      result.details.forEach((assignment, index) => {
        console.log(`  ${index + 1}. Assignment ID: ${assignment.assignmentId}`);
        console.log(`     - Workout ID: ${assignment.workoutId}`);
        console.log(`     - Athlete ID: ${assignment.athleteId}`);
        console.log('');
      });
    }
    
    console.log('\n🎯 Cleanup completed successfully!');
    console.log('\nNext steps:');
    console.log('- Athletes should no longer see deleted workouts in their portal');
    console.log('- Future workout deletions will automatically clean up assignments');
    console.log('- Consider running this script periodically if needed');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  }
}

// Run the cleanup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCleanup();
}

export { runCleanup }; 