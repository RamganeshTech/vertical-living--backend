import express from 'express';
import { multiRoleAuthMiddleware } from '../../middlewares/multiRoleAuthMiddleware';
import { clonePreSalesQuote, createPreSalesQuote, deletePreSalesQuote, getAllPreSalesQuotes, getSinglePreSalesQuote, updatePreSalesQuote, updatePreSalesQuoteName } from '../../controllers/Quote Controllers/PreSalesQuote_controller/preSalesQuote.controller';

const PreSalesRoutes = express.Router();

/**
 * BASE ROUTE: /api/quote/presales
 */

// 1. Create Initial Main Quote (Step 1)
PreSalesRoutes.post(
    "/createmainquote",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    createPreSalesQuote
);


// 1. Create Initial Main Quote (Step 1)
PreSalesRoutes.put(
    "/updatemainquote/:quoteId",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    updatePreSalesQuoteName
);





// 2. Get All Quotes (Infinite Scroll / List View)
// Note: organizationId should be passed in query params or as a route param
PreSalesRoutes.get(
    "/getall",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    getAllPreSalesQuotes
);

// 3. Get Single Quote Details (For Editing or Printing)
PreSalesRoutes.get(
    "/single/:quoteId",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    getSinglePreSalesQuote
);

// 4. Update Quote (Save Config, Audit Data, or Status)
PreSalesRoutes.put(
    "/update/:quoteId",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    updatePreSalesQuote
);

// 5. Delete Quote
PreSalesRoutes.delete(
    "/delete/:quoteId",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    deletePreSalesQuote
);


//  clone
PreSalesRoutes.put(
    "/clone/:quoteId",
    multiRoleAuthMiddleware("owner", "staff", "CTO"),
    clonePreSalesQuote
);


export default PreSalesRoutes;