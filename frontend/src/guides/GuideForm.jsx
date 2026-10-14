import { useEffect, useRef, useState } from 'react';
import { languages, municipalities, saveGuide, specialties } from './guidesDb.js';
import { preparePhoto, useObjectUrl } from './photo.js';
import { today } from '../utils/format.js';

const EMPTY = { name: '', specialty: '', municipality: '', phone: '', email: '', startDate: '', languages: ['Español'] };

// Un solo formulario para el alta y la modificación: si recibe un registro en editing, lo carga.
export default function GuideForm({ version, editing, onSaved, onCancel }) {
  const [fields, setFields] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const nameRef = useRef(null);
  const fileRef = useRef(null);
  const preview = useObjectUrl(file ?? editing?.photo);

  useEffect(() => {
    setFields(editing ? { ...EMPTY, ...editing } : EMPTY);
    setFile(null);
    setError('');
    fileRef.current.value = '';
    if (editing) nameRef.current.focus();
  }, [editing]);

  const set = (name) => (event) => setFields((current) => ({ ...current, [name]: event.target.value }));
  const toggleLanguage = (language) => setFields((current) => ({
    ...current,
    languages: current.languages.includes(language)
      ? current.languages.filter((l) => l !== language)
      : languages.filter((l) => l === language || current.languages.includes(l)),
  }));

  async function submit(event) {
    event.preventDefault();
    // No deshabilitamos el botón mientras se guarda: perdería el foco y quien usa teclado volvería al inicio.
    if (saving) return;
    const form = event.currentTarget;
    form.querySelector('input[name="languages"]')
      ?.setCustomValidity(fields.languages.length === 0 ? 'Elige al menos un idioma.' : '');
    if (!form.reportValidity()) return;
    setSaving(true);
    setError('');
    const { id, photo: currentPhoto, languages: spoken, ...data } = fields;
    const guide = { ...data, name: data.name.trim(), email: data.email.trim(), phone: data.phone.trim(), photo: currentPhoto };
    if (version >= 2) guide.languages = spoken;
    if (editing) guide.id = id;
    try {
      if (file) guide.photo = await preparePhoto(file);
    } catch {
      setError('No pudimos leer esa imagen. Prueba con un archivo JPG, PNG o WebP.');
      setSaving(false);
      return;
    }
    try {
      await saveGuide(guide);
      onSaved(guide, Boolean(editing));
      setFields(EMPTY);
      setFile(null);
      fileRef.current.value = '';
    } catch {
      setError('No pudimos guardar el registro en este navegador.');
    } finally {
      setSaving(false);
    }
  }

  return <form className="guide-form" onSubmit={submit} aria-labelledby="titulo-registro">
    <div className="guide-form__fields">
      <label className="field field--wide">Nombre completo
        <input ref={nameRef} name="name" value={fields.name} onChange={set('name')} required maxLength={80} autoComplete="off" />
      </label>
      <label className="field">Especialidad
        <select name="specialty" value={fields.specialty} onChange={set('specialty')} required>
          <option value="">Elige una especialidad</option>{specialties.map((s) => <option key={s}>{s}</option>)}
        </select>
      </label>
      <label className="field">Municipio
        <select name="municipality" value={fields.municipality} onChange={set('municipality')} required>
          <option value="">Elige un municipio</option>{municipalities.map((m) => <option key={m}>{m}</option>)}
        </select>
      </label>
      <div className="field">
        <label htmlFor="guia-telefono">Teléfono</label>
        <input id="guia-telefono" type="tel" name="phone" value={fields.phone} onChange={set('phone')} required inputMode="tel"
          pattern="\+?[0-9 ]{10,17}" title="Diez dígitos; puedes incluir lada internacional y espacios." aria-describedby="ayuda-telefono" />
        <small id="ayuda-telefono">Ejemplo: 612 123 4567</small>
      </div>
      <label className="field">Correo electrónico
        <input type="email" name="email" value={fields.email} onChange={set('email')} required autoComplete="off" />
      </label>
      <label className="field">Fecha de ingreso
        <input type="date" name="startDate" value={fields.startDate} onChange={set('startDate')} required max={today()} />
      </label>
      {version >= 2 && <fieldset className="field field--wide checks">
        <legend>Idiomas que habla</legend>
        {languages.map((language) => <label key={language}>
          <input type="checkbox" name="languages" value={language} checked={fields.languages.includes(language)}
            onChange={() => toggleLanguage(language)} /> {language}
        </label>)}
      </fieldset>}
      <div className="field field--wide photo-field">
        <label>Fotografía
          <input ref={fileRef} type="file" name="photo" accept="image/*" required={!editing}
            onChange={(event) => setFile(event.target.files[0] ?? null)} aria-describedby="ayuda-foto" />
        </label>
        <small id="ayuda-foto">{editing ? 'Deja este campo vacío para conservar la fotografía actual.' : 'Se guarda dentro de la base, reducida a 480 px.'}</small>
        {preview && <img src={preview} alt="Vista previa de la fotografía" width="96" height="96" />}
      </div>
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="guide-form__actions">
      <button className="button">{editing ? 'Guardar cambios' : 'Registrar guía'}</button>
      {editing && <button type="button" className="button button--secundario" onClick={onCancel}>Cancelar modificación</button>}
    </div>
  </form>;
}
