import React, { useState, useRef, useEffect } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';

export default function PostsView() {
  const { token } = useAuthContext();
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

  // --- ESTADOS NUEVOS ---
  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  // --- ESTADOS EXISTENTES ---
  const [descripcion, setDescripcion] = useState('');
  const [imagen, setImagen] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar posts al montar el componente
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/userJ/posts`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.ok) setPosts(data.posts);
    } catch (error) {
      console.error("Error cargando posts:", error);
    } finally {
      setCargando(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImagen(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagen) return alert("Por favor, selecciona una imagen");
    setSubiendo(true);

    const formData = new FormData();
    formData.append('imagen', imagen);
    formData.append('descripcion', descripcion);

    try {
      const response = await fetch(`${apiUrl}/api/userJ/posts/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();

      if (data.ok) {
        alert("¡Publicado con éxito!");
        // Limpiar y volver a la galería
        setImagen(null);
        setPreview(null);
        setDescripcion('');
        setMostrandoFormulario(false);
        fetchPosts(); // Refrescar lista
      } else {
        alert(data.msg || "Error al subir");
      }
    } catch (error) {
      alert("No se pudo conectar con el servidor.");
    } finally {
      setSubiendo(false);
    }
  };

  // --- RENDERIZADO CONDICIONAL ---

  // VISTA A: FORMULARIO DE SUBIDA (La imagen que pasaste)
  if (mostrandoFormulario) {
    return (
      <div className="animate-fade-in">
        <button 
          onClick={() => setMostrandoFormulario(false)}
          className="mb-4 text-blue-600 font-bold flex items-center gap-2 hover:underline"
        >
          ← Volver a mis publicaciones
        </button>
        <header className="mb-8">
          <h2 className="text-3xl font-black text-gray-950 uppercase tracking-tighter">
            Nueva <span className="text-blue-600">Publicación</span>
          </h2>
          <p className="text-gray-500 font-medium">Sube los trabajos realizados hoy</p>
        </header>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative group border-4 border-dashed border-gray-100 rounded-[2rem] h-[400px] flex flex-col items-center justify-center cursor-pointer hover:border-blue-200 hover:bg-blue-50/30 transition-all overflow-hidden"
          >
            {preview ? (
              <img src={preview} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <div className="text-center p-6">
                <div className="text-5xl mb-4">📸</div>
                <p className="text-gray-900 font-bold uppercase text-sm tracking-wider">Subir Fotografía</p>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          </div>

          <div className="flex flex-col justify-center">
            <div className="mb-6">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Descripción</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="w-full p-5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all resize-none text-gray-700 font-medium"
                placeholder="Ej: Fade medio con diseño..."
                rows={5}
              />
            </div>
            <button
              type="submit"
              disabled={subiendo}
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-white shadow-xl transition-all ${
                subiendo ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
              }`}
            >
              {subiendo ? 'Procesando...' : 'Publicar Ahora'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // VISTA B: GALERÍA DE PUBLICACIONES
  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-gray-950 uppercase tracking-tighter">
            Mis <span className="text-blue-600">Publicaciones</span>
          </h2>
          <p className="text-gray-500 font-medium">Mira el historial de tus trabajos</p>
        </div>
        <button 
          onClick={() => setMostrandoFormulario(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          + Subir Fotografía
        </button>
      </div>

      {cargando ? (
        <p className="text-center py-10">Cargando publicaciones...</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {posts.length > 0 ? (
            posts.map((post) => (
              <div key={post.id_publicacion} className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all">
                <img 
                  src={post.imagen_url} 
                  alt={post.descripcion} 
                  className="w-full aspect-square object-cover" 
                />
                <div className="p-3">
                  <p className="text-sm text-gray-700 line-clamp-2 italic">
                    "{post.descripcion || 'Sin descripción'}"
                  </p>
                  <p className="text-[10px] text-gray-400 mt-2 uppercase font-bold">
                    {new Date(post.fecha).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400 font-medium">No has subido ninguna foto todavía.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}