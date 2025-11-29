// MEDICATION DATA MIGRATION HELPER
// Run this in browser console to check and fix medication data format

console.log('🔧 Medication Data Migration Helper');
console.log('====================================\n');

// Check current data format
const currentData = localStorage.getItem('aarogya_medications');

if (!currentData) {
  console.log('❌ No medications found in localStorage');
  console.log('Run this to add test data:\n');
  console.log(`
const testMeds = [
  {
    id: 'med_test_1',
    userId: 'test_user',
    name: 'Paracetamol',
    strength: '500mg',
    dosage: '1 tablet',
    frequency: 'Twice daily',
    timing: ['Morning', 'Evening'],
    duration: '7 days',
    instructions: 'After food',
    createdAt: new Date().toISOString()
  }
];
localStorage.setItem('aarogya_medications', JSON.stringify(testMeds));
location.reload();
  `);
} else {
  console.log('✅ Found medication data\n');
  
  try {
    const parsed = JSON.parse(currentData);
    console.log('📊 Current format:', Array.isArray(parsed) ? 'Array' : typeof parsed);
    console.log('📦 Item count:', parsed.length);
    
    if (parsed.length > 0) {
      const firstItem = parsed[0];
      console.log('\n📋 First item structure:');
      console.log('  - Has "key" field:', 'key' in firstItem);
      console.log('  - Has "value" field:', 'value' in firstItem);
      console.log('  - Has "id" field:', 'id' in firstItem);
      console.log('  - Has "name" field:', 'name' in firstItem);
      
      // Check if it's in old key-value format
      if (firstItem.key && firstItem.value) {
        console.log('\n⚠️  OLD FORMAT DETECTED (key-value)');
        console.log('🔄 Converting to new format...\n');
        
        // Convert from key-value format to direct array
        const converted = parsed.map((item, index) => {
          try {
            const medData = JSON.parse(item.value);
            console.log(`  ✓ Converted: ${medData.name || 'Unknown'}`);
            return medData;
          } catch (e) {
            console.error(`  ✗ Error converting item ${index}:`, e);
            return null;
          }
        }).filter(Boolean);
        
        console.log(`\n✅ Converted ${converted.length} medications`);
        console.log('💾 Saving in new format...');
        
        localStorage.setItem('aarogya_medications', JSON.stringify(converted));
        
        console.log('\n✨ MIGRATION COMPLETE!');
        console.log('🔄 Reloading page...\n');
        
        setTimeout(() => location.reload(), 1000);
      } else if (firstItem.id && firstItem.name) {
        console.log('\n✅ NEW FORMAT (direct array) - No migration needed');
        console.log('\n📋 Medications:');
        parsed.forEach((med, index) => {
          console.log(`  ${index + 1}. ${med.name} - ${med.strength || 'N/A'}`);
          console.log(`     ID: ${med.id}`);
          console.log(`     Dosage: ${med.dosage || 'N/A'}`);
          console.log(`     Frequency: ${med.frequency || 'N/A'}`);
        });
      } else {
        console.log('\n⚠️  UNKNOWN FORMAT');
        console.log('Raw data:', firstItem);
      }
    }
  } catch (e) {
    console.error('❌ Error parsing data:', e);
    console.log('Raw data:', currentData);
  }
}

console.log('\n====================================');
console.log('💡 Helpful commands:');
console.log('  - View all medications: JSON.parse(localStorage.getItem("aarogya_medications"))');
console.log('  - Clear all: localStorage.removeItem("aarogya_medications")');
console.log('  - Reload page: location.reload()');
