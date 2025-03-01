import { useState } from "react";
import ComponentCard from "../../common/ComponentCard";
import Label from "../Label";
import Input from "../input/InputField";
import Button from "../../ui/button/Button";
import axios from "axios"; // Assurez-vous d'avoir installé axios
import { EyeCloseIcon, EyeIcon } from "../../../icons";
import Alert from "../../ui/alert/Alert";
type AlertType = {
  variant: "success" | "error";
  title: string;
  message: string;
} | null;
export default function DefaultInputs() {
  const [showPassword, setShowPassword] = useState(false);
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [carteIdentite, setCarteIdentite] = useState("");
  const [numTel, setNumTel] = useState("");
  const [password, setPassword] = useState("");
  const [alert, setAlert] = useState<AlertType>(null);

  const handleSubmit = async () => {
    const serviceInterventionData = {
      nom: `${nom} ${prenom}`,  // Fusionner le nom et le prénom ici
      email,
      motDePasse: password,
      carteIdentite: parseInt(carteIdentite),
      numTel: parseInt(numTel),
    };

    try {
      await axios.post("http://localhost:8080/api/service-intervention/save", serviceInterventionData);
      setAlert({ variant: "success", title: "Succès", message: "Inscription réussie !" });
    } catch (error) {
      setAlert({ variant: "error", title: "Erreur", message: "Erreur lors de l'inscription." });
    }
  };

  return (
    <ComponentCard title="Ajouter un Travailler de bureau d'intervention">
       {alert && (
                    <Alert
                      variant={alert.variant}
                      title={alert.title}
                      message={alert.message}
                    />
                  )}
      <div className="space-y-6">
        <div>
          <Label htmlFor="nom">Nom</Label>
          <Input type="text" id="nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="ex : Ben ayed" />
        </div>
        <div>
          <Label htmlFor="prenom">Prénom</Label>
          <Input type="text" id="prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="ex : Ala" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@gmail.com" />
        </div>
        <div>
          <Label htmlFor="carteIdentite">Carte Identité</Label>
          <Input type="number" id="carteIdentite" value={carteIdentite} onChange={(e) => setCarteIdentite(e.target.value)} placeholder="ex : 11111111" />
        </div>
        <div>
          <Label htmlFor="numTel">Numéro téléphone</Label>
          <Input type="number" id="numTel" value={numTel} onChange={(e) => setNumTel(e.target.value)} placeholder="ex : 11111111" />
        </div>
        <div>
          <Label>Password</Label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
            >
              {showPassword ? <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" /> : <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />}
            </button>
          </div>
        </div>
        <Button onClick={handleSubmit} className="w-full" size="sm">
          Enregistrer
        </Button>
      </div>
    </ComponentCard>
  );
}
