import { Router } from 'express';
import {
  getPerfilBasico,
  login,
  registro,
  getPerfil,
  actualizarPerfil,
  solicitarResetPassword,
  confirmarResetPassword,
  getCitasUsuario,
  subirImagenCabecera,
} from '../controllers/usuarioController';
import { checkAuth } from '../middlewares/authMiddleware';
import { upload } from '../middlewares/uploadMiddleware';

const router = Router();

router.post('/login', login);
router.post('/registro', registro);
router.post('/password/reset-request', solicitarResetPassword);
router.post('/password/reset-confirm', confirmarResetPassword);
// router.get('/perfil', checkAuth, getPerfilBasico);
router.get('/perfil', checkAuth, getPerfil);
router.get('/citas', checkAuth, getCitasUsuario);
router.put('/perfil', checkAuth, actualizarPerfil);
router.put('/perfil/cabecera', checkAuth, upload.single('imagen'), subirImagenCabecera);

export default router;
