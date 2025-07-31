import express from 'express';
import { getFirstPendingStageForProject } from '../../controllers/CurrentActiveStage Controller/currentActiveStage.controller';

const currentActiveStage = express.Router();

currentActiveStage.get('/:projectId/pendingstage', getFirstPendingStageForProject);

export default currentActiveStage;
