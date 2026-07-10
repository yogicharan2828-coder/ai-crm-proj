import { useState } from "react";

import Navbar from "./components/Navbar";
import HeroBanner from "./components/HeroBanner";
import DashboardCards from "./components/DashboardCards";
import InteractionForm from "./components/InteractionForm";
import AIResponse from "./components/AIResponse";
import History from "./components/History";
import ChatInterface from "./components/ChatInterface";
import Footer from "./components/Footer";

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshDashboard = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950">

      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section id="hero">
        <HeroBanner />
      </section>

      {/* Dashboard */}
      <section id="dashboard">
        <DashboardCards refreshKey={refreshKey} />
      </section>

      {/* Interaction Form + AI Assistant */}
      <section className="max-w-7xl mx-auto px-8 mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">

        <div id="new-interaction">
          <InteractionForm onRefresh={refreshDashboard} />
        </div>

        <div id="ai-assistant">
          <AIResponse />
        </div>

      </section>

      {/* Interaction History */}
      <section id="history">
        <History refreshKey={refreshKey} />
          <ChatInterface />
          <Footer />
      </section>

      {/* AI Chatbot */}
      
        
      

    </div>
  );
}