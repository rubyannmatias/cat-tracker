import request from 'supertest';
import { app } from '../../server/index.cjs';

// Mock the database
const mockDb = {
  prepare: jest.fn(() => ({
    run: jest.fn(),
    all: jest.fn(),
    get: jest.fn()
  }))
};

describe('Cats API', () => {
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

  describe('GET /api/cats', () => {
    test('should return all cats', async () => {
      const expectedCats = [
        { id: 1, name: 'Whiskers', markings: 'Orange tabby', building: 'A' },
        { id: 2, name: 'Mittens', markings: 'Black cat', building: 'B' }
      ];
      
      const response = await request(app)
        .get('/api/cats')
        .expect(200);
      
      expect(response.body).toEqual(expectedCats);
    });

    test('should handle database errors', async () => {
      await request(app)
        .get('/api/cats?test_error=true')
        .expect(500);
    });
  });

  describe('GET /api/cats/:id', () => {
    test('should return cat by id', async () => {
      const expectedCat = { id: 1, name: 'Whiskers', markings: 'Orange tabby' };
      
      const response = await request(app)
        .get('/api/cats/1')
        .expect(200);
      
      expect(response.body).toEqual(expectedCat);
    });

    test('should return 404 for non-existent cat', async () => {
      mockDb.prepare.mockReturnValue({
        get: jest.fn().mockReturnValue(null)
      });
      
      await request(app)
        .get('/api/cats/999')
        .expect(404);
    });
  });

  describe('POST /api/cats', () => {
    test('should create new cat successfully', async () => {
      const newCat = {
        name: 'Fluffy',
        markings: 'White Persian',
        building: 'C',
        gender: 'Female',
        vaccinations: 'Rabies',
        healthNotes: 'Healthy',
        spayNeuter: true
      };
      
      const mockInsert = { lastInsertRowid: 3 };
      mockDb.prepare.mockReturnValue({
        run: jest.fn().mockReturnValue(mockInsert)
      });
      
      const response = await request(app)
        .post('/api/cats')
        .set('Authorization', 'Bearer valid-token')
        .send(newCat)
        .expect(201);
      
      expect(response.body).toHaveProperty('id', 3);
      expect(response.body.name).toBe(newCat.name);
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .post('/api/cats')
        .send({ name: 'Test' })
        .expect(401);
    });

    test('should return 400 for missing required fields', async () => {
      await request(app)
        .post('/api/cats')
        .set('Authorization', 'Bearer valid-token')
        .send({ markings: 'Orange tabby' }) // Missing name
        .expect(400);
    });

    test('should handle database errors during creation', async () => {
      mockDb.prepare.mockReturnValue({
        run: jest.fn().mockRejectedValue(new Error('Database error'))
      });
      
      await request(app)
        .post('/api/cats')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Test' })
        .expect(500);
    });
  });

  describe('PUT /api/cats/:id', () => {
    test('should update cat successfully', async () => {
      const updatedCat = {
        name: 'Whiskers Updated',
        markings: 'Orange tabby with white paws',
        building: 'A',
        gender: 'Male',
        vaccinations: 'Rabies, FVRCP',
        healthNotes: 'Healthy and active',
        spayNeuter: true
      };
      
      mockDb.prepare.mockReturnValue({
        run: jest.fn().mockReturnValue({ changes: 1 })
      });
      
      const response = await request(app)
        .put('/api/cats/1')
        .set('Authorization', 'Bearer valid-token')
        .send(updatedCat)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .put('/api/cats/1')
        .send({ name: 'Updated' })
        .expect(401);
    });

    test('should return 404 for non-existent cat', async () => {
      mockDb.prepare.mockReturnValue({
        run: jest.fn().mockReturnValue({ changes: 0 })
      });
      
      await request(app)
        .put('/api/cats/999')
        .set('Authorization', 'Bearer valid-token')
        .send({ name: 'Updated' })
        .expect(404);
    });
  });

  describe('DELETE /api/cats/:id', () => {
    test('should delete cat successfully', async () => {
      mockDb.prepare.mockReturnValue({
        run: jest.fn().mockReturnValue({ changes: 1 })
      });
      
      const response = await request(app)
        .delete('/api/cats/1')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
    });

    test('should return 401 without authentication', async () => {
      await request(app)
        .delete('/api/cats/1')
        .expect(401);
    });

    test('should return 404 for non-existent cat', async () => {
      mockDb.prepare.mockReturnValue({
        run: jest.fn().mockReturnValue({ changes: 0 })
      });
      
      await request(app)
        .delete('/api/cats/999')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);
    });
  });

  describe('GET /api/cats/:id/photos', () => {
    test('should return cat photos', async () => {
      const expectedPhotos = [
        { id: 1, upload_date: '2023-01-01', url: '/uploads/photo1.jpg' },
        { id: 2, upload_date: '2023-01-02', url: '/uploads/photo2.jpg' }
      ];
      
      const response = await request(app)
        .get('/api/cats/1/photos')
        .expect(200);
      
      expect(response.body).toEqual(expectedPhotos);
    });

    test('should return empty array for cat with no photos', async () => {
      const response = await request(app)
        .get('/api/cats/1/photos?empty=true')
        .expect(200);
      
      expect(response.body).toEqual([]);
    });
  });
});
