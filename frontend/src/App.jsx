import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./lib/WalletContext";
import { ThemeProvider } from "./lib/ThemeContext";
import { ToastProvider } from "./lib/ToastContext";
import { MemesProvider } from "./lib/MemesContext";
import TopTicker from "./components/TopTicker";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import Explore from "./pages/Explore";
import Launch from "./pages/Launch";
import MemeDetail from "./pages/MemeDetail";
import Profile from "./pages/Profile";
import Swap from "./pages/Swap";
import Send from "./pages/Send";

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <WalletProvider>
          <MemesProvider>
            <BrowserRouter>
              <div className="app-header">
                <TopTicker />
                <NavBar />
              </div>
              <Routes>
                <Route path="/" element={<Explore />} />
                <Route path="/launch" element={<Launch />} />
                <Route path="/meme/:tokenAddress" element={<MemeDetail />} />
                <Route path="/profile/:address" element={<Profile />} />
                <Route path="/swap" element={<Swap />} />
                <Route path="/send" element={<Send />} />
              </Routes>
              <Footer />
            </BrowserRouter>
          </MemesProvider>
        </WalletProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
