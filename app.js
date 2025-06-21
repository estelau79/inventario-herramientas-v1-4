let inventario = JSON.parse(localStorage.getItem("inventario")) || [];
let stock = JSON.parse(localStorage.getItem("stock")) || {};

const form = document.getElementById("formulario");
const registrosDiv = document.getElementById("registros");
const btnDescargar = document.getElementById("descargarExcel");
const formStock = document.getElementById("form-stock-inicial");
const tablaStock = document.querySelector("#tablaStock tbody");

const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");
const btnAyuda = document.getElementById("btn-ayuda");
const btnStock = document.getElementById("btn-ver-stock");
const modal = document.getElementById("modal-ayuda");
const closeModal = document.querySelector(".close");

// Navegación entre pestañas
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    tabContents.forEach(c => c.classList.remove("active"));
    document.getElementById(tab.dataset.tab).classList.add("active");
  });
});
btnStock.addEventListener("click", () => {
  tabs[1].click();
});

// Modal de ayuda
btnAyuda.onclick = () => modal.style.display = "block";
closeModal.onclick = () => modal.style.display = "none";
window.onclick = e => { if (e.target == modal) modal.style.display = "none"; };

// Guardar movimiento
form.addEventListener("submit", e => {
  e.preventDefault();
  const codigo = codigo.value.trim();
  const descripcion = descripcion.value.trim();
  const movimiento = document.getElementById("movimiento").value;
  const cantidad = parseInt(document.getElementById("cantidad").value);
  const fecha = new Date().toLocaleString("es-AR");

  if (!codigo || !descripcion || cantidad <= 0) return;

  if (!stock[codigo]) stock[codigo] = { descripcion, inicial: 0 };
  if (movimiento === "Egreso") {
    const totalMov = calcularMovimientos(codigo);
    const disponible = stock[codigo].inicial + totalMov;
    if (cantidad > disponible) {
      alert(`❌ No hay suficiente stock de ${codigo}. Quedan ${disponible}.`);
      return;
    }
  }

  inventario.push({ codigo, descripcion, movimiento, cantidad, fecha });
  localStorage.setItem("inventario", JSON.stringify(inventario));
  renderizarRegistros();
  renderizarStock();
  form.reset();
});

// Guardar stock inicial
formStock.addEventListener("submit", e => {
  e.preventDefault();
  const cod = codigoStock.value.trim();
  const desc = descripcionStock.value.trim();
  const cant = parseInt(stockInicial.value);
  if (!cod || cant < 0) return;
  stock[cod] = { descripcion: desc, inicial: cant };
  localStorage.setItem("stock", JSON.stringify(stock));
  renderizarStock();
  formStock.reset();
});

function calcularMovimientos(cod) {
  return inventario
    .filter(i => i.codigo === cod)
    .reduce((acum, i) => acum + (i.movimiento === "Ingreso" ? i.cantidad : -i.cantidad), 0);
}

function renderizarRegistros() {
  registrosDiv.innerHTML = "";
  const egresos = inventario.filter(i => i.movimiento === "Egreso");
  if (egresos.length === 0) {
    btnDescargar.style.display = "none";
    return;
  }
  egresos.forEach(i => {
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
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${cod}</td>
      <td>${stock[cod].descripcion}</td>
      <td>${stock[cod].inicial}</td>
      <td>${mov}</td>
      <td class="${disponible <= 0 ? 'stock-bajo' : ''}">${disponible}</td>
    `;
    tablaStock.appendChild(row);
  });
}

btnDescargar.addEventListener("click", () => {
  const wb = XLSX.utils.book_new();
  const data = [["Código", "Descripción", "Tipo", "Cantidad", "Fecha"]];
  inventario.forEach(i =>
    data.push([i.codigo, i.descripcion, i.movimiento, i.cantidad, i.fecha])
  );
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Movimientos");
  const fecha = new Date().toLocaleDateString("es-AR").replace(/\//g, "-");
  XLSX.writeFile(wb, `inventario-esteban-${fecha}.xlsx`);
});

// PWA instalación
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

renderizarRegistros();
renderizarStock();