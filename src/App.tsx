import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./Components/login";
import ForgotPassword from "./Components/ForgetPassword";
import OTPVerification from "./Components/OTP";
import ResetPassword from "./Components/ResetPassword";
import Signup from "./Components/Signup";

import ReaderManagement from "./Components/management";
import ReaderDetailView from "./Components/ReaderDetailView";
import AuthorManagement from "./Components/AuthorManagement";
import AuthorDetailView from "./Components/AuthorDetailView";
import RequestsManagement from "./Components/RequestsManagement";
import RequestDetailView from "./Components/RequestDetailView";
import SubscriptionPlans from "./Components/SubscriptionPlans";
import ReportsAnalytics from "./Components/ReportsAnalytics";
import PrivacyPolicy from "./Components/PrivacyPolicy";
import FAQsManagement from "./Components/FAQsManagement";
import Dashboard from "./Components/Dashboard";
import Ebook from "./Components/Ebook";
import EbookDetails from "./Components/EbookDetails";
import Autograph from "./Components/Autograph";
import QueryManagement from "./Components/QueryManagement";
import PlatformSettings from "./Components/PlatformSettings";
import Profile from "./Components/Profile";
import Notification from "./Components/Notification";

function ProtectedRoute() {
  const token = localStorage.getItem("token");

  return token ? <Outlet /> : <Navigate to="/" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/otp" element={<OTPVerification />} />

        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/signup" element={<Signup />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/readers" element={<ReaderManagement />} />

          <Route path="/reader-detail" element={<ReaderDetailView />} />

          <Route path="/author-management" element={<AuthorManagement />} />

          <Route path="/author-detail" element={<AuthorDetailView />} />

          <Route path="/requests" element={<RequestsManagement />} />

          <Route path="/request-detail" element={<RequestDetailView />} />

          <Route path="/subscription-plans" element={<SubscriptionPlans />} />

          <Route path="/reports-analytics" element={<ReportsAnalytics />} />

          <Route path="/privacy-policy" element={<PrivacyPolicy />} />

          <Route path="/faqs" element={<FAQsManagement />} />

          <Route path="/ebooks" element={<Ebook />} />

          <Route path="/ebook-detail" element={<EbookDetails />} />

          <Route path="/autograph" element={<Autograph />} />

          <Route path="/query-management" element={<QueryManagement />} />

          <Route path="/platform-settings" element={<PlatformSettings />} />

          <Route path="/profile" element={<Profile />} />

          <Route path="/notification" element={<Notification />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
