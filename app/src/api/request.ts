import axios from "axios";

// TODO: import url from env depending on the stack
const request = axios.create({
  baseURL:
    "http://lb-20250825080459426200000002-697227279.us-east-1.elb.amazonaws.com",
  headers: { "Content-Type": "application/json" },
});

export default request;
