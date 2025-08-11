import axios from "axios";

const request = axios.create({
  baseURL: "http://localhost:3000",
  headers: { "Content-Type": "application/json" },
});

const urls = {
  root: "/hello",
};

export async function get() {
  return request.get(urls.root).then((res) => res.data);
}
