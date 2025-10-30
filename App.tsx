import { Provider } from 'react-redux';
import { AuthProvider } from './src/contexts/AuthContext';
import Route from './src/navigation/Route';
import { store } from './src/app/store';

// Initialize Google Sign-In
// GoogleSignin.configure({
//   webClientId:
//     '282622432243-8a4moppj2fecg1m8occmgje6g351e98e.apps.googleusercontent.com',
//   scopes: ['profile', 'email'],
//   offlineAccess: true,
//   forceCodeForRefreshToken: true,
// });

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <Route />
      </AuthProvider>
    </Provider>
  );
}

export default App;
