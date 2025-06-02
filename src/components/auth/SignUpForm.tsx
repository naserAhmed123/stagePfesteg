import { useState, ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import { X } from "lucide-react";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Alert from "../ui/alert/Alert";

type AlertType = {
  variant: "success" | "error";
  title: string;
  message: string;
} | null;

// Textes des conditions et politique
const TERMS_OF_USE = `
Bienvenue sur la plateforme STEG. En utilisant nos services, vous acceptez les présentes Conditions générales d'utilisation. Ces conditions régissent votre accès et votre utilisation de notre plateforme, y compris l'inscription, la soumission de réclamations et la gestion de votre compte. Nous nous réservons le droit de modifier ces conditions à tout moment, et les modifications seront effectives dès leur publication. Veuillez vérifier régulièrement cette page pour rester informé des mises à jour. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre plateforme. Pour toute question, contactez-nous à support@steg.tn.
`;

const PRIVACY_POLICY = `
Chez STEG, nous prenons votre vie privée au sérieux. Cette Politique de confidentialité explique comment nous collectons, utilisons et protégeons vos données personnelles, telles que votre nom, email, numéro de téléphone et carte d'identité, lorsque vous utilisez notre plateforme. Vos données sont utilisées uniquement pour fournir et améliorer nos services, traiter vos réclamations et assurer la sécurité de votre compte. Nous ne partageons pas vos informations avec des tiers sans votre consentement, sauf si la loi l'exige. Vous pouvez à tout moment demander l'accès, la modification ou la suppression de vos données en nous contactant à privacy@steg.tn.
`;

// Composant Popup intégré
interface PopupProps {
  title: string;
  content: string;
  onClose: () => void;
}

function Popup({ title, content, onClose }: PopupProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300">
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[80vh] overflow-y-auto animate-fade-in">
        {/* Bouton de fermeture */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          aria-label="Fermer le popup"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Titre */}
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">
          {title}
        </h2>

        {/* Contenu */}
        <div className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
          {content.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-4">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Bouton OK */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            OK
          </button>
        </div>
      </div>

      {/* Style pour l'animation */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(true);
  const [alert, setAlert] = useState<AlertType>(null);
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    password: "",
    carteIdentite: "",
    numTelephone: "",
    adress: "",
    references: [0],
  });
  // État pour gérer le popup
  const [popupContent, setPopupContent] = useState<{ title: string; content: string } | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleReferenceChange = (index: number, value: string) => {
    const newReferences = [...formData.references];
    newReferences[index] = parseInt(value) || 0;
    setFormData({ ...formData, references: newReferences });
  };

  const addReference = () => {
    setFormData({ ...formData, references: [...formData.references, 0] });
  };

  const removeReference = (index: number) => {
    if (formData.references.length > 1) {
      const newReferences = formData.references.filter((_, i) => i !== index);
      setFormData({ ...formData, references: newReferences });
    }
  };

  const ValiderForm = () => {
    if (!formData.fname.trim()) {
      setAlert({ variant: "error", title: "Erreur", message: "Le nom est requis" });
      return false;
    }

    if (!formData.lname.trim()) {
      setAlert({ variant: "error", title: "Erreur", message: "Le prénom est requis" });
      return false;
    }

    if (!formData.email.trim()) {
      setAlert({ variant: "error", title: "Erreur", message: "L'email est requis" });
      return false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setAlert({ variant: "error", title: "Erreur", message: "Email invalide" });
      return false;
    }

    if (!formData.password) {
      setAlert({ variant: "error", title: "Erreur", message: "Le mot de passe est requis" });
      return false;
    } else if (formData.password.length < 8) {
      setAlert({
        variant: "error",
        title: "Erreur",
        message: "Le mot de passe doit contenir au moins 8 caractères",
      });
      return false;
    }

    if (!formData.carteIdentite || isNaN(parseInt(formData.carteIdentite))) {
      setAlert({ variant: "error", title: "Erreur", message: "Carte d'identité invalide" });
      return false;
    } else if (formData.carteIdentite.length !== 8) {
      setAlert({
        variant: "error",
        title: "Erreur",
        message: "La carte d'identité doit être composée de 8 chiffres",
      });
      return false;
    } else {
      const firstChar = formData.carteIdentite.charAt(0);
      if (firstChar !== "1" && firstChar !== "0") {
        setAlert({
          variant: "error",
          title: "Erreur",
          message: "La carte d'identité doit être tunisienne",
        });
        return false;
      }
    }

    if (!formData.numTelephone || isNaN(parseInt(formData.numTelephone))) {
      setAlert({ variant: "error", title: "Erreur", message: "Numéro de téléphone invalide" });
      return false;
    } else {
      const firstDigit = formData.numTelephone.charAt(0);
      const validPrefixes = ["2", "5", "9", "7", "3"];
      if (!validPrefixes.includes(firstDigit)) {
        setAlert({ variant: "error", title: "Erreur", message: "Le numéro doit être tunisien" });
        return false;
      }
    }

    if (!formData.adress.trim()) {
      setAlert({ variant: "error", title: "Erreur", message: "L'adresse est requise" });
      return false;
    }

    if (!formData.references || !formData.references.some((ref) => ref > 0)) {
      setAlert({
        variant: "error",
        title: "Erreur",
        message: "Au moins une référence valide est requise",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isChecked) {
      setAlert({
        variant: "error",
        title: "Erreur",
        message: "Vous devez accepter les conditions pour vous inscrire.",
      });
      return;
    }

    if (!ValiderForm()) return;

    const citoyenData = {
      nom: `${formData.fname} ${formData.lname}`.trim(),
      email: formData.email,
      motDePasse: formData.password,
      carteIdentite: parseInt(formData.carteIdentite, 10),
      numTelephone: parseInt(formData.numTelephone, 10),
      adress: formData.adress,
      con: "ACTIF",
      etatSauvgarder: "NON_ARCHIVER",
      references: formData.references.filter((ref) => ref > 0),
      etatCompte : "NON_BLOQUER",
    };

    try {
      const response = await fetch("http://localhost:8080/api/citoyens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(citoyenData),
      });

      if (response.ok) {
        setAlert({ variant: "success", title: "Succès", message: "Inscription réussie !" });
        setFormData({
          fname: "",
          lname: "",
          email: "",
          password: "",
          carteIdentite: "",
          numTelephone: "",
          adress: "",
          references: [0],
        });
      } else {
        const errorText = await response.text();
        setAlert({
          variant: "error",
          title: "Erreur",
          message: errorText || "Erreur lors de l'inscription. Veuillez vérifier vos informations.",
        });
      }
    } catch (error) {
      console.error("Erreur:", error);
      setAlert({
        variant: "error",
        title: "Erreur",
        message: "Erreur de connexion au serveur. Veuillez réessayer plus tard.",
      });
    }
  };

  // Fonction pour ouvrir le popup
  const openPopup = (type: "terms" | "privacy") => {
    setPopupContent(
      type === "terms"
        ? { title: "Conditions générales d'utilisation", content: TERMS_OF_USE }
        : { title: "Politique de confidentialité", content: PRIVACY_POLICY }
    );
  };

  // Fonction pour fermer le popup
  const closePopup = () => {
    setPopupContent(null);
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      <div className="w-full max-w-md mx-auto mb-5 sm:pt-10">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Retourner vers la connexion
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Inscription
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Entrez votre email et mot de passe pour vous inscrire !
            </p>
          </div>
          <div className="mb-6">
            {alert && (
              <Alert
                variant={alert.variant}
                title={alert.title}
                message={alert.message}
              />
            )}
          </div>
          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <Label>
                    Nom<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="fname"
                    placeholder="Ex: Ali"
                    value={formData.fname}
                    onChange={handleChange}
                  />
                </div>
                <div className="sm:col-span-1">
                  <Label>
                    Prénom<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    name="lname"
                    placeholder="Ex: Ben Salah"
                    value={formData.lname}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <Label>
                  Email<span className="text-error-500">*</span>
                </Label>
                <Input
                  type="email"
                  name="email"
                  placeholder="Ex: ali@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label>
                  Mot de passe<span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    placeholder="Entrez votre mot de passe"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? <EyeIcon className="size-5" /> : <EyeCloseIcon className="size-5" />}
                  </span>
                </div>
              </div>

              <div>
                <Label>
                  Carte d'identité<span className="text-error-500">*</span>
                </Label>
                <Input
                  type="number"
                  name="carteIdentite"
                  placeholder="Ex: 11119999"
                  value={formData.carteIdentite}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label>
                  Numéro de téléphone<span className="text-error-500">*</span>
                </Label>
                <Input
                  type="number"
                  name="numTelephone"
                  placeholder="Ex: 27777777"
                  value={formData.numTelephone}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label>
                  Adresse<span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  name="adress"
                  placeholder="Ex: Hay Ennour"
                  value={formData.adress}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label>
                  Références<span className="text-error-500">*</span>
                </Label>
                <div className="space-y-2">
                  {formData.references.map((reference, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder={`Référence ${index + 1}`}
                        value={reference}
                        onChange={(e) => handleReferenceChange(index, e.target.value)}
                        min="1"
                      />
                      {formData.references.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeReference(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addReference}
                    className="flex items-center gap-1 px-3 py-1 mt-2 text-sm text-white bg-green-500 rounded-lg hover:bg-green-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Ajouter une référence
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  className="w-5 h-5"
                  checked={isChecked}
                  onChange={() => setIsChecked(!isChecked)}
                />
                <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                  En créant un compte, vous acceptez les{" "}
                  <button
                    type="button"
                    onClick={() => openPopup("terms")}
                    className="text-gray-800 dark:text-white/90 hover:underline focus:outline-none"
                  >
                    Conditions générales d'utilisation
                  </button>{" "}
                  et notre{" "}
                  <button
                    type="button"
                    onClick={() => openPopup("privacy")}
                    className="text-gray-800 dark:text-white hover:underline focus:outline-none"
                  >
                    Politique de confidentialité
                  </button>.
                </p>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 mb-6"
                >
                  S'inscrire
                </button>
              </div>
            </div>
          </form>
          {/* Affichage du popup */}
          {popupContent && (
            <Popup
              title={popupContent.title}
              content={popupContent.content}
              onClose={closePopup}
            />
          )}
        </div>
      </div>
    </div>
  );
}