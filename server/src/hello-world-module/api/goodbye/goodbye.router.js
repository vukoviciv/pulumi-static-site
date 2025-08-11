import { Router } from "express";
import { GoodbyeController } from "./goodbye.controller.js";
import * as service from "./goodbye.service.js";

const router = Router();
const controller = new GoodbyeController(service);

router.get("/", controller.getGoodbye.bind(controller));

export default router;
