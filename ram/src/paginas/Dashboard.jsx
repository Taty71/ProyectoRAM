import React from "react";
import SolicitudesCodigoAdmin from "../componentes/SolicitudesCodigoAdmin";
import GestionCodigosInvitacion from "../componentes/GestionCodigosInvitacion";
import InformesEstadisticos from "../componentes/InformesEstadisticos";
import ListaUsuarios from "../componentes/ListaUsuarios";
import ModalVentana from "../componentes/ModalVentana";
import InstitucionBanner from "../componentes/Institucion_Banner";
import ProfesorDashboard from "../componentes/ProfesorDashboard";
import GestionMateriasWrapper from "../componentes/GestionMaterias";
// import JefeAreaDashboard from "../componentes/JefeAreaDashboard"; // crear si hace falta
// import EstudianteDashboard from "../componentes/EstudianteDashboard"; // crear si hace falta
import "../estilos/colores.css";
import "../estilos/dashboard.css";
import logo from "../assets/logo-ram.png";

function Dashboard({ setPantalla }) {
  // Nombre y rol del usuario (leer de localStorage)
  const storedNombre = localStorage.getItem("nombre") || "";
  const storedApellido = localStorage.getItem("apellido") || "";
  const storedNombreCompleto = localStorage.getItem("nombreCompleto") || "";

  const nombreMostrar = storedNombre || (storedNombreCompleto ? storedNombreCompleto.split(' ')[0] : "Administrador");
  const apellidoMostrar = storedApellido || (storedNombreCompleto ? storedNombreCompleto.split(' ').slice(1).join(' ') : "");
  const rol = localStorage.getItem("rol") || "administrador";
  const nombreCompleto = `${nombreMostrar} ${apellidoMostrar}`.trim();

  // Institución (leer de localStorage y mantener en estado)
  const [institucionId] = React.useState(() => localStorage.getItem("institucionId") || "");
  const [institucionNombre, setInstitucionNombre] = React.useState(() => localStorage.getItem("institucionNombre") || "");

  // Intentar obtener el nombre de la institución si no está en localStorage pero sí hay id
  React.useEffect(() => {
    if (institucionNombre || !institucionId) return;

    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/instituciones/${institucionId}`);
        if (!res.ok) return;
        const data = await res.json();
        const nombre = data?.institucion?.nombre || data?.nombre;
        if (nombre && mounted) {
          setInstitucionNombre(nombre);
          try { localStorage.setItem("institucionNombre", nombre); } catch { /* ignore */ }
        }
      } catch {
        try {
          const res2 = await fetch("http://localhost:3000/api/instituciones/activa");
          if (!res2.ok) return;
          const data2 = await res2.json();
          const nombre2 = data2?.institucion?.nombre || data2?.nombre;
          if (nombre2 && mounted) {
            setInstitucionNombre(nombre2);
            try { localStorage.setItem("institucionNombre", nombre2); } catch { /* ignore */ }
          }
        } catch {
          // ignore
        }
      }
    })();

    return () => { mounted = false; };
  }, [institucionId, institucionNombre]);

  const [modal, setModal] = React.useState("");
  // Decide que componente mostrar según rol
  if (rol === "profesor") {
    // ProfesorDashboard debería implementar su propia UI mínima
    return <ProfesorDashboard setPantalla={setPantalla} />;
  }

  if (rol === "jefe_area") {
    // crear y usar JefeAreaDashboard cuando esté listo
    return (
      <div>
        {/* Temporal: mensaje o redirigir a otro componente */}
        <h2>Bienvenido/a, {nombreCompleto} (Jefe de Área)</h2>
        <p>Panel de Jefe de Área en desarrollo.</p>
      </div>
    );
  }

  if (rol === "estudiante") {
    // crear y usar EstudianteDashboard cuando esté listo
    return (
      <div>
        <h2>Bienvenido/a, {nombreCompleto} (Estudiante)</h2>
        <p>Panel del estudiante en desarrollo.</p>
      </div>
    );
  }

  // POR DEFECTO: admin (o cualquier rol no reconocido)
  // Aquí colocamos la UI admin completa con botones y modales

  return (
    <div className="dashboard-container">
  <InstitucionBanner nombreInstitucion={institucionNombre} institucionId={institucionId} />
      <button className="logout-btn" onClick={() => { localStorage.clear(); setPantalla && setPantalla("login"); }}>
        &#x2716; Cerrar sesión
      </button>
      <img src={logo} alt="Logo RAM" className="logo-ram" />
      <h1>Panel de Administración RAM</h1>
      <p className="slogan">Gestión de solicitudes y códigos de invitación</p>

      <div className="dashboard-bienvenida">
        <span>Bienvenido/a, <strong>{nombreCompleto}</strong> ({rol})</span>
      </div>

      <div className="dashboard-admin-btns">
        <button className="dashboard-admin-btn" onClick={() => setModal("usuarios")}>👥 Ver usuarios registrados</button>
        <button className="dashboard-admin-btn" onClick={() => setModal("solicitudes")}>📨 Ver solicitudes de códigos</button>
        <button className="dashboard-admin-btn" onClick={() => setModal("codigos")}>🔑 Gestionar códigos de invitación</button>
  <button className="dashboard-admin-btn" onClick={() => setModal("materias")}>📚 Gestionar materias</button>
        <button className="dashboard-admin-btn" onClick={() => setModal("informes")}>📈 Informes y estadísticas</button>
        <button className="dashboard-admin-btn" onClick={() => setModal("profesores")}>👨‍🏫 Gestionar profesores</button>
        <button className="dashboard-admin-btn" onClick={() => setModal("trabajos")}>📄 Trabajos Prácticos Evaluativos</button>
        <button className="dashboard-admin-btn" onClick={() => setModal("estudiantes")}>🎓 Gestionar estudiantes</button>
      </div>

      <ModalVentana open={modal === "usuarios"} onClose={() => setModal("")} titulo="Usuarios registrados">
        <ListaUsuarios />
      </ModalVentana>

      <ModalVentana open={modal === "solicitudes"} onClose={() => setModal("")} titulo="Solicitudes de código de invitación">
        <SolicitudesCodigoAdmin institucionId={institucionId} institucionNombre={""} />
      </ModalVentana>

      <ModalVentana open={modal === "codigos"} onClose={() => setModal("")} titulo="Gestión de códigos de invitación">
        <GestionCodigosInvitacion institucionId={institucionId} institucionNombre={""} />
      </ModalVentana>

      <ModalVentana open={modal === "materias"} onClose={() => setModal("")} titulo="Gestión de materias">
        <div style={{ padding: 8 }}>
          <GestionMateriasWrapper institucionId={institucionId} institucionNombre={institucionNombre} />
        </div>
      </ModalVentana>

      <ModalVentana open={modal === "informes"} onClose={() => setModal("")} titulo="Informes y estadísticas">
        <InformesEstadisticos rol="administrador" />
      </ModalVentana>

      <ModalVentana open={modal === "profesores"} onClose={() => setModal("")} titulo="Gestión de profesores">
        <p>Gestión de profesores (en desarrollo)</p>
      </ModalVentana>

      <ModalVentana open={modal === "trabajos"} onClose={() => setModal("")} titulo="Trabajos Prácticos Evaluativos">
        <p>Trabajos prácticos evaluativos (en desarrollo)</p>
      </ModalVentana>

      <ModalVentana open={modal === "estudiantes"} onClose={() => setModal("")} titulo="Gestión de estudiantes">
        <p>Gestión de estudiantes (en desarrollo)</p>
      </ModalVentana>
    </div>
  );
}

export default Dashboard;