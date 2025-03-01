import { useState } from "react";
import ComponentCard from "../../common/ComponentCard";
import Label from "../Label";
import Input from "../input/InputField";
import Select from "react-select"; // Assurez-vous que react-select est installé
import Button from "../../ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "../../../icons";
import axios from "axios";
import Alert from "../../ui/alert/Alert";

// Définir un type pour les options de Select
interface OptionType {
  value: string;
  label: string;
}
type AlertType = {
  variant: "success" | "error";
  title: string;
  message: string;
} | null;
export default function TechnicienPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [carteIdentite, setCarteIdentite] = useState("");
  const [numTel, setNumTel] = useState("");
  const [equipe, setEquipe] = useState(""); // État pour l'équipe sélectionnée
  const [alert, setAlert] = useState<AlertType>(null);

  // Options pour l'équipe
  const options: OptionType[] = [
    { value: "Equipe A", label: "Equipe A" },
    { value: "Equipe B", label: "Equipe B" },
  ];

  // Gestion de la sélection de l'équipe avec typage explicite
  const handleSelectChange = (selectedOption: OptionType | null) => {
    if (selectedOption) {
      setEquipe(selectedOption.value); // Mettre à jour l'état avec l'équipe sélectionnée
    }
  };

  const handleSubmit = async () => {
    const technicienData = {
      nom: `${nom} ${prenom}`,
      email,
      motDePasse: password,
      carteIdentite: carteIdentite,
      numTel: numTel,
      equipe: equipe // Ajouter l'équipe sélectionnée dans les données envoyées
    };

    try {
      await axios.post("http://localhost:8080/api/technicien/save", technicienData);
      setAlert({ variant: "success", title: "Succès", message: "Inscription réussie !" });

    } catch (error) {
      setAlert({ variant: "error", title: "Erreur", message: "Erreur lors de l'inscription." });

    }
  };

  return (
    <ComponentCard title="Ajouter un Technicien">
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
          <Label htmlFor="password">Mot de Passe</Label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez votre mot de passe"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
            >
              {showPassword ? (
                <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
              ) : (
                <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
              )}
            </button>
          </div>
        </div>
        <ComponentCard title="Select équipe de technicien">
      <div className="space-y-6">
       
          <Label>Select équipe</Label>
          <Select
            options={options}
            placeholder="Sélectionner l'équipe"
            onChange={handleSelectChange} // Appeler la fonction de gestion du changement
            className="dark:bg-dark-900"
          />
        </div>
        </ComponentCard>
        <Button className="w-full" size="sm" onClick={handleSubmit}>
          Enregistrer
        </Button>
      </div>

      {/* Ajouter ToastContainer pour afficher les notifications */}
    </ComponentCard>
  );
}
