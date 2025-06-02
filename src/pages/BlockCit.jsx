import { ShieldX, AlertTriangle, Building2 } from "lucide-react";
import { useEffect } from "react";

export default function BlockedPage() {
  const rawString = localStorage.getItem("userEroner");
  const raw = rawString ? JSON.parse(rawString) : null;


  const handleRedirectToLogin = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-red-500 to-red-600 px-8 py-6">
            <div className="flex items-center justify-center mb-2">
              <div className="bg-white/20 p-3 rounded-full">
                <ShieldX className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white text-center">
              Votre accés est bloquer Mr {raw?.name || 'Utilisateur'}
            </h1>
          </div>

          {/* Content Section - Horizontal Layout */}
          <div className="px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Column - Main Message */}
            <div className="lg:col-span-2">
              {/* Warning Icon */}
              <div className="flex justify-center lg:justify-start mb-6">
                <div className="bg-red-50 p-4 rounded-full">
                  <AlertTriangle className="w-10 h-10 text-red-500" />
                </div>
              </div>

              {/* Main Message */}
              <div className="text-center lg:text-left mb-6">
                <p className="text-slate-700 text-lg font-medium mb-4 leading-relaxed">
                  Votre compte a été bloqué suite à des activités suspectes détectées sur votre profil citoyen STEG.
                </p>
                
                {/* Police Contact Alert */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-center lg:justify-start mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                    <span className="font-semibold text-red-800">Avis Important</span>
                  </div>
                  <p className="text-red-700 text-sm leading-relaxed">
                    La STEG a contacté la police et leur a fourni votre numéro de carte d'identité ainsi que votre numéro de téléphone afin qu'ils puissent vous joindre au plus tôt en vue d'une éventuelle sanction.
                  </p>
                </div>
                
                {/* Action Required Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-center lg:justify-start mb-2">
                    <Building2 className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="font-semibold text-blue-800">Action Requise</span>
                  </div>
                  <p className="text-blue-700 text-sm">
                    Veuillez vous rendre à la STEG pour régulariser votre situation et clarifier ces activités suspectes
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Contact & Actions */}
            <div className="space-y-6">
              {/* Contact Information */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-800 mb-3 text-center">
                  Informations de Contact
                </h3>
                <div className="text-sm text-slate-600 space-y-3">
                  <div className="text-center">
                    <p className="font-medium">Direction Génerale</p>
                    <p>Société Tunisienne de l'Électricité et du Gaz</p>
                  </div>
                  
                  <div className="border-t border-slate-200 pt-3">
                    <div className="flex items-center justify-center mb-2">
                      <div className="bg-blue-100 p-1 rounded mr-2">
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                        </svg>
                      </div>
                      <span className="font-medium text-slate-700">Numéro :</span>
                    </div>
                    <p className="text-center text-blue-600 font-mono">+216 27 704 159</p>
                    <p className="text-center text-xs text-slate-500">(prototype)</p>
                  </div>
                  
                  <div className="border-t border-slate-200 pt-3">
                    <div className="flex items-center justify-center mb-2">
                      <div className="bg-blue-100 p-1 rounded mr-2">
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                        </svg>
                      </div>
                      <span className="font-medium text-slate-700">Email :</span>
                    </div>
                    <p className="text-center text-blue-600 font-mono text-xs">StegSfaxSud@steg.tn</p>
                    <p className="text-center text-xs text-slate-500">(prototype)</p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleRedirectToLogin}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              >
                Retour à la page de connexion
              </button>

              {/* Footer Note */}
              <p className="text-xs text-slate-500 text-center">
                Pour toute assistance, contactez le service informatique de la STEG
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Accent */}
        <div className="flex justify-center mt-4">
          <div className="w-16 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}