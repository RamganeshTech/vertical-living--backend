import { Router } from "express";
import { getTipsForStage,
upsertStageTip, 
deleteStageTip,  
markStageAsViewed,
toggleUserGuidePreference} from "../../controllers/guide_controllers/guide.controller";
import { multiRoleAuthMiddleware } from "../../middlewares/multiRoleAuthMiddleware";

const GuideRoutes = Router();

// Base Route: /api/guideline

// ✅ GET Tips for a specific stage
// Usage: GET /api/guideline/org_12345/cleaning_stage
GuideRoutes.get("/:organizationId/:stageName", getTipsForStage);

// ✅ UPSERT (Create OR Update) a Tip
// Usage: POST /api/guideline
// Body: { "organizationId": "...", "stageName": "...", "tipText": "...", "tipId": "optional_if_updating" }
GuideRoutes.post("/", multiRoleAuthMiddleware("owner", "CTO"), upsertStageTip);

// ✅ DELETE a Tip
// Usage: DELETE /api/guideline
// Body: { "organizationId": "...", "stageName": "...", "tipId": "..." }
GuideRoutes.delete("/delete", multiRoleAuthMiddleware("owner"), deleteStageTip);


// ✅ PATCH: Mark Stage as Viewed
// Usage: No specific role check needed strictly, but user must be logged in
GuideRoutes.patch("/viewed", multiRoleAuthMiddleware("owner", "CTO", "staff", "worker"), markStageAsViewed);

// ✅ PATCH: Toggle User Preference
// Usage: Accessible by anyone who can log in (except maybe client if you want to restrict them)
GuideRoutes.patch("/preference/:organizationId", multiRoleAuthMiddleware("owner", "CTO", "staff", "worker", "client"), toggleUserGuidePreference);

export default  GuideRoutes;