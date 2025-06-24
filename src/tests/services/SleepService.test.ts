import { describe, test, expect, beforeEach, vi } from 'vitest';
import { SleepService } from '../../services/domain/SleepService';
import { ServiceRegistry } from '../../services';

// Mock the dbClient
const mockDbClient = {
  getCurrentUser: vi.fn(),
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  checkAccess: vi.fn(),
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      }))
    }))
  }
};

// Mock user
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com'
};

// Mock sleep record
const mockSleepRecord = {
  id: 'record-1',
  user_id: 'test-user-id',
  date: '2025-01-18',
  bedtime: '22:30:00',
  wake_time: '07:30:00',
  duration: 9,
  quality: 4,
  notes: 'Great sleep',
  created_at: '2025-01-18T22:30:00Z'
};

describe('SleepService', () => {
  let sleepService: SleepService;

  beforeEach(() => {
    // Clear service registry
    ServiceRegistry.clear();
    
    // Create new service instance with mocked dependencies
    sleepService = new (class extends SleepService {
      protected db = mockDbClient as any;
    })();

    // Reset all mocks
    vi.clearAllMocks();
  });

  describe('getSleepRecords', () => {
    test('should fetch sleep records for authenticated user', async () => {
      // Arrange
      mockDbClient.getCurrentUser.mockResolvedValue(mockUser);
      
      // Create a proper mock chain for the Supabase query
      const mockLte = vi.fn().mockResolvedValue({
        data: [mockSleepRecord],
        error: null
      });
      const mockGte = vi.fn().mockReturnValue({ lte: mockLte });
      const mockEq = vi.fn().mockReturnValue({ gte: mockGte });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
      
      mockDbClient.supabase.from = mockFrom;

      // Act
      const result = await sleepService.getSleepRecords('test-user-id', '2025-01-01', '2025-01-31');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockSleepRecord);
      expect(mockDbClient.getCurrentUser).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalledWith('sleep_records');
    });

    test('should throw error when user is not authenticated', async () => {
      // Arrange
      mockDbClient.getCurrentUser.mockResolvedValue(null);

      // Act & Assert
      await expect(
        sleepService.getSleepRecords('test-user-id', '2025-01-01', '2025-01-31')
      ).rejects.toThrow('User not authenticated');
    });

    test('should throw error when user tries to access another user\'s records', async () => {
      // Arrange
      mockDbClient.getCurrentUser.mockResolvedValue({ ...mockUser, id: 'different-user-id' });
      mockDbClient.checkAccess.mockResolvedValue(false);

      // Act & Assert
      await expect(
        sleepService.getSleepRecords('test-user-id', '2025-01-01', '2025-01-31')
      ).rejects.toThrow('Access denied to sleep records');
    });
  });

  describe('createSleepRecord', () => {
    const validSleepData = {
      user_id: 'test-user-id',
      date: '2025-01-18',
      bedtime: '22:30:00',
      wake_time: '07:30:00',
      duration: 9,
      quality: 4,
      notes: 'Great sleep'
    };

    test('should create sleep record with valid data', async () => {
      // Arrange
      mockDbClient.getCurrentUser.mockResolvedValue(mockUser);
      mockDbClient.insert.mockResolvedValue([mockSleepRecord]);

      // Act
      const result = await sleepService.createSleepRecord(validSleepData);

      // Assert
      expect(result).toEqual(mockSleepRecord);
      expect(mockDbClient.insert).toHaveBeenCalledWith('sleep_records', validSleepData);
    });

    test('should throw error when user tries to create record for another user', async () => {
      // Arrange
      mockDbClient.getCurrentUser.mockResolvedValue(mockUser);
      const invalidData = { ...validSleepData, user_id: 'different-user-id' };

      // Act & Assert
      await expect(
        sleepService.createSleepRecord(invalidData)
      ).rejects.toThrow('Cannot create sleep record for another user');
    });

    test('should validate required fields', async () => {
      // Arrange
      mockDbClient.getCurrentUser.mockResolvedValue(mockUser);
      const incompleteData = { ...validSleepData, bedtime: '' };

      // Act & Assert
      await expect(
        sleepService.createSleepRecord(incompleteData)
      ).rejects.toThrow('Missing required fields');
    });

    test('should validate duration range', async () => {
      // Arrange
      mockDbClient.getCurrentUser.mockResolvedValue(mockUser);
      const invalidData = { ...validSleepData, duration: 25 }; // > 24 hours

      // Act & Assert
      await expect(
        sleepService.createSleepRecord(invalidData)
      ).rejects.toThrow('Duration must be between 0 and 24 hours');
    });

    test('should validate quality range', async () => {
      // Arrange
      mockDbClient.getCurrentUser.mockResolvedValue(mockUser);
      const invalidData = { ...validSleepData, quality: 5 }; // > 4

      // Act & Assert
      await expect(
        sleepService.createSleepRecord(invalidData)
      ).rejects.toThrow('Quality must be between 1 and 4');
    });
  });

  describe('upsertSleepRecord', () => {
    const sleepData = {
      user_id: 'test-user-id',
      date: '2025-01-18',
      bedtime: '22:30:00',
      wake_time: '07:30:00',
      duration: 9,
      quality: 4
    };

    test('should update existing record when one exists for the date', async () => {
      // Arrange
      mockDbClient.getCurrentUser.mockResolvedValue(mockUser);
      mockDbClient.select.mockResolvedValue([{ ...mockSleepRecord }]);
      mockDbClient.update.mockResolvedValue([{ ...mockSleepRecord, quality: 3 }]);

      // Act
      const result = await sleepService.upsertSleepRecord(sleepData);

      // Assert
      expect(mockDbClient.select).toHaveBeenCalledWith(
        'sleep_records',
        '*',
        {
          user_id: sleepData.user_id,
          date: sleepData.date
        }
      );
      expect(mockDbClient.update).toHaveBeenCalled();
      expect(result.quality).toBe(3);
    });

    test('should create new record when none exists for the date', async () => {
      // Arrange
      mockDbClient.getCurrentUser.mockResolvedValue(mockUser);
      mockDbClient.select.mockResolvedValue([]); // No existing records
      mockDbClient.insert.mockResolvedValue([mockSleepRecord]);

      // Act
      const result = await sleepService.upsertSleepRecord(sleepData);

      // Assert
      expect(mockDbClient.select).toHaveBeenCalled();
      expect(mockDbClient.insert).toHaveBeenCalledWith('sleep_records', sleepData);
      expect(result).toEqual(mockSleepRecord);
    });
  });

  describe('getSleepStats', () => {
    test('should calculate stats from recent records', async () => {
      // Arrange
      const mockRecords = [
        { ...mockSleepRecord, duration: 8, quality: 4 },
        { ...mockSleepRecord, duration: 9, quality: 3 },
        { ...mockSleepRecord, duration: 7, quality: 4 }
      ];
      
      // Mock the getSleepRecords method
      vi.spyOn(sleepService, 'getRecentSleepRecords').mockResolvedValue(mockRecords);

      // Act
      const stats = await sleepService.getSleepStats('test-user-id', 7);

      // Assert
      expect(stats.avgDuration).toBe(8); // (8 + 9 + 7) / 3 = 8
      expect(stats.avgQuality).toBe(3.7); // (4 + 3 + 4) / 3 = 3.67 rounded to 3.7
      expect(stats.totalRecords).toBe(3);
      expect(stats.latestRecord).toEqual(mockRecords[0]);
    });

    test('should return zero stats when no records exist', async () => {
      // Arrange
      vi.spyOn(sleepService, 'getRecentSleepRecords').mockResolvedValue([]);

      // Act
      const stats = await sleepService.getSleepStats('test-user-id', 7);

      // Assert
      expect(stats.avgDuration).toBe(0);
      expect(stats.avgQuality).toBe(0);
      expect(stats.totalRecords).toBe(0);
      expect(stats.latestRecord).toBeUndefined();
    });
  });

  describe('deleteSleepRecord', () => {
    test('should delete record when user owns it', async () => {
      // Arrange
      mockDbClient.getCurrentUser.mockResolvedValue(mockUser);
      mockDbClient.select.mockResolvedValue([{ user_id: 'test-user-id' }]);
      mockDbClient.delete.mockResolvedValue([]);

      // Act
      await sleepService.deleteSleepRecord('record-1');

      // Assert
      expect(mockDbClient.delete).toHaveBeenCalledWith('sleep_records', { id: 'record-1' });
    });

    test('should throw error when record does not exist', async () => {
      // Arrange
      mockDbClient.getCurrentUser.mockResolvedValue(mockUser);
      mockDbClient.select.mockResolvedValue([]); // No records found

      // Act & Assert
      await expect(
        sleepService.deleteSleepRecord('nonexistent-record')
      ).rejects.toThrow('Sleep record not found');
    });

    test('should throw error when user tries to delete another user\'s record', async () => {
      // Arrange
      mockDbClient.getCurrentUser.mockResolvedValue(mockUser);
      mockDbClient.select.mockResolvedValue([{ user_id: 'different-user-id' }]);

      // Act & Assert
      await expect(
        sleepService.deleteSleepRecord('record-1')
      ).rejects.toThrow('Cannot delete another user\'s sleep record');
    });
  });
}); 