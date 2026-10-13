import { useState } from "react";
import "./App.css";

// Configuración de la API: adaptable a desarrollo local y a Nginx en AWS
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
const AUTH_API = `${API_BASE}/api/auth`;
const DASHBOARD_API = `${API_BASE}/api/dashboard`;

function App() {
  const [token, setToken] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [seccion, setSeccion] = useState("dashboard");

  const [dashboardData, setDashboardData] = useState(null);
  const [cargandoDashboard, setCargandoDashboard] = useState(false);
  const [pruebaResultado, setPruebaResultado] = useState(null);

  const [modoRegistro, setModoRegistro] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");

  function avisar(texto, tipo = "error") {
    setMensaje(texto);
    setTipoMensaje(tipo);
  }

  function cambiarModo(registro) {
    setModoRegistro(registro);
    setNombre("");
    setPassword("");
    setConfirmarPassword("");
    setMostrarPassword(false);
    setMensaje("");
    setTipoMensaje("");
  }

  // Carga y validación continua Zero Trust del Dashboard
  async function cargarDashboard(tokenActivo = token) {
    if (!tokenActivo) return;
    setCargandoDashboard(true);
    setPruebaResultado(null);

    try {
      const respuesta = await fetch(`${DASHBOARD_API}/stats`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${tokenActivo}`,
          "Content-Type": "application/json",
        },
      });

      const datos = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        if (respuesta.status === 401 || respuesta.status === 403) {
          avisar("Sesión caducada o token inválido según la política Zero Trust", "error");
          cerrarSesion();
          return;
        }
        throw new Error(datos.error || "No se pudo consultar el dashboard protegido.");
      }

      setDashboardData(datos);
    } catch (error) {
      console.error("Error al cargar dashboard protegido:", error);
    } finally {
      setCargandoDashboard(false);
    }
  }

  // Prueba de acceso no autorizado para evidencia de seguridad (Zero Trust)
  async function probarAccesoSinToken() {
    setPruebaResultado({ cargando: true });
    try {
      const respuesta = await fetch(`${DASHBOARD_API}/stats`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const datos = await respuesta.json().catch(() => ({}));
      setPruebaResultado({
        cargando: false,
        status: respuesta.status,
        ok: respuesta.ok,
        mensaje: datos.error || "Respuesta sin cuerpo",
        codigo: datos.code || "NO_CODE",
      });
    } catch (error) {
      setPruebaResultado({
        cargando: false,
        status: 0,
        ok: false,
        mensaje: error.message,
      });
    }
  }

  async function enviarFormulario(e) {
    e.preventDefault();
    setMensaje("");
    setTipoMensaje("");

    if (modoRegistro) {
      if (password.length < 6 || password.length > 8) {
        avisar("La contraseña debe tener entre 6 y 8 caracteres.");
        return;
      }

      if (password !== confirmarPassword) {
        avisar("Las contraseñas no coinciden.");
        return;
      }
    }

    setCargando(true);

    try {
      const respuesta = await fetch(
        `${AUTH_API}/${modoRegistro ? "register" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            modoRegistro
              ? {
                  name: nombre.trim(),
                  email: email.trim(),
                  password,
                }
              : {
                  email: email.trim(),
                  password,
                }
          ),
        }
      );

      const datos = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          datos.error ||
            (modoRegistro
              ? "No se pudo crear la cuenta."
              : "No se pudo iniciar sesión.")
        );
      }

      if (modoRegistro) {
        cambiarModo(false);
        avisar(
          "Cuenta creada correctamente. Ahora puedes iniciar sesión.",
          "exito"
        );
        return;
      }

      if (!datos.token) {
        throw new Error("El servidor no devolvió un token de acceso.");
      }

      setToken(datos.token);
      setUsuario(datos.user || { email: email.trim() });
      setPassword("");
      setMensaje("");
      setSeccion("dashboard");

      // Consultar endpoint protegido con Zero Trust
      cargarDashboard(datos.token);
    } catch (error) {
      avisar(
        error instanceof TypeError
          ? "No se pudo conectar con el servidor. Comprueba que el backend esté ejecutándose."
          : error.message
      );
    } finally {
      setCargando(false);
    }
  }

  function cerrarSesion() {
    setToken(null);
    setUsuario(null);
    setDashboardData(null);
    setPruebaResultado(null);
    setSeccion("dashboard");
    setNombre("");
    setEmail("");
    setPassword("");
    setConfirmarPassword("");
    setMensaje("");
    setTipoMensaje("");
    setModoRegistro(false);
  }

  const nombreUsuario =
    usuario?.name ||
    usuario?.nombre ||
    usuario?.email ||
    "Usuario";

  if (!token) {
    return (
      <main className="auth-page">
        <header className="auth-header">
          <a className="brand" href="#" aria-label="DuoShield">
            <span className="brand-mark">D</span>
            <span>
              Duo<span className="brand-accent">Shield</span>
            </span>
          </a>

          <span className="security-badge">
            <span className="online-dot" />
            Arquitectura Zero Trust
          </span>
        </header>

        <section className="auth-layout">
          <div className="auth-intro">
            <span className="eyebrow">SEGURIDAD DIGITAL & DEFENSA EN PROFUNDIDAD</span>
            <h1>
              Protege tu mundo.
              <span> Controla tu acceso.</span>
            </h1>
            <p>
              Plataforma web protegida con segmentación de VPCs, autenticación continua JWT,
              hardening UFW, Fail2ban y AWS WAF.
            </p>

            <div className="feature-list">
              <article className="feature-item">
                <span className="feature-icon">•</span>
                <div>
                  <strong>Principio Zero Trust</strong>
                  <p>Validación continua de identidad en cada petición.</p>
                </div>
              </article>

              <article className="feature-item">
                <span className="feature-icon">•</span>
                <div>
                  <strong>Defensa en Profundidad</strong>
                  <p>Aislamiento de red privada, WAF, UFW y Fail2Ban.</p>
                </div>
              </article>
            </div>
          </div>

          <section className="auth-card">
            <div className="auth-card-icon">D</div>

            <h2>{modoRegistro ? "Crea tu cuenta" : "Bienvenido a DuoShield"}</h2>
            <p className="auth-description">
              {modoRegistro
                ? "Regístrate para comenzar a usar DuoShield."
                : "Inicia sesión para entrar a tu espacio protegido."}
            </p>

            <div className="auth-tabs">
              <button
                type="button"
                className={!modoRegistro ? "active" : ""}
                onClick={() => cambiarModo(false)}
                disabled={cargando}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                className={modoRegistro ? "active" : ""}
                onClick={() => cambiarModo(true)}
                disabled={cargando}
              >
                Crear cuenta
              </button>
            </div>

            <form onSubmit={enviarFormulario}>
              {modoRegistro && (
                <>
                  <label htmlFor="nombre">Nombre completo</label>
                  <input
                    id="nombre"
                    type="text"
                    placeholder="Tu nombre"
                    autoComplete="name"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    minLength={2}
                    maxLength={100}
                    required
                  />
                </>
              )}

              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                placeholder="tu@ejemplo.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <label htmlFor="password">Contraseña</label>
              <div className="password-field">
                <input
                  id="password"
                  type={mostrarPassword ? "text" : "password"}
                  placeholder={
                    modoRegistro
                      ? "Entre 6 y 8 caracteres"
                      : "Tu contraseña"
                  }
                  autoComplete={
                    modoRegistro ? "new-password" : "current-password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={modoRegistro ? 6 : undefined}
                  maxLength={modoRegistro ? 8 : undefined}
                  required
                />

                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setMostrarPassword((v) => !v)}
                >
                  {mostrarPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>

              {modoRegistro && (
                <>
                  <label htmlFor="confirmarPassword">
                    Confirmar contraseña
                  </label>
                  <input
                    id="confirmarPassword"
                    type={mostrarPassword ? "text" : "password"}
                    placeholder="Repite tu contraseña"
                    autoComplete="new-password"
                    value={confirmarPassword}
                    onChange={(e) => setConfirmarPassword(e.target.value)}
                    minLength={6}
                    maxLength={8}
                    required
                  />

                  <small className="field-help">
                    Usa entre 6 y 8 caracteres.
                  </small>
                </>
              )}

              {mensaje && (
                <p
                  className={`form-message ${tipoMensaje}`}
                  role="status"
                  aria-live="polite"
                >
                  {mensaje}
                </p>
              )}

              <button
                className="primary-button"
                type="submit"
                disabled={cargando}
              >
                {cargando
                  ? "Procesando..."
                  : modoRegistro
                  ? "Crear cuenta"
                  : "Iniciar sesión"}
              </button>
            </form>

            <p className="auth-footnote">
              Tu acceso está protegido mediante firma criptográfica JWT.
            </p>
          </section>
        </section>

        <footer className="auth-footer">
          DuoShield — Arquitectura Web Segura (AWS & Zero Trust)
        </footer>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand sidebar-brand" href="#">
          <span className="brand-mark">D</span>
          <span>
            Duo<span className="brand-accent">Shield</span>
          </span>
        </a>

        <span className="sidebar-label">MENÚ PRINCIPAL</span>

        <nav className="side-navigation">
          <button
            className={seccion === "dashboard" ? "nav-item active" : "nav-item"}
            onClick={() => setSeccion("dashboard")}
          >
            Panel principal
          </button>

          <button
            className={seccion === "actividad" ? "nav-item active" : "nav-item"}
            onClick={() => setSeccion("actividad")}
          >
            Actividad y Auditoría
          </button>

          <button
            className={seccion === "seguridad" ? "nav-item active" : "nav-item"}
            onClick={() => setSeccion("seguridad")}
          >
            Zero Trust y Controles
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="user-summary">
            <div className="user-avatar">
              {String(nombreUsuario).charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <strong>{nombreUsuario}</strong>
              <span>Rol: {dashboardData?.user?.role || usuario?.role || "user"}</span>
            </div>
          </div>

          <button className="logout-button" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <span className="eyebrow">CENTRO DE OPERACIONES Y SEGURIDAD</span>
            <p>Monitoreo continuo de defensas en AWS y Linux</p>
          </div>
          <span className="session-status">
            <span className="online-dot" /> Sesión activa (JWT Bearer)
          </span>
        </header>

        <div className="dashboard-content">
          {seccion === "dashboard" && (
            <>
              <section className="welcome-panel">
                <div>
                  <span className="eyebrow">DASHBOARD PROTEGIDO</span>
                  <h1>
                    Bienvenido, {dashboardData?.user?.name || usuario?.name || nombreUsuario}
                  </h1>
                  <p>
                    Tu solicitud fue procesada y validada continuamente mediante el principio Zero Trust
                    desde la red privada de backend.
                  </p>
                </div>
                <div className="welcome-symbol">✓</div>
              </section>

              <h2 className="section-heading">Métricas de Seguridad Zero Trust</h2>

              <div className="stats-grid">
                <article className="stat-card">
                  <span className="stat-label">Identidad</span>
                  <strong>Verificada</strong>
                  <small>Firma JWT válida y activa</small>
                </article>

                <article className="stat-card">
                  <span className="stat-label">Red Backend</span>
                  <strong>Privada / Aislada</strong>
                  <small>Sin salida pública a Internet</small>
                </article>

                <article className="stat-card">
                  <span className="stat-label">Hardening</span>
                  <strong>UFW & WAF</strong>
                  <small>Filtrado de puertos y perimetral</small>
                </article>
              </div>

              <div className="dashboard-grid">
                <article className="panel-card">
                  <span className="eyebrow">VALIDACIÓN CONTINUA DE CADA SOLICITUD</span>
                  <h3>Auditoría de Token en Backend</h3>
                  <p>
                    {dashboardData?.message || "Validando credenciales con la API privada..."}
                  </p>
                  <div className="success-line">
                    <span className="online-dot" />
                    <strong>Emisor:</strong> {dashboardData?.zeroTrustAudit?.tokenIssuer || "duoshield-api"}
                  </div>
                  <div className="success-line">
                    <span className="online-dot" />
                    <strong>Audiencia:</strong> {dashboardData?.zeroTrustAudit?.tokenAudience || "duoshield-client"}
                  </div>
                  <div className="success-line">
                    <span className="online-dot" />
                    <strong>IP Cliente detectada:</strong> {dashboardData?.zeroTrustAudit?.requestIp || "127.0.0.1"}
                  </div>
                </article>

                <article className="panel-card">
                  <span className="eyebrow">DATOS AUTENTICADOS DEL USUARIO</span>
                  <h3>Perfil Recuperado de BD</h3>
                  <span className="data-label">Nombre</span>
                  <p className="data-value">{dashboardData?.user?.name || nombreUsuario}</p>
                  <span className="data-label">Correo electrónico</span>
                  <p className="data-value">{dashboardData?.user?.email || usuario?.email || email}</p>
                  <span className="data-label">Rol</span>
                  <p className="data-value">{dashboardData?.user?.role || "user"}</p>
                </article>
              </div>

              <div className="info-banner">
                <p>
                  Todas las consultas realizadas en este panel son validadas continuamente mediante tokens criptográficos Bearer en el backend privado, garantizando la política Zero Trust en cada solicitud.
                </p>
              </div>
            </>
          )}

          {seccion === "actividad" && (
            <section className="secondary-view">
              <span className="eyebrow">MONITOREO Y DEFENSAS ACTIVAS</span>
              <h1>Controles de Seguridad del Sistema</h1>
              <p>
                Estado actual de los controles de seguridad implementados en la infraestructura:
              </p>

              <div className="dashboard-grid">
                {dashboardData?.securityControls?.map((control, idx) => (
                  <article className="panel-card" key={idx}>
                    <span className="eyebrow">{control.name}</span>
                    <h3>Estado: <span style={{ color: "#10b981" }}>{control.status}</span></h3>
                    <p>{control.detail}</p>
                  </article>
                ))}
              </div>

              <article className="panel-card" style={{ marginTop: "1.5rem" }}>
                <h3>Métricas del Servidor Backend (Node.js)</h3>
                <p><strong>Tiempo activo:</strong> {dashboardData?.systemMetrics?.uptimeSeconds} segundos</p>
                <p><strong>Memoria utilizada:</strong> {dashboardData?.systemMetrics?.memoryUsageMb} MB</p>
                <p><strong>Versión de Node:</strong> {dashboardData?.systemMetrics?.nodeVersion}</p>
              </article>
            </section>
          )}

          {seccion === "seguridad" && (
            <section className="secondary-view">
              <span className="eyebrow">DEMOSTRACIÓN DE CONTROLES ZERO TRUST</span>
              <h1>Pruebas de Seguridad en Tiempo Real</h1>
              <p>
                Utiliza estos botones para generar evidencia de la validación continua y el bloqueo de accesos no autorizados:
              </p>

              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
                <button
                  className="primary-button"
                  style={{ width: "auto" }}
                  onClick={() => cargarDashboard()}
                  disabled={cargandoDashboard}
                >
                  {cargandoDashboard ? "Validando..." : "Re-validar Token (Zero Trust)"}
                </button>

                <button
                  className="logout-button"
                  style={{ width: "auto", border: "1px solid #ef4444", color: "#ef4444" }}
                  onClick={probarAccesoSinToken}
                >
                  Probar Acceso Sin Token (Simulación)
                </button>
              </div>

              {pruebaResultado && (
                <article
                  className="panel-card"
                  style={{
                    borderColor: pruebaResultado.status === 401 ? "#ef4444" : "#10b981",
                    background: pruebaResultado.status === 401 ? "rgba(239, 68, 68, 0.05)" : "transparent",
                  }}
                >
                  <h3>
                    Resultado de la Prueba:{" "}
                    <span style={{ color: pruebaResultado.status === 401 ? "#ef4444" : "#10b981" }}>
                      HTTP {pruebaResultado.status} ({pruebaResultado.status === 401 ? "BLOQUEADO CORRECTAMENTE" : "PERMITIDO"})
                    </span>
                  </h3>
                  <p><strong>Mensaje del Backend:</strong> {pruebaResultado.mensaje}</p>
                  <p><strong>Código de Auditoría:</strong> {pruebaResultado.codigo}</p>
                  <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
                    {pruebaResultado.status === 401
                      ? "Evidencia: El middleware 'auth.middleware.js' interceptó la petición sin token y denegó el acceso protegiendo la API."
                      : "La solicitud fue permitida."}
                  </p>
                </article>
              )}
            </section>
          )}
        </div>

        <footer className="dashboard-footer">
          DuoShield — Arquitectura Web Segura • Principios Zero Trust & Defensa en Profundidad
        </footer>
      </section>
    </main>
  );
}

export default App;
