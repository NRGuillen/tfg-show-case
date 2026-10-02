import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';

interface LoginForm {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

// Hook personalizado que contiene toda la logica del formulario de login
// La vista (LoginPage.tsx) solo se encarga del HTML, este hook maneja el estado y las peticiones
export function useLogin() {
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

  // Estado del formulario con email y password
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' });

  // Estado de los errores de validacion de cada campo
  const [errors, setErrors] = useState<FormErrors>({});

  // Estado de carga mientras se espera respuesta del servidor
  const [loading, setLoading] = useState(false);

  // Estado para mostrar u ocultar la contrasena en el input
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuthContext();
  // Funcion de validacion del formulario antes de enviarlo
  // Devuelve true si todo esta bien, false si hay errores
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.email) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Email no valido';
    }

    if (!form.password) {
      newErrors.password = 'La contrasena es obligatoria';
    } else if (form.password.length < 4) {
      newErrors.password = 'Minimo 4 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejador de cambios en los inputs
  // Actualiza el campo correspondiente en el estado y limpia su error si lo habia
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name as keyof FormErrors]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  // Manejador del envio del formulario
  // Valida, hace la peticion al backend y guarda el token si el login es correcto
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Si la validacion falla, no enviamos nada
    if (!validate()) return;
    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/api/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (data.ok) {
      // 3. USAMOS EL CONTEXTO: 
        // Esto hace el sessionStorage.setItem internamente y además avisa a React
        login(data.usuario, data.token);

        // 4. NAVEGACIÓN LIMPIA: 
        // Ya no necesitamos recargar la página completa. navigate ahora sí funcionará.
        if (data.usuario.rol === 'DUEÑO') {
          navigate('/userJ');
        } else {
          navigate('/inicio');
        }
        
      } else {
        alert(data.message || 'Credenciales incorrectas');
      }
    } catch {
      alert('Error de conexion con el servidor');
    } finally {
      setLoading(false);
    }
  };

  // Devolvemos todo lo que necesita la vista para funcionar
  return { form, errors, loading, showPassword, setShowPassword, handleChange, handleSubmit };
}