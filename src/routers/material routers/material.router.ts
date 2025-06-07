
import express, { RequestHandler }  from 'express';
import {  
    createMaterial,
    createMaterailList,

    getMaterial,
    getMaterialLists,

    deleteMaterial,
    deleteMaterialLists,

    updateMaterialLists,
    updateMaterialItem } from '../../controllers/materialEstimate controllers/materialEstimate.controller';

const router = express.Router()

router.post('/createmateriallist/:projectId', createMaterailList as RequestHandler)
router.post('/creatematerial/:projectId/:materialListId', createMaterial as RequestHandler)
router.get('/getmaterial/:materialListId', getMaterial as RequestHandler)
router.get('/getmateriallist/:projectId', getMaterialLists as RequestHandler)
router.put('/updatematerialitem/:materialListId/:materialId', updateMaterialItem as RequestHandler)
router.put('/updatemateraillist/:projectId/:materailListId', updateMaterialLists as RequestHandler)
router.delete('/deletematerial/:materialListId/:materialId', deleteMaterial as RequestHandler)
router.delete('/deletemateriallist/:projectId/:materailListId', deleteMaterialLists as RequestHandler)

export default router;