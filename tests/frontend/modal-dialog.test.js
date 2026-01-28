import { fireEvent, screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

// Import the component
import '../../src/components/modal-dialog.js';

describe('ModalDialog Component', () => {
  let element;
  
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Create component
    element = document.createElement('modal-dialog');
    document.body.appendChild(element);
  });
  
  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('renders empty by default', () => {
    expect(element.innerHTML).toBe('');
  });

  test('showAlert displays alert modal', async () => {
    const promise = element.showAlert('Test Title', 'Test Message');
    
    await waitFor(() => {
      expect(element.innerHTML).toContain('Test Title');
      expect(element.innerHTML).toContain('Test Message');
      expect(element.querySelector('.modal-overlay')).toBeTruthy();
      expect(element.querySelector('.modal-content')).toBeTruthy();
      expect(element.querySelector('.modal-ok-btn')).toBeTruthy();
    });
    
    // Click OK button
    const okBtn = element.querySelector('.modal-ok-btn');
    await userEvent.click(okBtn);
    
    // Promise should resolve
    const result = await promise;
    expect(result).toBe(true);
    
    // Modal should be closed
    expect(element.innerHTML).toBe('');
  });

  test('showConfirm displays confirmation modal', async () => {
    const promise = element.showConfirm('Confirm Title', 'Confirm Message');
    
    await waitFor(() => {
      expect(element.innerHTML).toContain('Confirm Title');
      expect(element.innerHTML).toContain('Confirm Message');
      expect(element.querySelector('.modal-overlay')).toBeTruthy();
      expect(element.querySelector('.modal-content')).toBeTruthy();
      expect(element.querySelector('.modal-confirm-btn')).toBeTruthy();
      expect(element.querySelector('.modal-cancel-btn')).toBeTruthy();
    });
    
    // Click Confirm button
    const confirmBtn = element.querySelector('.modal-confirm-btn');
    await userEvent.click(confirmBtn);
    
    // Promise should resolve with true
    const result = await promise;
    expect(result).toBe(true);
    
    // Modal should be closed
    expect(element.innerHTML).toBe('');
  });

  test('showConfirm resolves false when cancelled', async () => {
    const promise = element.showConfirm('Confirm Title', 'Confirm Message');
    
    await waitFor(() => {
      expect(element.querySelector('.modal-cancel-btn')).toBeTruthy();
    });
    
    // Click Cancel button
    const cancelBtn = element.querySelector('.modal-cancel-btn');
    await userEvent.click(cancelBtn);
    
    // Promise should resolve with false
    const result = await promise;
    expect(result).toBe(false);
    
    // Modal should be closed
    expect(element.innerHTML).toBe('');
  });

  test('modal closes when clicking overlay', async () => {
    const alertPromise = element.showAlert('Test Title', 'Test Message');
    
    await waitFor(() => {
      expect(element.querySelector('.modal-overlay')).toBeTruthy();
    });
    
    // Click overlay
    const overlay = element.querySelector('.modal-overlay');
    await userEvent.click(overlay);
    
    // Promise should resolve
    const result = await alertPromise;
    expect(result).toBe(true);
    
    // Modal should be closed
    expect(element.innerHTML).toBe('');
  });

  test('confirm modal closes when clicking overlay', async () => {
    const confirmPromise = element.showConfirm('Confirm Title', 'Confirm Message');
    
    await waitFor(() => {
      expect(element.querySelector('.modal-overlay')).toBeTruthy();
    });
    
    // Click overlay
    const overlay = element.querySelector('.modal-overlay');
    await userEvent.click(overlay);
    
    // Promise should resolve with false
    const result = await confirmPromise;
    expect(result).toBe(false);
    
    // Modal should be closed
    expect(element.innerHTML).toBe('');
  });

  test('showConfirm accepts custom button text', async () => {
    const promise = element.showConfirm('Confirm Title', 'Confirm Message', {
      confirmText: 'Yes, do it',
      cancelText: 'No, cancel'
    });
    
    await waitFor(() => {
      const confirmBtn = element.querySelector('.modal-confirm-btn');
      const cancelBtn = element.querySelector('.modal-cancel-btn');
      
      expect(confirmBtn.textContent.trim()).toBe('Yes, do it');
      expect(cancelBtn.textContent.trim()).toBe('No, cancel');
    });
    
    // Clean up
    const confirmBtn = element.querySelector('.modal-confirm-btn');
    await userEvent.click(confirmBtn);
    await promise;
  });

  test('showConfirm applies danger style when specified', async () => {
    const promise = element.showConfirm('Delete Item', 'Are you sure?', {
      danger: true
    });
    
    await waitFor(() => {
      const confirmBtn = element.querySelector('.modal-confirm-btn');
      // Check if the inline style contains the CSS variable
      expect(confirmBtn.getAttribute('style')).toContain('var(--error)');
    });
    
    // Clean up
    const confirmBtn = element.querySelector('.modal-confirm-btn');
    await userEvent.click(confirmBtn);
    await promise;
  });

  test('handles multiple modals sequentially', async () => {
    // First modal
    const promise1 = element.showAlert('First Title', 'First Message');
    
    await waitFor(() => {
      expect(element.innerHTML).toContain('First Title');
    });
    
    // Close first modal
    const okBtn1 = element.querySelector('.modal-ok-btn');
    await userEvent.click(okBtn1);
    await promise1;
    
    // Second modal
    const promise2 = element.showAlert('Second Title', 'Second Message');
    
    await waitFor(() => {
      expect(element.innerHTML).toContain('Second Title');
    });
    
    // Close second modal
    const okBtn2 = element.querySelector('.modal-ok-btn');
    await userEvent.click(okBtn2);
    await promise2;
    
    // Modal should be closed
    expect(element.innerHTML).toBe('');
  });
});
