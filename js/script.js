/* =========================================================
   script.js — Validaciones del formulario de reservas
   Restaurante El Fogón Dorado
   ========================================================= */


/* ---------------------------------------------------------
   1. ELEMENTOS DEL HTML QUE VAMOS A USAR
   --------------------------------------------------------- */
const formulario     = document.getElementById("formReserva");
const avisoErrores   = document.getElementById("avisoErrores");
const observaciones  = document.getElementById("observaciones");
const contador       = document.getElementById("contador");

const modal          = document.getElementById("modal");
const modalMensaje   = document.getElementById("modalMensaje");
const resumen        = document.getElementById("resumen");
const btnCerrarModal = document.getElementById("btnCerrarModal");


/* ---------------------------------------------------------
   2. REGLAS DEL RESTAURANTE
   --------------------------------------------------------- */
const HORA_APERTURA = "12:00";   // primera hora para reservar
const HORA_CIERRE   = "22:00";   // última hora para reservar
const MAX_PERSONAS  = 20;
const EDAD_MINIMA   = 18;

// Nombres "bonitos" para mostrar el tipo de reserva en el resumen
const NOMBRES_TIPO = {
  familiar: "Familiar",
  pareja: "Pareja",
  amigos: "Amigos",
  empresarial: "Empresarial"
};


/* ---------------------------------------------------------
   3. EXPRESIONES REGULARES (patrones para revisar textos)
   --------------------------------------------------------- */

// Solo letras (incluye tildes y ñ) y espacios
const patronNombre = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]+$/;

// Solo números (uno o más dígitos)
const patronSoloNumeros = /^[0-9]+$/;

// Teléfono de Colombia (10 dígitos):
//   celular -> empieza por 3   (ej: 3001234567)
//   fijo    -> empieza por 60  (ej: 6017654321)
const patronTelefono = /^(3[0-9]{9}|60[0-9]{8})$/;

// Correo: texto + @ + texto + . + al menos 2 letras (ej: ana@correo.com)
const patronCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;


/* ---------------------------------------------------------
   4. FUNCIONES DE APOYO
   --------------------------------------------------------- */

// Devuelve el valor de un campo sin espacios al inicio ni al final
function valorDe(id) {
  return document.getElementById(id).value.trim();
}

// Convierte una fecha al texto "AAAA-MM-DD" (formato de los <input type="date">)
function fechaATexto(fecha) {
  const anio = fecha.getFullYear();
  const mes  = String(fecha.getMonth() + 1).padStart(2, "0"); // los meses empiezan en 0
  const dia  = String(fecha.getDate()).padStart(2, "0");
  return anio + "-" + mes + "-" + dia;
}

// Convierte el texto "AAAA-MM-DD" en una fecha de JavaScript (con la hora local)
function textoAFecha(texto) {
  const partes = texto.split("-");
  return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
}

// Fecha de hoy en formato "AAAA-MM-DD"
function fechaDeHoy() {
  return fechaATexto(new Date());
}

// Hora actual en formato "HH:MM" (ej: "15:07")
function horaActual() {
  const ahora   = new Date();
  const horas   = String(ahora.getHours()).padStart(2, "0");
  const minutos = String(ahora.getMinutes()).padStart(2, "0");
  return horas + ":" + minutos;
}

// Calcula la edad a partir de la fecha de nacimiento ("AAAA-MM-DD")
function calcularEdad(textoNacimiento) {
  const nacimiento = textoAFecha(textoNacimiento);
  const hoy = new Date();

  let edad = hoy.getFullYear() - nacimiento.getFullYear();

  // Si este año todavía no ha cumplido años, se le resta 1
  const diferenciaMeses = hoy.getMonth() - nacimiento.getMonth();
  if (diferenciaMeses < 0 || (diferenciaMeses === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad = edad - 1;
  }
  return edad;
}

// Muestra una fecha larga, ej: "martes, 3 de noviembre de 2026"
function formatearFecha(texto) {
  return textoAFecha(texto).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

// Pasa la hora de 24 horas a 12 horas, ej: "19:30" -> "7:30 p. m."
function formatearHora(hora) {
  const partes  = hora.split(":");
  let horas     = Number(partes[0]);
  const minutos = partes[1];
  const periodo = horas >= 12 ? "p. m." : "a. m.";

  if (horas > 12) horas = horas - 12;
  if (horas === 0) horas = 12;

  return horas + ":" + minutos + " " + periodo;
}


/* ---------------------------------------------------------
   5. MOSTRAR Y QUITAR ERRORES
   Cada campo está dentro de un <div class="grupo">.
   El mensaje de error va en <small id="error-ID_DEL_CAMPO">.
   --------------------------------------------------------- */

// Marca el campo en rojo y escribe el mensaje. Devuelve false (campo NO válido).
function mostrarError(id, mensaje) {
  const campo = document.getElementById(id);
  const grupo = campo.closest(".grupo");          // busca el div.grupo que lo contiene
  const textoError = document.getElementById("error-" + id);

  grupo.classList.add("invalido");
  grupo.classList.remove("valido");
  textoError.textContent = mensaje;
  campo.setAttribute("aria-invalid", "true");     // aviso para lectores de pantalla

  return false;
}

// Marca el campo en verde y borra el mensaje. Devuelve true (campo válido).
function marcarValido(id) {
  const campo = document.getElementById(id);
  const grupo = campo.closest(".grupo");
  const textoError = document.getElementById("error-" + id);

  grupo.classList.remove("invalido");
  grupo.classList.add("valido");
  textoError.textContent = "";
  campo.removeAttribute("aria-invalid");

  return true;
}

// Quita todos los colores y mensajes del formulario
function limpiarEstados() {
  formulario.querySelectorAll(".grupo").forEach(function (grupo) {
    grupo.classList.remove("invalido", "valido");
  });
  formulario.querySelectorAll(".error").forEach(function (mensaje) {
    mensaje.textContent = "";
  });
  formulario.querySelectorAll("[aria-invalid]").forEach(function (campo) {
    campo.removeAttribute("aria-invalid");
  });
  avisoErrores.hidden = true;
  contador.textContent = "0 / " + observaciones.maxLength;
}


/* ---------------------------------------------------------
   6. VALIDACIÓN DE CADA CAMPO
   Cada función devuelve true si el campo está bien o false si tiene error.
   Nota: "return mostrarError(...)" muestra el mensaje y termina la
   función devolviendo false.
   --------------------------------------------------------- */

function validarNombre() {
  const valor = valorDe("nombre");

  if (valor === "") {
    return mostrarError("nombre", "El nombre completo es obligatorio.");
  }
  if (!patronNombre.test(valor)) {
    return mostrarError("nombre", "El nombre solo puede tener letras y espacios.");
  }
  // Se separa el texto por espacios para contar las palabras (nombre + apellido)
  const palabras = valor.split(" ").filter(function (palabra) {
    return palabra !== "";
  });
  if (palabras.length < 2) {
    return mostrarError("nombre", "Escribe tu nombre y al menos un apellido.");
  }
  return marcarValido("nombre");
}

function validarIdentificacion() {
  const valor = valorDe("identificacion");

  if (valor === "") {
    return mostrarError("identificacion", "El número de identificación es obligatorio.");
  }
  if (!patronSoloNumeros.test(valor)) {
    return mostrarError("identificacion", "Escribe solo números, sin puntos ni espacios.");
  }
  if (valor.length < 6 || valor.length > 10) {
    return mostrarError("identificacion", "Debe tener entre 6 y 10 dígitos.");
  }
  return marcarValido("identificacion");
}

function validarTelefono() {
  // Se quitan espacios y guiones por si el usuario escribe "300 123 4567"
  const valor = valorDe("telefono").replace(/[\s-]/g, "");

  if (valor === "") {
    return mostrarError("telefono", "El número de teléfono es obligatorio.");
  }
  if (!patronSoloNumeros.test(valor)) {
    return mostrarError("telefono", "El teléfono solo puede tener números.");
  }
  if (valor.length !== 10) {
    return mostrarError("telefono", "El teléfono debe tener 10 dígitos (tiene " + valor.length + ").");
  }
  if (!patronTelefono.test(valor)) {
    return mostrarError("telefono", "Debe empezar por 3 (celular) o por 60 (fijo).");
  }
  return marcarValido("telefono");
}

function validarCorreo() {
  const valor = valorDe("correo");

  if (valor === "") {
    return mostrarError("correo", "El correo electrónico es obligatorio.");
  }
  if (!patronCorreo.test(valor)) {
    return mostrarError("correo", "Escribe un correo válido, por ejemplo: nombre@correo.com");
  }
  return marcarValido("correo");
}

function validarFechaNacimiento() {
  const valor = valorDe("fechaNacimiento");

  if (valor === "") {
    return mostrarError("fechaNacimiento", "La fecha de nacimiento es obligatoria.");
  }
  // Las fechas "AAAA-MM-DD" se pueden comparar como texto: la mayor es la más reciente
  if (valor > fechaDeHoy()) {
    return mostrarError("fechaNacimiento", "La fecha de nacimiento no puede ser futura.");
  }
  const edad = calcularEdad(valor);
  if (edad < EDAD_MINIMA) {
    return mostrarError("fechaNacimiento", "Debes ser mayor de edad (" + EDAD_MINIMA + " años o más) para reservar.");
  }
  if (edad > 110) {
    return mostrarError("fechaNacimiento", "Revisa la fecha de nacimiento.");
  }
  return marcarValido("fechaNacimiento");
}

function validarFechaReserva() {
  const valor = valorDe("fechaReserva");

  if (valor === "") {
    return mostrarError("fechaReserva", "La fecha de la reserva es obligatoria.");
  }
  if (valor < fechaDeHoy()) {
    return mostrarError("fechaReserva", "La fecha de la reserva no puede ser anterior a hoy.");
  }
  return marcarValido("fechaReserva");
}

function validarHora() {
  const valor = valorDe("hora");

  if (valor === "") {
    return mostrarError("hora", "La hora de la reserva es obligatoria.");
  }
  // Las horas "HH:MM" también se pueden comparar como texto
  if (valor < HORA_APERTURA || valor > HORA_CIERRE) {
    return mostrarError("hora", "Recibimos reservas de 12:00 m. a 10:00 p. m.");
  }
  // Si la reserva es para hoy, la hora debe ser posterior a la hora actual
  if (valorDe("fechaReserva") === fechaDeHoy() && valor <= horaActual()) {
    return mostrarError("hora", "Para hoy, elige una hora posterior a la actual.");
  }
  return marcarValido("hora");
}

function validarPersonas() {
  const valor = valorDe("personas");

  if (valor === "") {
    return mostrarError("personas", "Indica cuántas personas asistirán.");
  }
  const cantidad = Number(valor);

  if (!Number.isInteger(cantidad)) {
    return mostrarError("personas", "Escribe un número entero (sin decimales).");
  }
  if (cantidad < 1) {
    return mostrarError("personas", "La reserva debe ser al menos para 1 persona.");
  }
  if (cantidad > MAX_PERSONAS) {
    return mostrarError("personas", "Para más de " + MAX_PERSONAS + " personas comunícate directamente con el restaurante.");
  }
  return marcarValido("personas");
}

function validarTipo() {
  // Busca el radio que esté marcado (si no hay ninguno, devuelve null)
  const seleccionado = document.querySelector('input[name="tipo"]:checked');

  if (seleccionado === null) {
    return mostrarError("tipo", "Selecciona el tipo de reserva.");
  }
  return marcarValido("tipo");
}

// Ejecuta TODAS las validaciones (para mostrar todos los errores a la vez)
function validarFormulario() {
  const resultados = [
    validarNombre(),
    validarIdentificacion(),
    validarTelefono(),
    validarCorreo(),
    validarFechaNacimiento(),
    validarFechaReserva(),
    validarHora(),
    validarPersonas(),
    validarTipo()
  ];
  // El formulario es válido solo si ningún resultado es false
  return !resultados.includes(false);
}


/* ---------------------------------------------------------
   7. VALIDACIÓN MIENTRAS EL USUARIO ESCRIBE
   - Al salir de un campo (blur) se revisa ese campo.
   - Si el campo ya tenía error, se vuelve a revisar con cada tecla
     para que el mensaje desaparezca apenas se corrija.
   --------------------------------------------------------- */

// Relación entre el id de cada campo y su función de validación
const validaciones = {
  nombre: validarNombre,
  identificacion: validarIdentificacion,
  telefono: validarTelefono,
  correo: validarCorreo,
  fechaNacimiento: validarFechaNacimiento,
  fechaReserva: validarFechaReserva,
  hora: validarHora,
  personas: validarPersonas
};

// Oculta el aviso general cuando ya no queda ningún campo con error
function actualizarAviso() {
  if (formulario.querySelector(".invalido") === null) {
    avisoErrores.hidden = true;
  }
}

Object.keys(validaciones).forEach(function (id) {
  const campo = document.getElementById(id);
  const validar = validaciones[id];

  campo.addEventListener("blur", function () {
    // Si el campo está vacío y nunca se ha revisado, no se molesta al usuario
    if (campo.value === "" && !campo.closest(".grupo").classList.contains("invalido")) {
      return;
    }
    validar();
    actualizarAviso();
  });

  campo.addEventListener("input", function () {
    if (campo.closest(".grupo").classList.contains("invalido")) {
      validar();
      actualizarAviso();
    }
  });
});

// Si cambia la fecha de la reserva, se revisa otra vez la hora
// (porque la regla de "hora posterior a la actual" depende de la fecha)
document.getElementById("fechaReserva").addEventListener("change", function () {
  if (valorDe("hora") !== "") {
    validarHora();
    actualizarAviso();
  }
});

// Los radios del tipo de reserva se revisan al seleccionar uno
document.querySelectorAll('input[name="tipo"]').forEach(function (radio) {
  radio.addEventListener("change", function () {
    validarTipo();
    actualizarAviso();
  });
});

// Contador de caracteres de las observaciones
observaciones.addEventListener("input", function () {
  contador.textContent = observaciones.value.length + " / " + observaciones.maxLength;
});


/* ---------------------------------------------------------
   8. ENVÍO DEL FORMULARIO
   --------------------------------------------------------- */
formulario.addEventListener("submit", function (evento) {
  // Evita que la página se recargue (comportamiento normal de un formulario)
  evento.preventDefault();

  if (!validarFormulario()) {
    // Hay errores: se muestra el aviso y se lleva el cursor al primer campo con error
    avisoErrores.hidden = false;
    const primerCampoConError = formulario.querySelector(".invalido input");
    if (primerCampoConError) {
      primerCampoConError.focus();
    }
    return;
  }

  // Todo está bien: se reúnen los datos en un objeto
  const reserva = {
    nombre: valorDe("nombre"),
    identificacion: valorDe("identificacion"),
    telefono: valorDe("telefono").replace(/[\s-]/g, ""),
    correo: valorDe("correo"),
    fechaNacimiento: valorDe("fechaNacimiento"),
    fechaReserva: valorDe("fechaReserva"),
    hora: valorDe("hora"),
    personas: Number(valorDe("personas")),
    tipo: document.querySelector('input[name="tipo"]:checked').value,
    observaciones: valorDe("observaciones")
  };

  // En un proyecto real, aquí se enviarían los datos a un servidor.
  // Por ahora se muestran en la consola del navegador (tecla F12).
  console.log("Nueva reserva registrada:", reserva);

  mostrarConfirmacion(reserva);

  // Limpia el formulario (esto dispara el evento "reset" de más abajo)
  formulario.reset();
});

// Cuando el formulario se limpia (botón "Limpiar" o después de registrar)
formulario.addEventListener("reset", function () {
  limpiarEstados();
});


/* ---------------------------------------------------------
   9. VENTANA DE CONFIRMACIÓN
   --------------------------------------------------------- */

// Agrega una línea "Título: valor" a la lista del resumen.
// Se usa textContent (y no innerHTML) para que lo que escribió el usuario
// se muestre como texto y nunca se interprete como código HTML.
function agregarLineaResumen(titulo, valor) {
  const linea = document.createElement("li");

  const textoTitulo = document.createElement("strong");
  textoTitulo.textContent = titulo;

  const textoValor = document.createElement("span");
  textoValor.textContent = valor;

  linea.appendChild(textoTitulo);
  linea.appendChild(textoValor);
  resumen.appendChild(linea);
}

function mostrarConfirmacion(reserva) {
  const primerNombre = reserva.nombre.split(" ")[0];
  modalMensaje.textContent = "Gracias, " + primerNombre + ". Estos son los datos de tu reserva:";

  // Se vacía el resumen anterior y se escribe el nuevo
  resumen.innerHTML = "";
  agregarLineaResumen("Nombre", reserva.nombre);
  agregarLineaResumen("Fecha", formatearFecha(reserva.fechaReserva));
  agregarLineaResumen("Hora", formatearHora(reserva.hora));
  agregarLineaResumen("Personas", reserva.personas + (reserva.personas === 1 ? " persona" : " personas"));
  agregarLineaResumen("Tipo", NOMBRES_TIPO[reserva.tipo]);
  agregarLineaResumen("Correo", reserva.correo);
  if (reserva.observaciones !== "") {
    agregarLineaResumen("Observaciones", reserva.observaciones);
  }

  modal.hidden = false;
  document.body.classList.add("sin-scroll");
  btnCerrarModal.focus();
}

function cerrarConfirmacion() {
  modal.hidden = true;
  document.body.classList.remove("sin-scroll");
  document.getElementById("nombre").focus(); // listo para una nueva reserva
}

// Formas de cerrar la ventana: botón "Aceptar", clic afuera o tecla Escape
btnCerrarModal.addEventListener("click", cerrarConfirmacion);

modal.addEventListener("click", function (evento) {
  // Solo se cierra si el clic fue en el fondo oscuro, no dentro de la caja
  if (evento.target === modal) {
    cerrarConfirmacion();
  }
});

document.addEventListener("keydown", function (evento) {
  if (evento.key === "Escape" && !modal.hidden) {
    cerrarConfirmacion();
  }
});


/* ---------------------------------------------------------
   10. AJUSTES INICIALES AL CARGAR LA PÁGINA
   --------------------------------------------------------- */
// El calendario de la reserva no deja escoger días pasados
document.getElementById("fechaReserva").min = fechaDeHoy();
// El calendario de nacimiento no deja escoger días futuros
document.getElementById("fechaNacimiento").max = fechaDeHoy();
