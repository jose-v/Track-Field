import { createClient } from '@supabase/supabase-js';

// Use the URL from your network tab
const supabase = createClient(
  'https://vqfqhhjfroqdjdmyzc.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxZnFoaGZpcm9xZGpkbXl6YyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM0NzI5NjAwLCJleHAiOjIwNTAzMDU2MDB9.Ey6wJlmKnJXBYnFzSIelnZ6nFoGZqcm9ycWRabGRteXoLnhNGCYXNLnbAG1qyjiatS9Achy8utl'
);

async function debugProfileSize() {
  console.log('🔍 Testing profile query that returns 10.5MB...');
  
  try {
    // Test 1: Just get the ID
    console.log('\n1. Testing ID only:');
    const { data: idOnly, error: idError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', 'dbeba00c-466c-43ad-8f76-d8adc66cf210')
      .single();
    
    console.log('ID only result:', { data: idOnly, error: idError });
    console.log('Size:', JSON.stringify(idOnly || idError).length, 'bytes');
    
    // Test 2: Get each field individually
    console.log('\n2. Testing email only:');
    const { data: emailOnly, error: emailError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', 'dbeba00c-466c-43ad-8f76-d8adc66cf210')
      .single();
    
    console.log('Email only result:', { data: emailOnly, error: emailError });
    console.log('Size:', JSON.stringify(emailOnly || emailError).length, 'bytes');
    
    // Test 3: Get first_name only
    console.log('\n3. Testing first_name only:');
    const { data: firstNameOnly, error: firstNameError } = await supabase
      .from('profiles')
      .select('first_name')
      .eq('id', 'dbeba00c-466c-43ad-8f76-d8adc66cf210')
      .single();
    
    console.log('First name only result:', { data: firstNameOnly, error: firstNameError });
    console.log('Size:', JSON.stringify(firstNameOnly || firstNameError).length, 'bytes');
    
    // Test 4: The full query that's causing issues
    console.log('\n4. Testing the full problematic query:');
    const { data: fullData, error: fullError } = await supabase
      .from('profiles')
      .select('id,email,first_name,last_name,role')
      .eq('id', 'dbeba00c-466c-43ad-8f76-d8adc66cf210')
      .single();
    
    console.log('Full query result:', { data: fullData, error: fullError });
    console.log('Size:', JSON.stringify(fullData || fullError).length, 'bytes');
    
    // Test 5: Check if there are multiple records (shouldn't be with single())
    console.log('\n5. Testing without single() to see if multiple records:');
    const { data: multipleData, error: multipleError } = await supabase
      .from('profiles')
      .select('id,email,first_name,last_name,role')
      .eq('id', 'dbeba00c-466c-43ad-8f76-d8adc66cf210');
    
    console.log('Multiple records result:', { data: multipleData, error: multipleError });
    console.log('Count:', multipleData?.length || 0);
    console.log('Size:', JSON.stringify(multipleData || multipleError).length, 'bytes');
    
  } catch (err) {
    console.error('❌ Error during testing:', err);
  }
}

debugProfileSize(); 