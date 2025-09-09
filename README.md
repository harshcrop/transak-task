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

## Getting Started (Full Stack)

### 1. Install dependencies (frontend & backend):

```bash
# In the project root
npm install

# In the backend folder
cd backend && npm install
```

### 2. Set up environment variables

- Frontend: see Environment Setup above
- Backend: create a `.env` file in `backend/` with:

```env
MONGODB_URI=mongodb://localhost:27017/transak_kyb
PORT=5001
```

### 3. Start the servers (concurrently):

```bash
# From the project root
npm run dev-all
```

This will start both the Vite frontend and the Express backend with hot reload.

Frontend: [http://localhost:5173](http://localhost:5173)
Backend API: [http://localhost:5001](http://localhost:5001)

## Backend API (KYB)

The backend provides endpoints for Know Your Business (KYB) form management and file uploads.

### Main Endpoints

- `POST   /api/kyb/create` — Create or upsert a KYB form
- `PUT    /api/kyb/update/:userId` — Update a KYB form
- `GET    /api/kyb/user/:userId` — Get KYB form for a user
- `POST   /api/kyb/upload/:userId` — Upload incorporation document (file upload)
- `POST   /api/kyb/submit/:userId` — Submit KYB form for review
- `GET    /api/kyb/all` — List all KYB forms (admin)
- `GET    /api/kyb/stats` — Get KYB statistics

Uploads are saved to `backend/uploads/` and served at `/uploads/`.

#### Example: Uploading a Document

```bash
curl -F "incorporationDocument=@/path/to/file.pdf" http://localhost:5001/api/kyb/upload/USER_ID
```

#### Example: Creating a KYB Form

```bash
curl -X POST http://localhost:5001/api/kyb/create \
  -H "Content-Type: application/json" \
  -d '{ "userId": "123", "partnerUserId": "abc", ... }'
```

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

Frontend:

```bash
npm run build
```

Backend:

```bash
cd backend && npm start
```

## Technical Stack

- **React 19** — UI Framework
- **Vite** — Build tool and dev server
- **Tailwind CSS** — Styling
- **Lucide React** — Icons
- **Express** — Backend server (KYB API)
- **MongoDB & Mongoose** — Database for KYB forms
- **Multer** — File uploads

## Project Structure

```
transak-task/
├── backend/
│   ├── server.js         # Express server
│   ├── models/KYB.js     # Mongoose KYB schema
│   ├── routes/kyb.js     # KYB API routes
│   ├── uploads/          # Uploaded documents
│   └── package.json      # Backend dependencies
├── public/
├── src/
│   ├── api/              # Frontend API integration
│   ├── components/       # React components
│   ├── context/          # React context
│   ├── App.jsx           # Main app
│   ├── main.jsx          # Entry point
│   └── index.css         # Styles
├── package.json          # Frontend dependencies/scripts
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

This project provides a full-stack template for integrating Transak's widget and a robust KYB backend with file uploads and MongoDB. For advanced linting, see the [Vite React TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts).
