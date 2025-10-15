import React from "react";
import SolicitudesCodigoAdmin from "../componentes/SolicitudesCodigoAdmin";
import GestionCodigosInvitacion from "../componentes/GestionCodigosInvitacion";
import InformesEstadisticos from "../componentes/InformesEstadisticos";
import ListaUsuarios from "../componentes/ListaUsuarios";
import ModalVentana from "../componentes/ModalVentana";
import "../estilos/colores.css";
import "../estilos/dashboard.css";
import logo from "../assets/logo-ram.png";

function Dashboard({ setPantalla }) {
	// Recibe setPantalla como prop para navegación

	// Función para cerrar sesión
	const handleLogout = () => {
		localStorage.clear();
		setPantalla && setPantalla("login");
	};

	const [institucionId] = React.useState(() => localStorage.getItem("institucionId") || "");
	const [institucionNombre, setInstitucionNombre] = React.useState("");
	// Obtener nombre de la institución por id
	React.useEffect(() => {
		async function fetchNombre() {
			console.log("InstitucionId en localStorage:", institucionId);
			if (!institucionId) return setInstitucionNombre("");
			try {
				const res = await fetch(`http://localhost:3000/api/instituciones/${institucionId}`);
				const data = await res.json();
				console.log("Respuesta API institucion:", data);
				if (res.ok && data.institucion && data.institucion.nombre) {
					setInstitucionNombre(data.institucion.nombre);
				} else {
					setInstitucionNombre("");
				}
			} catch (err) {
				console.error("Error al obtener institucion:", err);
				setInstitucionNombre("");
			}
		}
		fetchNombre();
	}, [institucionId]);

	// Obtener nombre y rol del usuario logueado
	const nombre = localStorage.getItem("nombre") || "Administrador";
	const rol = localStorage.getItem("rol") || "admin";

	const [modal, setModal] = React.useState("");

	return (
		<div className="dashboard-container">
			<button className="logout-btn" onClick={handleLogout} title="Cerrar sesión">
				&#x2716; Cerrar sesión
			</button>
			<img src={logo} alt="Logo RAM" className="logo-ram" />
			<h1>Panel de Administración RAM</h1>
			<p className="slogan">Gestión de solicitudes y códigos de invitación</p>
			<div className="dashboard-bienvenida">
				<span>Bienvenido/a, <strong>{nombre}</strong> ({rol})</span>
				{institucionNombre && (
					<div style={{ marginTop: '0.5rem', fontWeight: 'bold', color: '#2980b9', fontSize: '1.1rem', background: 'rgba(255,255,255,0.7)', borderRadius: '6px', padding: '0.3rem 0.8rem', display: 'inline-block' }}>
						Institución: {institucionNombre}
					</div>
				)}
			</div>
			<div className="dashboard-admin-btns">
				<button className="dashboard-admin-btn" onClick={() => setModal("usuarios")}>👥 Ver usuarios registrados</button>
				<button className="dashboard-admin-btn" onClick={() => setModal("solicitudes")}>📨 Ver solicitudes de códigos</button>
				<button className="dashboard-admin-btn" onClick={() => setModal("codigos")}>🔑 Gestionar códigos de invitación</button>
				<button className="dashboard-admin-btn" onClick={() => setModal("informes")}>📈 Informes y estadísticas</button>
				<button className="dashboard-admin-btn" onClick={() => setModal("profesores")}>👨‍🏫 Gestionar profesores</button>
				<button className="dashboard-admin-btn" onClick={() => setModal("trabajos")}>📄 Trabajos Prácticos Evaluativos</button>
				<button className="dashboard-admin-btn" onClick={() => setModal("estudiantes")}>🎓 Gestionar estudiantes</button>
			</div>
			<ModalVentana open={modal === "usuarios"} onClose={() => setModal("")} titulo="Usuarios registrados">
				<ListaUsuarios />
			</ModalVentana>
			<ModalVentana open={modal === "solicitudes"} onClose={() => setModal("")} titulo="Solicitudes de código de invitación">
				<SolicitudesCodigoAdmin institucionId={institucionId} institucionNombre={institucionNombre} />
			</ModalVentana>
			<ModalVentana open={modal === "codigos"} onClose={() => setModal("")} titulo="Gestión de códigos de invitación">
				<GestionCodigosInvitacion institucionId={institucionId} institucionNombre={institucionNombre} />
			</ModalVentana>
			<ModalVentana open={modal === "informes"} onClose={() => setModal("")} titulo="Informes y estadísticas">
				<InformesEstadisticos rol="administrador" />
			</ModalVentana>
			<ModalVentana open={modal === "profesores"} onClose={() => setModal("")} titulo="Gestión de profesores">
				{/* Aquí va el componente de gestión de profesores */}
				<p>Gestión de profesores (en desarrollo)</p>
			</ModalVentana>
			<ModalVentana open={modal === "trabajos"} onClose={() => setModal("")} titulo="Trabajos Prácticos Evaluativos">
				{/* Aquí va el componente de trabajos prácticos evaluativos */}
				<p>Trabajos prácticos evaluativos (en desarrollo)</p>
			</ModalVentana>
			<ModalVentana open={modal === "estudiantes"} onClose={() => setModal("")} titulo="Gestión de estudiantes">
				{/* Aquí va el componente de gestión de estudiantes */}
				<p>Gestión de estudiantes (en desarrollo)</p>
			</ModalVentana>
		</div>
	);
}

export default Dashboard;
