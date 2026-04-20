/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Toaster } from 'sonner';
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomeLandingPage } from './components/HomeLandingPage';
import { ProductsPage } from './components/ProductsPage';
import { ProductScene } from './components/ProductScene';
import { VisualLabProvider, useVisualLab } from './components/VisualLabContext';
import LoginPage from './components/LoginPage';
import { CustomerPortal } from './components/CustomerPortal';
import { EmployeePortal } from './components/EmployeePortal';
import { SupplierPortal } from './components/SupplierPortal';
import { StudioShowcase } from './components/StudioShowcase';
import { MemberTenderAccessPage } from './components/MemberTenderAccess';
import { CommunityPostPage, DesignCommunity, KnowledgeArticlePage } from './components/DesignCommunity';
import { PdfPreviewProvider } from './components/PdfPreviewContext';
import {
  StudioCreativeIndexRedirect,
  StudioCreativeModeRoute,
  StudioCreativeShell,
} from './components/StudioCreativeRoute';
import { fetchSupplierPortalSession } from './inventory/api';

function AppContent() {
  const { isLoggedIn, userRole, setIsLoggedIn, setUserRole, setIsViewingPortal } = useVisualLab();

  useEffect(() => {
    if (isLoggedIn) {
      return;
    }

    let cancelled = false;

    const hydrateSupplierSession = async () => {
      try {
        const session = await fetchSupplierPortalSession();
        if (!session.ok) {
          return;
        }
        if (cancelled) {
          return;
        }

        setIsLoggedIn(true);
        setUserRole('supplier');
        setIsViewingPortal(true);
      } catch {
        if (cancelled) {
          return;
        }

        setIsLoggedIn(false);
      }
    };

    void hydrateSupplierSession();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, setIsLoggedIn, setIsViewingPortal, setUserRole]);

  return (
    <>
      <ProductScene />
      <Routes>
      <Route path="/" element={<HomeLandingPage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/customize" element={<StudioShowcase />} />
      <Route path="/customize/:designId" element={<StudioShowcase />} />
      <Route path="/members/tenders" element={<MemberTenderAccessPage />} />
      <Route path="/community" element={<DesignCommunity />} />
      <Route path="/community/posts/:postId" element={<CommunityPostPage />} />
      <Route path="/community/articles/:articleId" element={<KnowledgeArticlePage />} />
      <Route path="/customize/gallery" element={<Navigate to="/community?type=generated_design" replace />} />
      <Route path="/projects" element={<Navigate to="/community?type=built_project" replace />} />
      <Route path="/studio/creative" element={<StudioCreativeShell />}>
        <Route index element={<StudioCreativeIndexRedirect />} />
        <Route path="ad-builder" element={<StudioCreativeModeRoute routeMode="ad-builder" />} />
        <Route path="cutout" element={<StudioCreativeModeRoute routeMode="cutout" />} />
        <Route path="visualizer" element={<StudioCreativeModeRoute routeMode="visualizer" />} />
      </Route>
      
      <Route 
        path="/portal/*" 
        element={
          isLoggedIn ? (
            userRole === 'customer' ? <CustomerPortal /> : userRole === 'supplier' ? <SupplierPortal /> : <EmployeePortal />
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
        <PdfPreviewProvider>
          <Toaster position="top-center" richColors theme="dark" />
          <AppContent />
          <LoginPage />
        </PdfPreviewProvider>
      </BrowserRouter>
    </VisualLabProvider>
  );
}
