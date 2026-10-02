// frontend/src/views/RegisterPage.tsx
import { useNavigate } from 'react-router-dom';
import { useRegister } from '../hooks/useRegister';

export default function RegisterPage() {
  const navigate = useNavigate();
  const {
    form,
    errors,
    loading,
    showPassword,
    showConfirm,
    setShowPassword,
    setShowConfirm,
    handleChange,
    handleSelect,
    handleSubmit,
    inputClass,
  } = useRegister();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-blue-50 px-4 text-[#111111]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 -top-16 h-56 w-56 rounded-full bg-black/5 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-black/10 blur-3xl" />
      </div>

      <div className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl shadow-blue-200/40 md:grid-cols-[1.1fr_1fr]">
        <section className="hidden flex-col justify-between bg-blue-600 p-10 text-white md:flex">
          <div>
            <span className="text-sm font-bold tracking-[0.24em] text-white/70">ALTIORAM</span>
            <h2 className="mt-6 text-4xl font-black leading-tight">Gestiona tu tienda con estilo.</h2>
            <p className="mt-4 max-w-sm text-sm text-white/75">
              Crea tu cuenta para revisar productos, ventas y actividad de tu equipo en un solo lugar.
            </p>
          </div>

          <div className="space-y-3 text-sm text-white/75">
            <p>✓ Control de inventario en tiempo real</p>
            <p>✓ Panel de administración intuitivo</p>
            <p>✓ Historial y métricas de negocio</p>
          </div>
        </section>

        <section className="p-8 md:p-10">
          <div className="mb-8 text-center md:text-left">
            <span className="mb-3 block text-3xl font-black tracking-tighter text-[#111111] md:hidden">ALTIORAM</span>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#111111]">Crear cuenta</h1>
            <p className="mt-2 text-sm text-gray-500">Regístrate para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Nombre</label>
              <input
                type="text"
                name="nombre"
                placeholder="Tu nombre"
                value={form.nombre}
                onChange={handleChange}
                className={inputClass('nombre')}
              />
              {errors.nombre && <p className="pl-1 text-xs text-red-500">{errors.nombre}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">1er Apellido</label>
                <input
                  type="text"
                  name="apellido_1"
                  placeholder="Primer apellido"
                  value={form.apellido_1}
                  onChange={handleChange}
                  className={inputClass('apellido_1')}
                />
                {errors.apellido_1 && <p className="pl-1 text-xs text-red-500">{errors.apellido_1}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">2º Apellido</label>
                <input
                  type="text"
                  name="apellido_2"
                  placeholder="Opcional"
                  value={form.apellido_2}
                  onChange={handleChange}
                  className="w-full rounded-2xl border-[1.5px] border-[#d3d3d3] bg-white px-4 py-3 text-sm text-[#111111] outline-none transition-all placeholder:text-gray-400 focus:border-black"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Email</label>
              <input
                type="email"
                name="email"
                placeholder="tucorreo@ejemplo.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                className={inputClass('email')}
              />
              {errors.email && <p className="pl-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Rol</label>
              <div className="relative">
                <select
                  name="rol"
                  value={form.rol}
                  onChange={handleSelect}
                  className={`w-full appearance-none rounded-2xl border-[1.5px] bg-white px-4 py-3 pr-10 text-sm outline-none transition-all ${
                    errors.rol ? 'border-red-500 text-[#111111] focus:border-red-500' : 'border-[#d3d3d3] text-[#111111] focus:border-black'
                  } ${!form.rol ? 'text-gray-500' : ''}`}
                >
                  <option value="" disabled>
                    Selecciona tu rol
                  </option>
                  <option value="CLIENTE">Cliente</option>
                  <option value="DUEÑO">Dueño</option>
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500">▼</span>
              </div>
              {errors.rol && <p className="pl-1 text-xs text-red-500">{errors.rol}</p>}
            </div>

            {form.rol === 'DUEÑO' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                  CIF <span className="normal-case text-gray-600">Ej: A58818501</span>
                </label>
                <input
                  type="text"
                  name="cif"
                  placeholder="Tu CIF"
                  value={form.cif}
                  onChange={handleChange}
                  className={inputClass('cif')}
                />
                {errors.cif && <p className="pl-1 text-xs text-red-500">{errors.cif}</p>}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                Ubicación <span className="normal-case text-gray-600">(opcional)</span>
              </label>
              <input
                type="text"
                name="ubicacion"
                placeholder="Tu ciudad o dirección"
                value={form.ubicacion}
                onChange={handleChange}
                className="w-full rounded-2xl border-[1.5px] border-[#d3d3d3] bg-white px-4 py-3 text-sm text-[#111111] outline-none transition-all placeholder:text-gray-400 focus:border-black"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Contraseña</label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className={`w-full rounded-2xl border-[1.5px] bg-white px-4 py-3 pr-14 text-sm text-[#111111] outline-none transition-all placeholder:text-gray-400 ${
                    errors.password ? 'border-red-500 focus:border-red-500' : 'border-[#d3d3d3] focus:border-black'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-xs font-semibold text-gray-500 transition-colors hover:text-black"
                >
                  {showPassword ? 'Ocultar' : 'Ver'}
                </button>
              </div>
              {errors.password && <p className="pl-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">Confirmar contraseña</label>
              <div className="relative flex items-center">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className={`w-full rounded-2xl border-[1.5px] bg-white px-4 py-3 pr-14 text-sm text-[#111111] outline-none transition-all placeholder:text-gray-400 ${
                    errors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'border-[#d3d3d3] focus:border-black'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 text-xs font-semibold text-gray-500 transition-colors hover:text-black"
                >
                  {showConfirm ? 'Ocultar' : 'Ver'}
                </button>
              </div>
              {errors.confirmPassword && <p className="pl-1 text-xs text-red-500">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex min-h-[48px] items-center justify-center rounded-2xl bg-blue-600 py-3 font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : 'Crear cuenta'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 md:text-left">
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={() => navigate('/login')}
              className="cursor-pointer border-none bg-transparent p-0 font-semibold text-[#111111] hover:underline"
            >
              Inicia sesión
            </button>
          </p>
        </section>
      </div>
    </div>
  );
}