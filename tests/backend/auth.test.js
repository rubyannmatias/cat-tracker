import request from 'supertest';
import bcrypt from 'bcrypt';
import { app } from '../../server/index.cjs';

// Mock the database
const mockDb = {
  prepare: jest.fn(() => ({
    run: jest.fn(),
    all: jest.fn(),
    get: jest.fn()
  }))
};

describe('Authentication API', () => {
  let server;
  
  beforeAll(async () => {
    // Start server
    server = app.listen(0); // Use random port
  });
  
  afterAll(async () => {
    // Close server
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    test('should register new user successfully', async () => {
      const newUser = {
        name: 'Test User',
        email: 'newuser@example.com',
        password: 'password123'
      };
      
      // Reset users to avoid conflicts
      await request(app)
        .post('/api/auth/reset')
        .expect(200);
      
      // Mock database queries
      mockDb.prepare.mockReturnValue({
        get: jest.fn().mockReturnValue(null), // Email not found
        run: jest.fn().mockReturnValue({ lastInsertRowid: 1 })
      });
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(201);
      
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('name', newUser.name);
      expect(response.body.user).toHaveProperty('email', newUser.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    test('should return 400 for duplicate email', async () => {
      const existingUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };
      
      // Mock database to find existing email
      mockDb.prepare.mockReturnValue({
        get: jest.fn().mockReturnValue({ id: 1, email: 'test@example.com' })
      });
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(existingUser)
        .expect(400);
      
      expect(response.body.error).toContain('already exists');
    });

    test('should return 400 for missing required fields', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test' }) // Missing email and password
        .expect(400);
    });

    test('should return 400 for invalid email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123'
        })
        .expect(400);
    });

    test('should return 400 for short password', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: '123' // Too short
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login successfully with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      // Mock database to find user
      mockDb.prepare.mockReturnValue({
        get: jest.fn().mockReturnValue({
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          password: hashedPassword
        })
      });
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('name', 'Test User');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.user).not.toHaveProperty('password');
    });

    test('should return 401 for invalid email', async () => {
      // Mock database to not find user
      mockDb.prepare.mockReturnValue({
        get: jest.fn().mockReturnValue(null)
      });
      
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);
    });

    test('should return 401 for invalid password', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      // Mock database to find user
      mockDb.prepare.mockReturnValue({
        get: jest.fn().mockReturnValue({
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          password: hashedPassword
        })
      });
      
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401);
    });

    test('should return 400 for missing fields', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' }) // Missing password
        .expect(400);
    });

    test('should return 400 for invalid email format', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123'
        })
        .expect(400);
    });
  });

  describe('Token Validation', () => {
    test('should accept valid token', async () => {
      // Mock database for user lookup
      mockDb.prepare.mockReturnValue({
        get: jest.fn().mockReturnValue({
          id: 1,
          name: 'Test User',
          email: 'test@example.com'
        })
      });
      
      // First login to get token
      const hashedPassword = await bcrypt.hash('password123', 10);
      mockDb.prepare.mockReturnValue({
        get: jest.fn().mockReturnValue({
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          password: hashedPassword
        })
      });
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      const token = loginResponse.body.token;
      
      // Use token to access protected route
      await request(app)
        .get('/api/cats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    test('should reject invalid token', async () => {
      await request(app)
        .post('/api/cats')
        .set('Authorization', 'Bearer invalid-token')
        .send({ name: 'Test Cat' })
        .expect(401);
    });

    test('should reject missing token', async () => {
      await request(app)
        .post('/api/cats')
        .send({ name: 'Test Cat' })
        .expect(401);
    });

    test('should reject malformed authorization header', async () => {
      await request(app)
        .post('/api/cats')
        .set('Authorization', 'InvalidFormat token')
        .send({ name: 'Test Cat' })
        .expect(401);
    });
  });

  describe('User Profile', () => {
    test('should get user profile with valid token', async () => {
      // Mock database for user lookup
      mockDb.prepare.mockReturnValue({
        get: jest.fn().mockReturnValue({
          id: 1,
          name: 'Test User',
          email: 'test@example.com'
        })
      });
      
      // First login to get token
      const hashedPassword = await bcrypt.hash('password123', 10);
      mockDb.prepare.mockReturnValue({
        get: jest.fn().mockReturnValue({
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          password: hashedPassword
        })
      });
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      const token = loginResponse.body.token;
      
      // Get profile
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(profileResponse.body).toHaveProperty('name', 'Test User');
      expect(profileResponse.body).toHaveProperty('email', 'test@example.com');
      expect(profileResponse.body).not.toHaveProperty('password');
    });
  });
});
