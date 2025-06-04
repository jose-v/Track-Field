import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSoftDeleteMigration() {
  console.log('🚀 Running Soft Delete Migration...\n');

  try {
    // Step 1: Add columns to workouts table
    console.log('1. Adding soft delete columns to workouts table...');
    
    const workoutsSql = `
      ALTER TABLE workouts 
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id) DEFAULT NULL;
    `;
    
    const { error: workoutsError } = await supabase.rpc('exec_sql', { 
      sql: workoutsSql 
    });
    
    if (workoutsError) {
      console.error('❌ Error adding columns to workouts:', workoutsError);
    } else {
      console.log('✅ Added soft delete columns to workouts table');
    }

    // Step 2: Add columns to monthly_plans table
    console.log('2. Adding soft delete columns to monthly_plans table...');
    
    const plansSql = `
      ALTER TABLE monthly_plans 
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES profiles(id) DEFAULT NULL;
    `;
    
    const { error: plansError } = await supabase.rpc('exec_sql', { 
      sql: plansSql 
    });
    
    if (plansError) {
      console.error('❌ Error adding columns to monthly_plans:', plansError);
    } else {
      console.log('✅ Added soft delete columns to monthly_plans table');
    }

    // Step 3: Create indexes
    console.log('3. Creating indexes for better performance...');
    
    const indexSql = `
      CREATE INDEX IF NOT EXISTS idx_workouts_deleted_at ON workouts(deleted_at) WHERE deleted_at IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_monthly_plans_deleted_at ON monthly_plans(deleted_at) WHERE deleted_at IS NOT NULL;
    `;
    
    const { error: indexError } = await supabase.rpc('exec_sql', { 
      sql: indexSql 
    });
    
    if (indexError) {
      console.error('❌ Error creating indexes:', indexError);
    } else {
      console.log('✅ Created performance indexes');
    }

    console.log('\n🎉 Soft delete migration completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - Added deleted_at and deleted_by columns to workouts table');
    console.log('   - Added deleted_at and deleted_by columns to monthly_plans table');
    console.log('   - Created performance indexes for soft delete queries');
    console.log('\n✨ The deleted tab should now work properly!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n💡 Alternative approach:');
    console.log('   1. Go to your Supabase dashboard');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Run the migration script manually from src/db/migrations.sql');
  }
}

runSoftDeleteMigration(); 