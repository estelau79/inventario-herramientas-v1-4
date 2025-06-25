let inventario = JSON.parse(localStorage.getItem("inventario")) || [];
let stock = JSON.parse(localStorage.getItem("stock")) || {};

const form = document.getElementById("formulario");
const registrosDiv = document.getElementById("registros");
const btnDescargar = document.getElementById("descargarExcel");
const formStock = document.getElementById("form-stock-inicial");
const tablaStock = document.querySelector("#tablaStock tbody");
const inputCodigo = document.getElementById("codigo");
const inputDescripcion = document.getElementById("descripcion");
const btnLimpiar = document.getElementById("btn-limpiar");

// Tabs
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    document.getElementById(tab.dataset.tab).classList.add("active");
  });
});

document.getElementById("btn-ver-stock").addEventListener("click", () => {
  document.querySelector('[data-tab="stock"]').click();
});

// Modal ayuda
document.getElementById("btn-ayuda").onclick = () => modal.style.display = "block";
document.querySelector(".close").onclick = () => modal.style.display = "none";
window.onclick = e => { if (e.target == modal) modal.style.display = "none"; };

// Autocompletar descripción si código existe
inputCodigo.addEventListener("blur", () => {
  const cod = inputCodigo.value.trim();
  if (stock[cod]) {
    inputDescripcion.value = stock[cod].descripcion;
    inputDescripcion.readOnly = true;
  } else {
    inputDescripcion.value = "";
    inputDescripcion.readOnly = false;
  }
});

// Registrar movimiento
form.addEventListener("submit", e => {
  e.preventDefault();
  const codigo = inputCodigo.value.trim();
  const descripcion = inputDescripcion.value.trim();
  const movimiento = document.getElementById("movimiento").value;
  const cantidad = parseInt(document.getElementById("cantidad").value);
  const fecha = new Date().toLocaleString("es-AR");

  if (!codigo || !descripcion || cantidad <= 0) return;

  if (!stock[codigo]) {
    stock[codigo] = { descripcion, inicial: 0 };
  }

  if (movimiento === "Egreso") {
    const disponibles = stock[codigo].inicial + calcularMovimientos(codigo);
    if (cantidad > disponibles) {
      alert(`❌ No hay suficiente stock de ${codigo}. Quedan ${disponibles}.`);
      return;
    }
  }

  inventario.push({ codigo, descripcion, movimiento, cantidad, fecha });
  localStorage.setItem("inventario", JSON.stringify(inventario));
  localStorage.setItem("stock", JSON.stringify(stock));

  renderizarRegistros();
  renderizarStock();
  verificarDevolucionCompleta(codigo, descripcion);

  form.reset();
  inputDescripcion.readOnly = false;
});

// Stock inicial
formStock.addEventListener("submit", e => {
  e.preventDefault();
  const cod = document.getElementById("codigoStock").value.trim();
  const desc = document.getElementById("descripcionStock").value.trim();
  const cant = parseInt(document.getElementById("stockInicial").value);
  if (!cod || cant < 0) return;
  stock[cod] = { descripcion: desc, inicial: cant };
  localStorage.setItem("stock", JSON.stringify(stock));
  renderizarStock();
  formStock.reset();
});

function calcularMovimientos(cod) {
  return inventario
    .filter(i => i.codigo === cod)
    .reduce((total, i) => total + (i.movimiento === "Ingreso" ? i.cantidad : -i.cantidad), 0);
}

function renderizarRegistros() {
  registrosDiv.innerHTML = "";
  const egresos = inventario.filter(i => i.movimiento === "Egreso");
  const egresosVisibles = egresos.filter(egreso => {
    const cod = egreso.codigo;
    const totalEgresos = egresos.filter(e => e.codigo === cod).reduce((s, e) => s + e.cantidad, 0);
    const totalIngresos = inventario.filter(i => i.movimiento === "Ingreso" && i.codigo === cod).reduce((s, i) => s + i.cantidad, 0);
    return totalIngresos < totalEgresos;
  });

  if (egresosVisibles.length === 0) {
    btnDescargar.style.display = "none";
    return;
  }

  egresosVisibles.forEach(i => {
    const div = document.createElement("div");
    div.textContent = `${i.codigo} - ${i.descripcion} [${i.cantidad}] - ${i.fecha}`;
    registrosDiv.appendChild(div);
  });
  btnDescargar.style.display = "block";
}

function renderizarStock() {
  tablaStock.innerHTML = "";
  Object.keys(stock).forEach(cod => {
    const mov = calcularMovimientos(cod);
    const disponible = stock[cod].inicial + mov;
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${cod}</td>
      <td>${stock[cod].descripcion}</td>
      <td>${stock[cod].inicial}</td>
      <td>${mov}</td>
      <td class="${disponible <= 0 ? 'stock-bajo' : ''}">${disponible}</td>
      <td>
        <button onclick="editarStock('${cod}')">✏️</button>
        <button onclick="eliminarStock('${cod}')">🗑️</button>
      </td>
    `;
    tablaStock.appendChild(fila);
  });
}

function verificarDevolucionCompleta(codigo, descripcion) {
  const totalEgresos = inventario.filter(i => i.codigo === codigo && i.movimiento === "Egreso").reduce((s, i) => s + i.cantidad, 0);
  const totalIngresos = inventario.filter(i => i.codigo === codigo && i.movimiento === "Ingreso").reduce((s, i) => s + i.cantidad, 0);

  if (totalIngresos >= totalEgresos && totalEgresos > 0) {
    const msg = document.createElement("div");
    msg.textContent = `✔️ ${descripcion} (${codigo}) fue devuelto por completo.`;
    msg.className = "snackbar";
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 4000);
  }
}

// Descargar Excel
btnDescargar.addEventListener("click", () => {
  const wb = XLSX.utils.book_new();
  const datos = [["Código", "Descripción", "Tipo", "Cantidad", "Fecha"]];
  inventario.forEach(i =>
    datos.push([i.codigo, i.descripcion, i.movimiento, i.cantidad, i.fecha])
  );
  const ws = XLSX.utils.aoa_to_sheet(datos);
  XLSX.utils.book_append_sheet(wb, ws, "Movimientos");
  const fecha = new Date().toLocaleDateString("es-AR").replace(/\//g, "-");
  XLSX.writeFile(wb, `inventario-esteban-${fecha}.xlsx`);
});

// Limpiar movimientos
btnLimpiar.addEventListener("click", () => {
  if (confirm("¿Estás seguro de que querés borrar todos los movimientos registrados?")) {
    inventario = [];
    localStorage.setItem("inventario", JSON.stringify(inventario));
    renderizarRegistros();
    renderizarStock();
  }
});

// Instalación como app
let deferredPrompt;
const popup = document.getElementById("instalar-popup");
const btnInstalar = document.getElementById("btn-confirmar-instalar");
const btnNo = document.getElementById("btn-rechazar");

window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
  popup.style.display = "block";
});

btnInstalar.onclick = () => {
  popup.style.display = "none";
  deferredPrompt.prompt();
};

btnNo.onclick = () => {
  popup.style.display = "none";
};

// Acciones de stock
window.editarStock = function(cod) {
  const nuevo = prompt(`Nuevo stock inicial para ${stock[cod].descripcion} (${cod}):`, stock[cod].inicial);
  if (nuevo === null) return;
  const n = parseInt(nuevo);
  if (!isNaN(n) && n >= 0) {
    stock[cod].inicial = n;
    localStorage.setItem("stock", JSON.stringify(stock));
    renderizarStock();
  }
};

window.eliminarStock = function(cod) {
  if (confirm(`¿Eliminar el ítem "${stock[cod].descripcion}" (${cod}) del stock?