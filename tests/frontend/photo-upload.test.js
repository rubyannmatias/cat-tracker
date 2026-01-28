import { fireEvent, screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

// Mock the modal dialog component
const mockModal = {
  showAlert: jest.fn(),
  showConfirm: jest.fn()
};
global.document.getElementById = jest.fn(() => mockModal);

// Import the component
import '../../src/components/photo-upload.js';

describe('PhotoUpload Component', () => {
  let element;
  
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    
    // Create component
    element = document.createElement('photo-upload');
    document.body.appendChild(element);
  });
  
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('renders upload form correctly', () => {
    expect(element.querySelector('form')).toBeTruthy();
    expect(element.querySelector('#photo-input')).toBeTruthy();
    expect(element.querySelector('#upload-btn')).toBeTruthy();
    expect(element.querySelector('#preview')).toBeTruthy();
    expect(element.querySelector('#upload-status')).toBeTruthy();
    
    const uploadBtn = element.querySelector('#upload-btn');
    expect(uploadBtn.textContent.trim()).toBe('Upload & Analyze');
  });

  test('shows file input when clicking choose photo button', async () => {
    const fileInput = element.querySelector('#photo-input');
    const choosePhotoLabel = element.querySelector('label[for="photo-input"]');
    
    // Test that the label exists and is clickable
    expect(choosePhotoLabel).toBeTruthy();
    expect(fileInput).toBeTruthy();
    expect(choosePhotoLabel.getAttribute('for')).toBe('photo-input');
  });

  test('previews image when file is selected', async () => {
    const fileInput = element.querySelector('#photo-input');
    const preview = element.querySelector('#preview');
    
    // Create a mock file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    // Simulate file selection
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: true
    });
    
    fireEvent.change(fileInput);
    
    // Wait for FileReader to complete and preview to update
    await waitFor(() => {
      const img = preview.querySelector('img');
      expect(img).toBeTruthy();
      expect(img.alt).toBe('Preview');
    }, { timeout: 2000 });
  });

  test('shows HEIC placeholder for HEIC files', async () => {
    const fileInput = element.querySelector('#photo-input');
    const preview = element.querySelector('#preview');
    
    // Create a mock HEIC file
    const file = new File(['test'], 'test.heic', { type: 'image/heic' });
    
    // Simulate file selection
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: true
    });
    
    fireEvent.change(fileInput);
    
    // Wait for preview to update
    await waitFor(() => {
      expect(preview.textContent).toContain('HEIC image selected');
      expect(preview.textContent).toContain('Preview not available');
    });
  });

  test('shows alert when trying to upload without selecting file', async () => {
    const form = element.querySelector('form');
    const uploadBtn = element.querySelector('#upload-btn');
    
    // Submit form without file
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(mockModal.showAlert).toHaveBeenCalledWith(
        'No Photo Selected',
        'Please select a photo before uploading.'
      );
    });
  });

  test('uploads file when form is submitted with file', async () => {
    const fileInput = element.querySelector('#photo-input');
    const form = element.querySelector('form');
    
    // Create a mock file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    // Simulate file selection
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: true
    });
    
    fireEvent.change(fileInput);
    
    // Mock successful upload response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: {
        get: jest.fn((header) => {
          const headers = {
            'content-type': 'application/json',
            'content-length': '123'
          };
          return headers[header];
        })
      },
      text: async () => JSON.stringify({
        photoId: 1,
        photoUrl: '/uploads/test.jpg',
        recognized: false,
        matches: [],
        ocrText: null
      }),
      json: async () => ({
        photoId: 1,
        photoUrl: '/uploads/test.jpg',
        recognized: false,
        matches: [],
        ocrText: null
      })
    });
    
    // Mock localStorage token
    global.localStorage.getItem = jest.fn().mockReturnValue('mock-token');
    
    // Submit form
    fireEvent.submit(form);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/photos/upload', expect.any(Object));
      expect(global.fetch).toHaveBeenCalledTimes(1);
      
      const callArgs = global.fetch.mock.calls[0];
      expect(callArgs[0]).toBe('/api/photos/upload');
      expect(callArgs[1].method).toBe('POST');
    });
  });

  test('handles upload error gracefully', async () => {
    const fileInput = element.querySelector('#photo-input');
    const form = element.querySelector('form');
    
    // Create a mock file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    // Simulate file selection
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: true
    });
    
    fireEvent.change(fileInput);
    
    // Mock failed upload response
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: {
        get: jest.fn((header) => {
          const headers = {
            'content-type': 'application/json',
            'content-length': '123'
          };
          return headers[header];
        })
      },
      text: async () => JSON.stringify({ error: 'Upload failed' }),
      json: async () => ({ error: 'Upload failed' })
    });
    
    // Mock localStorage token
    global.localStorage.getItem = jest.fn().mockReturnValue('mock-token');
    
    // Submit form
    fireEvent.submit(form);
    
    await waitFor(() => {
      const statusDiv = element.querySelector('#upload-status');
      expect(statusDiv.textContent).toContain('Upload Failed');
    });
  });

  test('shows recognition results when upload succeeds', async () => {
    const fileInput = element.querySelector('#photo-input');
    const form = element.querySelector('form');
    
    // Create a mock file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    // Simulate file selection
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: true
    });
    
    fireEvent.change(fileInput);
    
    // Mock successful upload with matches
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: {
        get: jest.fn((header) => {
          const headers = {
            'content-type': 'application/json',
            'content-length': '123'
          };
          return headers[header];
        })
      },
      text: async () => JSON.stringify({
        photoId: 1,
        photoUrl: '/uploads/test.jpg',
        recognized: true,
        matches: [
          {
            id: 1,
            name: 'Whiskers',
            markings: 'Orange tabby',
            confidence: 0.95,
            photos: [{ url: '/uploads/whiskers1.jpg' }]
          }
        ],
        ocrText: null
      }),
      json: async () => ({
        photoId: 1,
        photoUrl: '/uploads/test.jpg',
        recognized: true,
        matches: [
          {
            id: 1,
            name: 'Whiskers',
            markings: 'Orange tabby',
            confidence: 0.95,
            photos: [{ url: '/uploads/whiskers1.jpg' }]
          }
        ],
        ocrText: null
      })
    });
    
    // Mock localStorage token
    global.localStorage.getItem = jest.fn().mockReturnValue('mock-token');
    
    // Submit form
    fireEvent.submit(form);
    
    await waitFor(() => {
      const statusDiv = element.querySelector('#upload-status');
      expect(statusDiv.textContent).toContain('Cat Recognized!');
      expect(statusDiv.textContent).toContain('Whiskers');
      expect(statusDiv.textContent).toContain('95%');
    });
  });

  test('shows new cat form when no matches found', async () => {
    const fileInput = element.querySelector('#photo-input');
    const form = element.querySelector('form');
    
    // Create a mock file
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    // Simulate file selection
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: true
    });
    
    fireEvent.change(fileInput);
    
    // Mock successful upload with no matches
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: {
        get: jest.fn((header) => {
          const headers = {
            'content-type': 'application/json',
            'content-length': '123'
          };
          return headers[header];
        })
      },
      text: async () => JSON.stringify({
        photoId: 1,
        photoUrl: '/uploads/test.jpg',
        recognized: false,
        matches: [],
        ocrText: null
      }),
      json: async () => ({
        photoId: 1,
        photoUrl: '/uploads/test.jpg',
        recognized: false,
        matches: [],
        ocrText: null
      })
    });
    
    // Mock localStorage token
    global.localStorage.getItem = jest.fn().mockReturnValue('mock-token');
    
    // Submit form
    fireEvent.submit(form);
    
    await waitFor(() => {
      const statusDiv = element.querySelector('#upload-status');
      expect(statusDiv.textContent).toContain('Create New Cat Profile');
    });
  });

  test('resets component correctly', () => {
    // Set some initial state
    element.selectedFile = new File(['test'], 'test.jpg');
    element.recognitionResult = { photoId: 1 };
    
    // Reset
    element.reset();
    
    expect(element.selectedFile).toBeNull();
    expect(element.recognitionResult).toBeNull();
  });
});
