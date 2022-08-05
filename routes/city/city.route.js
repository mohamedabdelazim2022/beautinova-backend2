import express from 'express';
import AreaController from '../../controllers/area/area.controller';
import CityController from '../../controllers/city/city.controller';
import { requireAuth } from '../../services/passport';
import { cache } from '../../services/caching';

const router = express.Router();


router.route('/')
    .post(
        requireAuth,
        CityController.validateCityBody(),
        CityController.create
    )
router.route('/:countryId/cities/withoutPagenation')
    .get(CityController.getAll);

router.route('/:countryId/cities')
    .get(CityController.getAllPaginated);
    
router.route('/:cityId')
    .put(
        requireAuth,
        CityController.validateCityBody(true),
        CityController.update
    )
    .get(requireAuth,CityController.getById)
    .delete(requireAuth,CityController.delete);

router.route('/:cityId/areas')
    .post(
        requireAuth,
        AreaController.validateAreaBody(),
        AreaController.create
    )
    .get(AreaController.getAllPaginated);
router.route('/:cityId/areas/withoutPagenation')
    .get(AreaController.getAll);
router.route('/:cityId/areas/:areaId')
    .put(
        requireAuth,
        AreaController.validateAreaBody(true),
        AreaController.update
    )
    .get(AreaController.getById)
    .delete(requireAuth,AreaController.delete);




export default router;