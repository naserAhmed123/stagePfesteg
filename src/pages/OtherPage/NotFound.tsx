import { useNavigate } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import GridShape from "../../components/common/GridShape";
import { useAuth } from "../../layout/AuthContext";
import { useEffect, useState } from "react";

export default function NotFound() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState("We can't seem to find the page you are looking for!");
  const [title, setTitle] = useState("404 - Page Not Found");

  // Check URL to determine if it's a not-authorized case
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('not-authorized')) {
      setTitle("Access Denied");
      setMessage("You don't have permission to access this page.");
    }
  }, []);

  // Function to redirect based on role
  const handleBackToHome = () => {
    if (!user) {
      navigate("/");
      return;
    }

    switch (user.role) {
      case "client":
        navigate("/cotéClient");
        break;
      case "direction":
        navigate("/cotéDirection");
        break;
      case "intervention":
        navigate("/cotéBureauIntervention");
        break;
      default:
        navigate("/");
    }
  };

  return (
    <>
      <PageMeta
        description="Error page for dashboard application"
      />
      <div className="relative flex flex-col items-center justify-center min-h-screen p-6 overflow-hidden z-1">
        <GridShape />
        <div className="mx-auto w-full max-w-[242px] text-center sm:max-w-[472px]">
          <h1 className="mb-8 font-bold text-gray-800 text-title-md dark:text-white/90 xl:text-title-2xl">
            {title}
          </h1>

          <img src="/stagePfesteg/images/error/404.svg" alt="404" className="dark:hidden" />
          <img
            src="/stagePfesteg/images/error/404-dark.svg"
            alt="404"
            className="hidden dark:block"
          />

          <p className="mt-10 mb-6 text-base text-gray-700 dark:text-gray-400 sm:text-lg">
            {message}
          </p>

          <button
            onClick={handleBackToHome}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
          >
            {user ? "Back to Dashboard" : "Back to Login"}
          </button>
        </div>

        {/* Footer */}
        <p className="absolute text-sm text-center text-gray-500 -translate-x-1/2 bottom-6 left-1/2 dark:text-gray-400">
          &copy; {new Date().getFullYear()} - Naser Ahmed
        </p>
      </div>
    </>
  );
}