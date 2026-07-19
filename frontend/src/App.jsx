import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./lib/WalletContext";
import { ThemeProvider } from "./lib/ThemeContext";
import { ToastProvider } from "./lib/ToastContext";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import Explore from "./pages/Explore";
import Launch from "./pages/Launch";
import MemeDetail from "./pages/MemeDetail";

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <WalletProvider>
          <BrowserRouter>
            <NavBar />
            <Routes>
              <Route path="/" element={<Explore />} />
              <Route path="/launch" element={<Launch />} />
              <Route path="/meme/:tokenAddress" element={<MemeDetail />} />
            </Routes>
            <Footer />
          </BrowserRouter>
        </WalletProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
