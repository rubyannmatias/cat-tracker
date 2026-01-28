// Jest setup file
require('@testing-library/jest-dom');

// Polyfill TextEncoder/TextDecoder for Node environment
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock localStorage
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Reset localStorage mock before each test
beforeEach(() => {
  jest.clearAllMocks();
});


// Mock fetch
global.fetch = jest.fn();

// Mock File API
global.File = class File {
  constructor(chunks, filename, options = {}) {
    this.name = filename;
    this.size = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    this.type = options.type || '';
    this.lastModified = options.lastModified || Date.now();
  }
};

global.FileReader = class FileReader {
  constructor() {
    this.readyState = 0;
    this.result = null;
    this.onload = null;
  }
  
  readAsDataURL() {
    setTimeout(() => {
      this.result = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
      if (this.onload) {
        this.onload({ target: { result: this.result } });
      }
      this.readyState = 2;
    }, 100);
  }
};

// Mock FormData
global.FormData = class FormData {
  constructor() {
    this.data = new Map();
  }
  
  append(key, value) {
    this.data.set(key, value);
  }
  
  get(key) {
    return this.data.get(key);
  }
  
  // Add Symbol.iterator for Jest to properly inspect FormData
  *[Symbol.iterator]() {
    for (const [key, value] of this.data) {
      yield [key, value];
    }
  }
  
  // Add entries method for Jest inspection
  entries() {
    return Array.from(this.data.entries());
  }
  
  // Add toString for better error messages
  toString() {
    return 'FormData';
  }
};

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = jest.fn();

// Mock CSS variables for testing
window.getComputedStyle = jest.fn((element) => {
  const cssVars = {
    '--surface': '#ffffff',
    '--text-primary': '#111827',
    '--text-secondary': '#6b7280',
    '--border': '#e5e7eb',
    '--error': '#ef4444',
    '--success': '#10b981',
    '--warning': '#f59e0b'
  };
  return {
    getPropertyValue: jest.fn((prop) => cssVars[prop] || '')
  };
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};
