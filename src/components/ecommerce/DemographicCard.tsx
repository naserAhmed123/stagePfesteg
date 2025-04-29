import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import CountryMap from "./CountryMap";
import { Link } from "react-router";
import { useNavigate } from "react-router-dom";

export default function DemographicCard() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const handleViewMoreClick = () => {
    closeDropdown();
    navigate("/mapsfax");
  };
  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }
  return (
<div className="rounded-2xl border border-gray-200 h-[487px] bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
  <div className="flex justify-between">
    <div>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
        Customers Demographic
      </h3>
      <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
        Number of customers based on country
      </p>
    </div>
    <div className="relative inline-block">
      <button className="dropdown-toggle" onClick={toggleDropdown}>
        <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
      </button>

      {/* Dropdown */}
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className={`w-40 p-2 absolute z-50 bottom-2   ml-5 ${isOpen ? 'block' : 'hidden' }`}
      >
          <Link
          to="/mapsfax"
          >
        <DropdownItem
      onItemClick={handleViewMoreClick} 

          className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
        >
        
          View More
        </DropdownItem>
        </Link>

      </Dropdown>
    </div>
  </div>

  {/* Map Section */}
  <div className="px-4 py-6 my-6 overflow-hidden border border-gray-200 rounded-2xl dark:border-gray-800 sm:px-6 relative">
    <div
      id="mapOne"
      className="mapOne map-btn -mx-4 -my-6 h-[212px] w-[256px] 2xsm:w-[307px] xsm:w-[358px] sm:-mx-6 md:w-[668px] lg:w-[634px] xl:w-[393px] 2xl:w-[554px] mb-6"
    >
      <CountryMap />
    </div>
  </div>

  <div className="space-y-3 mr-8">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="items-center w-full rounded-full max-w-8"></div>
        <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
          Sfax Medina
        </p>
        <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
          2,379 Citoyens
        </span>
      </div>

      <div className="flex w-full max-w-[140px] items-center gap-3">
        <div className="relative block h-2 w-full max-w-[100px] rounded bg-gray-200 dark:bg-gray-800">
          <div className="absolute left-0 top-0 flex h-full w-[79%] items-center justify-center rounded bg-red-600 text-xs font-medium text-white"></div>
        </div>
        <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">79%</p>
      </div>
    </div>

    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="items-center w-full rounded-full max-w-8"></div>
        <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
          Sfax Medina
        </p>
        <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
          2,379 Citoyens
        </span>
      </div>

      <div className="flex w-full max-w-[140px] items-center gap-3">
        <div className="relative block h-2 w-full max-w-[100px] rounded bg-gray-200 dark:bg-gray-800">
          <div className="absolute left-0 top-0 flex h-full w-[73%] items-center justify-center rounded bg-red-600 text-xs font-medium text-white"></div>
        </div>
        <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">73%</p>
      </div>
    </div>
  </div>
</div>
  
  
  
  );
}
