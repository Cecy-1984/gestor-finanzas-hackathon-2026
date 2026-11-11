export class Transaccion {
    static historial = [];

    constructor(id, tipo, descripcion, monto, categoria) {
        this.id = id;
        this.tipo = tipo;
        this.descripcion = descripcion;
        this.monto = monto;
        this.categoria = categoria;
    }

    static guardar() {
        localStorage.setItem("historial", JSON.stringify(Transaccion.historial));
    }

    static recuperar() {
        const guardado = localStorage.getItem("historial");
        const movimientos = guardado ? JSON.parse(guardado) : [];

        Transaccion.historial = movimientos.map(movimiento =>
            new Transaccion(
                movimiento.id,
                movimiento.tipo,
                movimiento.descripcion,
                movimiento.monto,
                movimiento.categoria
            )
        );
    }
}
