import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateCIF } from '../utils/validations';

interface RegisterForm {
  nombre: string;
  cif: string;
  apellido_1: string;
  apellido_2: string;
  email: string;
  password: string;
  confirmPassword: string;
  ubicacion: string;
  rol: string;
}

interface FormErrors {
  nombre?: string;
  cif?: string;
  apellido_1?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  rol?: string;
}

export function useRegister() {
  const [form, setForm] = useState<RegisterForm>({
    nombre: '',
    cif:'',
    apellido_1: '',
    apellido_2: '',
    email: '',
    password: '',
    confirmPassword: '',
    ubicacion: '',
    rol: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    if (form.rol === 'DUEÑO') {
      if (!form.cif.trim()) {
        newErrors.cif = 'El CIF es obligatorio para Dueño';
      } else if (!validateCIF(form.cif)) {
        newErrors.cif = 'El CIF no es válido (formato: letra + 7 dígitos + control)';
      }
    }
    if (!form.apellido_1.trim()) newErrors.apellido_1 = 'El primer apellido es obligatorio';
    if (!form.email) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Email no válido';
    }
    if (!form.password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (form.password.length < 4) {
      newErrors.password = 'Mínimo 4 caracteres';
    }
    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }
    if (!form.rol) newErrors.rol = 'Selecciona un rol';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name as keyof FormErrors]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name as keyof FormErrors]) {
      setErrors({ ...errors, [name]: undefined });
    }

    // Si no es Dueño, el CIF deja de ser obligatorio.
    if (name === 'rol' && value !== 'DUEÑO' && errors.cif) {
      setErrors((prev) => ({ ...prev, cif: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const { confirmPassword, ...payload } = form;
      const response = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/api/usuarios/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.ok) {
        alert('¡Cuenta creada con éxito! Ya puedes iniciar sesión.');
        navigate('/login');
      } else {
        alert(data.message || 'Error al registrarse');
      }
    } catch {
      alert('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field: keyof FormErrors) =>
    `w-full rounded-2xl border-[1.5px] bg-white px-4 py-3 text-sm text-[#111111] outline-none transition-all placeholder:text-gray-400
    ${errors[field]
      ? 'border-red-500 focus:border-red-500'
      : 'border-[#d3d3d3] focus:border-black'
    }`;

  return { form, errors, loading, showPassword, showConfirm, setShowPassword, setShowConfirm, handleChange, handleSelect, handleSubmit, inputClass };
}