/**
 * Application root.
 *
 * SHARED FILE — changes here need team coordination (see CONTRIBUTING.md).
 * Keep it thin: providers and routing only. Layout belongs in pages/.
 */

import { AppProvider } from './context/AppContext';
import { HomePage } from './pages/HomePage';

export default function App() {
  return (
    <AppProvider>
      <HomePage />
    </AppProvider>
  );
}
