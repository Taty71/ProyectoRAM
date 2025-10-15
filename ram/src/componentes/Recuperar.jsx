import { useState } from "react";
import "../estilos/colores.css";
import "../estilos/recuperar.css";

function Recuperar({ setPantalla }) {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setError("");
    try {
      const res = await fetch("http://localhost:3000/api/auth/recuperar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg("Si el correo está registrado, recibirás instrucciones.");
      } else {
        setError(data.error || "No se pudo enviar el correo.");
      }
    } catch {
      setError("Error de conexión");
    }
  };

  return (
    <div className="recuperar-container">
      <h2>Recuperar contraseña</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Correo registrado"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <button type="submit">Enviar instrucciones</button>
        <button type="button" className="recuperar-link" onClick={() => setPantalla("login")}>Volver al login</button>
      </form>
      {error && <p className="recuperar-error">{error}</p>}
      {msg && <p className="recuperar-msg">{msg}</p>}
    </div>
  );
}

export default Recuperar;
