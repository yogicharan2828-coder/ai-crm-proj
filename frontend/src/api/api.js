import axios from "axios";

const api = axios.create({
  baseURL: "https://ai-crm-proj.onrender.com/",
});

export default api;