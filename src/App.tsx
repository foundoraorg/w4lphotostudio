import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Footer } from "./components/Footer";
import { Nav } from "./components/Nav";
import { WhatsAppButton } from "./components/WhatsAppButton";
import { BookingProvider } from "./components/booking/BookingContext";
import { BookingDrawer } from "./components/booking/BookingDrawer";
import { FlyerProvider } from "./components/gallery3d/FlyerContext";
import { ToastProvider } from "./components/ui/Toast";
import { CatalogueProvider } from "./lib/catalogue";
import { CurrencyProvider } from "./lib/currency";
import { SavedProvider } from "./lib/saved";
import { Home } from "./pages/Home";
import { NotFound } from "./pages/NotFound";
import { Sessions } from "./pages/Sessions";
import { SessionDetail } from "./pages/SessionDetail";
import { Estimate } from "./pages/Estimate";
import { Admin } from "./pages/Admin";
import { Studio } from "./pages/Studio";
import { Contact } from "./pages/Contact";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);
  return null;
}

function Shell() {
  return (
    <div className="flex min-h-screen flex-col bg-wall">
      <ScrollToTop />
      <Nav />
      <main id="main" className="flex-1 pt-16 lg:pt-[72px]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/index" element={<Home />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/sessions/:slug" element={<SessionDetail />} />
          <Route path="/estimate" element={<Estimate />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <CatalogueProvider>
        <CurrencyProvider>
          <ToastProvider>
            <SavedProvider>
              <BookingProvider>
                <FlyerProvider>
                  <Shell />
                  <BookingDrawer />
                </FlyerProvider>
              </BookingProvider>
            </SavedProvider>
          </ToastProvider>
        </CurrencyProvider>
      </CatalogueProvider>
    </BrowserRouter>
  );
}
