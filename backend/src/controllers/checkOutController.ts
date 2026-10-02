import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { createCheckout } from '../services/checkOutService';
import { sendMail } from '../utils/smtpMailer';
import { purchaseConfirmationTemplate } from '../utils/purchaseConfirmationTemplate';
// Importa tu servicio de usuario (ajusta la ruta según tu carpeta)
import { getUsuarioBasicoById } from '../services/usuarioService';

export const procesarPedido = async (req: AuthRequest, res: Response) => {
    try {
        const idUsuario = req.usuario?.id;
        // EXTRAEMOS EL EMAIL DEL MODAL PAGO
        const { items, emailContacto } = req.body; 

        if (!idUsuario || !items?.length) {
            return res.status(400).json({ ok: false, msg: 'Datos insuficientes' });
        }

        // PEDIMOS NOMBRE A LA BBDD PARA CORREO PERSONALIZADO
        const datosUsuario = await getUsuarioBasicoById(Number(idUsuario));

        // SE REALIZA LA COMPRA
        const facturas = await createCheckout(Number(idUsuario), items);

        //POR PRECAUCION PRIORIZAMOS EL EMAIL DEL MODAL ANTES QUE EL DEL USUARIO
        const destinatario = emailContacto || datosUsuario?.email;

        if (destinatario) {
            const totalCompra = items.reduce((acc: number, item: any) => 
                acc + (item.precio * (item.cantidad || 1)), 0
            );

            const { subject, text, html } = purchaseConfirmationTemplate({
                nombre: datosUsuario?.nombre || 'Cliente',
                facturaId: facturas.join(', '),
                productos: items.map((i: any) => ({ nombre: i.nombre, precio: i.precio })),
                total: totalCompra
            });

            sendMail({
                to: destinatario,
                subject,
                text,
                html
            }).catch(err => console.error("Error enviado email de confirmación:", err));
        }

        res.status(201).json({ ok: true, msg: 'Compra finalizada con éxito', facturas });
        
    } catch (error: any) {
        res.status(500).json({ ok: false, msg: error.message });
    }
};