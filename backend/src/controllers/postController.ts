import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware'; 
import * as postsService from '../services/postService';
import { UsuarioPayload } from '../types/crearPostType';

export const subirPost = async (req: AuthRequest, res: Response) => {
    try {
        // Cast de req.usuario para tener tipado fuerte
        const usuario = req.usuario as UsuarioPayload;
        
        const idPeluqueria = usuario?.idPeluqueria;
        const idUsuarioLogueado = usuario?.id;
        
        // La descripción viene del body (texto) y el archivo de req.file (gracias a Multer)
        const { descripcion } = req.body;
        const archivo = req.file;

        // Validaciones previas
        if (!archivo) {
            return res.status(400).json({ 
                ok: false, 
                msg: "No se ha seleccionado ninguna imagen." 
            });
        }

        if (!idPeluqueria || !idUsuarioLogueado) {
            return res.status(401).json({ 
                ok: false, 
                msg: "Sesión no válida o falta ID de peluquería." 
            });
        }

        // Llamada al servicio con los datos limpios
        const idNuevoPost = await postsService.crearPublicacionService(
            Number(idPeluqueria),
            Number(idUsuarioLogueado),
            descripcion || "", // Si no hay descripción, enviamos string vacío
            archivo.buffer     // El buffer de la imagen en memoria
        );

        return res.status(201).json({
            ok: true,
            msg: "¡Corte de pelo publicado con éxito!",
            id_publicacion: idNuevoPost
        });

    } catch (error) {
        console.error("❌ Error en el controlador subirPost:", error);
        return res.status(500).json({ 
            ok: false, 
            msg: "Hubo un error al intentar subir la publicación." 
        });
    }
};

export const listarPosts = async (req: AuthRequest, res: Response) => {
    try {
        const usuario = req.usuario as UsuarioPayload;
        const idPeluqueria = usuario?.idPeluqueria;

        if (!idPeluqueria) {
            return res.status(401).json({ ok: false, msg: "Falta ID de peluquería" });
        }

        const posts = await postsService.obtenerPublicacionesPeluqueria(Number(idPeluqueria));

        // Importante: devolver siempre un objeto con "ok: true" para que el front lo entienda
        return res.json({
            ok: true,
            posts
        });
    } catch (error) {
        console.error("Error en listarPosts:", error);
        return res.status(500).json({ ok: false, msg: "Error interno" });
    }
};