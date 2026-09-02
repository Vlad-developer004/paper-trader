import { useEffect } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { connectPriceFeed } from "./lib/binanceSocket.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { PortfolioPage } from "./pages/PortfolioPage.js";
import { HistoryPage } from "./pages/HistoryPage.js";
import { LeaderboardPage } from "./pages/LeaderboardPage.js";
import { LoginPage } from "./pages/LoginPage.js";
import { RegisterPage } from "./pages/RegisterPage.js";
import { Logo } from "./components/Logo.js";
import { Avatar } from "./components/Avatar.js";
import { ThemeToggle } from "./components/ThemeToggle.js";
import { DisclaimerBanner } from "./components/DisclaimerBanner.js";
import { Footer } from "./components/Footer.js";
import { BottomTabBar } from "./components/BottomTabBar.js";

const navLinks = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/history", label: "History" },
  { to: "/leaderboard", label: "Leaderboard" },
];

export default function App() {
  useEffect(() => {
    connectPriceFeed();
  }, []);

  return (
    <div className="min-h-screen bg-bg text-fg">
      <DisclaimerBanner />

      <nav className="flex items-center gap-2 px-4 py-5 md:px-12">
        <Logo />

        <div className="ml-14 hidden gap-1 rounded-full border border-border bg-card/70 p-1.5 backdrop-blur md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold ${
                  isActive ? "bg-fg text-bg" : "text-muted hover:text-fg"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3.5">
          <ThemeToggle />
          <NavLink to="/login">
            <Avatar />
          </NavLink>
        </div>
      </nav>

      <main className="px-4 pb-28 md:px-12 md:pb-6">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </main>

      <Footer />
      <BottomTabBar />
    </div>
  );
}
