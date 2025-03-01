import { useState, ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Alert from "../ui/alert/Alert";


type AlertType = {
  variant: "success" | "error";
  title: string;
  message: string;
} | null;

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(true); // Accepté par défaut
  const [alert, setAlert] = useState<AlertType>(null);
  const [formData, setFormData] = useState({
    fname: "",
    lname: "",
    email: "",
    password: "",
    carteIdentite: "",
    numTelephone: "",
    adress: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isChecked) {
      setAlert({ variant: "error", title: "Erreur", message: "Vous devez accepter les conditions pour vous inscrire." });
      return;
    }

    const citoyenData = {
      nom: `${formData.fname} ${formData.lname}`.trim(), // Fusionner Nom & Prénom
      email: formData.email,
      motDePasse: formData.password,
      carteIdentite: parseInt(formData.carteIdentite, 10),
      numTelephone: parseInt(formData.numTelephone, 10),
      adress: formData.adress,
    };

    try {
      const response = await fetch("http://localhost:8080/api/citoyens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(citoyenData),
      });

      if (response.ok) {
        setAlert({ variant: "success", title: "Succès", message: "Inscription réussie !" });
      } else {
        setAlert({ variant: "error", title: "Erreur", message: "Erreur lors de l'inscription." });
      }
    } catch (error) {
      console.error("Erreur:", error);
      setAlert({ variant: "error", title: "Erreur", message: "Erreur de connexion au serveur." });
    }
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
                  <Label>Nom<span className="text-error-500">*</span></Label>
                  <Input
                    type="text"
                    name="fname"
                    placeholder="Ex: Ali"
                    value={formData.fname}
                    onChange={handleChange}
                  />
                </div>
                <div className="sm:col-span-1">
                  <Label>Prénom<span className="text-error-500">*</span></Label>
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
                <Label>Email<span className="text-error-500">*</span></Label>
                <Input
                  type="email"
                  name="email"
                  placeholder="Ex: ali@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label>Mot de passe<span className="text-error-500">*</span></Label>
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
                <Label>Carte d'identité<span className="text-error-500">*</span></Label>
                <Input
                  type="number"
                  name="carteIdentite"
                  placeholder="Ex: 11119999"
                  value={formData.carteIdentite}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label>Numéro de téléphone<span className="text-error-500">*</span></Label>
                <Input
                  type="number"
                  name="numTelephone"
                  placeholder="Ex: 27777777"
                  value={formData.numTelephone}
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label>Adresse<span className="text-error-500">*</span></Label>
                <Input
                  type="text"
                  name="adress"
                  placeholder="Ex: Hay Ennour"
                  value={formData.adress}
                  onChange={handleChange}
                />
              </div>

              <div className="flex items-center gap-3">
                <Checkbox
                  className="w-5 h-5"
                  checked={isChecked}
                  onChange={() => setIsChecked(!isChecked)}
                />
                <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                  En créant un compte, vous acceptez les{" "}
                  <span className="text-gray-800 dark:text-white/90">Conditions générales d'utilisation</span>{" "}
                  et notre{" "}
                  <span className="text-gray-800 dark:text-white">Politique de confidentialité.</span>
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
        </div>
      </div>
    </div>
  );
}
