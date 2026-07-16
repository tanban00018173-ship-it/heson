import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { CartProvider } from './lib/CartContext'
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { getRoleHome } from '@/lib/roleRouter';

/* ── Lazy-loaded pages (code splitting) ── */
const AdminAttendance       = React.lazy(() => import('./pages/AdminAttendance'));
const MyBookings            = React.lazy(() => import('./pages/MyBookings'));
const PaymentResult         = React.lazy(() => import('./pages/PaymentResult'));
const PaymentRedirect       = React.lazy(() => import('./pages/PaymentRedirect'));
const OrderQuery            = React.lazy(() => import('./pages/OrderQuery'));
const ServiceInquiry        = React.lazy(() => import('./pages/ServiceInquiry'));
const PrivacyPolicy         = React.lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService        = React.lazy(() => import('./pages/TermsOfService'));
const JoinCleaner           = React.lazy(() => import('./pages/JoinCleaner'));
const BusinessCooperation   = React.lazy(() => import('./pages/BusinessCooperation'));
const Recruitment           = React.lazy(() => import('./pages/Recruitment'));
const CleanerTeam           = React.lazy(() => import('./pages/CleanerTeam'));
const CleanerApplicationForm= React.lazy(() => import('./pages/CleanerApplicationForm'));
const CleanerManagement     = React.lazy(() => import('./pages/CleanerManagement'));
const CleanerBulkImport     = React.lazy(() => import('./pages/CleanerBulkImport'));
const CleanerJobsPage       = React.lazy(() => import('./pages/CleanerJobs'));
const GoogleSheetsManager   = React.lazy(() => import('./pages/GoogleSheetsManager'));
const SheetSyncLog          = React.lazy(() => import('./pages/SheetSyncLog'));
const ServiceCaseManager    = React.lazy(() => import('./pages/ServiceCaseManager'));
const InternalSpreadsheet   = React.lazy(() => import('./pages/InternalSpreadsheet'));
const PartTimeSchedule      = React.lazy(() => import('./pages/PartTimeSchedule'));
const AdminShopProducts     = React.lazy(() => import('./pages/AdminShopProducts'));
const FlashTaskPost         = React.lazy(() => import('./pages/FlashTaskPost'));
const AdminUsers            = React.lazy(() => import('./pages/AdminUsers'));
const ClientShop            = React.lazy(() => import('./pages/ClientShop'));
const ClientProfileEdit     = React.lazy(() => import('./pages/ClientProfileEdit'));
const ClientPersonalInfo    = React.lazy(() => import('./pages/ClientPersonalInfo'));
const ClientAddressList     = React.lazy(() => import('./pages/ClientAddressList'));
const ClientAddressForm     = React.lazy(() => import('./pages/ClientAddressForm'));
const VendorChatPage        = React.lazy(() => import('./pages/VendorChatPage'));
const AdminPermissions      = React.lazy(() => import('./pages/AdminPermissions'));
const AdminSchedule         = React.lazy(() => import('./pages/AdminSchedule'));
const AdminShopBackend      = React.lazy(() => import('./pages/AdminShopBackend'));
const AdminSupport          = React.lazy(() => import('./pages/AdminSupport'));
const AdminDepartment       = React.lazy(() => import('./pages/AdminDepartment'));
const AdminMe               = React.lazy(() => import('./pages/AdminMe'));
const CleanerStorefront     = React.lazy(() => import('./pages/CleanerStorefront'));
const ProviderSectionManager= React.lazy(() => import('./pages/ProviderSectionManager'));
const SearchResults         = React.lazy(() => import('./pages/SearchResults'));
const CleanerShopPage       = React.lazy(() => import('./pages/CleanerShopPage'));
const ClientFavorites       = React.lazy(() => import('./pages/ClientFavorites'));

/* ── Page loading fallback ── */
const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-white">
    <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin" />
  </div>
);

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const RoleRedirector = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (location.pathname !== '/') return;
    const dest = getRoleHome(user.role);
    navigate(dest, { replace: true });
  }, [isAuthenticated, user, location.pathname]);

  return null;
};

const AuthenticatedApp = () => {
  const { isLoadingPublicSettings, authError, navigateToLogin, appPublicSettings } = useAuth();

  if (isLoadingPublicSettings) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'user_banned') {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-sm">
            <h1 className="text-2xl font-bold text-red-600 mb-4">帳號已被封禁</h1>
            <p className="text-stone-600 mb-6">您的帳號因違反平台規定已被停用，無法訪問此平台。</p>
            <p className="text-xs text-stone-400">如有疑問，請聯繫客服支援。</p>
          </div>
        </div>
      );
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={
          <><RoleRedirector /><LayoutWrapper currentPageName={mainPageKey}><MainPage /></LayoutWrapper></>
        } />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route
            key={path}
            path={`/${path}`}
            element={
              <LayoutWrapper currentPageName={path}>
                <Page />
              </LayoutWrapper>
            }
          />
        ))}
        <Route path="/AdminAttendance"        element={<LayoutWrapper currentPageName="AdminAttendance"><AdminAttendance /></LayoutWrapper>} />
        <Route path="/MyBookings"             element={<LayoutWrapper currentPageName="MyBookings"><MyBookings /></LayoutWrapper>} />
        <Route path="/PaymentResult"          element={<LayoutWrapper currentPageName="PaymentResult"><PaymentResult /></LayoutWrapper>} />
        <Route path="/PaymentRedirect"        element={<LayoutWrapper currentPageName="PaymentRedirect"><PaymentRedirect /></LayoutWrapper>} />
        <Route path="/ServiceInquiry"         element={<LayoutWrapper currentPageName="ServiceInquiry"><ServiceInquiry /></LayoutWrapper>} />
        <Route path="/OrderQuery"             element={<LayoutWrapper currentPageName="OrderQuery"><OrderQuery /></LayoutWrapper>} />
        <Route path="/PrivacyPolicy"          element={<LayoutWrapper currentPageName="PrivacyPolicy"><PrivacyPolicy /></LayoutWrapper>} />
        <Route path="/TermsOfService"         element={<LayoutWrapper currentPageName="TermsOfService"><TermsOfService /></LayoutWrapper>} />
        <Route path="/JoinCleaner"            element={<LayoutWrapper currentPageName="JoinCleaner"><JoinCleaner /></LayoutWrapper>} />
        <Route path="/BusinessCooperation"    element={<LayoutWrapper currentPageName="BusinessCooperation"><BusinessCooperation /></LayoutWrapper>} />
        <Route path="/Recruitment"            element={<LayoutWrapper currentPageName="Recruitment"><Recruitment /></LayoutWrapper>} />
        <Route path="/CleanerTeam"            element={<LayoutWrapper currentPageName="CleanerTeam"><CleanerTeam /></LayoutWrapper>} />
        <Route path="/CleanerApplicationForm" element={<LayoutWrapper currentPageName="CleanerApplicationForm"><CleanerApplicationForm /></LayoutWrapper>} />
        <Route path="/CleanerManagement"      element={<LayoutWrapper currentPageName="CleanerManagement"><CleanerManagement /></LayoutWrapper>} />
        <Route path="/CleanerJobs"            element={<CleanerJobsPage />} />
        <Route path="/CleanerBulkImport"      element={<LayoutWrapper currentPageName="CleanerBulkImport"><CleanerBulkImport /></LayoutWrapper>} />
        <Route path="/GoogleSheetsManager"    element={<LayoutWrapper currentPageName="GoogleSheetsManager"><GoogleSheetsManager /></LayoutWrapper>} />
        <Route path="/SheetSyncLog"           element={<LayoutWrapper currentPageName="SheetSyncLog"><SheetSyncLog /></LayoutWrapper>} />
        <Route path="/ServiceCaseManager"     element={<LayoutWrapper currentPageName="ServiceCaseManager"><ServiceCaseManager /></LayoutWrapper>} />
        <Route path="/InternalSpreadsheet"    element={<InternalSpreadsheet />} />
        <Route path="/PartTimeSchedule"       element={<PartTimeSchedule />} />
        <Route path="/AdminShopProducts"      element={<AdminShopProducts />} />
        <Route path="/FlashTaskPost"          element={<FlashTaskPost />} />
        <Route path="/AdminUsers"             element={<LayoutWrapper currentPageName="AdminUsers"><AdminUsers /></LayoutWrapper>} />
        <Route path="/ClientShop"             element={<ClientShop />} />
        <Route path="/ClientProfileEdit"      element={<LayoutWrapper currentPageName="ClientProfileEdit"><ClientProfileEdit /></LayoutWrapper>} />
        <Route path="/ClientPersonalInfo"     element={<ClientPersonalInfo />} />
        <Route path="/ClientAddressList"      element={<ClientAddressList />} />
        <Route path="/ClientAddressForm"      element={<ClientAddressForm />} />
        <Route path="/VendorChatPage"         element={<VendorChatPage />} />
        <Route path="/AdminPermissions"       element={<LayoutWrapper currentPageName="AdminPermissions"><AdminPermissions /></LayoutWrapper>} />
        <Route path="/AdminSchedule"          element={<AdminSchedule />} />
        <Route path="/AdminShopBackend"       element={<AdminShopBackend />} />
        <Route path="/AdminSupport"           element={<AdminSupport />} />
        <Route path="/AdminDepartment"        element={<AdminDepartment />} />
        <Route path="/AdminMe"                element={<AdminMe />} />
        <Route path="/CleanerStorefront"      element={<CleanerStorefront />} />
        <Route path="/ProviderSectionManager" element={<ProviderSectionManager />} />
        <Route path="/SearchResults"          element={<SearchResults />} />
        <Route path="/CleanerShopPage"        element={<CleanerShopPage />} />
        <Route path="/ClientFavorites"       element={<ClientFavorites />} />
        <Route path="*"                       element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <NavigationTracker />
            <AuthenticatedApp />
          </Router>
          <Toaster />
          <VisualEditAgent />
        </QueryClientProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;