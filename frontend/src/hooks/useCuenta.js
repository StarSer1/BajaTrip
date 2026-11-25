import { useEffect, useState } from 'react';
import { alCambiar, quienSoy } from '../storage/cuenta.js';

// Quién inició sesión: { estado: 'cargando' | 'listo', usuario }. Se actualiza al entrar o salir.
export default function useCuenta() {
  const [cuenta, setCuenta] = useState({ estado: 'cargando', usuario: null });
  useEffect(() => {
    let vigente = true;
    const cargar = () => quienSoy().then((usuario) => vigente && setCuenta({ estado: 'listo', usuario }));
    cargar();
    const quitar = alCambiar(cargar);
    return () => { vigente = false; quitar(); };
  }, []);
  return cuenta;
}
