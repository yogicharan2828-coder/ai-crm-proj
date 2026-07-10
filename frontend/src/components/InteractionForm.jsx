import { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";

import { setAIResponse } from "../redux/interactionSlice";
import api from "../api/api";

export default function InteractionForm({ onRefresh }) {
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    doctor_name: "",
    hospital: "",
    specialization: "",
    interaction_type: "Visit",
    summary: "",
    follow_up_date: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const generateAI = async () => {
    try {
      setLoading(true);

      const response = await api.post("/ai/generate", formData);

      dispatch(setAIResponse(response.data.response));

      if (onRefresh) {
        onRefresh();
      }

      toast.success("AI Insights Generated Successfully!");

      setFormData({
        doctor_name: "",
        hospital: "",
        specialization: "",
        interaction_type: "Visit",
        summary: "",
        follow_up_date: "",
      });

    } catch (error) {
      console.error(error);
      toast.error("Failed to generate AI insights.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8">

      <h2 className="text-2xl font-bold text-white mb-6">
        Log HCP Interaction
      </h2>

      <div className="space-y-5">

        <input
          type="text"
          name="doctor_name"
          value={formData.doctor_name}
          onChange={handleChange}
          placeholder="Doctor Name"
          className="w-full bg-slate-800/60 text-white rounded-xl px-4 py-3 outline-none border border-slate-700 focus:border-cyan-400"
        />

        <input
          type="text"
          name="hospital"
          value={formData.hospital}
          onChange={handleChange}
          placeholder="Hospital"
          className="w-full bg-slate-800/60 text-white rounded-xl px-4 py-3 outline-none border border-slate-700 focus:border-cyan-400"
        />

        <input
          type="text"
          name="specialization"
          value={formData.specialization}
          onChange={handleChange}
          placeholder="Specialization"
          className="w-full bg-slate-800/60 text-white rounded-xl px-4 py-3 outline-none border border-slate-700 focus:border-cyan-400"
        />

        <select
          name="interaction_type"
          value={formData.interaction_type}
          onChange={handleChange}
          className="w-full bg-slate-800/60 text-white rounded-xl px-4 py-3 outline-none border border-slate-700 focus:border-cyan-400"
        >
          <option value="Visit">Visit</option>
          <option value="Call">Call</option>
          <option value="Email">Email</option>
          <option value="Conference">Conference</option>
        </select>

        <textarea
          rows={5}
          name="summary"
          value={formData.summary}
          onChange={handleChange}
          placeholder="Interaction Summary..."
          className="w-full bg-slate-800/60 text-white rounded-xl px-4 py-3 outline-none border border-slate-700 focus:border-cyan-400"
        />

        <input
          type="date"
          name="follow_up_date"
          value={formData.follow_up_date}
          onChange={handleChange}
          className="w-full bg-slate-800/60 text-white rounded-xl px-4 py-3 outline-none border border-slate-700 focus:border-cyan-400"
        />

        <button
          type="button"
          onClick={generateAI}
          disabled={loading}
          className="w-full bg-cyan-500 hover:bg-cyan-400 transition py-3 rounded-xl text-white font-semibold disabled:opacity-60"
        >
          {loading ? "Generating AI Insights..." : "✨ Generate AI Insights"}
        </button>

      </div>
    </div>
  );
}