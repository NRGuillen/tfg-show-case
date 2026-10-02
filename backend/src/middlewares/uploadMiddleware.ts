import multer from 'multer';

// El archivo se guardará temporalmente como un Buffer en req.file.buffer
// Para no petar el docker ccon archivos basura.
const storage = multer.memoryStorage();

// Filtro para asegurarnos de que solo se suben las imágenes
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('El archivo no es una imagen válida'), false);
    }
};

// Exportamos el middleware configurado
export const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB límite para no saturar el servidor con archivos grandes
    }
});