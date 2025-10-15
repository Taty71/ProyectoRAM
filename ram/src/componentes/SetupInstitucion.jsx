import React, { useState } from "react";
import { institucionSchema } from "../utils/validatorYup";
import ErrorHandler, { useErrorHandler } from "../utils/ErrorHandler";
import InputText from "./InputText";
import InputSelect from "./InputSelect";
import "../estilos/SetupInstitucion.css";



function SetupInstitucion({
  institucion,
  setInstitucion,
  tipoInstitucion,
  setTipoInstitucion,
  especialidadesDisponibles,
  setEspecialidadesDisponibles,
  orientacionesDisponibles,
  setOrientacionesDisponibles,
  nuevaEspecialidad,
  setNuevaEspecialidad,
  erroresCampos,
  setErroresCampos,
  setPaso,
  setMensaje,
  cargando,
  setCargando
}) {
  const { error, clearError, setValidationError, formatError } = useErrorHandler();
  // ...existing code...
  const [mensajeLocal, setMensajeLocal] = React.useState("");
  const [showModal, setShowModal] = useState(false);
  const [checkedEspecialidades, setCheckedEspecialidades] = useState([]);
  const handleInstitucionChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setInstitucion(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setInstitucion(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleOpenModal = () => {
    setCheckedEspecialidades([]);
    setShowModal(true);
  };

  const handleCheckEspecialidad = (id) => {
    setCheckedEspecialidades(prev =>
      prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]
    );
  };

  const handleConfirmEspecialidades = () => {
    const lista = tipoInstitucion === 'tecnica' ? especialidadesDisponibles : orientacionesDisponibles;
    const nuevas = lista.filter(esp => checkedEspecialidades.includes(esp.id));
    setInstitucion(prev => {
      const yaExistentes = prev.ciclos?.map(e => e.nombre) || [];
      const nuevasFiltradas = nuevas.filter(esp => !yaExistentes.includes(esp.nombre));
      const cursosAuto = tipoInstitucion === 'tecnica' ? ['4to', '5to', '6to', '7mo'] : ['4to', '5to', '6to'];
      return {
        ...prev,
        ciclos: [
          ...(prev.ciclos || []),
          ...nuevasFiltradas.map(esp => ({
            id: esp.id,
            nombre: esp.nombre,
            cursos: cursosAuto
          }))
        ]
      };
    });
    setShowModal(false);
  };

  const handleAgregarEspecialidad = () => {
    if (!nuevaEspecialidad.trim()) return;
    if (tipoInstitucion === 'tecnica') {
      setEspecialidadesDisponibles(prev => [...prev, { id: nuevaEspecialidad.toLowerCase().replace(/\s+/g, '_'), nombre: nuevaEspecialidad }]);
    } else {
      setOrientacionesDisponibles(prev => [...prev, { id: nuevaEspecialidad.toLowerCase().replace(/\s+/g, '_'), nombre: nuevaEspecialidad }]);
    }
    setNuevaEspecialidad("");
  };

  // ...existing code...

  const handleSubmitInstitucion = async (e) => {
    e.preventDefault();
  clearError();
    setErroresCampos({});
    let sitioWeb = institucion.contacto.sitioWeb;
    if (sitioWeb.startsWith('www.https://')) {
      sitioWeb = sitioWeb.replace('www.', '');
    }
    // Solo enviar los campos requeridos por el backend
    const payload = {
      nombre: institucion.nombre,
      codigo: institucion.codigo,
      modalidad: tipoInstitucion,
      ciclos: (institucion.ciclos || []).map(ciclo => ({
        id: ciclo.id,
        nombre: ciclo.nombre,
        cursos: ciclo.cursos
      })),
      contacto: {
        email: institucion.contacto.email,
        sitioWeb
      }
    };
    try {
      await institucionSchema.validate(payload, { abortEarly: false });
      setCargando(true);
      await ErrorHandler.handleFetch(
        "http://localhost:3000/api/setup/institucion",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        },
        "Error al crear la institución"
      );
  setMensajeLocal("Institución creada exitosamente");
      setTimeout(() => {
        setPaso(2);
        setMensaje("");
      }, 1500);
    } catch (err) {
      if (err.name === 'ValidationError') {
        const fieldErrors = {};
        err.inner.forEach(e => {
          fieldErrors[e.path] = e.message;
        });
        setErroresCampos(fieldErrors);
        setValidationError("Corrige los errores marcados en el formulario.");
      } else if (err.type) {
        setValidationError(err.message);
      } else {
        setValidationError("Error de red o inesperado");
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <form onSubmit={handleSubmitInstitucion} className="setup-form">
      <h2>Configurar Institución</h2>
      <div className="setup-row">
        <InputText
          label="Nombre de la Institución *"
          name="nombre"
          value={institucion.nombre}
          onChange={handleInstitucionChange}
          placeholder="Ej: IPET 379 ALFREDO BENOIT MOLET"
          required
          error={erroresCampos.nombre}
        />
        <InputText
          label="Código/ID Simple *"
          name="codigo"
          value={institucion.codigo}
          onChange={handleInstitucionChange}
          placeholder="Ej: 379"
          required
          error={erroresCampos.codigo}
        />
      </div>
      <div className="setup-row">
        <InputSelect
          label="Tipo de institución *"
          name="tipoInstitucion"
          value={tipoInstitucion}
          onChange={e => setTipoInstitucion(e.target.value)}
          required
          options={[
            { value: "tecnica", label: "Técnica" },
            { value: "orientada", label: "Orientada" }
          ]}
          className="setup-input-select"
        />
      </div>
      <div className="setup-row">
        <div className="setup-especialidad-row-horizontal">
          <button type="button" className="setup-btn-primary setup-especialidad-btn" onClick={handleOpenModal}>
            Seleccionar {tipoInstitucion === 'tecnica' ? 'especialidades técnicas' : 'orientaciones'}
          </button>
          <InputText
            className="setup-input setup-input-nueva-especialidad setup-especialidad-input"
            value={nuevaEspecialidad}
            onChange={e => setNuevaEspecialidad(e.target.value)}
            placeholder={`Agregar nueva ${tipoInstitucion === 'tecnica' ? 'especialidad' : 'orientación'}`}
          />
          <button type="button" className="setup-btn-primary setup-especialidad-btn" onClick={handleAgregarEspecialidad}>
            Agregar
          </button>
        </div>
        {/* Modal de selección múltiple */}
        {showModal && (
          <div className="setup-modal-overlay">
            <div className="setup-modal" style={{ background: '#fff', borderRadius: 12, padding: '2rem', boxShadow: '0 4px 24px rgba(0,0,0,0.13)', maxWidth: 400, margin: '2rem auto', position: 'relative', zIndex: 999 }}>
              <h3 style={{ marginBottom: '1rem' }}>Selecciona {tipoInstitucion === 'tecnica' ? 'especialidades técnicas' : 'orientaciones'}</h3>
              <div style={{ maxHeight: 220, overflowY: 'auto', marginBottom: '1rem' }}>
                {(tipoInstitucion === 'tecnica' ? especialidadesDisponibles : orientacionesDisponibles).map(esp => (
                  <label key={esp.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                    <input
                      type="checkbox"
                      checked={checkedEspecialidades.includes(esp.id)}
                      onChange={() => handleCheckEspecialidad(esp.id)}
                      style={{ marginRight: 8 }}
                    />
                    {esp.nombre}
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="setup-btn-primary" onClick={handleConfirmEspecialidades} disabled={checkedEspecialidades.length === 0}>Confirmar</button>
                <button type="button" className="setup-btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              </div>
            </div>
            <div className="setup-modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 998 }} onClick={() => setShowModal(false)} />
          </div>
        )}
        {/* Mostrar ciclos agregados */}
        {institucion.ciclos?.length > 0 && (
          <div className="setup-especialidades-list">
            <strong>{tipoInstitucion === 'tecnica' ? 'Especialidades técnicas' : 'Orientaciones'} agregadas:</strong>
            <ul style={{ margin: '0.5rem 0', paddingLeft: '1rem' }}>
              {institucion.ciclos.map((ciclo, idx) => (
                <li key={ciclo.nombre} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>{ciclo.nombre}</span>
                  <button type="button" style={{ color: '#c62828', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }} onClick={() => {
                    setInstitucion(prev => ({
                      ...prev,
                      ciclos: prev.ciclos.filter((_, i) => i !== idx)
                    }));
                  }}>✕</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {institucion.ciclos?.length > 0 && (
        <div className="setup-row">
          <label>
            Cursos asignados automáticamente a cada {tipoInstitucion === 'tecnica' ? 'especialidad' : 'orientación'}:
            <div className="setup-años-container">
              {institucion.ciclos.map((ciclo) => (
                <div key={ciclo.nombre} style={{ marginBottom: '0.5rem' }}>
                  <strong>{ciclo.nombre}:</strong>
                  <span style={{ marginLeft: '1rem' }}>{ciclo.cursos.join(', ')}</span>
                </div>
              ))}
            </div>
          </label>
        </div>
      )}
      <div className="setup-row">
        <InputText
          label="Email de contacto"
          name="contacto.email"
          type="email"
          value={institucion.contacto.email}
          onChange={handleInstitucionChange}
          placeholder="Ej: contacto@ipet379.edu.ar"
          error={erroresCampos['contacto.email']}
        />
      </div>
      <div className="setup-row">
        <InputText
          label="Sitio Web"
          name="contacto.sitioWeb"
          type="url"
          value={institucion.contacto.sitioWeb}
          onChange={handleInstitucionChange}
          placeholder="Ej: www.ipet379.edu.ar"
        />
      </div>
      <button type="submit" disabled={cargando} className="setup-btn-primary">
        {cargando ? "Creando institución..." : "Continuar"}
      </button>
      {error && (
        <div className="setup-error-message">
          {formatError(error)}
        </div>
      )}
      {mensajeLocal && (
        <div className="setup-success-message">
          <span style={{fontSize: '1.3em', marginRight: '0.5em', verticalAlign: 'middle'}}>✅</span>
          {mensajeLocal}
        </div>
      )}
    </form>
  );
}

export default SetupInstitucion;
