import { Sparkles, ArrowRight, Bot } from "lucide-react";

export default function HeroBanner() {
  const scrollToSection = (id) => {
    const section = document.getElementById(id);

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
      <div className="relative overflow-hidden rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 p-6 sm:p-8 lg:p-10">
        {/* Background Glow */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-cyan-500/20 blur-3xl rounded-full"></div>

        <div className="relative z-10">
          {/* Badge */}
          <div className="flex items-center gap-2 text-cyan-300 mb-4">
            <Sparkles size={18} />
            <span className="text-xs sm:text-sm font-semibold tracking-wide uppercase">
              AI Powered Healthcare CRM
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight break-words">
            Welcome Back,
            <br />
            Medical Representative 👋
          </h1>

          {/* Description */}
          <p className="text-slate-300 mt-4 sm:mt-6 max-w-2xl text-base sm:text-lg leading-7 sm:leading-8">
            Log doctor interactions, generate AI-powered follow-ups, manage
            HCP relationships, and improve field productivity from one
            intelligent AI-powered CRM platform.
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap gap-4 sm:gap-5 mt-8 sm:mt-10">
            <button
              onClick={() => scrollToSection("new-interaction")}
              className="group flex items-center gap-3 bg-cyan-500 hover:bg-cyan-400 transition-all duration-300 px-5 sm:px-7 py-3 rounded-xl font-semibold text-white shadow-lg shadow-cyan-500/30 hover:scale-105"
            >
              New Interaction
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>

            <button
              onClick={() => scrollToSection("ai-assistant")}
              className="group flex items-center gap-3 border border-cyan-400 text-cyan-300 hover:bg-cyan-500/10 transition-all duration-300 px-5 sm:px-7 py-3 rounded-xl hover:scale-105"
            >
              <Bot size={18} />
              AI Assistant
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}