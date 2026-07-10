import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Stethoscope,
  LayoutDashboard,
  Bot,
  Bell,
  UserCircle2,
  User,
  Briefcase,
  LogOut,
} from "lucide-react";

export default function Navbar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  const scrollToSection = (id) => {
    const section = document.getElementById(id);

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/10 border-b border-white/20">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-5">

        {/* Logo */}
        <div className="flex items-center gap-3">

          <div className="w-12 h-12 rounded-2xl bg-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/40">

            <Stethoscope size={26} className="text-white" />

          </div>

          <div>
            <h1 className="text-white font-bold text-2xl">
              AI First CRM
            </h1>

            <p className="text-cyan-200 text-sm">
              Healthcare Professional Module
            </p>
          </div>

        </div>

        {/* Navigation */}
        <div className="hidden md:flex gap-10 text-slate-300 font-medium">

          <button
            onClick={() => scrollToSection("dashboard")}
            className="flex items-center gap-2 hover:text-cyan-400 transition"
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>

          <button
            onClick={() => scrollToSection("ai-assistant")}
            className="flex items-center gap-2 hover:text-cyan-400 transition"
          >
            <Bot size={18} />
            AI Assistant
          </button>

        </div>

        {/* Right */}
        <div className="flex items-center gap-6 relative">

          <button
            onClick={() =>
              toast.info("🔔 No new notifications")
            }
          >
            <Bell
              className="text-slate-300 hover:text-cyan-400 cursor-pointer transition"
              size={22}
            />
          </button>

          <button
            onClick={() =>
              setProfileOpen(!profileOpen)
            }
          >
            <UserCircle2
              className="text-cyan-300 hover:text-cyan-200 transition"
              size={36}
            />
          </button>

          {profileOpen && (
            <div
              ref={dropdownRef}
              className="absolute top-14 right-0 w-60 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden"
            >

              <div className="px-5 py-4 border-b border-white/10">

                <h3 className="text-white font-semibold">
                  Demo User
                </h3>

                <p className="text-cyan-300 text-sm">
                  Medical Representative
                </p>

              </div>

              <button className="w-full flex items-center gap-3 px-5 py-4 hover:bg-cyan-500/10 text-slate-300 transition">
                <User size={18} />
                Profile
              </button>

              <button className="w-full flex items-center gap-3 px-5 py-4 hover:bg-cyan-500/10 text-slate-300 transition">
                <Briefcase size={18} />
                Role
              </button>

              <button
                onClick={() =>
                  toast.info("Logout feature coming soon!")
                }
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-red-500/10 text-red-300 transition"
              >
                <LogOut size={18} />
                Logout
              </button>

            </div>
          )}

        </div>

      </div>
    </nav>
  );
}