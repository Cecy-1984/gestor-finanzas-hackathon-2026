import { Transaccion } from "./classes/Transaccion.js";

const formulario = document.getElementById("formulario");
const descripcion = document.getElementById("descripcion");
const monto = document.getElementById("monto");
const tipo = document.getElementById("tipo");
const categoria = document.getElementById("categoria");
const lista = document.getElementById("lista");
const ingresos = document.getElementById("ingresos");
const gastos = document.getElementById("gastos");
const saldo = document.getElementById("saldo");
const resumenCategorias = document.getElementById("categorias");
const aviso = document.getElementById("aviso");

const pesos = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS"
});

function mostrarMovimientos() {
    lista.innerHTML = "";

    if (Transaccion.historial.length === 0) {
        lista.textContent = "Todavía no agregaste movimientos.";
        return;
    }

    Transaccion.historial.forEach(movimiento => {
        const fila = document.createElement("div");
        fila.className = "flex flex-wrap items-center justify-between gap-2 border-b py-2";

        const texto = document.createElement("span");
        texto.textContent = `${movimiento.descripcion} - ${movimiento.categoria} (${movimiento.tipo})`;

        const importe = document.createElement("strong");
        importe.textContent = pesos.format(movimiento.monto);
        importe.className = movimiento.tipo === "ingreso" ? "text-green-700" : "text-red-700";

        const borrar = document.createElement("button");
        borrar.textContent = "Eliminar";
        borrar.className = "rounded border px-2 py-1 text-sm";
        borrar.addEventListener("click", () => {
            Transaccion.historial = Transaccion.historial.filter(
                item => item.id !== movimiento.id
            );
            Transaccion.guardar();
            actualizarPagina();
        });

        fila.append(texto, importe, borrar);
        lista.append(fila);
    });
}

function calcularBalance() {
    let sumaIngresos = 0;
    let sumaGastos = 0;

    Transaccion.historial.forEach(movimiento => {
        if (movimiento.tipo === "ingreso") {
            sumaIngresos += movimiento.monto;
        } else {
            sumaGastos += movimiento.monto;
        }
    });

    ingresos.textContent = pesos.format(sumaIngresos);
    gastos.textContent = pesos.format(sumaGastos);
    saldo.textContent = pesos.format(sumaIngresos - sumaGastos);
}

function mostrarCategorias() {
    resumenCategorias.innerHTML = "";

    if (Transaccion.historial.length === 0) {
        resumenCategorias.textContent = "No hay datos para mostrar.";
        return;
    }

    const totales = {};

    Transaccion.historial.forEach(movimiento => {
        if (!totales[movimiento.categoria]) {
            totales[movimiento.categoria] = 0;
        }
        totales[movimiento.categoria] += movimiento.monto;
    });

    for (const categoria in totales) {
        const renglon = document.createElement("p");
        renglon.textContent = `${categoria}: ${pesos.format(totales[categoria])}`;
        resumenCategorias.append(renglon);
    }
}

function actualizarPagina() {
    mostrarMovimientos();
    calcularBalance();
    mostrarCategorias();
}

formulario.addEventListener("submit", event => {
    event.preventDefault();

    const nombreMovimiento = descripcion.value.trim();
    const importeMovimiento = Number(monto.value);

    if (nombreMovimiento === "" || importeMovimiento <= 0 || !Number.isFinite(importeMovimiento)) {
        aviso.textContent = "Revisá la descripción y el monto.";
        aviso.className = "mt-2 text-sm text-red-700";
        return;
    }

    const movimientoNuevo = new Transaccion(
        Date.now(),
        tipo.value,
        nombreMovimiento,
        importeMovimiento,
        categoria.value
    );

    Transaccion.historial.push(movimientoNuevo);
    Transaccion.guardar();
    actualizarPagina();
    formulario.reset();

    aviso.textContent = "Movimiento agregado.";
    aviso.className = "mt-2 text-sm text-green-700";
});

Transaccion.recuperar();
actualizarPagina();
