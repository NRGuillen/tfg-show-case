import { Router } from 'express';
import { procesarPedido } from '../controllers/checkOutController';
import { checkAuth } from '../middlewares/authMiddleware';

const router = Router();

// ruta POST y protegemos con checkAuth
router.post('/', checkAuth, procesarPedido);

export default router;