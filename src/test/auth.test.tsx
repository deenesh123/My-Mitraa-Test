/**
 * Frontend Authentication UI Tests
 * Covers Login form, empty inputs, validation, registration without auto-login
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { AuthPage } from '../pages/auth/AuthPage';
import { renderWithProviders } from './testUtils';
import { ApiClient } from '../api/client';

describe('AuthPage UI & Workflow', () => {
  it('renders login credentials form with empty username and password inputs', () => {
    const handleSuccess = vi.fn();
    renderWithProviders(<AuthPage onSuccess={handleSuccess} />);

    expect(screen.getByText(/Sign In to/i)).toBeDefined();
    const userInput = screen.getByPlaceholderText(/deenesh-sabat/i) as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText(/••••••••••/i) as HTMLInputElement;

    // Must be uninitialized (empty)
    expect(userInput.value).toBe('');
    expect(passwordInput.value).toBe('');
    expect(screen.getByRole('button', { name: /Sign In & Proceed/i })).toBeDefined();
  });

  it('allows toggling between Sign In and Create Account modes', () => {
    const handleSuccess = vi.fn();
    renderWithProviders(<AuthPage onSuccess={handleSuccess} />);

    const switchBtn = screen.getByRole('button', { name: /^Sign Up$/i });
    fireEvent.click(switchBtn);

    expect(screen.getByText(/Create/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/e.g. Deenesh Sabat/i)).toBeDefined();
  });

  it('validates that user name and password are required before submission', async () => {
    const handleSuccess = vi.fn();
    renderWithProviders(<AuthPage onSuccess={handleSuccess} />);

    const submitBtn = screen.getByRole('button', { name: /Sign In & Proceed/i });
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    expect(handleSuccess).not.toHaveBeenCalled();
  });

  it('triggers login form submission with user-supplied credentials', async () => {
    const handleSuccess = vi.fn();
    const loginSpy = vi.spyOn(ApiClient.auth, 'login').mockResolvedValueOnce({
      code: 200,
      message: 'LOGIN_SUCCESS',
      data: {
        id: 'usr-1',
        name: 'Deenesh Sabat',
        email: 'deenesh@mymitraa.com',
        role: 'Super Admin',
        team: 'Executive',
        status: 'Active',
        avatar: 'DS',
        created_date: '01-Jan-2025',
      },
      metaInfo: {
        token: 'mock-valid-backend-jwt-token',
      },
    });

    renderWithProviders(<AuthPage onSuccess={handleSuccess} />);

    const userInput = screen.getByPlaceholderText(/deenesh-sabat/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••••/i);
    const submitBtn = screen.getByRole('button', { name: /Sign In & Proceed/i });

    await act(async () => {
      fireEvent.change(userInput, { target: { value: 'deenesh@mymitraa.com' } });
      fireEvent.change(passwordInput, { target: { value: 'SecretPassword123!' } });
      fireEvent.click(submitBtn);
    });

    expect(loginSpy).toHaveBeenCalledWith('deenesh@mymitraa.com', 'SecretPassword123!');
    loginSpy.mockRestore();
  });

  it('registration redirects to sign in without auto-authenticating', async () => {
    const handleSuccess = vi.fn();
    const registerSpy = vi.spyOn(ApiClient.auth, 'register').mockResolvedValueOnce({
      code: 200,
      message: 'REGISTRATION_SUCCESS',
      data: {
        id: 'usr-reg-1',
        name: 'New Registered User',
        email: 'newuser@mymitraa.com',
        role: 'Employee',
        team: 'Engineering',
        status: 'Active',
        avatar: 'NU',
        created_date: '01-Jan-2025',
      },
    });

    renderWithProviders(<AuthPage onSuccess={handleSuccess} />);

    // Switch to Sign Up
    const switchBtn = screen.getByRole('button', { name: /^Sign Up$/i });
    fireEvent.click(switchBtn);

    const nameInput = screen.getByPlaceholderText(/e.g. Deenesh Sabat/i);
    const emailInput = screen.getByPlaceholderText(/deenesh@mymitraa.internal/i);
    const pwdInput = screen.getByPlaceholderText(/At least 6 characters/i);
    const registerBtn = screen.getByRole('button', { name: /Register & Join/i });

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'New Registered User' } });
      fireEvent.change(emailInput, { target: { value: 'newuser@mymitraa.com' } });
      fireEvent.change(pwdInput, { target: { value: 'ValidPass123!' } });
      fireEvent.click(registerBtn);
    });

    expect(registerSpy).toHaveBeenCalled();
    // Must NOT call onSuccess directly (no fabricated authentication)
    expect(handleSuccess).not.toHaveBeenCalled();

    registerSpy.mockRestore();
  });
});
