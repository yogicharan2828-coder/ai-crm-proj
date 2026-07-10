import Navbar from "../components/Navbar";
import DashboardCards from "../components/DashboardCards";
import InteractionForm from "../components/InteractionForm";
import AIResponse from "../components/AIResponse";
import RecentInteractions from "../components/RecentInteractions";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-cyan-900 text-white">

      <Navbar />

      <div className="max-w-7xl mx-auto p-8">

        <DashboardCards />

        <div className="grid lg:grid-cols-2 gap-8 mt-8">

          <InteractionForm />

          <AIResponse />

        </div>

        <RecentInteractions />

      </div>

    </div>
  );
}