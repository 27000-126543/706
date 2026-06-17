import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.js";
import MainLayout from "./components/layout/MainLayout.js";
import ProtectedRoute from "./components/ProtectedRoute.js";
import DashboardOverview from "./pages/dashboard/DashboardOverview.js";
import ProvinceDetail from "./pages/dashboard/ProvinceDetail.js";
import HydrogenProduction from "./pages/monitoring/HydrogenProduction.js";
import StorageMonitoring from "./pages/monitoring/StorageMonitoring.js";
import TransportMonitoring from "./pages/monitoring/TransportMonitoring.js";
import RefuelingMonitoring from "./pages/monitoring/RefuelingMonitoring.js";
import AlertList from "./pages/alerts/AlertList.js";
import AlertApproval from "./pages/alerts/AlertApproval.js";
import PlanUpload from "./pages/forecast/PlanUpload.js";
import GapAnalysis from "./pages/forecast/GapAnalysis.js";
import Recommendations from "./pages/forecast/Recommendations.js";
import ReportList from "./pages/reports/ReportList.js";
import ReportDetail from "./pages/reports/ReportDetail.js";
import UserManagement from "./pages/admin/UserManagement.js";
import PermissionConfig from "./pages/admin/PermissionConfig.js";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardOverview />} />
          <Route path="/dashboard/province/:code" element={<ProvinceDetail />} />
          
          <Route path="/monitoring/hydrogen-production" element={<HydrogenProduction />} />
          <Route path="/monitoring/storage" element={<StorageMonitoring />} />
          <Route path="/monitoring/transport" element={<TransportMonitoring />} />
          <Route path="/monitoring/refueling" element={<RefuelingMonitoring />} />
          
          <Route path="/alerts" element={<AlertList />} />
          <Route path="/alerts/approval/:id" element={<AlertApproval />} />
          
          <Route
            path="/forecast/upload"
            element={
              <ProtectedRoute requiredRoles={['national', 'provincial']}>
                <PlanUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/forecast/analysis"
            element={
              <ProtectedRoute requiredRoles={['national', 'provincial']}>
                <GapAnalysis />
              </ProtectedRoute>
            }
          />
          <Route
            path="/forecast/recommendations"
            element={
              <ProtectedRoute requiredRoles={['national', 'provincial']}>
                <Recommendations />
              </ProtectedRoute>
            }
          />
          
          <Route path="/reports" element={<ReportList />} />
          <Route path="/reports/:id" element={<ReportDetail />} />
          
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredRoles={['national']}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/permissions"
            element={
              <ProtectedRoute requiredRoles={['national']}>
                <PermissionConfig />
              </ProtectedRoute>
            }
          />
        </Route>
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
