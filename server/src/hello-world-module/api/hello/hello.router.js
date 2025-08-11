import { Router } from "express";
import { HelloController } from "./hello.controller.js";
import * as service from "./hello.service.js";

const router = Router();
const controller = new HelloController(service);

router.get("/", controller.getHello.bind(controller));

export default router;
