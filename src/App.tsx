import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./layout/AuthContext";
import { Suspense, lazy, JSX } from "react";
import { AuthGuard } from "./layout/AuthContext";

// Import auth pages directly as they're needed for initial load
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";

// Lazy load other pages to improve initial load time
const UserProfiles = lazy(() => import("./pages/UserProfiles"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Blank = lazy(() => import("./pages/Blank"));
const Home = lazy(() => import("./pages/Dashboard/Home"));
const CitoyenHome = lazy(() => import("./pages/Dashboard/citoyen"));
const BackupPage = lazy(() => import("./pages/Backup"));
const Technicien = lazy(() => import("./pages/Forms/LesTechniciens"));
const Intervention = lazy(() => import("./pages/Forms/Intervention"));
const Table1 = lazy(() => import("./pages/Tables/Table1"));
const Table2 = lazy(() => import("./pages/Tables/table2"));
const Tabledirection = lazy(() => import("./pages/Tables/TableDirection"));
const TabledirectionArchiv = lazy(() => import("./pages/Tables/tableDirectionArch"));
const TableArchiverInt = lazy(() => import("./pages/LesRéclamationArchivInt"));
const Chat = lazy(() => import("./pages/Chat/chat1"));
const ReportGenerator = lazy(() => import("./pages/creerRapport"));
const RéclamationCitoyen = lazy(() => import("./pages/LesreclamationCitoyen"));
const ReclamationAllClient = lazy(() => import("./pages/toutRecCitoyen"));
const AjouterPlainte = lazy(() => import("./pages/AjouterPlainte"));
const MesPlaintes = lazy(() => import("./pages/mesPlainte"));
const MesRefs = lazy(() => import("./pages/MesRef"));
const Videos = lazy(() => import("./pages/UiElements/Videos"));
const Images = lazy(() => import("./pages/UiElements/Images"));
const Alerts = lazy(() => import("./pages/UiElements/Alerts"));
const Badges = lazy(() => import("./pages/UiElements/Badges"));
const Avatars = lazy(() => import("./pages/UiElements/Avatars"));
const Buttons = lazy(() => import("./pages/UiElements/Buttons"));
const LineChart = lazy(() => import("./pages/Charts/LineChart"));
const BarChart = lazy(() => import("./pages/Charts/BarChart"));
const ReclamationReportSystem = lazy(() => import("./pages/rapport"));
const RapportTech = lazy(() => import("./pages/LesRapportdetech"));
const RapportInt = lazy(() => import("./pages/rapportdesinter"));
const ListeIntervention = lazy(() => import("./pages/table123"));
const ListTechnicien = lazy(() => import("./pages/tableListetech"));
const MatrielDirection = lazy(() => import("./pages/MatrielDirection"));
const EquipeDirection = lazy(() => import("./pages/EquipeDirection"));
const AjouterRéference = lazy(() => import("./pages/AjouterRéferenceCit"));
const RetardJours = lazy(() => import("./pages/ReclamationenRetard"));
const TousLesRet = lazy(() => import("./pages/toutLesRetard"));
const ListCitoyen = lazy(() => import("./pages/Tables/CitoyenList"));
const ListReportage = lazy(() => import("./pages/Tables/TableReportage"));
const ListReportageDirection = lazy(() => import("./pages/Tables/TableReportageDirection"));
const ListeCitBloquerDirection = lazy(() => import("./pages/Tables/TableCitBloquer"));
const TableRecCitoyen = lazy(() => import("./pages/Tables/TableRecCitoyen"));
const TableNonVerifPlainte = lazy(() => import("./pages/Tables/PlaintesNonVerif"));
const TableVerifPlainte = lazy(() => import("./pages/Tables/PlaintesVerifier"));
const PlainteDirection = lazy(() => import("./pages/plainteDirection"));
const AppLayout = lazy(() => import("./layout/AppLayout"));
import { ScrollToTop } from "./components/common/ScrollToTop";
import SfaxLightInterruptionRiskMap from "./pages/mapSfax";
import MesRapportInt from "./pages/mesRapportPourInt";
const BlockedPage = lazy(() => import("./pages/Blockpage"));
const BlockedPageCit = lazy(() => import("./pages/BlockCit"));

// Role-based route guard
interface ProtectedRouteProps {
  allowedRoles: string[];
  children: JSX.Element;
  redirectPath?: string;
}

const ProtectedRoute = ({ 
  allowedRoles, 
  children, 
  redirectPath = "/not-authorized" 
}: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>; // Afficher un loader pendant le chargement
  }
  
  if (!user) {
    console.log("No user in ProtectedRoute, redirecting to /login");
    return <Navigate to="/login" replace />;
  }
  
  if (!allowedRoles.includes(user.role)) {
    console.log(`Role ${user.role} not allowed for this route, redirecting to ${redirectPath}`);
    return <Navigate to={redirectPath} replace />;
  }
  
  return children;
};

// Redirect if already authenticated
const AuthRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>; // Afficher un loader pendant le chargement
  }
  
  if (user) {
    console.log(`Authenticated user with role ${user.role}, redirecting to dashboard`);
    if (user.role === "direction") {
      return <Navigate to="/cotéDirection" replace />;
    } else if (user.role === "intervention") {
      return <Navigate to="/cotéBureauIntervention" replace />;
    } else {
      return <Navigate to="/cotéClient" replace />;
    }
  }
  
  return children;
};

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={<AuthRoute><SignIn /></AuthRoute>} />
        <Route path="/login" element={<AuthRoute><SignIn /></AuthRoute>} />
        <Route path="/signup" element={<AuthRoute><SignUp /></AuthRoute>} />
        
        {/* Blocked Pages - Accessible to all */}
        <Route path="/blocked" element={
          <Suspense fallback={<div>Loading...</div>}>
            <BlockedPage />
          </Suspense>
        } />
        <Route path="/blockedCit" element={
          <Suspense fallback={<div>Loading...</div>}>
            <BlockedPageCit />
          </Suspense>
        } />

        {/* Protected Routes wrapped with AuthGuard */}
        <Route element={
          <Suspense fallback={<div>Loading...</div>}>
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          </Suspense>
        }>
          {/* Shared Routes */}
          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={["client", "direction", "intervention"]}>
              <UserProfiles />
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute allowedRoles={["client", "direction", "intervention"]}>
              <Calendar />
            </ProtectedRoute>
          } />
          <Route path="/blank" element={
            <ProtectedRoute allowedRoles={["client", "direction", "intervention"]}>
              <Blank />
            </ProtectedRoute>
          } />

          {/* Client Routes */}
          <Route path="/cotéClient" element={
            <ProtectedRoute allowedRoles={["client"]}>
              <CitoyenHome />
            </ProtectedRoute>
          } />
          <Route path="/mesPlaintes" element={
            <ProtectedRoute allowedRoles={["client"]}>
              <MesPlaintes />
            </ProtectedRoute>
          } />
          <Route path="/mesRéferences" element={
            <ProtectedRoute allowedRoles={["client"]}>
              <MesRefs />
            </ProtectedRoute>
          } />
          <Route path="/recCitoyen" element={
            <ProtectedRoute allowedRoles={["client"]}>
              <RéclamationCitoyen />
            </ProtectedRoute>
          } />
          <Route path="/toutrecCit" element={
            <ProtectedRoute allowedRoles={["client"]}>
              <ReclamationAllClient />
            </ProtectedRoute>
          } />
          <Route path="/ajouterPlainte" element={
            <ProtectedRoute allowedRoles={["client"]}>
              <AjouterPlainte />
            </ProtectedRoute>
          } />
          <Route path="/ajouterRéference" element={
            <ProtectedRoute allowedRoles={["client"]}>
              <AjouterRéference />
            </ProtectedRoute>
          } />

          {/* Direction Routes */}
          <Route path="/cotéDirection" element={
            <ProtectedRoute allowedRoles={["direction"]}>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/retardJour" element={
            <ProtectedRoute allowedRoles={["direction"]}>
              <RetardJours />
            </ProtectedRoute>
          } />
          <Route path="/plainteDirection" element={
            <ProtectedRoute allowedRoles={["direction"]}>
              <PlainteDirection />
            </ProtectedRoute>
          } />
          <Route path="/toutLesretards" element={
            <ProtectedRoute allowedRoles={["direction"]}>
              <TousLesRet />
            </ProtectedRoute>
          } />
          <Route path="/reportageDirection" element={
            <ProtectedRoute allowedRoles={["direction"]}>
              <ListReportageDirection />
            </ProtectedRoute>
          } />
          <Route path="/listeCitoyenBloquer" element={
            <ProtectedRoute allowedRoles={["direction"]}>
              <ListeCitBloquerDirection />
            </ProtectedRoute>
          } />
          <Route path="/Intervention" element={
            <ProtectedRoute allowedRoles={["direction"]}>
              <Intervention />
            </ProtectedRoute>
          } />
          <Route path="/listeintervention" element={
            <ProtectedRoute allowedRoles={["direction"]}>
              <ListeIntervention />
            </ProtectedRoute>
          } />
          <Route path="/listetechnicien" element={
            <ProtectedRoute allowedRoles={["direction"]}>
              <ListTechnicien />
            </ProtectedRoute>
          } />
          <Route path="/LesTechniciens" element={
            <ProtectedRoute allowedRoles={["direction"]}>
              <Technicien />
            </ProtectedRoute>
          } />
          <Route path="/lesEquipes" element={
            <ProtectedRoute allowedRoles={["direction"]}>
              <EquipeDirection />
            </ProtectedRoute>
          } />
          <Route path="/tableDirection" element={
            <ProtectedRoute allowedRoles={["direction"]}>
              <Tabledirection />
            </ProtectedRoute>
          } />
          <Route path="/backup" element={
            <ProtectedRoute allowedRoles={["direction"]}>
              <BackupPage />
            </ProtectedRoute>
          } />
          <Route path="/tableDirectionArch" element={
            <ProtectedRoute allowedRoles={["direction"]}>
              <TabledirectionArchiv />
            </ProtectedRoute>
          } />
          <Route path="/matrieldirection" element={
            <ProtectedRoute allowedRoles={["direction"]}>
              <MatrielDirection />
            </ProtectedRoute>
          } />

          {/* Bureau Intervention Routes */}
          <Route path="/cotéBureauIntervention" element={
            <ProtectedRoute allowedRoles={["intervention"]}>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/listeCitoynes" element={
            <ProtectedRoute allowedRoles={["intervention"]}>
              <ListCitoyen />
            </ProtectedRoute>
          } />
          <Route path="/effectuerréclamation" element={
            <ProtectedRoute allowedRoles={["intervention"]}>
              <TableRecCitoyen />
            </ProtectedRoute>
          } />
          <Route path="/nonVerifPlainte" element={
            <ProtectedRoute allowedRoles={["intervention"]}>
              <TableNonVerifPlainte />
            </ProtectedRoute>
          } />
          <Route path="/verifPlainte" element={
            <ProtectedRoute allowedRoles={["intervention"]}>
              <TableVerifPlainte />
            </ProtectedRoute>
          } />
          <Route path="/listeReportage" element={
            <ProtectedRoute allowedRoles={["intervention"]}>
              <ListReportage />
            </ProtectedRoute>
          } />
          <Route path="/rapport" element={
            <ProtectedRoute allowedRoles={["intervention", "direction"]}>
              <ReclamationReportSystem />
            </ProtectedRoute>
          } />
          <Route path="/lesrapportdeint" element={
            <ProtectedRoute allowedRoles={["intervention", "direction"]}>
              <RapportInt />
            </ProtectedRoute>
          } />
          <Route path="/messanger" element={
            <ProtectedRoute allowedRoles={["intervention"]}>
              <Chat />
            </ProtectedRoute>
          } />
          <Route path="/AjouterReclamation" element={
            <ProtectedRoute allowedRoles={["intervention"]}>
              <Table2 />
            </ProtectedRoute>
          } />
          <Route path="/creerRapport" element={
            <ProtectedRoute allowedRoles={["intervention"]}>
              <ReportGenerator />
            </ProtectedRoute>
          } />
          <Route path="/mesrapports" element={
            <ProtectedRoute allowedRoles={["intervention"]}>
              <MesRapportInt />
            </ProtectedRoute>
          } />
          <Route path="/reclamationsArch" element={
            <ProtectedRoute allowedRoles={["intervention"]}>
              <TableArchiverInt />
            </ProtectedRoute>
          } />
          <Route path="/lesrapportdetech" element={
            <ProtectedRoute allowedRoles={["intervention", "direction"]}>
              <RapportTech />
            </ProtectedRoute>
          } />
          <Route path="/table1" element={
            <ProtectedRoute allowedRoles={["intervention"]}>
              <Table1 />
            </ProtectedRoute>
          } />

          {/* UI Elements - accessible to all authenticated users */}
          <Route path="/alerts" element={
            <ProtectedRoute allowedRoles={["client", "direction", "intervention"]}>
              <Alerts />
            </ProtectedRoute>
          } />
          <Route path="/avatars" element={
            <ProtectedRoute allowedRoles={["client", "direction", "intervention"]}>
              <Avatars />
            </ProtectedRoute>
          } />
          <Route path="/badge" element={
            <ProtectedRoute allowedRoles={["client", "direction", "intervention"]}>
              <Badges />
            </ProtectedRoute>
          } />
          <Route path="/buttons" element={
            <ProtectedRoute allowedRoles={["client", "direction", "intervention"]}>
              <Buttons />
            </ProtectedRoute>
          } />
          <Route path="/mapsfax" element={
            <ProtectedRoute allowedRoles={["client", "direction", "intervention"]}>
              <SfaxLightInterruptionRiskMap />
            </ProtectedRoute>
          } />
          <Route path="/images" element={
            <ProtectedRoute allowedRoles={["client", "direction", "intervention"]}>
              <Images />
            </ProtectedRoute>
          } />
          <Route path="/videos" element={
            <ProtectedRoute allowedRoles={["client", "direction", "intervention"]}>
              <Videos />
            </ProtectedRoute>
          } />
          <Route path="/line-chart" element={
            <ProtectedRoute allowedRoles={["client", "direction", "intervention"]}>
              <LineChart />
            </ProtectedRoute>
          } />
          <Route path="/bar-chart" element={
            <ProtectedRoute allowedRoles={["client", "direction", "intervention"]}>
              <BarChart />
            </ProtectedRoute>
          } />
        </Route>
        
        {/* Error Routes */}
        <Route path="/not-found" element={<NotFound />} />
        <Route path="/not-authorized" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}