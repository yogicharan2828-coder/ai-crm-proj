import { useEffect, useState } from "react";
import { X, CalendarDays, Building2, Stethoscope } from "lucide-react";
import api from "../api/api";

export default function History({ refreshKey }) {
  const [history, setHistory] = useState([]);
  const [selectedInteraction, setSelectedInteraction] = useState(null);

  const fetchHistory = async () => {
    try {
      const res = await api.get("/interactions");
      setHistory(res.data);
    } catch (err) {
      console.error("History Error:", err);
    }
  };

  useEffect(() => {
    const loadHistory = async () => {
      await fetchHistory();
    };

    loadHistory();
  }, [refreshKey]);

  return (
    <section
      id="history"
      className="max-w-7xl mx-auto mt-14 px-8"
    >
      <div className="flex items-center justify-between mb-8">

        <h2 className="text-3xl font-bold text-white">
          📋 Recent HCP Interactions
        </h2>

        <span className="text-cyan-300 text-sm">
          {history.length} Records
        </span>

      </div>

      {history.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center text-slate-300">
          No interactions available.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">

          {history.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedInteraction(item)}
              className="cursor-pointer bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-400 hover:shadow-xl hover:shadow-cyan-500/20"
            >

              <div className="flex justify-between items-center">

                <h3 className="text-xl font-bold text-cyan-400">
                  {item.doctor_name}
                </h3>

                <span className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-sm">
                  {item.interaction_type}
                </span>

              </div>

              <div className="mt-4 space-y-2">

                <p className="text-slate-300 flex items-center gap-2">
                  <Building2 size={16} />
                  {item.hospital}
                </p>

                <p className="text-slate-300 flex items-center gap-2">
                  <Stethoscope size={16} />
                  {item.specialization}
                </p>

              </div>

              <p className="text-white mt-5 line-clamp-2">
                {item.summary}
              </p>

              <div className="flex items-center gap-2 mt-5 text-sm text-slate-400">

                <CalendarDays size={15} />

                {item.follow_up_date || "No Follow-up"}

              </div>

            </div>
          ))}

        </div>
      )}

      {selectedInteraction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">

          <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-[650px] max-w-[90%] relative">

            <button
              onClick={() => setSelectedInteraction(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X />
            </button>

            <h2 className="text-3xl font-bold text-cyan-400 mb-6">
              {selectedInteraction.doctor_name}
            </h2>

            <div className="space-y-4 text-slate-300">

              <p>
                <strong>🏥 Hospital:</strong>{" "}
                {selectedInteraction.hospital}
              </p>

              <p>
                <strong>🩺 Specialization:</strong>{" "}
                {selectedInteraction.specialization}
              </p>

              <p>
                <strong>📞 Interaction:</strong>{" "}
                {selectedInteraction.interaction_type}
              </p>

              <p>
                <strong>📝 Summary:</strong>
                <br />
                {selectedInteraction.summary}
              </p>

              <p>
                <strong>📅 Follow-up:</strong>{" "}
                {selectedInteraction.follow_up_date || "Not Scheduled"}
              </p>

            </div>

          </div>

        </div>
      )}

    </section>
  );
}