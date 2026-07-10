export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-slate-950/90 backdrop-blur-xl">

      <div className="max-w-7xl mx-auto px-8 py-12">

        <div className="grid md:grid-cols-3 gap-10">

          {/* Brand */}

          <div>

            <h2 className="text-3xl font-bold text-cyan-400">
              AI First CRM
            </h2>

            <p className="text-slate-400 mt-2">
              Healthcare Professional Module
            </p>

            <p className="text-slate-500 mt-6 leading-7">
              AI-powered Healthcare CRM platform designed to streamline
              doctor interactions, automate follow-ups, generate AI
              clinical insights, and improve medical representative
              productivity.
            </p>

          </div>

          {/* Tech Stack */}

          <div>

            <h3 className="text-white text-xl font-semibold mb-5">
              Tech Stack
            </h3>

            <div className="flex flex-wrap gap-3">

              {[
                "React",
                "FastAPI",
                "PostgreSQL",
                "Redux",
                "Tailwind CSS",
                "LangGraph",
                "Groq AI",
              ].map((tech) => (

                <span
                  key={tech}
                  className="bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-full text-sm hover:border-cyan-400 hover:text-cyan-300 transition-all duration-300"
                >
                  {tech}
                </span>

              ))}

            </div>

          </div>

          {/* Connect */}

          <div>

            <h3 className="text-white text-xl font-semibold mb-5">
              Connect
            </h3>

            <div className="space-y-4">

              <a
                href="mailto:yogicharan2828@gmail.com"
                className="block text-slate-300 hover:text-cyan-400 transition-all duration-300"
              >
                📧 yogicharan2828@gmail.com
              </a>

              <a
                href="https://www.linkedin.com/in/yogi-charan-sharma-235b62282/"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-slate-300 hover:text-cyan-400 transition-all duration-300"
              >
                💼 LinkedIn Profile
              </a>

              <a
                href="https://charansharmaportfolio.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-slate-300 hover:text-cyan-400 transition-all duration-300"
              >
                🌐 Portfolio Website
              </a>

              <a
                href="https://www.instagram.com/charan_tarak_28?igsh=MXRtZ3hjOHB6cmtvNQ%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-slate-300 hover:text-pink-400 transition-all duration-300"
              >
                📷 Instagram
              </a>

            </div>

          </div>

        </div>

        {/* Bottom */}

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">

          <p className="text-slate-500 text-sm">
            © 2026 AI First CRM. All Rights Reserved.
          </p>

          <p className="text-slate-400 text-sm mt-3 md:mt-0">
            Designed & Developed with ❤️ by{" "}
            <span className="text-cyan-400 font-semibold">
              Yogi Charan Sharma
            </span>
          </p>

        </div>

      </div>

    </footer>
  );
}