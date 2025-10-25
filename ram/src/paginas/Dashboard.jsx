import React from "react";
import SolicitudesCodigoAdmin from "../componentes/SolicitudesCodigoAdmin";
import GestionCodigosInvitacion from "../componentes/GestionCodigosInvitacion";
import InformesEstadisticos from "../componentes/InformesEstadisticos";
import VerUsuariosModal from "../componentes/VerUsuariosModal";
import TrabajosPracticosMiAprendizaje from "../componentes/TrabajosPracticosMiAprendizaje";
import ModalVentana from "../componentes/ModalVentana";
import InstitucionBanner from "../componentes/Institucion_Banner";
import ProfesorDashboard from "../componentes/ProfesorDashboard";
import EstudianteDashboard from "../componentes/EstudianteDashboard";
import GestionMateriasWrapper from "../componentes/GestionMaterias";
import ListaProfesores from "../componentes/ListaProfesoresFixed";
import ListaEstudiantes from "../componentes/ListaEstudiantes";
// import JefeAreaDashboard from "../componentes/JefeAreaDashboard"; // crear si hace falta
// import EstudianteDashboard from "../componentes/EstudianteDashboard"; // crear si hace falta
import "../estilos/colores.css";
import "../estilos/dashboard.css";
import "../estilos/estudianteDashboard.css";
import logo from "../assets/logoRAM.png";

function Dashboard({ setPantalla }) {
  // Nombre y rol del usuario (leer de localStorage)
  const storedNombre = localStorage.getItem("nombre") || "";
  const storedApellido = localStorage.getItem("apellido") || "";
  const storedNombreCompleto = localStorage.getItem("nombreCompleto") || "";

  const nombreMostrar = storedNombre || (storedNombreCompleto ? storedNombreCompleto.split(' ')[0] : "Administrador");
  const apellidoMostrar = storedApellido || (storedNombreCompleto ? storedNombreCompleto.split(' ').slice(1).join(' ') : "");
  const rawRol = localStorage.getItem("rol") || "administrador";
  const rol = (typeof rawRol === 'string') ? rawRol.toLowerCase() : rawRol;
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
        } catch (err) {
          // ignore errors when attempting fallback institution lookup
          void err;
        }
      }
    })();

    return () => { mounted = false; };
  }, [institucionId, institucionNombre]);

  const [modal, setModal] = React.useState("");
  // Decide que componente mostrar según rol
  if (rol === "profesor" || rol === 'teacher') {
    // ProfesorDashboard proporciona la vista restringida para profesores
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
    return <EstudianteDashboard setPantalla={setPantalla} />;
  }

  // POR DEFECTO: admin (o cualquier rol no reconocido)
  // Aquí colocamos la UI admin completa con botones y modales

  return (
    <div className="dashboard-wrap">
      <div className="header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={logo} alt="Logo RAM" className="logo-ram" />
          <h1 className="header-title">Panel de Administración RAM</h1>
        </div>
        <div className="header-actions">
          <button className="logout-btn" onClick={() => { localStorage.clear(); setPantalla && setPantalla("login"); }}>
            Cerrar sesión
          </button>
        </div>
      </div>

      <p className="slogan">Gestión de solicitudes y códigos de invitación</p>

      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <span className="welcome-pill">Bienvenido/a, <strong>{nombreCompleto}</strong> ({rol})</span>
      </div>

      <InstitucionBanner nombreInstitucion={institucionNombre} institucionId={institucionId} />

      <div className="panel-buttons">
        <button className="btn-primary" onClick={() => setModal("usuarios")}>👥 Ver usuarios registrados</button>
        <button className="btn-primary" onClick={() => setModal("solicitudes")}>📨 Ver solicitudes de códigos</button>
        <button className="btn-primary" onClick={() => setModal("codigos")}>🔑 Gestionar códigos de invitación</button>
        <button className="btn-primary" onClick={() => setModal("materias")}>📚 Gestionar materias</button>
        <button className="btn-primary" onClick={() => setModal("informes")}>📈 Informes y estadísticas</button>
        <button className="btn-primary" onClick={() => setModal("profesores")}>👨‍🏫 Gestionar profesores</button>
        <button className="btn-primary" onClick={() => setModal("trabajos")}>📄 Trabajos Prácticos Evaluativos</button>
        <button className="btn-primary" onClick={() => setModal("estudiantes")}>🎓 Gestionar estudiantes</button>
      </div>

      <VerUsuariosModal open={modal === "usuarios"} onClose={() => setModal("")} />

      <ModalVentana open={modal === "solicitudes"} onClose={() => setModal("")} titulo="Solicitudes de código de invitación" wide ultra>
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

      <ModalVentana open={modal === "profesores"} onClose={() => setModal("")} titulo="Gestión de profesores" wide>
        <div style={{ padding: 8 }}>
          <ListaProfesores institucionId={institucionId} institucionNombre={institucionNombre} />
        </div>
      </ModalVentana>

      <ModalVentana open={modal === "trabajos"} onClose={() => setModal("")} titulo="Trabajos Prácticos Evaluativos">
        <TrabajosPracticosMiAprendizaje />
      </ModalVentana>

      <ModalVentana open={modal === "estudiantes"} onClose={() => setModal("")} titulo="Gestión de estudiantes" wide>
        <div style={{ padding: 8 }}>
          <ListaEstudiantes institucionId={institucionId} />
        </div>
      </ModalVentana>
    </div>
  );
}

export default Dashboard;