import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import logo1 from "./logo1.png";
import logo2 from "./logo2.png";
import logo from "./steglogo.png";

import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PieChartIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import SidebarWidget from "./SidebarWidget";
import { useAuth } from "./AuthContext"; 
import { AlertCircleIcon, MapIcon } from "lucide-react";
import Alert from "../components/ui/alert/Alert";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const roleBasedMenus: Record<string, { main: NavItem[], others: NavItem[] }> = {
  direction: {
    main: [
      {
        icon: <GridIcon />,
        name: "Dashboard",
        subItems: [{ name: "Mon dashboard", path: "/cotéDirection", pro: false }],
      },
      {
        icon: <CalenderIcon />,
        name: "Calendar",
        path: "/calendar",
      },
      {
        icon: <UserCircleIcon />,
        name: "User Profile",
        path: "/profile",
      },
      {
        name: "Gestion des Utilisateurs",
        icon: <ListIcon />,
        subItems: [
          { name: "Liste bureau d'intervention", path: "/listeintervention", pro: false },
          { name: "Liste des technicines", path: "/listetechnicien", pro: false },
        ],
      },
      {
        name: "Ajouter des Travailleurs",
        icon: <ListIcon />,
        subItems: [
          { name: "Bureau Intervention", path: "/Intervention", pro: false },
          { name: "Les Techniciens", path: "/LesTechniciens", pro: false },
        ],
      },
      {
        name: "Tables",
        icon: <TableIcon />,
        subItems: [{ name: "Table des réclamations", path: "/tableDirection", pro: false }],
      },
      {
        name: "Rapports",
        icon: <PageIcon />,
        subItems: [
          { name: "Les Rapport de IA", path: "/rapport", pro: false },
          { name: "Les rapports des bureau intervention", path: "/lesrapportdeint", pro: false },
          { name: "Les Rapports des techniciens", path: "/lesrapportdetech", pro: false },
        ],
      },
      {
        name: "Réclamation de retard",
        icon: <AlertCircleIcon />,
        subItems: [
          { name: "Les retard de jour", path: "/not-found", pro: false },
          { name: "Touts les retard", path: "/not-found", pro: false },
        ],
      },
      {
        name: "Live map",
        icon: <MapIcon />,
        path: "/mapsfax", 
      },
      {
        name: "Stock de matriels",
        icon: <BoxCubeIcon />,
        path: "/matrieldirection", 
      },
    ],
    others: [
   
    ],
  },
  intervention: {
    main: [
      {
        icon: <GridIcon />,
        name: "Dashboard",
        subItems: [{ name: "Mon dashboard", path: "/cotéBureauIntervention", pro: false }],
      },
      {
        icon: <CalenderIcon />,
        name: "Calendrier Interventions",
        path: "/calendar",
      },
      {
        name: "Tables",
        icon: <TableIcon />,
        subItems: [{ name: "Table des réclamations", path: "/AjouterReclamation", pro: false }],
      },
      {
        icon: <UserCircleIcon />,
        name: "Mon Profil",
        path: "/profile",
      },
      {
        icon: <UserCircleIcon />,
        name: "Discussion Technicien",
        path: "/messanger",
      },
      {
        name: "Rapports",
        icon: <PageIcon />,
        subItems: [
          { name: "Mes Rapports", path: "/rapport", pro: false },
          { name: "Créer Rapport", path: "/creerRapport", pro: false },
          { name: "Les Rapports des techniciens", path: "/lesrapportdetech", pro: false },
        ],
      },
    ],
    others: [
      {
        icon: <PieChartIcon />,
        name: "Statistiques",
        path: "/statistiques",
      },
    ],
  },
  client: {
    main: [
      {
        icon: <GridIcon />,
        name: "Dashboard",
        subItems: [{ name: "Mon dashboard", path: "/cotéClient", pro: false }],
      },
      {
        icon: <CalenderIcon />,
        name: "Mes Rendez-vous",
        path: "/rendez-vous",
      },
      {
        icon: <UserCircleIcon />,
        name: "Mon Profil",
        path: "/profile",
      },
      {
        name: "Réclamation",
        icon: <ListIcon />,
        subItems: [
          { name: "Nouvelle Demande", path: "/nouvelle-demande", pro: false },
          { name: "Mes Demandes", path: "/mes-demandes", pro: false },
        ],
      },
    ],
    others: [
      {
        icon: <PageIcon />,
        name: "Factures",
        path: "/factures",
      },
    ],
  },
};

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();
  const { user } = useAuth(); 
  
  const userRole = user?.role || "client";
  
  const navItems = roleBasedMenus[userRole]?.main || [];
  const othersItems = roleBasedMenus[userRole]?.others || [];

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive, navItems, othersItems]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={`menu-item-icon-size  ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <div className="flex items-center gap-x-3">
                <img
                  className="dark:hidden transition-transform hover:scale-110 -mb-6 ml-2"
                  src={logo1}
                  alt="Logo"
                  width={110}
                  height={30}
                />
              </div>

              <div className="flex items-center gap-x-3">
                <img
                  className="hidden dark:block transition-transform hover:scale-110 -mb-6"
                  src={logo2}
                  alt="Logo"
                  width={110}
                  height={30}
                />
              </div>
            </>
          ) : (
            <img src={logo} alt="Logo" width={32} height={32} />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>
            {othersItems.length > 0 && (
              <div className="">
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Others"
                  ) : (
                    <HorizontaLDots />
                  )}
                </h2>
                {renderMenuItems(othersItems, "others")}
              </div>
            )}
          </div>
        </nav>
        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;