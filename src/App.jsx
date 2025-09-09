import { TransakWidget } from "./TransakWidget";
import { TransakProvider } from "./context/TransakContext.jsx";

function App() {
  return (
    <>
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <TransakProvider>
            <TransakWidget />
          </TransakProvider>
        </div>
      </div>
    </>
  );
}

export default App;
