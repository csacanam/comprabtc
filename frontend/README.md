# CompraBTC - Bitcoin Savings App

A mobile-first Progressive Web App (PWA) for accumulating Bitcoin using the DCA (Dollar Cost Averaging) strategy. Built with **Neo-Brutalism** style and designed for users new to crypto.

## Features

- **Simulated OTP authentication** (passwordless)
- **Invitation system** with limited-use codes
- **Customizable DCA plan** (amount and frequency)
- **Simulated bank connection** (authorization flow)
- **Anti-panic portfolio** (metrics that reduce anxiety)
- **Destination wallet** for receiving purchased Bitcoin
- **PWA installable** on mobile devices
- **100% frontend** — everything mocked in localStorage

---

## Installation & Running

### Prerequisites
- Node.js 18+
- npm or pnpm

### Steps

```bash
# 1. Clone the repository
git clone <your-repo>
cd comprabtc/frontend

# 2. Install dependencies
npm install
# or with pnpm
pnpm install

# 3. Run in development mode
npm run dev
# or
pnpm dev

# 4. Open in browser
# http://localhost:3000
```

### Production build

```bash
npm run build
npm start
```

---

## Project Structure

```
/
├── app/                      # Pages (Next.js App Router)
│   ├── page.tsx              # Landing page
│   ├── login/                # Login page with OTP
│   ├── signup/               # Signup with invitation code
│   └── app/                  # Protected dashboard
│       ├── page.tsx          # Dashboard home
│       ├── plan/             # Configure DCA plan
│       ├── bank-connect/     # Connect bank (simulated)
│       ├── portfolio/       # View portfolio
│       ├── wallet/           # Wallet view (anti-panic)
│       └── settings/         # Settings and dev tools
│
├── components/
│   └── neo-brutal/           # Neo-brutalist UI components
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       ├── Badge.tsx
│       ├── Select.tsx
│       └── Tooltip.tsx
│
├── data/                     # Mock data layer
│   ├── seed.ts               # Initial data (invitation codes)
│   └── storage.ts            # localStorage wrapper
│
├── domain/                   # Domain logic
│   ├── models.ts             # TypeScript types (User, DcaPlan, etc.)
│   ├── utils.ts              # Calculation and formatting helpers
│   └── withdraw.ts           # Bitcoin address validation
│
├── market/                   # Market simulation
│   └── marketSim.ts          # Simulated price generator
│
├── services/                 # Mock API
│   └── mockApi.ts            # Async functions simulating endpoints
│
├── stores/                   # Global state (Zustand)
│   ├── authStore.ts          # Authentication and session
│   └── dcaStore.ts           # DCA plan, purchases, portfolio
│
└── public/                   # Static assets
    ├── manifest.json         # PWA manifest
    ├── sw.js                 # Service worker
    └── icon-*.png            # App icons
```

---

## Mock Storage

### localStorage persistence

Data is stored in `localStorage` with the `saka_dca_` prefix:

| Key | Content |
|-----|---------|
| `saka_dca_users` | Registered users |
| `saka_dca_invitation_codes` | Invitation codes and status |
| `saka_dca_otp_challenge` | Pending OTP verification |
| `saka_dca_session` | Active session |
| `saka_dca_dca_plans` | DCA plans |
| `saka_dca_bank_links` | Bank connections |
| `saka_dca_purchases` | Purchase history |
| `saka_dca_market_prices` | Simulated price points |
| `saka_dca_btc_destination_addresses` | Destination wallet addresses (per user) |

### Initialization

On first load, `data/storage.ts` checks for existing data. If empty, it seeds initial data from `data/seed.ts`.

### Valid invitation codes

To test signup:
- `SAKA001` (max 100 uses)
- `BUILD3RS` (max 50 uses)
- `ONEPAYPILOT` (max 25 uses)

---

## User Flow

1. **Landing** → Choose "Create account" or "Sign in"
2. **Signup** → Enter email + invitation code
3. **Login** → Enter email → Receive OTP (simulated) → Verify
4. **Dashboard** → View plan summary
5. **Plan** → Configure amount (min $100,000 COP) and frequency
6. **Bank Connect** → Simulate bank connection
7. **Portfolio** → View accumulated BTC and anti-panic metrics
8. **Settings** → Set destination wallet, dev tools

### Development Panel (Settings)

In **Settings** you'll find:
- **Simulate purchases** — +1 purchase, +10 historical, or 6 sample purchases (2 per status)
- **Simulate plan state** — Switch between: real data, no plan, paused, payment failed
- **Market trend** — Toggle between bullish, bearish, or sideways

---

## Replacing Mock with Real Backend

### Step 1: Modify `services/mockApi.ts`

Each function in `mockApi.ts` simulates an endpoint. To connect to a real backend:

```typescript
// BEFORE (mock)
export async function login(email: string): Promise<ApiResponse<void>> {
  await delay(500);
  // ... mock logic
}

// AFTER (real)
export async function login(email: string): Promise<ApiResponse<void>> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return response.json();
}
```

### Step 2: Keep the `ApiResponse<T>` interface

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

### Step 3: Remove localStorage dependency

Once you have a backend, you can remove:
- `data/seed.ts`
- `data/storage.ts`
- `market/marketSim.ts`

---

## Neo-Brutalism Design

### Principles
- **Thick borders** (3–4px)
- **Hard shadows** (offset, no blur)
- **Flat colors** (no gradients)
- **Clear typography** (Space Grotesk + Inter)
- **Large touch targets** (mobile-friendly)

### Color palette
- **Primary**: `#F7931A` (Bitcoin orange)
- **Background**: `#FFFEF5` (Cream)
- **Text**: `#1A1A1A` (Soft black)
- **Accent**: `#3B82F6` (Blue)
- **Success**: `#22C55E` (Green)

---

## License

MIT — Do whatever you want with it.

---

## Support

If you have questions, open an issue or contact the CompraBTC team.
