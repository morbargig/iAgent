export interface User {
  userId: string;
  email: string;
  password: string;
  role: string;
  createdAt: Date;
}

export const DEMO_USERS: User[] = [
  {
    userId: 'user_demo_001',
    email: 'demo@iagent.com',
    password: 'demo',
    role: 'user',
    createdAt: new Date('2024-01-01'),
  },
  {
    userId: 'user_test_001',
    email: 'test@iagent.com',
    password: 'test',
    role: 'user',
    createdAt: new Date('2024-01-01'),
  },
];
