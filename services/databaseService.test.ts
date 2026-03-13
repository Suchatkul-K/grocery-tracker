import { describe, it, expect, beforeEach } from 'vitest';
import { databaseService } from './databaseService';

describe('DatabaseService - User and Household Management', () => {
  beforeEach(async () => {
    // Initialize a fresh database for each test
    await databaseService.initialize();
  });

  describe('User Operations', () => {
    it('should create a user with unique ID', async () => {
      const user = await databaseService.createUser('John Doe');

      expect(user).toBeDefined();
      expect(user.id).toBeTruthy();
      expect(user.name).toBe('John Doe');
      expect(user.createdAt).toBeGreaterThan(0);
    });

    it('should retrieve a user by ID', async () => {
      const createdUser = await databaseService.createUser('Jane Smith');
      const retrievedUser = await databaseService.getUser(createdUser.id);

      expect(retrievedUser).toBeDefined();
      expect(retrievedUser?.id).toBe(createdUser.id);
      expect(retrievedUser?.name).toBe('Jane Smith');
      expect(retrievedUser?.createdAt).toBe(createdUser.createdAt);
    });

    it('should return null for non-existent user', async () => {
      const user = await databaseService.getUser('non-existent-id');
      expect(user).toBeNull();
    });

    it('should create multiple users with unique IDs', async () => {
      const user1 = await databaseService.createUser('User 1');
      const user2 = await databaseService.createUser('User 2');
      const user3 = await databaseService.createUser('User 3');

      expect(user1.id).not.toBe(user2.id);
      expect(user2.id).not.toBe(user3.id);
      expect(user1.id).not.toBe(user3.id);
    });
  });

  describe('Household Operations', () => {
    it('should create a household with unique ID and reference code', async () => {
      const owner = await databaseService.createUser('Owner');
      const household = await databaseService.createHousehold('My Home', owner.id);

      expect(household).toBeDefined();
      expect(household.id).toBeTruthy();
      expect(household.name).toBe('My Home');
      expect(household.referenceCode).toBeTruthy();
      expect(household.referenceCode).toHaveLength(6);
      expect(household.ownerId).toBe(owner.id);
      expect(household.createdAt).toBeGreaterThan(0);
    });

    it('should retrieve a household by ID', async () => {
      const owner = await databaseService.createUser('Owner');
      const createdHousehold = await databaseService.createHousehold('Test House', owner.id);
      const retrievedHousehold = await databaseService.getHousehold(createdHousehold.id);

      expect(retrievedHousehold).toBeDefined();
      expect(retrievedHousehold?.id).toBe(createdHousehold.id);
      expect(retrievedHousehold?.name).toBe('Test House');
      expect(retrievedHousehold?.referenceCode).toBe(createdHousehold.referenceCode);
      expect(retrievedHousehold?.ownerId).toBe(owner.id);
    });

    it('should retrieve a household by reference code', async () => {
      const owner = await databaseService.createUser('Owner');
      const createdHousehold = await databaseService.createHousehold('Code House', owner.id);
      const retrievedHousehold = await databaseService.getHouseholdByReferenceCode(
        createdHousehold.referenceCode
      );

      expect(retrievedHousehold).toBeDefined();
      expect(retrievedHousehold?.id).toBe(createdHousehold.id);
      expect(retrievedHousehold?.name).toBe('Code House');
      expect(retrievedHousehold?.referenceCode).toBe(createdHousehold.referenceCode);
    });

    it('should return null for non-existent household ID', async () => {
      const household = await databaseService.getHousehold('non-existent-id');
      expect(household).toBeNull();
    });

    it('should return null for non-existent reference code', async () => {
      const household = await databaseService.getHouseholdByReferenceCode('XXXXXX');
      expect(household).toBeNull();
    });

    it('should create multiple households with unique IDs and reference codes', async () => {
      const owner = await databaseService.createUser('Owner');
      const house1 = await databaseService.createHousehold('House 1', owner.id);
      const house2 = await databaseService.createHousehold('House 2', owner.id);
      const house3 = await databaseService.createHousehold('House 3', owner.id);

      // Check unique IDs
      expect(house1.id).not.toBe(house2.id);
      expect(house2.id).not.toBe(house3.id);
      expect(house1.id).not.toBe(house3.id);

      // Check unique reference codes
      expect(house1.referenceCode).not.toBe(house2.referenceCode);
      expect(house2.referenceCode).not.toBe(house3.referenceCode);
      expect(house1.referenceCode).not.toBe(house3.referenceCode);
    });
  });

  describe('Household Membership', () => {
    it('should create owner membership when household is created', async () => {
      const owner = await databaseService.createUser('Owner');
      const household = await databaseService.createHousehold('My Home', owner.id);

      // Verify owner membership was created using the public API
      const role = await databaseService.getUserRole(owner.id, household.id);
      expect(role).toBe('owner');

      // Verify the household appears in the user's households
      const households = await databaseService.getUserHouseholds(owner.id);
      expect(households).toHaveLength(1);
      expect(households[0].household.id).toBe(household.id);
      expect(households[0].role).toBe('owner');
    });
  });
});
