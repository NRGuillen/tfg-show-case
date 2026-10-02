import { Router } from 'express'
import { generarTokenTelegram } from '../controllers/telegramController'
import { checkAuth } from '../middlewares/authMiddleware'

const router = Router()

// Ruta protegida: solo usuarios logueados pueden generar su token de vinculacion.
router.post('/vincular', checkAuth, generarTokenTelegram)

export default router
