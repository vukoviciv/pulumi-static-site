import express from "express";
import helloRouter from "./src/hello-world-module/api/hello/hello.router.js";
import goodbyeRouter from "./src/hello-world-module/api/goodbye/goodbye.router.js";

const app = express();

app.use("/", helloRouter);
app.use("/goodbye", goodbyeRouter);

export default app;
