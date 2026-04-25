import { useState } from "react";

const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const dias = Array.from({length: 31}, (_, i) => i + 1);
const anios = Array.from({length: 100}, (_, i) => new Date().getFullYear() - i);
const dietaOpciones = ["Mantener mi peso actual","Pérdida de peso leve","Pérdida de peso ","Pérdida de peso intensa ","Ganar peso "];

export default function MiCuentaFatSecret() {
  const [form, setForm] = useState({
    sexo: "femenino",
    peso: "",
    altura: "",
    mes: "Enero",
    dia: "1",
    anio: "",
    actividad: "sedentario",
    dieta: "Mantener mi peso actual",
    pesoMeta: "",
    usuario: "",
    correo: "",
    tipoDieta: "omnivoro",
    intolerancias: [],
    alimentoRestringido: "",
    alimentosRestringidos: [],
  });

  const [enviado, setEnviado] = useState(false);
  const [errores, setErrores] = useState({});

  const set = (campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }));
    setErrores(prev => ({ ...prev, [campo]: "" }));
  };

  const validar = () => {
    const e = {};
    if (!form.peso) e.peso = "Ingresa tu peso";
    if (!form.altura) e.altura = "Ingresa tu altura";
    if (!form.anio) e.anio = "Selecciona el año";
    if (!form.usuario.trim()) e.usuario = "El nombre de usuario es obligatorio";
    if (!form.correo.trim()) e.correo = "El correo es obligatorio";
    else if (!/\S+@\S+\.\S+/.test(form.correo)) e.correo = "Correo inválido";
    return e;
  };

  const handleSiguiente = async () => {
    const e = validar();
    if (Object.keys(e).length > 0) {
      setErrores(e);
      return;
    }
    try {
      const respuesta = await fetch("http://localhost:3000/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (respuesta.ok) {
        setEnviado(true);
      } else {
        alert("Hubo un error al guardar");
      }
    } catch (err) {
      alert("No se pudo conectar con el servidor");
    }
  };
  if (enviado) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.successTitle}>¡Cuenta creada!</h2>
          <p style={styles.successText}>Bienvenida, <strong>{form.usuario}</strong>. Tu perfil fue guardado correctamente.</p>
          <button style={styles.btnPrimary} onClick={() => setEnviado(false)}>Volver al formulario</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>

        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>🔒</span>
            <span style={styles.logoText}>fatsecret</span>
          </div>
          <span style={styles.headerTitle}>Mi cuenta FatSecret</span>
        </div>

        <div style={styles.divider} />

        <div style={styles.body}>

          {/* Sección: Mis Detalles */}
          <Section title="Mis detalles">

            <Row label="Sexo:">
              <RadioGroup
                options={[{ value: "femenino", label: "Femenino" }, { value: "masculino", label: "Masculino" }]}
                value={form.sexo}
                onChange={v => set("sexo", v)}
              />
            </Row>

            <Row label="Peso Actual:">
              <div style={styles.inputGroup}>
                <input
                  type="number"
                  placeholder=""
                  value={form.peso}
                  onChange={e => set("peso", e.target.value)}
                  style={{ ...styles.inputSmall, ...(errores.peso ? styles.inputError : {}) }}
                />
                <span style={styles.unit}>kg</span>
                <span style={styles.linkAzul}>(Cambiar a libras)</span>
              </div>
              {errores.peso && <ErrorMsg>{errores.peso}</ErrorMsg>}
            </Row>

            <Row label="Altura:">
              <div style={styles.inputGroup}>
                <input
                  type="number"
                  placeholder=""
                  value={form.altura}
                  onChange={e => set("altura", e.target.value)}
                  style={{ ...styles.inputSmall, ...(errores.altura ? styles.inputError : {}) }}
                />
                <span style={styles.unit}>cm</span>
                <span style={styles.linkAzul}>(Cambiar a pulgadas)</span>
              </div>
              {errores.altura && <ErrorMsg>{errores.altura}</ErrorMsg>}
            </Row>

            <Row label="Fecha de nacimiento:">
              <div style={styles.inputGroup}>
                <Select value={form.mes} onChange={v => set("mes", v)} options={meses} />
                <Select value={form.dia} onChange={v => set("dia", v)} options={dias} />
                <Select
                  value={form.anio}
                  onChange={v => set("anio", v)}
                  options={["Año", ...anios]}
                  style={errores.anio ? styles.inputError : {}}
                />
              </div>
              {errores.anio && <ErrorMsg>{errores.anio}</ErrorMsg>}
            </Row>

            <Row label="Nivel de Actividad*:">
              <div>
                <RadioGroup
                  options={[
                    { value: "sedentario", label: "Sedentario" },
                    { value: "baja", label: "Baja Actividad" },
                    { value: "activo", label: "Activo" },
                    { value: "muy_activo", label: "Muy Activo" },
                  ]}
                  value={form.actividad}
                  onChange={v => set("actividad", v)}
                />
                <p style={styles.helpText}>* ¿Qué nivel de actividad debo elegir?</p>
              </div>
            </Row>

          </Section>

          <div style={styles.divider} />

          {/* Sección: Mis Metas */}
          <Section title="Mis Metas">

    <Row label="Dieta Objetivo:">
      <select
        value={form.dieta}
        onChange={e => set("dieta", e.target.value)}
        style={styles.selectWide}
      >
        {dietaOpciones.map(o => <option key={o}>{o}</option>)}
      </select>
    </Row>

    <Row label="Peso meta:">
      <div style={styles.inputGroup}>
        <input
          type="number"
          value={form.pesoMeta}
          onChange={e => set("pesoMeta", e.target.value)}
          style={styles.inputSmall}
        />
        <span style={styles.unit}>kg</span>
      </div>
    </Row>

    <Row label="Tipo de dieta:">
      <RadioGroup
        options={[
          { value: "omnivoro", label: "Omnívoro" },
          { value: "vegetariano", label: "Vegetariano" },
          { value: "vegano", label: "Vegano" },
          { value: "pescetariano", label: "Pescetariano" },
          { value: "keto", label: "Keto" },
        ]}
        value={form.tipoDieta}
        onChange={v => set("tipoDieta", v)}
      />
    </Row>

    <Row label="Intolerancias:">
      <div style={styles.radioGroup}>
        {["Gluten", "Lactosa", "Ninguna"].map(item => (
          <label key={item} style={styles.radioLabel}>
            <input
              type="checkbox"
              checked={form.intolerancias.includes(item)}
              onChange={e => {
                if (item === "Ninguna") {
                  set("intolerancias", e.target.checked ? ["Ninguna"] : []);
                } else {
                  const sin = form.intolerancias.filter(i => i !== "Ninguna");
                  set("intolerancias", e.target.checked
                    ? [...sin, item]
                    : sin.filter(i => i !== item)
                  );
                }
              }}
              style={{ accentColor: teal }}
            />
            {item}
          </label>
        ))}
      </div>
    </Row>

    <Row label="Alimentos restringidos:">
      <div>
        <p style={styles.helpText}>Sea lo más específico y preciso posible. Ejemplo: "pistachos", "camarones".</p>
        <div style={styles.inputGroup}>
          <input
            type="text"
            value={form.alimentoRestringido}
            onChange={e => set("alimentoRestringido", e.target.value)}
            placeholder="Escribe un alimento..."
            style={styles.inputWide}
            onKeyDown={e => {
              if (e.key === "Enter" && form.alimentoRestringido.trim()) {
                set("alimentosRestringidos", [...form.alimentosRestringidos, form.alimentoRestringido.trim()]);
                set("alimentoRestringido", "");
              }
            }}
          />
          <button
            style={styles.btnAgregar}
            onClick={() => {
              if (form.alimentoRestringido.trim()) {
                set("alimentosRestringidos", [...form.alimentosRestringidos, form.alimentoRestringido.trim()]);
                set("alimentoRestringido", "");
              }
            }}
          >
            Agregar
          </button>
        </div>
        <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
          {form.alimentosRestringidos.map((a, i) => (
            <span key={i} style={styles.tag}>
              {a}
              <button
                onClick={() => set("alimentosRestringidos", form.alimentosRestringidos.filter((_, j) => j !== i))}
                style={styles.tagX}
              >×</button>
            </span>
          ))}
        </div>
      </div>
    </Row>

  </Section>

          <div style={styles.divider} />

          {/* Sección: Cuenta */}
          <Section title="Cuenta de FatSecret">

            <Row label="Nombre del Miembro:">
              <div>
                <input
                  type="text"
                  value={form.usuario}
                  onChange={e => set("usuario", e.target.value)}
                  style={{ ...styles.inputWide, ...(errores.usuario ? styles.inputError : {}) }}
                />
                <p style={styles.helpText}>Su nombre de usuario es público, coloque algo con lo que se sienta cómodo para interactuar con la comunidad. Toda la demás información provista es confidencial.</p>
                {errores.usuario && <ErrorMsg>{errores.usuario}</ErrorMsg>}
              </div>
            </Row>

            <Row label="Correo Electrónico:">
              <div>
                <input
                  type="email"
                  value={form.correo}
                  onChange={e => set("correo", e.target.value)}
                  style={{ ...styles.inputWide, ...(errores.correo ? styles.inputError : {}) }}
                />
                {errores.correo && <ErrorMsg>{errores.correo}</ErrorMsg>}
              </div>
            </Row>

          </Section>

          {/* Aviso legal */}
          <p style={styles.legal}>
            Haciendo click en 'Siguiente', usted está de acuerdo con los{" "}
            <span style={styles.linkAzul}>Términos y Condiciones</span>{" "}
            y la{" "}
            <span style={styles.linkAzul}>Política de Privacidad</span>{" "}
            de FatSecret
          </p>

          {/* Botones */}
          <div style={styles.botones}>
            <button style={styles.btnCancelar} onClick={() => setForm({ sexo:"femenino", peso:"", altura:"", mes:"Enero", dia:"1", anio:"", actividad:"sedentario", dieta:"Mantener mi peso actual", pesoMeta:"", usuario:"", correo:"" })}>
              Cancelar
            </button>
            <button style={styles.btnPrimary} onClick={handleSiguiente}>
              Siguiente
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ─── Sub-componentes ─── */

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      <div>{children}</div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div style={styles.row}>
      <label style={styles.rowLabel}>{label}</label>
      <div style={styles.rowContent}>{children}</div>
    </div>
  );
}

function RadioGroup({ options, value, onChange }) {
  return (
    <div style={styles.radioGroup}>
      {options.map(opt => (
        <label key={opt.value} style={styles.radioLabel}>
          <input
            type="radio"
            name={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            style={styles.radio}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

function Select({ value, onChange, options, style = {} }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ ...styles.select, ...style }}
    >
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  );
}

function ErrorMsg({ children }) {
  return <p style={styles.errorMsg}>{children}</p>;
}

/* ─── Estilos ─── */

const teal = "#3db39e";
const tealDark = "#2a8a7a";

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f0",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingTop: 32,
    paddingBottom: 32,
    fontFamily: "'Segoe UI', Arial, sans-serif",
    fontSize: 14,
    color: "#333",
  },
  card: {
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: 4,
    width: "100%",
    maxWidth: 780,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
  },
  logo: { display: "flex", alignItems: "center", gap: 8 },
  logoIcon: { fontSize: 22 },
  logoText: { color: teal, fontSize: 22, fontWeight: "bold", fontStyle: "italic" },
  headerTitle: { color: "#7ab", fontSize: 18 },
  divider: { height: 1, backgroundColor: "#e0e0e0" },
  body: { padding: "24px 40px 32px" },
  sectionTitle: { color: teal, fontSize: 18, fontWeight: "normal", marginBottom: 16, marginTop: 8 },
  row: {
    display: "flex",
    alignItems: "flex-start",
    marginBottom: 14,
    gap: 16,
  },
  rowLabel: { width: 160, minWidth: 160, textAlign: "right", paddingTop: 6, color: "#555", fontSize: 13 },
  rowContent: { flex: 1 },
  inputGroup: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  inputSmall: {
    width: 90, padding: "5px 8px", border: "1px solid #ccc",
    borderRadius: 3, fontSize: 13, outline: "none",
  },
  inputWide: {
    width: 380, padding: "5px 8px", border: "1px solid #ccc",
    borderRadius: 3, fontSize: 13, outline: "none",
  },
  inputError: { borderColor: "#e55" },
  select: {
    padding: "5px 6px", border: "1px solid #ccc",
    borderRadius: 3, fontSize: 13, backgroundColor: "#fff",
  },
  selectWide: {
    width: 380, padding: "5px 8px", border: "1px solid #ccc",
    borderRadius: 3, fontSize: 13, backgroundColor: "#fff",
  },
  unit: { color: "#555", fontSize: 13 },
  linkAzul: { color: teal, cursor: "pointer", fontSize: 13 },
  radioGroup: { display: "flex", gap: 20, flexWrap: "wrap", paddingTop: 4 },
  radioLabel: { display: "flex", alignItems: "center", gap: 5, fontSize: 13, cursor: "pointer" },
  radio: { accentColor: teal },
  helpText: { fontSize: 12, color: "#777", marginTop: 6, maxWidth: 440 },
  legal: { textAlign: "center", fontSize: 12, color: "#555", margin: "20px 0" },
  botones: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  btnCancelar: {
    padding: "8px 32px", backgroundColor: "#fff", border: "1px solid #aaa",
    borderRadius: 3, fontSize: 14, cursor: "pointer", color: teal, fontWeight: "bold",
  },
  btnPrimary: {
    padding: "8px 32px", backgroundColor: teal, border: "none",
    borderRadius: 3, fontSize: 14, cursor: "pointer", color: "#fff", fontWeight: "bold",
  },
  errorMsg: { color: "#e55", fontSize: 12, marginTop: 3 },
  successIcon: { fontSize: 48, textAlign: "center", color: teal, marginBottom: 12 },
  successTitle: { textAlign: "center", color: teal, fontSize: 22, fontWeight: "normal" },
  successText: { textAlign: "center", color: "#555", marginBottom: 20 },

  btnAgregar: {
    padding: "5px 14px",
    backgroundColor: teal,
    border: "none",
    borderRadius: 3,
    color: "#fff",
    fontSize: 13,
    cursor: "pointer",
  },
  tag: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#e8f5f2",
    border: `1px solid ${teal}`,
    borderRadius: 20,
    padding: "3px 10px",
    fontSize: 12,
    color: teal,
  },
  tagX: {
    background: "none",
    border: "none",
    color: teal,
    cursor: "pointer",
    fontSize: 14,
    padding: 0,
    lineHeight: 1,
  },

};
