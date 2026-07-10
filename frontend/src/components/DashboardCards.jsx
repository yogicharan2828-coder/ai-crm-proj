import { useEffect, useState } from "react";
import {
  Calendar,
  Brain,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import api from "../api/api";

export default function DashboardCards({ refreshKey }) {
  const [stats, setStats] = useState({
    total_interactions: 0,
    ai_insights: 0,
    pending_followups: 0,
  });

  const [displayStats, setDisplayStats] = useState({
    total_interactions: 0,
    ai_insights: 0,
    pending_followups: 0,
  });

  // Fetch dashboard stats
  const fetchStats = async () => {
    try {
      const res = await api.get("/dashboard/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Dashboard Error:", err);
    }
  };

 useEffect(() => {
  let ignore = false;

  const loadStats = async () => {
    try {
      const res = await api.get("/dashboard/stats");

      if (!ignore) {
        setStats(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  loadStats();

  return () => {
    ignore = true;
  };
}, [refreshKey]);

  // Animated counters
  useEffect(() => {
    const duration = 800;
    const interval = 20;

    const animate = (key) => {
      const target = stats[key];
      let current = 0;

      const step = Math.max(1, Math.ceil(target / (duration / interval)));

      const timer = setInterval(() => {
        current += step;

        if (current >= target) {
          current = target;
          clearInterval(timer);
        }

        setDisplayStats((prev) => ({
          ...prev,
          [key]: current,
        }));
      }, interval);

      return timer;
    };

    const timers = [
      animate("total_interactions"),
      animate("ai_insights"),
      animate("pending_followups"),
    ];

    return () => timers.forEach(clearInterval);
  }, [stats]);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const cards = [
    {
      title: "Total Interactions",
      value: displayStats.total_interactions,
      icon: <Calendar size={32} />,
      subtitle: "Updated Today",
      color: "from-cyan-500 to-blue-500",
      action: () => scrollToSection("history"),
    },
    {
      title: "AI Insights",
      value: displayStats.ai_insights,
      icon: <Brain size={32} />,
      subtitle: "AI Powered",
      color: "from-purple-500 to-pink-500",
      action: () => scrollToSection("ai-panel"),
    },
    {
      title: "Pending Follow-ups",
      value: displayStats.pending_followups,
      icon: <Clock size={32} />,
      subtitle: "Requires Attention",
      color: "from-orange-500 to-red-500",
      action: () => scrollToSection("history"),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 px-8">

      {cards.map((card, index) => (

        <div
          key={index}
          onClick={card.action}
          className="
            cursor-pointer
            group
            rounded-3xl
            p-6
            backdrop-blur-xl
            bg-white/10
            border
            border-white/10
            transition-all
            duration-300
            hover:-translate-y-2
            hover:scale-[1.02]
            hover:border-cyan-400/50
            hover:shadow-2xl
            hover:shadow-cyan-500/20
          "
        >

          <div className="flex justify-between items-start">

            <div>

              <p className="text-slate-300 text-sm">
                {card.title}
              </p>

              <h2 className="text-5xl font-bold text-white mt-3">
                {card.value}
              </h2>

              <div className="flex items-center gap-2 mt-4 text-cyan-300 text-sm">

                <ArrowUpRight size={16} />

                {card.subtitle}

              </div>

            </div>

            <div
              className={`
                w-16
                h-16
                rounded-2xl
                flex
                items-center
                justify-center
                bg-gradient-to-br
                ${card.color}
                text-white
                shadow-lg
                group-hover:rotate-6
                group-hover:scale-110
                transition-all
                duration-300
              `}
            >
              {card.icon}
            </div>

          </div>

          <div className="mt-6 h-1 rounded-full bg-white/10 overflow-hidden">

            <div
              className={`
                h-full
                rounded-full
                bg-gradient-to-r
                ${card.color}
                w-full
              `}
            />

          </div>

        </div>

      ))}

    </div>
  );
}