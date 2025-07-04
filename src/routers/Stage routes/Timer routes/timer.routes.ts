// routes/stageTimer.routes.ts (example)

import express from "express";
import { startStageTimer } from "../../../controllers/stage controllers/Timer Controllers/timer.controllers";
import { multiRoleAuthMiddleware } from "../../../middlewares/multiRoleAuthMiddleware";

const stageTimerRoutes = express.Router();

/**
 * Start the timer for any stage
 * Example: POST /api/stage-timer/start/requirementform/12345
 */
stageTimerRoutes.post("/start/:stageName/:projectId", multiRoleAuthMiddleware("CTO", "owner", "staff"), startStageTimer);

export default stageTimerRoutes;
