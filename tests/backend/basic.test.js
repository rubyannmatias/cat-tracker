// Basic test to verify test setup works
describe('Backend Test Setup', () => {
  test('should run basic test', () => {
    expect(true).toBe(true);
  });

  test('should have Node.js environment', () => {
    expect(process).toBeDefined();
    expect(Buffer).toBeDefined();
  });

  test('should have TextEncoder/TextDecoder', () => {
    expect(TextEncoder).toBeDefined();
    expect(TextDecoder).toBeDefined();
  });
});
