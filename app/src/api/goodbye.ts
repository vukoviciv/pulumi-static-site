import request from "./request";

const urls = { root: "/goodbye" };

export async function get() {
  return request.get(urls.root).then((res) => res.data);
}
