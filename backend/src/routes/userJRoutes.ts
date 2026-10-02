import { Router } from 'express';
// Asegúrate de que el nombre coincida con el que exportas en el controlador
import { getUserJ, hireEmployee, getStaff, despedirEmpleado, getAgenda, cancelarReserva,buscarClientePorEmail, forzarCita, getServicios, updateServiciosConfig} from '../controllers/userJController'; 
import { actualizarPerfil } from '../controllers/usuarioController';
import { checkAuth, checkRol } from '../middlewares/authMiddleware';
import { subirPost, listarPosts } from '../controllers/postController';
import { getAnalytics, sendAnalyticsEmail } from '../controllers/analyticsController';
import { upload } from '../middlewares/uploadMiddleware';   // El de Multer

const router = Router();

// --- PERFIL Y AJUSTES ---
router.get('/perfil', checkAuth, checkRol('DUEÑO', 'PERSONAL'), getUserJ);

// Actualización de perfil, reutilizando el controlador general de usuario
router.put('/perfil', checkAuth, checkRol('DUEÑO', 'PERSONAL'), actualizarPerfil);

router.get('/agenda', checkAuth, checkRol('DUEÑO', 'PERSONAL'), getAgenda);
router.delete('/reserva/:id', checkAuth, checkRol('DUEÑO', 'PERSONAL'), cancelarReserva);
router.get('/buscar-cliente', checkAuth, checkRol('DUEÑO', 'PERSONAL'), buscarClientePorEmail);
router.post('/forzar-reserva', checkAuth, checkRol('DUEÑO', 'PERSONAL'), forzarCita);
router.get('/servicios', checkAuth, checkRol('DUEÑO', 'PERSONAL'), getServicios);
// Esta es la que falta para GUARDAR los cambios del modal
router.post('/servicios-sync', checkAuth, checkRol('DUEÑO'), updateServiciosConfig);

// --- PUBLICACIONES (POSTS) ---
router.get('/posts', checkAuth, checkRol('DUEÑO', 'PERSONAL'), listarPosts);
router.post('/posts/upload', checkAuth, checkRol('DUEÑO', 'PERSONAL'), upload.single('imagen'), subirPost);

// --- CONTRATACIÓN ---
router.post('/hire', checkAuth, checkRol('DUEÑO'), hireEmployee);
router.put('/fire/:idUsuario', checkAuth, checkRol('DUEÑO'), despedirEmpleado);
router.get('/staff/:idPeluqueria', checkAuth, checkRol('DUEÑO'), getStaff);

//--- ESTADÍSTICAS ---
router.get('/analytics', checkAuth, checkRol('DUEÑO'), getAnalytics);
router.post('/send-analytics', checkAuth, checkRol('DUEÑO'), sendAnalyticsEmail);
export default router;