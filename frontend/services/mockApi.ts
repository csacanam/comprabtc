/**
 * MOCK API
 * =========
 * Simula llamadas a un backend con delays realistas.
 * 
 * IMPORTANTE PARA EL FUTURO:
 * Cuando conectes un backend real, solo necesitas:
 * 1. Cambiar estas funciones para hacer fetch() real
 * 2. Mantener los mismos nombres de función y tipos de retorno
 * 3. La UI no necesita cambios
 */

import type {
  User,
  InvitationCode,
  Session,
  OtpChallenge,
  DcaPlan,
  BankLink,
  Purchase,
  MarketPricePoint,
  DcaFrequency,
  PlanStatus,
  PurchaseStatus,
} from '@/domain/models';

import { getItem, setItem, removeItem, STORAGE_KEYS } from '@/data/storage';
import { INITIAL_INVITATION_CODES } from '@/data/seed';
import { generateId, generateOTP } from '@/domain/utils';
import { generatePriceSeries, generateCurrentMarketPrice, type MarketTrend } from '@/market/marketSim';

// ===== UTILIDAD: DELAY SIMULADO =====

/**
 * Simula latencia de red (300-800ms)
 */
async function simulateDelay(): Promise<void> {
  const delay = 300 + Math.random() * 500;
  await new Promise(resolve => setTimeout(resolve, delay));
}

// ===== INICIALIZACIÓN =====

/**
 * Inicializa los datos si es la primera vez
 */
export async function initializeData(): Promise<void> {
  const isSeeded = getItem<boolean>(STORAGE_KEYS.IS_SEEDED, false);
  
  if (!isSeeded) {
    // Guardar códigos de invitación iniciales
    setItem(STORAGE_KEYS.INVITATION_CODES, INITIAL_INVITATION_CODES);
    
    // Generar precios de mercado iniciales (90 días, tendencia lateral)
    const prices = generatePriceSeries(90, 'sideways');
    setItem(STORAGE_KEYS.MARKET_PRICES, prices);
    
    // Marcar como inicializado
    setItem(STORAGE_KEYS.IS_SEEDED, true);
  }
}

// ===== CÓDIGOS DE INVITACIÓN =====

/**
 * Valida si un código de invitación es válido y está activo
 */
export async function validateInvitationCode(code: string): Promise<{
  isValid: boolean;
  message: string;
}> {
  await simulateDelay();
  
  const codes = getItem<InvitationCode[]>(STORAGE_KEYS.INVITATION_CODES, []);
  const invitation = codes.find(c => c.code.toUpperCase() === code.toUpperCase());
  
  if (!invitation) {
    return {
      isValid: false,
      message: 'Este código no existe.',
    };
  }
  
  if (!invitation.isActive) {
    return {
      isValid: false,
      message: 'Este código ya no está activo.',
    };
  }
  
  if (invitation.usageCount >= invitation.maxUsage) {
    return {
      isValid: false,
      message: 'Este código ha alcanzado su límite de usos.',
    };
  }
  
  return {
    isValid: true,
    message: 'Código válido.',
  };
}

/**
 * Usa un código de invitación (incrementa el contador)
 */
async function useInvitationCode(code: string): Promise<void> {
  const codes = getItem<InvitationCode[]>(STORAGE_KEYS.INVITATION_CODES, []);
  const updatedCodes = codes.map(c => {
    if (c.code.toUpperCase() === code.toUpperCase()) {
      return { ...c, usageCount: c.usageCount + 1 };
    }
    return c;
  });
  setItem(STORAGE_KEYS.INVITATION_CODES, updatedCodes);
}

// ===== USUARIOS =====

/**
 * Crea un nuevo usuario
 */
export async function createUser(email: string, invitationCode: string): Promise<{
  success: boolean;
  user?: User;
  message: string;
}> {
  await simulateDelay();
  
  // Verificar código
  const validation = await validateInvitationCode(invitationCode);
  if (!validation.isValid) {
    return {
      success: false,
      message: validation.message,
    };
  }
  
  // Verificar si el email ya existe
  const users = getItem<User[]>(STORAGE_KEYS.USERS, []);
  const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (existingUser) {
    return {
      success: false,
      message: 'Ya existe una cuenta con este correo.',
    };
  }
  
  // Crear usuario
  const newUser: User = {
    id: generateId(),
    email: email.toLowerCase(),
    invitedByCode: invitationCode.toUpperCase(),
    createdAt: new Date().toISOString(),
  };
  
  // Usar el código de invitación
  await useInvitationCode(invitationCode);
  
  // Guardar usuario
  const updatedUsers = [...users, newUser];
  setItem(STORAGE_KEYS.USERS, updatedUsers);
  
  // Verificar que se guardó correctamente (solo en desarrollo)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const savedUsers = getItem<User[]>(STORAGE_KEYS.USERS, []);
    console.log('[MockAPI] Usuario creado:', newUser.email);
    console.log('[MockAPI] Total usuarios guardados:', savedUsers.length);
  }
  
  return {
    success: true,
    user: newUser,
    message: 'Cuenta creada exitosamente.',
  };
}

/**
 * Busca un usuario por email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  await simulateDelay();
  
  const users = getItem<User[]>(STORAGE_KEYS.USERS, []);
  
  // Debug en desarrollo
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('[MockAPI] Buscando usuario:', email);
    console.log('[MockAPI] Usuarios en storage:', users.length);
    console.log('[MockAPI] Emails en storage:', users.map(u => u.email));
  }
  
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

// ===== AUTENTICACIÓN OTP =====

/**
 * Envía un OTP al email (simulado)
 */
export async function sendOTP(email: string): Promise<{
  success: boolean;
  message: string;
  devOtp?: string; // Solo para desarrollo
}> {
  await simulateDelay();
  
  // Verificar que el usuario existe
  const user = await getUserByEmail(email);
  if (!user) {
    return {
      success: false,
      message: 'No encontramos una cuenta con este correo.',
    };
  }
  
  // Generar OTP
  const otp = generateOTP();
  
  // Guardar challenge (expira en 5 minutos)
  const challenge: OtpChallenge = {
    email: email.toLowerCase(),
    otp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  };
  
  setItem(STORAGE_KEYS.OTP_CHALLENGE, challenge);
  
  return {
    success: true,
    message: 'Te enviamos un código de 6 dígitos a tu correo.',
    devOtp: otp, // En producción, esto NO se enviaría
  };
}

/**
 * Verifica el OTP y crea sesión
 */
export async function verifyOTP(email: string, otp: string): Promise<{
  success: boolean;
  session?: Session;
  message: string;
}> {
  await simulateDelay();
  
  const challenge = getItem<OtpChallenge | null>(STORAGE_KEYS.OTP_CHALLENGE, null);
  
  if (!challenge) {
    return {
      success: false,
      message: 'No hay un código pendiente. Solicita uno nuevo.',
    };
  }
  
  if (challenge.email !== email.toLowerCase()) {
    return {
      success: false,
      message: 'El código no corresponde a este correo.',
    };
  }
  
  if (new Date(challenge.expiresAt) < new Date()) {
    removeItem(STORAGE_KEYS.OTP_CHALLENGE);
    return {
      success: false,
      message: 'El código ha expirado. Solicita uno nuevo.',
    };
  }
  
  if (challenge.otp !== otp) {
    return {
      success: false,
      message: 'El código no es correcto.',
    };
  }
  
  // OTP válido - crear sesión
  const user = await getUserByEmail(email);
  if (!user) {
    return {
      success: false,
      message: 'Usuario no encontrado.',
    };
  }
  
  const session: Session = {
    userId: user.id,
    email: user.email,
    createdAt: new Date().toISOString(),
  };
  
  setItem(STORAGE_KEYS.SESSION, session);
  removeItem(STORAGE_KEYS.OTP_CHALLENGE);
  
  return {
    success: true,
    session,
    message: 'Sesión iniciada correctamente.',
  };
}

/**
 * Obtiene la sesión actual
 */
export async function getSession(): Promise<Session | null> {
  // Sin delay para verificación rápida de sesión
  return getItem<Session | null>(STORAGE_KEYS.SESSION, null);
}

/**
 * Cierra la sesión
 */
export async function logout(): Promise<void> {
  await simulateDelay();
  removeItem(STORAGE_KEYS.SESSION);
}

// ===== PLANES DCA =====

/** Valores para simular estado del plan en desarrollo */
export type MockPlanState = 'no_plan' | 'active' | 'paused' | 'payment_failed';

function applyMockPlanState(plan: DcaPlan | null, _userId: string): DcaPlan | null {
  const mock = getItem<MockPlanState | null>(STORAGE_KEYS.MOCK_PLAN_STATE, null);
  if (!mock) return plan; // Sin mock: datos reales
  if (mock === 'no_plan') return null;
  if (!plan) return null;
  if (mock === 'active') return { ...plan, status: 'active' as PlanStatus, isActive: true };
  if (mock === 'paused') return { ...plan, status: 'paused' as PlanStatus, isActive: false };
  if (mock === 'payment_failed') return { ...plan, status: 'payment_failed' as PlanStatus, isActive: true };
  return plan;
}

/**
 * Obtiene el plan DCA del usuario (respeta mock de estado en desarrollo)
 */
export async function getDcaPlan(userId: string): Promise<DcaPlan | null> {
  await simulateDelay();
  const plans = getItem<DcaPlan[]>(STORAGE_KEYS.DCA_PLANS, []);
  const plan = plans.find(p => p.userId === userId) || null;
  return applyMockPlanState(plan, userId);
}

/** Establece el estado mock del plan (solo desarrollo). null = usar datos reales */
export function setMockPlanState(value: MockPlanState | null): void {
  if (value === null) removeItem(STORAGE_KEYS.MOCK_PLAN_STATE);
  else setItem(STORAGE_KEYS.MOCK_PLAN_STATE, value);
}

/** Lee el estado mock actual (solo desarrollo) */
export function getMockPlanState(): MockPlanState | null {
  return getItem<MockPlanState | null>(STORAGE_KEYS.MOCK_PLAN_STATE, null);
}

// ===== DESTINO BITCOIN =====

/**
 * Obtiene la dirección Bitcoin configurada como destino de las compras
 */
export async function getDestinationAddress(userId: string): Promise<string | null> {
  await simulateDelay();
  const map = getItem<Record<string, string>>(STORAGE_KEYS.BTC_DESTINATION_ADDRESSES, {});
  return map[userId] ?? null;
}

/**
 * Guarda la dirección Bitcoin de destino de las compras
 */
export async function setDestinationAddress(userId: string, address: string): Promise<void> {
  await simulateDelay();
  const map = getItem<Record<string, string>>(STORAGE_KEYS.BTC_DESTINATION_ADDRESSES, {});
  if (address.trim()) {
    map[userId] = address.trim();
  } else {
    delete map[userId];
  }
  setItem(STORAGE_KEYS.BTC_DESTINATION_ADDRESSES, map);
}

/**
 * Crea o actualiza un plan DCA
 */
export async function saveDcaPlan(
  userId: string,
  amountCop: number,
  frequency: DcaFrequency
): Promise<DcaPlan> {
  await simulateDelay();
  
  const plans = getItem<DcaPlan[]>(STORAGE_KEYS.DCA_PLANS, []);
  const existingIndex = plans.findIndex(p => p.userId === userId);
  
  const plan: DcaPlan = {
    id: existingIndex >= 0 ? plans[existingIndex].id : generateId(),
    userId,
    amountCop,
    frequency,
    isActive: false, // Se activa cuando se conecta el banco
    status: 'active',
    createdAt: existingIndex >= 0 
      ? plans[existingIndex].createdAt 
      : new Date().toISOString(),
  };
  
  if (existingIndex >= 0) {
    plans[existingIndex] = plan;
  } else {
    plans.push(plan);
  }
  
  setItem(STORAGE_KEYS.DCA_PLANS, plans);

  // Si estábamos simulando \"Usuario nuevo (sin plan)\",
  // al crear/actualizar un plan volvemos a \"Datos reales\"
  const mock = getItem<MockPlanState | null>(STORAGE_KEYS.MOCK_PLAN_STATE, null);
  if (mock === 'no_plan') {
    removeItem(STORAGE_KEYS.MOCK_PLAN_STATE);
  }

  return plan;
}

/**
 * Activa o pausa el plan DCA
 */
export async function toggleDcaPlan(userId: string, isActive: boolean): Promise<DcaPlan | null> {
  await simulateDelay();
  
  const plans = getItem<DcaPlan[]>(STORAGE_KEYS.DCA_PLANS, []);
  const index = plans.findIndex(p => p.userId === userId);
  
  if (index < 0) return null;
  plans[index].isActive = isActive;
  plans[index].status = isActive ? 'active' : 'paused';
  setItem(STORAGE_KEYS.DCA_PLANS, plans);
  return plans[index];
}

// ===== CONEXIÓN BANCARIA =====

/**
 * Obtiene la conexión bancaria del usuario.
 * - En mock "no_plan": se comporta como usuario nuevo (sin banco conectado).
 * - En mock "payment_failed": devuelve el banco como desconectado para que la UI sea coherente.
 */
export async function getBankLink(userId: string): Promise<BankLink | null> {
  await simulateDelay();
  const links = getItem<BankLink[]>(STORAGE_KEYS.BANK_LINKS, []);
  const link = links.find(l => l.userId === userId) || null;
  const mock = getItem<MockPlanState | null>(STORAGE_KEYS.MOCK_PLAN_STATE, null);

  if (!link) return null;

  if (mock === 'no_plan') {
    // Usuario nuevo: sin banco conectado
    return null;
  }

  if (mock === 'payment_failed') {
    // Problema de pago: mostrar banco desconectado
    return { ...link, status: 'disconnected' };
  }

  return link;
}

/**
 * Conecta un banco (simulado)
 */
export async function connectBank(userId: string, bankName: string): Promise<BankLink> {
  await simulateDelay();
  
  const links = getItem<BankLink[]>(STORAGE_KEYS.BANK_LINKS, []);
  const existingIndex = links.findIndex(l => l.userId === userId);
  
  const link: BankLink = {
    id: existingIndex >= 0 ? links[existingIndex].id : generateId(),
    userId,
    bankName,
    status: 'connected',
    createdAt: new Date().toISOString(),
  };
  
  if (existingIndex >= 0) {
    links[existingIndex] = link;
  } else {
    links.push(link);
  }
  
  setItem(STORAGE_KEYS.BANK_LINKS, links);
  
  // También activar el plan DCA
  await toggleDcaPlan(userId, true);

  // Si estábamos en modo mock de onboarding o fallo de pago,
  // al conectar banco asumimos que el problema se resolvió
  // y volvemos a \"Datos reales\"
  const mock = getItem<MockPlanState | null>(STORAGE_KEYS.MOCK_PLAN_STATE, null);
  if (mock === 'no_plan' || mock === 'payment_failed') {
    removeItem(STORAGE_KEYS.MOCK_PLAN_STATE);
  }
  
  return link;
}

// ===== COMPRAS =====

/**
 * Obtiene las compras del usuario
 */
export async function getPurchases(userId: string): Promise<Purchase[]> {
  await simulateDelay();
  
  const purchases = getItem<Purchase[]>(STORAGE_KEYS.PURCHASES, []);
  return purchases
    .filter(p => p.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Simula una compra
 */
export async function simulatePurchase(userId: string, planId: string, amountCop: number): Promise<Purchase> {
  await simulateDelay();
  
  // Obtener precio actual de mercado
  const prices = getItem<MarketPricePoint[]>(STORAGE_KEYS.MARKET_PRICES, []);
  const currentPrice = prices.length > 0 
    ? generateCurrentMarketPrice(prices[prices.length - 1].priceCopPerBtc)
    : generateCurrentMarketPrice();
  
  // Calcular BTC comprado
  const btcAmount = amountCop / currentPrice;
  
  const purchase: Purchase = {
    id: generateId(),
    userId,
    planId,
    amountCop,
    btcAmount,
    marketPriceCopPerBtc: currentPrice,
    createdAt: new Date().toISOString(),
    status: 'procesando',
  };
  
  const purchases = getItem<Purchase[]>(STORAGE_KEYS.PURCHASES, []);
  purchases.push(purchase);
  setItem(STORAGE_KEYS.PURCHASES, purchases);
  
  return purchase;
}

/**
 * Genera compras históricas para pruebas
 */
export async function generateHistoricalPurchases(
  userId: string,
  planId: string,
  amountCop: number,
  count: number = 10
): Promise<Purchase[]> {
  await simulateDelay();
  
  const prices = getItem<MarketPricePoint[]>(STORAGE_KEYS.MARKET_PRICES, []);
  const newPurchases: Purchase[] = [];
  
  // Distribuir las compras en los últimos 90 días
  const daysInterval = Math.floor(90 / count);
  
  const statuses: PurchaseStatus[] = ['enviado', 'enviado', 'enviado', 'enviado', 'procesando', 'procesando', 'procesando', 'programada', 'programada', 'programada'];
  
  for (let i = 0; i < count; i++) {
    const daysAgo = i * daysInterval;
    const priceIndex = Math.max(0, prices.length - 1 - daysAgo);
    const price = prices[priceIndex]?.priceCopPerBtc || generateCurrentMarketPrice();
    
    const purchaseDate = new Date();
    purchaseDate.setDate(purchaseDate.getDate() - daysAgo);
    
    const purchase: Purchase = {
      id: generateId(),
      userId,
      planId,
      amountCop,
      btcAmount: amountCop / price,
      marketPriceCopPerBtc: price,
      createdAt: purchaseDate.toISOString(),
      status: statuses[i % statuses.length],
    };
    
    newPurchases.push(purchase);
  }
  
  const existingPurchases = getItem<Purchase[]>(STORAGE_KEYS.PURCHASES, []);
  setItem(STORAGE_KEYS.PURCHASES, [...existingPurchases, ...newPurchases]);
  
  return newPurchases;
}

/**
 * Genera 6 compras de ejemplo con los 3 estados (2 Programada, 2 Procesando, 2 Enviado)
 * Para ver cómo se ven en el historial.
 */
export async function generateSamplePurchasesWithStatuses(
  userId: string,
  planId: string,
  amountCop: number
): Promise<Purchase[]> {
  await simulateDelay();
  const prices = getItem<MarketPricePoint[]>(STORAGE_KEYS.MARKET_PRICES, []);
  const currentPrice = prices.length > 0
    ? prices[prices.length - 1].priceCopPerBtc
    : generateCurrentMarketPrice();

  const statuses: PurchaseStatus[] = ['programada', 'programada', 'procesando', 'procesando', 'enviado', 'enviado'];
  const newPurchases: Purchase[] = [];

  for (let i = 0; i < 6; i++) {
    const purchaseDate = new Date();
    purchaseDate.setDate(purchaseDate.getDate() - i * 2); // 0, 2, 4, 6, 8, 10 días atrás
    const price = currentPrice * (1 + (Math.random() - 0.5) * 0.02);
    newPurchases.push({
      id: generateId(),
      userId,
      planId,
      amountCop,
      btcAmount: amountCop / price,
      marketPriceCopPerBtc: price,
      createdAt: purchaseDate.toISOString(),
      status: statuses[i],
    });
  }

  const existingPurchases = getItem<Purchase[]>(STORAGE_KEYS.PURCHASES, []);
  setItem(STORAGE_KEYS.PURCHASES, [...existingPurchases, ...newPurchases]);
  return newPurchases;
}

// ===== PRECIOS DE MERCADO =====

/**
 * Obtiene la serie de precios de mercado
 */
export async function getMarketPrices(): Promise<MarketPricePoint[]> {
  await simulateDelay();
  return getItem<MarketPricePoint[]>(STORAGE_KEYS.MARKET_PRICES, []);
}

/**
 * Obtiene el precio actual
 */
export async function getCurrentMarketPrice(): Promise<number> {
  const prices = await getMarketPrices();
  if (prices.length === 0) {
    return generateCurrentMarketPrice();
  }
  return generateCurrentMarketPrice(prices[prices.length - 1].priceCopPerBtc);
}

/**
 * Regenera los precios con una tendencia específica (solo para dev)
 */
export async function regenerateMarketPrices(trend: MarketTrend): Promise<void> {
  await simulateDelay();
  const prices = generatePriceSeries(90, trend);
  setItem(STORAGE_KEYS.MARKET_PRICES, prices);
}

// ===== DEV HELPERS =====

/**
 * Obtiene el OTP actual (solo para desarrollo)
 */
export function getDevOTP(): string | null {
  const challenge = getItem<OtpChallenge | null>(STORAGE_KEYS.OTP_CHALLENGE, null);
  return challenge?.otp || null;
}
