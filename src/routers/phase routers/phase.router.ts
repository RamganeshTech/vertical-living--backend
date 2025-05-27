import express, { RequestHandler }  from 'express';
import { createPhase, deletePhase, getPhases, updatePhase } from '../../controllers/phase controllers/phase.controller';

const router = express.Router()

router.get('/getphases/:projectId', getPhases)
router.post('/createphase/:projectId', createPhase)
router.delete('/deletephase/:projectId/:phaseId', deletePhase)
router.patch('/updatephase/:projectId/:phaseId', updatePhase)

export default router;