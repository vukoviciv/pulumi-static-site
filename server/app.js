import express from "express";
import helloRouter from "./src/hello-world-module/api/hello/hello.router.js";
import goodbyeRouter from "./src/hello-world-module/api/goodbye/goodbye.router.js";
import cors from "cors";

// TODO: move to config and register origins for non-dev environment
const corsOptions = {
  origin: "*",
};

const app = express();

app.use(cors(corsOptions));

// Register routers
app.use("/hello", helloRouter);
app.use("/goodbye", goodbyeRouter);

export default app;
