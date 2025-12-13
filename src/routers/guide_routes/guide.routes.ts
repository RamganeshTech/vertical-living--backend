import { Router } from "express";
import { getTipsForStage,
upsertStageTip, 
deleteStageTip,  
toggleUserGuidePreference} from "../../controllers/guide_controllers/guide.controller";
import { multiRoleAuthMiddleware } from "../../middlewares/multiRoleAuthMiddleware";

const GuideRoutes = Router();

// Base Route: /api/guideline

GuideRoutes.get("/:organizationId/:stageName", getTipsForStage);

GuideRoutes.post("/", multiRoleAuthMiddleware("owner", "CTO"), upsertStageTip);

GuideRoutes.delete("/delete", multiRoleAuthMiddleware("owner"), deleteStageTip);
GuideRoutes.patch("/preference/:organizationId", multiRoleAuthMiddleware("owner", "CTO", "staff", "worker", "client"), toggleUserGuidePreference);

export default  GuideRoutes;