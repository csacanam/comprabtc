/**
 * STORE DE DCA (Dollar Cost Averaging)
 * =====================================
 * Maneja el plan de compras automáticas, conexión bancaria y compras.
 */

import { create } from 'zustand';
import type { DcaPlan, BankLink, Purchase, DcaFrequency, MarketPricePoint } from '@/domain/models';
import * as api from '@/services/mockApi';
import type { MarketTrend } from '@/market/marketSim';

// ===== TIPOS =====

interface DcaState {
  // Estado
  plan: DcaPlan | null;
  bankLink: BankLink | null;
  purchases: Purchase[];
  marketPrices: MarketPricePoint[];
  currentPrice: number;
  destinationAddress: string | null;
  isLoading: boolean;
  
  // Acciones
  loadUserData: (userId: string) => Promise<void>;
  setDestinationAddress: (userId: string, address: string) => Promise<void>;
  savePlan: (userId: string, amountCop: number, frequency: DcaFrequency) => Promise<DcaPlan>;
  togglePlan: (userId: string, isActive: boolean) => Promise<void>;
  connectBank: (userId: string, bankName: string) => Promise<void>;
  simulatePurchase: (userId: string) => Promise<Purchase | null>;
  generateHistoricalPurchases: (userId: string, count: number) => Promise<void>;
  generateSamplePurchasesWithStatuses: (userId: string) => Promise<void>;
  regenerateMarketPrices: (trend: MarketTrend) => Promise<void>;
  refreshCurrentPrice: () => Promise<void>;
}

// ===== STORE =====

export const useDcaStore = create<DcaState>((set, get) => ({
  // Estado inicial
  plan: null,
  bankLink: null,
  purchases: [],
  marketPrices: [],
  currentPrice: 0,
  destinationAddress: null,
  isLoading: false,

  /**
   * Carga todos los datos del usuario
   */
  loadUserData: async (userId: string) => {
    set({ isLoading: true });
    
    try {
      // Cargar todo en paralelo
      const [plan, bankLink, purchases, marketPrices, currentPrice, destinationAddress] = await Promise.all([
        api.getDcaPlan(userId),
        api.getBankLink(userId),
        api.getPurchases(userId),
        api.getMarketPrices(),
        api.getCurrentMarketPrice(),
        api.getDestinationAddress(userId),
      ]);
      
      set({
        plan,
        bankLink,
        purchases,
        marketPrices,
        currentPrice,
        destinationAddress,
        isLoading: false,
      });
    } catch (error) {
      console.error('[DcaStore] Error cargando datos:', error);
      set({ isLoading: false });
    }
  },

  /**
   * Guarda un nuevo plan o actualiza el existente
   */
  savePlan: async (userId: string, amountCop: number, frequency: DcaFrequency) => {
    set({ isLoading: true });
    
    try {
      const plan = await api.saveDcaPlan(userId, amountCop, frequency);
      set({ plan, isLoading: false });
      return plan;
    } catch (error) {
      console.error('[DcaStore] Error guardando plan:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * Activa o pausa el plan
   */
  togglePlan: async (userId: string, isActive: boolean) => {
    set({ isLoading: true });
    
    try {
      const plan = await api.toggleDcaPlan(userId, isActive);
      if (plan) {
        set({ plan, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('[DcaStore] Error cambiando estado del plan:', error);
      set({ isLoading: false });
    }
  },

  /**
   * Guarda la dirección Bitcoin de destino de las compras
   */
  setDestinationAddress: async (userId: string, address: string) => {
    set({ isLoading: true });
    try {
      await api.setDestinationAddress(userId, address.trim());
      set({ destinationAddress: address.trim() || null, isLoading: false });
    } catch (error) {
      console.error('[DcaStore] Error guardando dirección destino:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  /**
   * Conecta un banco
   */
  connectBank: async (userId: string, bankName: string) => {
    set({ isLoading: true });
    
    try {
      const bankLink = await api.connectBank(userId, bankName);
      
      // También actualizar el plan (se activa automáticamente)
      const plan = await api.getDcaPlan(userId);
      
      set({ bankLink, plan, isLoading: false });
    } catch (error) {
      console.error('[DcaStore] Error conectando banco:', error);
      set({ isLoading: false });
    }
  },

  /**
   * Simula una compra
   */
  simulatePurchase: async (userId: string) => {
    const { plan } = get();
    
    if (!plan) {
      console.error('[DcaStore] No hay plan activo');
      return null;
    }
    
    set({ isLoading: true });
    
    try {
      const purchase = await api.simulatePurchase(userId, plan.id, plan.amountCop);
      const purchases = await api.getPurchases(userId);
      const currentPrice = await api.getCurrentMarketPrice();
      
      set({ purchases, currentPrice, isLoading: false });
      return purchase;
    } catch (error) {
      console.error('[DcaStore] Error simulando compra:', error);
      set({ isLoading: false });
      return null;
    }
  },

  /**
   * Genera compras históricas para pruebas
   */
  generateHistoricalPurchases: async (userId: string, count: number) => {
    const { plan } = get();
    
    if (!plan) {
      console.error('[DcaStore] No hay plan para generar historial');
      return;
    }
    
    set({ isLoading: true });
    
    try {
      await api.generateHistoricalPurchases(userId, plan.id, plan.amountCop, count);
      const purchases = await api.getPurchases(userId);
      
      set({ purchases, isLoading: false });
    } catch (error) {
      console.error('[DcaStore] Error generando historial:', error);
      set({ isLoading: false });
    }
  },

  /**
   * Genera 6 compras de ejemplo con los 3 estados (Programada, Procesando, Enviado)
   */
  generateSamplePurchasesWithStatuses: async (userId: string) => {
    const { plan } = get();
    if (!plan) {
      console.error('[DcaStore] No hay plan para generar ejemplo');
      return;
    }
    set({ isLoading: true });
    try {
      await api.generateSamplePurchasesWithStatuses(userId, plan.id, plan.amountCop);
      const purchases = await api.getPurchases(userId);
      set({ purchases, isLoading: false });
    } catch (error) {
      console.error('[DcaStore] Error generando ejemplo:', error);
      set({ isLoading: false });
    }
  },

  /**
   * Regenera los precios de mercado con una tendencia específica
   */
  regenerateMarketPrices: async (trend: MarketTrend) => {
    set({ isLoading: true });
    
    try {
      await api.regenerateMarketPrices(trend);
      const marketPrices = await api.getMarketPrices();
      const currentPrice = await api.getCurrentMarketPrice();
      
      set({ marketPrices, currentPrice, isLoading: false });
    } catch (error) {
      console.error('[DcaStore] Error regenerando precios:', error);
      set({ isLoading: false });
    }
  },

  /**
   * Actualiza el precio actual del mercado
   */
  refreshCurrentPrice: async () => {
    try {
      const currentPrice = await api.getCurrentMarketPrice();
      set({ currentPrice });
    } catch (error) {
      console.error('[DcaStore] Error actualizando precio:', error);
    }
  },
}));
