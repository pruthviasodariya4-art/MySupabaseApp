import { AuthProvider } from './src/contexts/AuthContext';
import Route from './src/navigation/Route';

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
    <AuthProvider>
      <Route />
    </AuthProvider>
  );
}

export default App;
