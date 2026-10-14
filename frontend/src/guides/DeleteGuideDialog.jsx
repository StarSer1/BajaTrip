import useModalDialog from '../hooks/useModalDialog.js';

// Confirmación de la baja. «Cancelar» va primero para que reciba el foco al abrir:
// pulsar Enter o Escape por accidente no borra nada.
export default function DeleteGuideDialog({ guide, onConfirm, onClose }) {
  const dialogRef = useModalDialog();
  return <dialog ref={dialogRef} className="confirm-dialog" aria-labelledby="confirmar-titulo"
    aria-describedby="confirmar-descripcion" onCancel={onClose}>
    <h2 id="confirmar-titulo">¿Dar de baja a {guide.name}?</h2>
    <p id="confirmar-descripcion">Se eliminarán su registro y su fotografía de este navegador. Esta acción no se puede deshacer.</p>
    <div className="confirm-dialog__actions">
      <button type="button" className="button button--secundario" onClick={onClose}>Cancelar</button>
      <button type="button" className="button button--peligro" onClick={onConfirm}>Sí, dar de baja</button>
    </div>
  </dialog>;
}
