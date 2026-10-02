import { Router } from 'express';
import {
  addFavoriteStoreController,
  createReservationController,
  getFavoriteStoresController,
  getPhotoCardDetailController,
  getPhotoCardsController,  
  getRandomPublicacionesController,
  getReservationOptionsController,
  getReservedHoursController,
  getPublicacionesController,
  addFavoritePhotoController,
  getFavoritePhotosController,
  removeFavoritePhotoController,
  getNotificationsController,
  deleteNotificationController,
  removeFavoriteStoreController,
  followStoreController,
  unfollowStoreController,
  getFollowStatusController,
  createReviewController
} from '../controllers/photoCardController';
import { checkAuth } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', getPhotoCardsController);
router.get('/publicaciones', getRandomPublicacionesController);
router.get('/favoritos', checkAuth, getFavoriteStoresController);
router.get('/fotos-favoritas', checkAuth, getFavoritePhotosController);
router.get('/notificaciones', checkAuth, getNotificationsController);
router.delete('/notificaciones/:idNotificacion', checkAuth, deleteNotificationController);
router.post('/fotos-favoritas', checkAuth, addFavoritePhotoController);
router.delete('/fotos-favoritas', checkAuth, removeFavoritePhotoController);
router.get('/:idPeluqueria/detalle', getPhotoCardDetailController);
router.get('/:idPeluqueria/publicaciones', getPublicacionesController);
router.get('/:idPeluqueria/opciones-reserva', getReservationOptionsController);
router.get('/:idPeluqueria/reservas', getReservedHoursController);
router.post('/:idPeluqueria/reservas', checkAuth, createReservationController);
router.post('/:idPeluqueria/favorito', checkAuth, addFavoriteStoreController);
router.delete('/:idPeluqueria/favorito', checkAuth, removeFavoriteStoreController);
router.get('/:idPeluqueria/seguir', checkAuth, getFollowStatusController);
router.post('/:idPeluqueria/seguir', checkAuth, followStoreController);
router.delete('/:idPeluqueria/seguir', checkAuth, unfollowStoreController);
router.post('/:idPeluqueria/resena', checkAuth, createReviewController);

export default router;