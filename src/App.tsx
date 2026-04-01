/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Toaster } from 'sonner';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomeLandingPage } from './components/HomeLandingPage';
import { ProductsPage } from './components/ProductsPage';
import { ProductScene } from './components/ProductScene';
import { VisualLabProvider, useVisualLab } from './components/VisualLabContext';
import LoginPage from './components/LoginPage';
import { CustomerPortal } from './components/CustomerPortal';
import { EmployeePortal } from './components/EmployeePortal';
import { CustomizeStudio } from './components/CustomizeStudio';
import { DesignCommunity } from './components/DesignCommunity';
import { StudioShowcase } from './components/StudioShowcase';

function AppContent() {
  const { isLoggedIn, userRole } = useVisualLab();

  return (
    <>
      <ProductScene />
      <Routes>
      <Route path="/" element={<HomeLandingPage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/customize" element={<StudioShowcase />} />
      <Route path="/customize/:designId" element={<StudioShowcase />} />
      <Route path="/community" element={<DesignCommunity />} />
      <Route path="/customize/gallery" element={<Navigate to="/community?type=generated_design" replace />} />
      <Route path="/projects" element={<Navigate to="/community?type=built_project" replace />} />
      
      <Route 
        path="/portal/*" 
        element={
          isLoggedIn ? (
            userRole === 'customer' ? <CustomerPortal /> : <EmployeePortal />
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <VisualLabProvider>
      <BrowserRouter>
        <Toaster position="top-center" richColors theme="dark" />
        <AppContent />
        <LoginPage />
      </BrowserRouter>
    </VisualLabProvider>
  );
}

