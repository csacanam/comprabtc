/**
 * DATOS INICIALES (SEED)
 * =======================
 * Estos son los datos que se cargan cuando la app se inicia por primera vez.
 * Incluye códigos de invitación activos para probar la app.
 */

import type { InvitationCode } from '@/domain/models';

// Códigos de invitación iniciales
// Estos permiten a los usuarios registrarse en la app
export const INITIAL_INVITATION_CODES: InvitationCode[] = [
  {
    code: 'SAKA001',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    usageCount: 0,
    maxUsage: 100,
  },
  {
    code: 'BUILD3RS',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    usageCount: 0,
    maxUsage: 50,
  },
  {
    code: 'ONEPAYPILOT',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    usageCount: 0,
    maxUsage: 25,
  },
];

// URL del formulario de lista de espera
// Reemplaza esto con tu URL real cuando la tengas
export const WAITLIST_URL = 'https://TU-FORMULARIO-WAITLIST.com';

// Configuración de montos mínimos
export const MIN_DCA_AMOUNT_COP = 100000; // $100,000 COP mínimo

// Lista de bancos disponibles (simulados)
export const AVAILABLE_BANKS = [
  { id: 'bancolombia', name: 'Bancolombia', logo: '🏦' },
  { id: 'davivienda', name: 'Davivienda', logo: '🏛️' },
  { id: 'bbva', name: 'BBVA', logo: '💳' },
  { id: 'banco-bogota', name: 'Banco de Bogotá', logo: '🏢' },
  { id: 'nequi', name: 'Nequi', logo: '💜' },
  { id: 'daviplata', name: 'Daviplata', logo: '🔴' },
];
