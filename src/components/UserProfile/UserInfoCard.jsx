import { useState, useEffect } from 'react';
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { toast, Toaster } from 'react-hot-toast';

export default function UserInfoCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    carteIdentite: '',
    role: '',
    motDePasse: '',
    con: '',
    confirmMotDePasse: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  function parseJwt(token) {
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Erreur lors du décodage du token', e);
      return null;
    }
  }

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const decoded = parseJwt(token);
        const email = decoded?.email;
        if (!email) {
          throw new Error("No email found in token");
        }

        const response = await fetch(`http://localhost:8080/api/utilisateur/${email}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch user: ${response.status}`);
        }

        const userData = await response.json();
        setUser(userData);
        setFormData({
          nom: userData.nom || '',
          carteIdentite: userData.carteIdentite || '',
          role: userData.role || '',
          motDePasse: '',
          con: userData.con || '',
          confirmMotDePasse: ''
        });
      } catch (err) {
        setError(err.message);
        toast.error(`Error fetching user: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (formData.motDePasse && formData.motDePasse.length < 8) {
      toast.error('Password must be at least 8 characters');
      return false;
    }
    if (formData.motDePasse !== formData.confirmMotDePasse) {
      toast.error('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSaveClick = () => {
    if (!validateForm()) return;
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirmModal(false);
    
    // Determine which save method to use based on role
    if (user?.role === 'DIRECTION') {
      await handleSaveDirection();
    } else {
      await handleSaveCitoyen();
    }
  };

  const handleSaveDirection = async () => {
    try {
      const loadingToast = toast.loading('Updating user information...');
      
      const payload = {
        nom: formData.nom,
        carteIdentite: formData.carteIdentite,
        role: formData.role,
        motDePasse: formData.motDePasse || undefined,
        con: formData.con
      };
  
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8080/api/directions/update/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
  
      if (!response.ok) {
        throw new Error(`Failed to update user: ${response.status}`);
      }
  
      // Read the response text
      const message = await response.text();
      console.log(message);
  
      // Update local form state
      setFormData(prev => ({
        ...prev,
        motDePasse: '',
        confirmMotDePasse: ''
      }));
  
      closeModal();
      toast.dismiss(loadingToast);
      toast.success('Direction user updated successfully');
    } catch (err) {
      toast.error(`Error updating user: ${err.message}`);
    }
  };

  const handleSaveCitoyen = async () => {
    try {
      const loadingToast = toast.loading('Updating user information...');
      
      const payload = {
        nom: formData.nom,
        carteIdentite: formData.carteIdentite,
        role: formData.role,
        motDePasse: formData.motDePasse || undefined,
        con: formData.con,
        email : user.email
      };
  
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8080/api/citoyens/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
  
      if (!response.ok) {
        throw new Error(`Failed to update user: ${response.status}`);
      }
  
      // Read the response text
      const message = await response.text();
      console.log(message);
  
      // Update local form state
      setFormData(prev => ({
        ...prev,
        motDePasse: '',
        confirmMotDePasse: ''
      }));
  
      closeModal();
      toast.dismiss(loadingToast);
      toast.success('Citoyen user updated successfully');
    } catch (err) {
      toast.error(`Error updating user: ${err.message}`);
    }
  };
  
  const ConfirmationModal = () => {
    if (!showConfirmModal) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="w-96 p-6 bg-white rounded-lg shadow-xl dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">Confirm Changes</h3>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            Are you sure you want to save these changes to your profile information?
          </p>
          <div className="flex justify-end space-x-4">
            <button 
              onClick={() => setShowConfirmModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirmSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="p-5">Loading...</div>;
  if (error) return <div className="p-5 text-red-500">Error: {error}</div>;

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <Toaster position="top-right" toastOptions={{
        success: {
          style: {
            background: '#10B981',
            color: 'white',
          },
          iconTheme: {
            primary: 'white',
            secondary: '#10B981',
          },
        },
        error: {
          style: {
            background: '#EF4444',
            color: 'white',
          },
          iconTheme: {
            primary: 'white',
            secondary: '#EF4444',
          },
        },
      }} />
      <ConfirmationModal />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Personal Information
          </h4>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                First Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user?.nom || 'N/A'}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Carte identité
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user?.carteIdentite || 'N/A'}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Role
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user?.role || 'N/A'}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Mot de passe
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                ****
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Congier
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user?.con || 'N/A'}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={openModal}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
        >
          <svg
            className="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
              fill=""
            />
          </svg>
          Edit
        </button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
              {user?.role === 'DIRECTION' ? ' (Direction account)' : ' (Citoyen account)'}
            </p>
          </div>
          <form className="flex flex-col">
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div className="mt-7">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Personal Information
                </h5>
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2 lg:col-span-1">
                    <Label>First Name</Label>
                    <Input
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Carte Identité</Label>
                    <Input
                      type="text"
                      name="carteIdentite"
                      value={formData.carteIdentite}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Role</Label>
                    <Input
                      type="text"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Congier</Label>
                    <Input
                      type="text"
                      name="con"
                      value={formData.con}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      name="motDePasse"
                      value={formData.motDePasse}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Confirm Password</Label>
                    <Input
                      type="password"
                      name="confirmMotDePasse"
                      value={formData.confirmMotDePasse}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" onClick={handleSaveClick}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}