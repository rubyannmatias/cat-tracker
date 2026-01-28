# Testing Guide

This directory contains comprehensive functional tests for the Cat Tracker PWA.

## Test Structure

```
tests/
├── README.md                 # This file
├── setup.js                  # Jest setup and global mocks
├── frontend/                 # Frontend component tests
│   ├── photo-upload.test.js  # Photo upload component tests
│   └── modal-dialog.test.js  # Modal dialog component tests
└── backend/                  # Backend API tests
    ├── photos.test.js        # Photo upload and management API
    ├── cats.test.js          # Cat management API
    └── auth.test.js          # Authentication API
```

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Frontend Tests Only
```bash
npm run test:frontend
```

### Run Backend Tests Only
```bash
npm run test:backend
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

## Test Coverage

### Frontend Tests

#### Photo Upload Component (`photo-upload.test.js`)
- ✅ Renders upload form correctly
- ✅ File selection and preview
- ✅ HEIC file handling
- ✅ Form validation
- ✅ Upload success/error handling
- ✅ Recognition results display
- ✅ New cat form display
- ✅ Component reset functionality

#### Modal Dialog Component (`modal-dialog.test.js`)
- ✅ Alert modal display and interaction
- ✅ Confirmation modal display and interaction
- ✅ Custom button text and styling
- ✅ Overlay click to close
- ✅ Sequential modal handling

### Backend Tests

#### Photos API (`photos.test.js`)
- ✅ Photo upload with authentication
- ✅ HEIC to JPG conversion
- ✅ OCR processing
- ✅ Cat recognition
- ✅ Photo assignment to cats
- ✅ Photo deletion
- ✅ Error handling for all scenarios

#### Cats API (`cats.test.js`)
- ✅ Get all cats
- ✅ Get cat by ID
- ✅ Create new cat
- ✅ Update cat information
- ✅ Delete cat
- ✅ Get cat photos
- ✅ Authentication requirements
- ✅ Error handling

#### Authentication API (`auth.test.js`)
- ✅ User registration
- ✅ User login
- ✅ Token validation
- ✅ Password hashing
- ✅ Input validation
- ✅ Error handling

## Test Configuration

### Jest Configuration (`jest.config.js`)
- Test environment: jsdom (for frontend tests)
- Coverage thresholds: 70% minimum
- Test timeout: 10 seconds
- Verbose output enabled

### Setup File (`tests/setup.js`)
- Global mocks for:
  - `localStorage`
  - `fetch` API
  - `File` and `FileReader`
  - `FormData`
  - Console methods (to reduce noise)

## Writing New Tests

### Frontend Component Tests
```javascript
import { jest } from '@jest/globals';
import { fireEvent, screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

// Import component to test
import '../src/components/your-component.js';

describe('YourComponent', () => {
  let element;
  
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
    element = document.createElement('your-component');
    document.body.appendChild(element);
  });
  
  test('should render correctly', () => {
    // Test component rendering
  });
});
```

### Backend API Tests
```javascript
import request from 'supertest';
import { jest } from '@jest/globals';
import { app } from '../server/index.js';

describe('Your API', () => {
  test('should handle request correctly', async () => {
    const response = await request(app)
      .post('/api/your-endpoint')
      .send(data)
      .expect(200);
    
    expect(response.body).toEqual(expectedResult);
  });
});
```

## Mock Strategy

### Frontend Mocks
- **DOM APIs**: Mocked in setup.js
- **Network Requests**: Use `jest.mock()` for fetch
- **File Operations**: Mock File and FileReader APIs
- **Local Storage**: Mocked with jest functions

### Backend Mocks
- **Database**: Mock `better-sqlite3` prepare statements
- **External Services**: Mock recognition and OCR services
- **File System**: Mock fs operations for upload tests
- **Authentication**: Mock JWT verification

## Coverage Targets

Current coverage goals:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Run Tests
  run: |
    npm ci
    npm run test:coverage
    
- name: Upload Coverage
  uses: codecov/codecov-action@v1
```

## Best Practices

1. **Test User Interactions**: Use `@testing-library/user-event`
2. **Wait for Async**: Use `waitFor` for DOM updates
3. **Mock External Dependencies**: Isolate unit tests
4. **Test Error Cases**: Cover both success and failure paths
5. **Clear Test Names**: Describe what the test validates
6. **Arrange-Act-Assert**: Structure tests clearly
7. **Reset State**: Clean up between tests

## Troubleshooting

### Common Issues
- **Module Import Errors**: Check file extensions and paths
- **Async Test Timeouts**: Increase timeout or fix async handling
- **DOM Not Ready**: Use `waitFor` for DOM updates
- **Mock Not Working**: Ensure mocks are called before imports

### Debug Mode
Run tests with verbose output:
```bash
npm test -- --verbose
```

### Specific Test
Run a single test file:
```bash
npm test tests/frontend/photo-upload.test.js
```
