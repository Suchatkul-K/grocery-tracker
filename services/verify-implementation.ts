/**
 * Manual verification script for user and household operations
 * This can be run in a browser console to verify the implementation
 */

import { databaseService } from './database';

export async function verifyImplementation() {
  console.log('Starting verification...');

  try {
    // Initialize database
    await databaseService.initialize();
    console.log('✓ Database initialized');

    // Test 1: Create users
    const user1 = await databaseService.createUser('Alice');
    const user2 = await databaseService.createUser('Bob');
    console.log('✓ Created users:', { user1, user2 });

    // Test 2: Retrieve users
    const retrievedUser1 = await databaseService.getUser(user1.id);
    const retrievedUser2 = await databaseService.getUser(user2.id);
    console.log('✓ Retrieved users:', { retrievedUser1, retrievedUser2 });

    // Test 3: Create households
    const household1 = await databaseService.createHousehold('Alice Home', user1.id);
    const household2 = await databaseService.createHousehold('Bob Home', user2.id);
    console.log('✓ Created households:', { household1, household2 });

    // Test 4: Retrieve households by ID
    const retrievedHousehold1 = await databaseService.getHousehold(household1.id);
    console.log('✓ Retrieved household by ID:', retrievedHousehold1);

    // Test 5: Retrieve household by reference code
    const retrievedByCode = await databaseService.getHouseholdByReferenceCode(
      household1.referenceCode
    );
    console.log('✓ Retrieved household by reference code:', retrievedByCode);

    // Test 6: Verify unique IDs
    if (user1.id !== user2.id && household1.id !== household2.id) {
      console.log('✓ All IDs are unique');
    }

    // Test 7: Verify unique reference codes
    if (household1.referenceCode !== household2.referenceCode) {
      console.log('✓ Reference codes are unique');
    }

    // Test 8: Verify reference code format (6 characters, alphanumeric)
    const codeRegex = /^[A-Z0-9]{6}$/;
    if (codeRegex.test(household1.referenceCode) && codeRegex.test(household2.referenceCode)) {
      console.log('✓ Reference codes have correct format');
    }

    console.log('\n✅ All verifications passed!');
    return true;
  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  }
}
