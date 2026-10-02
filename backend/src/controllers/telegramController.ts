import crypto from 'crypto'
import { type Response } from 'express'
import { type AuthRequest } from '../middlewares/authMiddleware'
import pool from '../database'

// Genera un token temporal para vincular la cuenta con Telegram.
// El token expira en 10 minutos.
export const generarTokenTelegram = async (req: AuthRequest, res: Response) => {
  const id_usuario = req.usuario?.id

  if (!id_usuario) {
    return res.status(401).json({ ok: false, message: 'No autorizado' })
  }

  try {
    // Generamos un token aleatorio de 32 caracteres sin guiones.
    const token = crypto.randomUUID().replace(/-/g, '')

    // Calculamos la expiracion en formato MySQL (10 minutos desde ahora).
    const expiracion = new Date(Date.now() + 10 * 60 * 1000)
    const expiracionMySQL = expiracion.toISOString().slice(0, 19).replace('T', ' ')

    // Guardamos el token y su expiracion en la BD.
    await pool.execute(
      'UPDATE usuario SET telegram_token = ?, telegram_token_exp = ? WHERE id_usuario = ?',
      [token, expiracionMySQL, id_usuario]
    )

    const botUsername = process.env.TELEGRAM_BOT_USERNAME

    if (!botUsername) {
      return res.status(500).json({
        ok: false,
        message: 'Falta TELEGRAM_BOT_USERNAME en el backend (.env)',
      })
    }

    // Devolvemos el enlace directo al bot con el token incluido.
    const enlace = `https://t.me/${botUsername}?start=${token}`

    return res.json({ ok: true, enlace })
  } catch (error) {
    console.error('Error generando token Telegram:', error)
    return res.status(500).json({ ok: false, message: 'Error interno del servidor' })
  }
}
