import { Request, Response } from 'express'; // Importamos Request de express
import * as analyticsService from '../services/analyticsService';
import { AnalyticsResponse } from '../types/analyticsTypes';
import { UsuarioPayload } from '../types/crearPostType';
import nodemailer from 'nodemailer';
import { getPerfilCompletoById } from '../services/usuarioService';
import { sendMail } from '../utils/smtpMailer';


export const getAnalytics = async (req: Request, res: Response) => {
    try {
        // Usamos el payload del usuario que ya inyectó el middleware
        const usuario = req.usuario as unknown as UsuarioPayload;
        const idPeluqueria = usuario?.idPeluqueria;

        if (!idPeluqueria) {
            return res.status(401).json({ 
                ok: false, 
                msg: "No se ha podido identificar la peluquería asociada a su cuenta." 
            });
        }

        const stats = await analyticsService.getStatsService(Number(idPeluqueria));

        const respuesta: AnalyticsResponse = {
            ok: true,
            ...stats
        };

        return res.json(respuesta);

    } catch (error) {
        console.error("❌ Error en getAnalytics Controller:", error);
        return res.status(500).json({ 
            ok: false, 
            msg: "Hubo un error al procesar las estadísticas." 
        });
    }
};

export const sendAnalyticsEmail = async (req: Request, res: Response) => {
  try {
    // 1. Extraemos el PDF y el nombre del archivo del body
    const { pdfBase64, fileName } = req.body as unknown as { pdfBase64: string; fileName: string };

    // 2. Validamos que el usuario esté autenticado
    if (!req.usuario || !req.usuario.id) {
      return res.status(401).json({ ok: false, msg: "Sesión no válida." });
    }

    // 3. Obtenemos los datos del perfil (nombre y email)
    const perfil = await getPerfilCompletoById(req.usuario.id, req.usuario.rol);

    if (!perfil || !perfil.email) {
      return res.status(404).json({ ok: false, msg: "No se encontró el email del destinatario." });
    }

    // 4. Enviamos el correo usando la utilidad centralizada
    await sendMail({
      to: perfil.email,
      subject: `📊 Reporte de Analíticas - ${new Date().toLocaleDateString()}`,
      text: `Hola ${perfil.nombre}, adjunto encontrarás el reporte de analíticas solicitado.`,
      html: `
        <div style="font-family: sans-serif; color: #333;">
          <h2 style="color: #2563eb;">¡Hola, ${perfil.nombre}!</h2>
          <p>Adjunto a este correo encontrarás el informe de analíticas que has generado desde tu panel de administración en <strong>Altioram</strong>.</p>
          <br/>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #777;">Este es un mensaje automático del sistema, por favor no respondas directamente a este correo.</p>
        </div>
      `,
      attachments: [
        {
          filename: fileName || 'Reporte_Analiticas.pdf',
          content: pdfBase64,
          encoding: 'base64'
        }
      ]
    });
    
    return res.status(200).json({ ok: true, msg: 'Email enviado con éxito.' });

  } catch (error) {
    console.error('Error en sendAnalyticsEmail:', error);
    return res.status(500).json({ 
      ok: false, 
      msg: 'Hubo un error al procesar el envío del email.' 
    });
  }
};