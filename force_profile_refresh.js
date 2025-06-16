// Force Profile Cache Refresh Script
// Run this in the browser console to force refresh cached profile data

console.log('🔄 Forcing profile cache refresh...');

// Clear localStorage
localStorage.clear();
console.log('✅ Cleared localStorage');

// Clear sessionStorage  
sessionStorage.clear();
console.log('✅ Cleared sessionStorage');

// If React Query is available, clear its cache
if (window.reactQueryClient) {
  window.reactQueryClient.clear();
  console.log('✅ Cleared React Query cache');
} else {
  console.log('ℹ️  React Query client not found in window');
}

// Force reload
console.log('🔄 Forcing page reload...');
window.location.reload(true); 