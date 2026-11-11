import { Transaccion } from "./classes/Transaccion.js";

const formulario = document.getElementById("formulario");
const descripcion = document.getElementById("descripcion");
const monto = document.getElementById("monto");
const tipo = document.getElementById("tipo");
const categoria = document.getElementById("categoria");
const fecha = document.getElementById("fecha");
const lista = document.getElementById("lista");
const ingresos = document.getElementById("ingresos");
const gastos = document.getElementById("gastos");
const saldo = document.getElementById("saldo");
const aviso = document.getElementById("aviso");

const pesos = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS"
});

function obtenerFechaLocal() {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const dia = String(hoy.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
}

fecha.value = obtenerFechaLocal();

function formatearFecha(fechaISO) {
    if (!fechaISO) return "Sin fecha"; 
    const [anio, mes, dia] = fechaISO.split("-");
    return `${dia}/${mes}/${anio}`;
}

function mostrarMovimientos() {
    lista.innerHTML = "";

    if (Transaccion.historial.length === 0) {
        const fila = document.createElement("tr");
        const celda = document.createElement("td");
        celda.colSpan = 6;
        celda.className = "px-4 py-6 text-center text-gray-500";
        celda.textContent = "Todavía no agregaste movimientos.";
        fila.append(celda);
        lista.append(fila);
        return;
    }

    const movimientosOrdenados = [...Transaccion.historial].sort((a, b) =>
        (b.fecha || "").localeCompare(a.fecha || "")
    );

    movimientosOrdenados.forEach(movimiento => {
        const fila = document.createElement("tr");
        fila.className = "border-b hover:bg-gray-50";

        const valores = [
            formatearFecha(movimiento.fecha),
            movimiento.descripcion,
            movimiento.tipo === "ingreso" ? "Ingreso" : "Egreso",
            movimiento.categoria,
            pesos.format(Number(movimiento.monto))
        ];

        valores.forEach((valor, indice) => {
            const celda = document.createElement("td");
            celda.className = "px-4 py-3 whitespace-nowrap";
            celda.textContent = valor;
            if (indice === 4) {
                celda.classList.add(movimiento.tipo === "ingreso" ? "text-green-700" : "text-red-700", "font-semibold");
            }
            fila.append(celda);
        });

        const celdaAccion = document.createElement("td");
        celdaAccion.className = "px-4 py-3";
        const borrar = document.createElement("button");
        borrar.type = "button";
        borrar.textContent = "Eliminar";
        borrar.className = "rounded border border-red-300 px-3 py-1 text-sm text-red-700 hover:bg-red-50";
        borrar.addEventListener("click", () => {
            Transaccion.historial = Transaccion.historial.filter(item => item.id !== movimiento.id);
            Transaccion.guardar();
            actualizarPagina();
        });
        celdaAccion.append(borrar);
        fila.append(celdaAccion);
        lista.append(fila);
    });
}

function calcularBalance() {
    let sumaIngresos = 0;
    let sumaGastos = 0;

    Transaccion.historial.forEach(movimiento => {
        const importe = Number(movimiento.monto) || 0;
        if (movimiento.tipo === "ingreso") sumaIngresos += importe;
        else sumaGastos += importe;
    });

    ingresos.textContent = pesos.format(sumaIngresos);
    gastos.textContent = pesos.format(sumaGastos);
    saldo.textContent = pesos.format(sumaIngresos - sumaGastos);
}

let graficoCategorias;
let graficoTemporal;

function mostrarCategorias() {
    const totales = {};
    Transaccion.historial.forEach(movimiento => {
        const nombreCategoria = movimiento.categoria;
        totales[nombreCategoria] = (totales[nombreCategoria] || 0) + (Number(movimiento.monto) || 0);
    });

    const etiquetas = Object.keys(totales);
    const valores = Object.values(totales);

    if (graficoCategorias) {
        graficoCategorias.data.labels = etiquetas;
        graficoCategorias.data.datasets[0].data = valores;
        graficoCategorias.update();
        return;
    }

    graficoCategorias = new Chart(document.getElementById("categorias"), {
        type: "bar",
        data: {
            labels: etiquetas,
            datasets: [{
                label: "Monto total",
                data: valores,
                backgroundColor: "rgba(37, 99, 235, 0.7)",
                borderColor: "rgb(37, 99, 235)",
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: contexto => pesos.format(contexto.raw) } }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: valor => pesos.format(valor) }
                }
            }
        }
    });
}

function mostrarEvolucionTemporal() {
    const porFecha = {};
    Transaccion.historial.forEach(movimiento => {
        if (!movimiento.fecha) return; 
        if (!porFecha[movimiento.fecha]) porFecha[movimiento.fecha] = { ingresos: 0, egresos: 0 };
        const importe = Number(movimiento.monto) || 0;
        if (movimiento.tipo === "ingreso") porFecha[movimiento.fecha].ingresos += importe;
        else porFecha[movimiento.fecha].egresos += importe;
    });

    const fechasOrdenadas = Object.keys(porFecha).sort();
    let totalIngresos = 0;
    let totalEgresos = 0;
    const ingresosAcumulados = [];
    const egresosAcumulados = [];
    const balancesAcumulados = [];

    fechasOrdenadas.forEach(dia => {
        totalIngresos += porFecha[dia].ingresos;
        totalEgresos += porFecha[dia].egresos;
        ingresosAcumulados.push(totalIngresos);
        egresosAcumulados.push(totalEgresos);
        balancesAcumulados.push(totalIngresos - totalEgresos);
    });

    const datos = [ingresosAcumulados, egresosAcumulados, balancesAcumulados];
    if (graficoTemporal) {
        graficoTemporal.data.labels = fechasOrdenadas.map(formatearFecha);
        graficoTemporal.data.datasets.forEach((dataset, indice) => dataset.data = datos[indice]);
        graficoTemporal.update();
        return;
    }

    graficoTemporal = new Chart(document.getElementById("evolucion"), {
        type: "line",
        data: {
            labels: fechasOrdenadas.map(formatearFecha),
            datasets: [
                { label: "Ingresos", data: ingresosAcumulados, borderColor: "rgb(22, 163, 74)", backgroundColor: "rgba(22, 163, 74, 0.1)", tension: 0.3 },
                { label: "Egresos", data: egresosAcumulados, borderColor: "rgb(220, 38, 38)", backgroundColor: "rgba(220, 38, 38, 0.1)", tension: 0.3 },
                { label: "Balance neto", data: balancesAcumulados, borderColor: "rgb(37, 99, 235)", backgroundColor: "rgba(37, 99, 235, 0.1)", tension: 0.3 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: { tooltip: { callbacks: { label: contexto => `${contexto.dataset.label}: ${pesos.format(contexto.raw)}` } } },
            scales: {
                y: { ticks: { callback: valor => pesos.format(valor) } }
            }
        }
    });
}

function actualizarPagina() {
    mostrarMovimientos();
    calcularBalance();
    mostrarCategorias();
    mostrarEvolucionTemporal();
}

formulario.addEventListener("submit", event => {
    event.preventDefault();

    const nombreMovimiento = descripcion.value.trim();
    const importeMovimiento = Number(monto.value);

    if (nombreMovimiento === "" || importeMovimiento <= 0 || !Number.isFinite(importeMovimiento) || !fecha.value) {
        aviso.textContent = "Revisá la descripción, el monto y la fecha.";
        aviso.className = "mt-2 text-sm text-red-700";
        return;
    }

    const movimientoNuevo = new Transaccion(
        Date.now(),
        tipo.value,
        nombreMovimiento,
        importeMovimiento,
        categoria.value,
        fecha.value
    );

    Transaccion.historial.push(movimientoNuevo);
    Transaccion.guardar();
    actualizarPagina();
    formulario.reset();
    fecha.value = obtenerFechaLocal();

    aviso.textContent = "Movimiento agregado.";
    aviso.className = "mt-2 text-sm text-green-700";
});

Transaccion.recuperar();
actualizarPagina();
