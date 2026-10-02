export interface PhotoCard {
    id: number;
    salon: string;
    rating: number;
    image: string;
    reviews: number;
    numero_seguidores: number;
    tipo_de_via?: string;
    calle?: string;
    codigo_postal?: string;
}

export interface PeluqueriaDetalle {
    id_peluqueria: number;
    nombre_empresa: string;
    puntuacion: number;
    imagen: string;
    reviews: number;
    numero_seguidores: number;
    tipo_de_via: string;
    calle: string;
    codigo_postal: string;
}

export interface PublicacionPeluqueria {
    id_publicacion: number;
    id_peluqueria: number;
    id_personal: number;
    imagen_url: string;
    nombre_trabajador: string;
}

export interface PublicacionBusqueda {
    id_publicacion: number;
    id_peluqueria: number;
    id_personal: number;
    imagen_url: string;
    nombre_empresa: string;
    nombre_trabajador: string;
}

export interface FotoFavoritaUsuario {
    id_favorita: number;
    id_peluqueria: number;
    id_personal: number;
    url: string;
    nombre_empresa: string;
    nombre_personal: string;
}