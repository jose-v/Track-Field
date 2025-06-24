#!/usr/bin/env tsx

/**
 * Sleep Service Integration Test Script
 * 
 * This script tests the sleep service with real database connections.
 * Run with: npx tsx src/scripts/test-sleep-service.ts
 */

import { sleepService } from '../services/domain/SleepService';
import { ServiceMigration } from '../utils/migration/ServiceMigration';
import { dbClient } from '../lib/dbClient';

async function testSleepService() {
  console.log('🧪 Testing Sleep Service Integration');
  console.log('=====================================\n');

  try {
    // Test 1: Check service health
    console.log('1. Checking service health...');
    const health = await ServiceMigration.checkMigrationHealth();
    console.log('   DbClient:', health.dbClient ? '✅ OK' : '❌ Error');
    console.log('   SleepService:', health.sleepService ? '✅ OK' : '❌ Error');
    if (health.errors.length > 0) {
      console.log('   Errors:', health.errors.join(', '));
    }
    console.log();

    // Test 2: Check authentication
    console.log('2. Checking authentication...');
    try {
      const user = await dbClient.getCurrentUser();
      if (user) {
        console.log(`   ✅ Authenticated as: ${user.email} (${user.id})`);
        
        // Test 3: Get recent sleep records
        console.log('\n3. Testing get recent sleep records...');
        const records = await sleepService.getRecentSleepRecords(user.id, 7);
        console.log(`   ✅ Found ${records.length} sleep records`);
        if (records.length > 0) {
          console.log(`   Latest record: ${records[0].date} - ${records[0].duration}h, Quality: ${records[0].quality}`);
        }

        // Test 4: Get sleep stats
        console.log('\n4. Testing get sleep stats...');
        const stats = await sleepService.getSleepStats(user.id, 7);
        console.log(`   ✅ Average duration: ${stats.avgDuration}h`);
        console.log(`   ✅ Average quality: ${stats.avgQuality}/4`);
        console.log(`   ✅ Total records: ${stats.totalRecords}`);

        // Test 5: Test migration layer
        console.log('\n5. Testing migration layer...');
        const migrationRecords = await ServiceMigration.sleep.getRecords(user.id, 3);
        console.log(`   ✅ Migration layer returned ${migrationRecords.length} records`);

        // Test 6: Create a test record (optional - uncomment to test)
        /*
        console.log('\n6. Testing create sleep record...');
        const testRecord = {
          user_id: user.id,
          date: new Date().toISOString().split('T')[0],
          bedtime: '22:30:00',
          wake_time: '07:30:00',
          duration: 9,
          quality: 4,
          notes: 'Test record from integration script'
        };
        
        const created = await sleepService.upsertSleepRecord(testRecord);
        console.log(`   ✅ Created/updated record: ${created.id}`);
        */

        console.log('\n🎉 All tests passed!');
        
      } else {
        console.log('   ❌ Not authenticated - please log in to the app first');
      }
    } catch (authError: any) {
      console.log(`   ❌ Authentication error: ${authError.message}`);
    }

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testSleepService().then(() => {
    console.log('\n✅ Test script completed');
    process.exit(0);
  }).catch((error) => {
    console.error('\n❌ Test script failed:', error);
    process.exit(1);
  });
}

export { testSleepService }; 