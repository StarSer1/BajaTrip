import useModalDialog from '../hooks/useModalDialog.js';
import { photoSrcSet, photoUrl } from '../utils/images.js';

export default function PhotoDialog({ experience: t, onClose }) {
  const dialogRef = useModalDialog();
  return <dialog ref={dialogRef} className="photo-dialog" aria-labelledby="photo-title" onCancel={onClose}>
    <button className="close" aria-label="Cerrar fotografía" onClick={onClose}>✕</button>
    <figure>
      <img src={photoUrl(t.image, 1200)} srcSet={photoSrcSet(t.image, [800, 1200, 1600])}
        sizes="(max-width: 62rem) calc(100vw - 4rem), 56rem"
        alt={`Fotografía ilustrativa: ${t.name}`} width="1200" height="900" />
      <figcaption><strong id="photo-title">{t.name}</strong> · {t.destination}</figcaption>
    </figure>
  </dialog>;
}
