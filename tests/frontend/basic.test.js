import { jest } from '@jest/globals';

// Basic test to verify test setup works
describe('Test Setup', () => {
  test('should run basic test', () => {
    expect(true).toBe(true);
  });

  test('should have DOM environment', () => {
    expect(document).toBeDefined();
    expect(window).toBeDefined();
  });

  test('should have localStorage mock', () => {
    expect(localStorage.getItem).toBeDefined();
    expect(localStorage.setItem).toBeDefined();
  });

  test('should have fetch mock', () => {
    expect(fetch).toBeDefined();
  });
});
