# Transak Widget Integration

A React application with Transak widget integration for cryptocurrency purchases.

## Features

- 🔄 Real-time exchange rates
- 💳 Multiple payment methods
- 🌍 Multi-currency support
- 📱 Responsive design
- ⚡ Fast loading with API integration
- 🎯 Dynamic fee calculation

## API Integration

This project includes a complete API integration with Transak services:

### API Structure

```
src/api/
├── config.js          # API configuration and endpoints
├── utils.js           # HTTP request utilities
├── transakService.js  # Transak API service functions
├── hooks.js           # React hooks for API state management
└── index.js           # Main exports
```

### API Features

- **Exchange Rates**: Real-time cryptocurrency exchange rates
- **Payment Methods**: Dynamic payment method loading based on location
- **Fee Calculation**: Automatic fee calculation with breakdown
- **Order Creation**: Complete order management
- **Error Handling**: Robust error handling with fallbacks
- **Loading States**: Proper loading indicators throughout

### Environment Setup

1. Copy the environment template:

```bash
cp .env.example .env
```

2. Get your Transak API key from [Transak Business Portal](https://transak.com/business)

3. Update your `.env` file:

```env
VITE_TRANSAK_API_KEY=your-actual-api-key
VITE_ENVIRONMENT=STAGING  # or PRODUCTION
```

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables (see Environment Setup above)

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173) to view the application

## API Usage Examples

### Using Hooks in Components

```jsx
import { useExchangeRate, usePaymentMethods } from "./api/hooks";

function MyComponent() {
  const { exchangeData, loading } = useExchangeRate("EUR", "ETH", 250);
  const { paymentMethods } = usePaymentMethods("DE", "EUR");

  // Component logic here
}
```

### Direct API Calls

```javascript
import { transakService } from "./api";

// Get exchange rate
const rate = await transakService.getExchangeRate(
  "EUR",
  "ETH",
  "ethereum",
  250
);

// Create order
const order = await transakService.createOrder({
  fiatCurrency: "EUR",
  cryptoCurrency: "ETH",
  fiatAmount: 250,
  paymentMethod: "sepa",
});
```

## Build for Production

```bash
npm run build
```

## Technical Stack

- **React 19** - UI Framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Custom API Layer** - Transak integration

## Project Structure

```
src/
├── api/                # API integration layer
├── assets/            # Static assets
├── App.jsx           # Main application component
├── TransakWidget.jsx # Main widget component
├── main.jsx          # Application entry point
└── index.css         # Global styles
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Requestte

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
