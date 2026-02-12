/**
 * STORE DE AUTENTICACIÓN
 * =======================
 * Maneja el estado de sesión del usuario usando Zustand.
 * Persiste automáticamente en localStorage.
 */

import { create } from 'zustand';
import type { Session, User } from '@/domain/models';
import * as api from '@/services/mockApi';

// ===== TIPOS =====

interface AuthState {
  // Estado
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  
  // OTP flow
  otpEmail: string | null;
  otpSent: boolean;
  devOtp: string | null; // Solo para desarrollo
  
  // Acciones
  initialize: () => Promise<void>;
  sendOtp: (email: string) => Promise<{ success: boolean; message: string }>;
  verifyOtp: (otp: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  clearOtpFlow: () => void;
}

// ===== STORE =====

export const useAuthStore = create<AuthState>((set, get) => ({
  // Estado inicial
  session: null,
  isLoading: false,
  isInitialized: false,
  otpEmail: null,
  otpSent: false,
  devOtp: null,

  /**
   * Inicializa la app: carga datos iniciales y verifica sesión existente
   */
  initialize: async () => {
    set({ isLoading: true });
    
    try {
      // Inicializar datos mock si es primera vez
      await api.initializeData();
      
      // Verificar si hay sesión guardada
      const session = await api.getSession();
      
      set({
        session,
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      console.error('[AuthStore] Error inicializando:', error);
      set({
        session: null,
        isLoading: false,
        isInitialized: true,
      });
    }
  },

  /**
   * Envía un código OTP al email
   */
  sendOtp: async (email: string) => {
    set({ isLoading: true });
    
    try {
      const result = await api.sendOTP(email);
      
      if (result.success) {
        set({
          otpEmail: email,
          otpSent: true,
          devOtp: result.devOtp || null,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
      
      return { success: result.success, message: result.message };
    } catch (error) {
      console.error('[AuthStore] Error enviando OTP:', error);
      set({ isLoading: false });
      return { success: false, message: 'Error al enviar el código.' };
    }
  },

  /**
   * Verifica el código OTP
   */
  verifyOtp: async (otp: string) => {
    const { otpEmail } = get();
    
    if (!otpEmail) {
      return { success: false, message: 'No hay un email pendiente.' };
    }
    
    set({ isLoading: true });
    
    try {
      const result = await api.verifyOTP(otpEmail, otp);
      
      if (result.success && result.session) {
        set({
          session: result.session,
          otpEmail: null,
          otpSent: false,
          devOtp: null,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
      
      return { success: result.success, message: result.message };
    } catch (error) {
      console.error('[AuthStore] Error verificando OTP:', error);
      set({ isLoading: false });
      return { success: false, message: 'Error al verificar el código.' };
    }
  },

  /**
   * Cierra la sesión
   */
  logout: async () => {
    set({ isLoading: true });
    
    try {
      await api.logout();
      set({
        session: null,
        isLoading: false,
      });
    } catch (error) {
      console.error('[AuthStore] Error cerrando sesión:', error);
      set({ isLoading: false });
    }
  },

  /**
   * Limpia el flujo de OTP (para volver atrás)
   */
  clearOtpFlow: () => {
    set({
      otpEmail: null,
      otpSent: false,
      devOtp: null,
    });
  },
}));
