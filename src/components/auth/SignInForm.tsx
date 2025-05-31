import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from '../../icons';
import Label from '../form/Label';
import Input from '../form/input/InputField';
import Checkbox from '../form/input/Checkbox';
import Button from '../ui/button/Button';
import { useAuth } from '../../layout/AuthContext';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface CitoyenDto {
  id: number;
  nom: string;
  email: string;
  motDePasse?: string;
  carteIdentite: number;
  numTelephone: number;
  adress: string;
  con?: unknown;
  etatSauvgarder: string;
  references: number[];
  etatCompte: 'ACTIF' | 'BLOQUER';
}

interface StatusResponse {
  etatCompte: 'ACTIF' | 'BLOQUER';
}

interface User {
  role: 'citoyen' | 'direction' | 'client' | 'intervention';
  email?: string;
  name?: string;
}

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isChecked, setIsChecked] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [blockedPopup, setBlockedPopup] = useState<boolean>(false);
  const [welcomePopup, setWelcomePopup] = useState<boolean>(false);
  const navigate = useNavigate();
  const { login, user, isLoading, error, logout } = useAuth();

  // Parse JWT
  const parseJwt = (token: string | null): { email?: string; sub?: string } | null => {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Erreur lors du décodage du token:', e);
      toast.error('Problème avec le token.', {
        position: 'top-right',
        autoClose: 3000,
      });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      // Pre-login: Check account status using public endpoint
      const statusResponse = await fetch(`http://localhost:8080/api/citoyens/email/${encodeURIComponent(email)}/status`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (statusResponse.ok) {
        const { etatCompte }: StatusResponse = await statusResponse.json();
        if (etatCompte === 'BLOQUER') {
          setBlockedPopup(true);
          setEmail('');
          setPassword('');
          return;
        }
      } else {
        console.warn('Unable to check account status:', statusResponse.statusText);
      }

      // Attempt login
      await login(email, password);

      // Post-login: Check citoyen status
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Aucun token trouvé après connexion.');
      }

      const decoded = parseJwt(token);
      if (!decoded) {
        throw new Error('Token JWT invalide ou mal formé');
      }

      const userEmail = decoded.email || decoded.sub;
      if (!userEmail) {
        throw new Error('Aucun email ou sujet trouvé dans le JWT');
      }

      if (user?.role === 'client') {
        const citoyenResponse = await fetch(`http://localhost:8080/api/citoyens/email/${encodeURIComponent(userEmail)}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!citoyenResponse.ok) {
          throw new Error(`Échec de la récupération des données utilisateur: ${citoyenResponse.statusText}`);
        }

        const citoyenData: CitoyenDto = await citoyenResponse.json();
        if (citoyenData.etatCompte === 'BLOQUER') {
          setBlockedPopup(true);
          logout();
          setEmail('');
          setPassword('');
          return;
        }
      }

      // Show welcome toast
      toast.success(
        user?.name
          ? `Bienvenue, ${user.name} !`
          : 'Connexion réussie !',
        {
          position: 'top-right',
          autoClose: 2000, // Close toast after 2 seconds
        }
      );

      // Show welcome popup
      setWelcomePopup(true);
      setTimeout(() => {
        setWelcomePopup(false);
      }, 3000); // Close popup after 3 seconds
    } catch (err: unknown) {
      console.error('Erreur lors de la connexion:', err);
      toast.error(`Erreur: ${(err as Error).message}`, {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  useEffect(() => {
    if (user && !blockedPopup && !welcomePopup) {
      switch (user.role) {
        case 'direction':
          navigate('/cotéDirection');
          break;
        case 'client':
          navigate('/cotéClient');
          break;
        case 'intervention':
          navigate('/cotéBureauIntervention');
          break;
        default:
          navigate('/');
      }
    }
  }, [user, navigate, blockedPopup, welcomePopup]);

  return (
    <div className="flex flex-col flex-1">
      <ToastContainer />
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/signup"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Allez vers Register
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Se connecter
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Entrez votre email et mot de passe pour vous connecter !
            </p>
          </div>
          <div>
            <div className="relative py-3 sm:py-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-800"></div>
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    placeholder="info@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label>
                    Mot de passe <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Entrez votre mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                {error && <div className="text-sm text-error-500">{error}</div>}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      Rester connecté
                    </span>
                  </div>
                  <Link
                    to="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div>
                  <Button className="w-full" size="sm" type="submit" disabled={isLoading}>
                    {isLoading ? 'Connexion...' : 'Se connecter'}
                  </Button>
                </div>
              </div>
            </form>
            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Pas de compte ?{' '}
                <Link
                  to="/signup"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  S'inscrire
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Blocked Account Popup */}
      {blockedPopup && (
        <div
          className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 backdrop-blur-sm p-4"
          role="dialog"
          aria-labelledby="blocked-title"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform transition-all duration-300 scale-100 hover:scale-105">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-500 rounded-full">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 id="blocked-title" className="text-2xl font-bold text-gray-800">
                  Compte Bloqué
                </h2>
                <p className="text-gray-600 mt-1">
                  Votre compte a été bloqué par la direction de la STEG. Veuillez vous rendre à la STEG pour régulariser
                  votre situation.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 hover:scale-105 transition-all duration-200 shadow-lg"
                onClick={() => {
                  setBlockedPopup(false);
                  setEmail('');
                  setPassword('');
                }}
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Popup */}
      {welcomePopup && (
        <div
          className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 backdrop-blur-sm p-4"
          role="dialog"
          aria-labelledby="welcome-title"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl transform transition-all duration-300 scale-100 hover:scale-105">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-green-500 rounded-full">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 id="welcome-title" className="text-2xl font-bold text-gray-800">
                  Bienvenue !
                </h2>
                <p className="text-gray-600 mt-1">
                  {user?.name
                    ? `Bienvenue, ${user.name} ! Vous serez redirigé vers votre tableau de bord...`
                    : 'Connexion réussie ! Vous serez redirigé vers votre tableau de bord...'}
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 hover:scale-105 transition-all duration-200 shadow-lg"
                onClick={() => setWelcomePopup(false)}
              >
                Continuer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}