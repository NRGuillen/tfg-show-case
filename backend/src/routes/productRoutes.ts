import { Router } from 'express';
import { getProducts, eliminarProducto, agregarProducto, modificarProducto } from '../controllers/productController';
import { checkAuth } from '../middlewares/authMiddleware'; 
import { upload } from '../middlewares/uploadMiddleware';

const router = Router();

router.get('/', checkAuth, getProducts);
router.delete('/:id', checkAuth, eliminarProducto);
router.post('/', checkAuth, upload.single('imagen'), agregarProducto);
router.put('/:id', checkAuth, modificarProducto);
router.get('/tienda/:idPeluqueria', checkAuth, getProducts);

export default router;