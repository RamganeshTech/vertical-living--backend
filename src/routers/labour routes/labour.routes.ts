
import express, { RequestHandler }  from 'express';

import { createLabour, createLabourList, deleteLabourItem,
     deleteLabourList, getLabourItems, getLabourLists, 
     updateLabourItem, updateLabourList } from '../../controllers/labour controllers/labourEstimate.controller';

const router = express.Router()

router.post('/createlabourlist/:projectId', createLabourList as RequestHandler)
router.post('/createlabour/:projectId', createLabour as RequestHandler)
router.get('/getlabour/:labourListId', getLabourItems as RequestHandler)
router.get('/getlabourlist/:projectId', getLabourLists as RequestHandler)
router.put('/updatelabouritem/:labourListId/:labourItemId', updateLabourItem as RequestHandler)
router.put('/updatelabourlist/:projectId/:labourListId', updateLabourList as RequestHandler)
router.delete('/deletelabour/:labourListId/:labourItemId', deleteLabourItem as RequestHandler)
router.delete('/deletelabourlist/:projectId/:labourListId', deleteLabourList as RequestHandler)

export default router;