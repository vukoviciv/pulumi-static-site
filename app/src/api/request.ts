import axios from "axios";

const baseUrl = import.meta.env.VITE_API_URL;

const request = axios.create({
  baseURL: baseUrl,
  headers: { "Content-Type": "application/json" },
});

export default request;
