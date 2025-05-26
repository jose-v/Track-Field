/**
 * Badge Population Script
 * Run this script to populate badge definitions in the database
 */

import { populateBadgeDefinitions } from '../services/gamificationService';

async function main() {
  console.log('Populating badge definitions...');
  
  try {
    await populateBadgeDefinitions();
    console.log('✅ Badge definitions populated successfully');
  } catch (error) {
    console.error('❌ Error populating badge definitions:', error);
    process.exit(1);
  }
}

main(); 