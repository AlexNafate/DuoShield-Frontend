import { useState } from "react";
import "./App.css";

function App() {
  const [mostrarPassword, setMostrarPassword] = useState(false);

  return (
    <main className="pagina">
      <header className="barra">
        <div className="marca">
          <div className="logo">D</div>
          <span>DuoShield</span>
        </div>
        <span className="estado">
          <span className="punto" />
          Plataforma protegida
        </span>
      </header>

      <section className="contenido">
        <div className="presentacion">
          <span className="etiqueta">SEGURIDAD POR CAPAS</span>
          <h1>Tu seguridad empieza aquí.</h1>
          <p>
            Una plataforma web diseñada con principios Zero Trust
            y defensa en profundidad.
          </p>

          <div className="beneficios">
            <div className="beneficio">
              <span className="icono">01</span>
              <div>
                <strong>Zero Trust</strong>
                <p>Verificación antes de conceder acceso.</p>
              </div>
            </div>
            <div className="beneficio">
              <span className="icono">02</span>
              <div>
                <strong>Defensa en profundidad</strong>
                <p>Capas de protección para tus servicios.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="tarjeta">
          <div className="escudo">✓</div>
          <h2>Bienvenido</h2>
          <p className="subtitulo">Inicia sesión en tu cuenta DuoShield</p>

          <form onSubmit={(e) => {
            e.preventDefault();
            alert("El inicio de sesión se conectará al backend en el siguiente paso.");
          }}>
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="tu@ejemplo.com"
              autoComplete="email"
              required
            />

            <label htmlFor="password">Contraseña</label>
            <div className="campo-password">
              <input
                id="password"
                type={mostrarPassword ? "text" : "password"}
                placeholder="Ingresa tu contraseña"
                autoComplete="current-password"
                required
              />
              <button
                className="ver-password"
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
              >
                {mostrarPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>

            <button className="boton-principal" type="submit">
              Iniciar sesión <span>→</span>
            </button>
          </form>

          <p className="nota">
            🔒 Tus accesos estarán protegidos mediante autenticación.
          </p>
        </div>
      </section>

      <footer>
        DuoShield · Proyecto académico de ciberseguridad
      </footer>
    </main>
  );
}

export default App;
