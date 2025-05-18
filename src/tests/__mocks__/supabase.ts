// Mock Supabase client for testing
interface MockDataStructure {
  [key: string]: any[];
  points_ledger: any[];
  badges: {
    id: string;
    code: string;
    name: string;
    description: string;
    category: string;
    icon_url?: string;
  }[];
  athlete_badges: any[];
  athlete_streaks: any[];
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
    team: string;
  }[];
}

const mockData: MockDataStructure = {
  points_ledger: [],
  badges: [
    { id: 'badge1', code: 'first_workout', name: 'First Workout', description: 'First workout completed', category: 'workout', icon_url: '/badges/first_workout.svg' },
    { id: 'badge2', code: 'consistency', name: 'Consistency', description: '7-day streak', category: 'streak', icon_url: '/badges/consistency.svg' },
    { id: 'badge3', code: 'bronze_athlete', name: 'Bronze Athlete', description: '100 points earned', category: 'points', icon_url: '/badges/bronze_athlete.svg' }
  ],
  athlete_badges: [],
  athlete_streaks: [],
  profiles: [
    { id: 'user1', first_name: 'John', last_name: 'Doe', team: 'Team A' },
    { id: 'user2', first_name: 'Jane', last_name: 'Smith', team: 'Team A' },
    { id: 'user3', first_name: 'Bob', last_name: 'Johnson', team: 'Team B' }
  ]
};

// Improved mock
export const supabase = {
  from: (table: string) => ({
    insert: (data: any) => ({
      select: () => ({
        single: () => {
          const newItem = { ...data, id: `mock-${Date.now()}` };
          mockData[table] = [...mockData[table], newItem];
          return Promise.resolve({ data: newItem, error: null });
        }
      })
    }),
    select: (columns?: string) => ({
      eq: (column: string, value: any) => ({
        eq: (column2: string, value2: any) => ({
          single: () => {
            const result = mockData[table].find((item: any) => item[column] === value && item[column2] === value2);
            return Promise.resolve({ data: result || null, error: null });
          },
          select: () => Promise.resolve({ 
            data: mockData[table].filter((item: any) => item[column] === value && item[column2] === value2), 
            error: null 
          })
        }),
        single: () => {
          const result = mockData[table].find((item: any) => item[column] === value);
          return Promise.resolve({ data: result || null, error: null });
        },
        delete: () => {
          mockData[table] = mockData[table].filter((item: any) => item[column] !== value);
          return Promise.resolve({ error: null });
        },
        order: (orderColumn: string, { ascending = true }: { ascending?: boolean } = {}) => ({
          select: () => {
            const filteredData = mockData[table].filter((item: any) => item[column] === value);
            const sortedData = [...filteredData].sort((a, b) => {
              if (ascending) {
                return a[orderColumn] > b[orderColumn] ? 1 : -1;
              } else {
                return a[orderColumn] < b[orderColumn] ? 1 : -1;
              }
            });
            return Promise.resolve({ data: sortedData, error: null });
          }
        }),
        select: () => Promise.resolve({ 
          data: mockData[table].filter((item: any) => item[column] === value), 
          error: null 
        })
      }),
      order: (orderColumn: string, { ascending = true }: { ascending?: boolean } = {}) => ({
        select: () => {
          const sortedData = [...mockData[table]].sort((a, b) => {
            if (ascending) {
              return a[orderColumn] > b[orderColumn] ? 1 : -1;
            } else {
              return a[orderColumn] < b[orderColumn] ? 1 : -1;
            }
          });
          return Promise.resolve({ data: sortedData, error: null });
        }
      }),
      single: () => Promise.resolve({ data: mockData[table][0] || null, error: null })
    }),
    upsert: (data: any) => ({
      select: () => ({
        single: () => {
          const index = mockData[table].findIndex((item: any) => item.athlete_id === data.athlete_id);
          if (index >= 0) {
            mockData[table][index] = { ...mockData[table][index], ...data };
            return Promise.resolve({ data: mockData[table][index], error: null });
          } else {
            const newItem = { ...data, id: `mock-${Date.now()}` };
            mockData[table].push(newItem);
            return Promise.resolve({ data: newItem, error: null });
          }
        }
      })
    }),
    update: (data: any) => ({
      eq: (column: string, value: any) => {
        const index = mockData[table].findIndex((item: any) => item[column] === value);
        if (index >= 0) {
          mockData[table][index] = { ...mockData[table][index], ...data };
          return Promise.resolve({ data: mockData[table][index], error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }
    }),
    delete: () => ({
      eq: (column: string, value: any) => {
        mockData[table] = mockData[table].filter((item: any) => item[column] !== value);
        return Promise.resolve({ error: null });
      }
    })
  }),
  rpc: (func: string, params: any) => {
    if (func === 'get_points_leaderboard') {
      // Simulate leaderboard calculation
      const leaderboardEntries = mockData.profiles.map((profile, index) => ({
        athlete_id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        avatar_url: null,
        total_points: 100 - (index * 10), // Higher points for earlier entries
        rank: index + 1
      }));
      
      return Promise.resolve({ 
        data: leaderboardEntries.slice(0, params.limit_count), 
        error: null 
      });
    }
    return Promise.resolve({ data: [], error: null });
  }
};

// Helper functions to reset mock data between tests
export function resetMockData() {
  mockData.points_ledger = [];
  mockData.athlete_badges = [];
  mockData.athlete_streaks = [];
  // Keep badges and profiles static
}

export function getMockData() {
  return { ...mockData };
}

export function setMockData(table: string, data: any[]) {
  mockData[table] = [...data];
} 