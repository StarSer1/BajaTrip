export default function LandingStory() {
  return <>
<section className="wrap story" aria-labelledby="titulo-historia">
        <div className="story-layout">
          <figure className="story-image">
            <img
              src="https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&amp;fit=crop&amp;w=800&amp;q=85"
              srcSet="https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&amp;fit=crop&amp;w=400&amp;q=85 400w, https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&amp;fit=crop&amp;w=800&amp;q=85 800w, https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&amp;fit=crop&amp;w=1600&amp;q=85 1600w"
              sizes="auto, (min-width: 55rem) 50vw, 100vw"
              width="800" height="600" loading="lazy"
              alt="Fotografía ilustrativa de una playa y el mar"
             />
          </figure>
          <div className="story-copy">
            <p className="eyebrow">LEJOS DE LO DE SIEMPRE</p>
            <h2 id="titulo-historia">No necesitas ir lejos.<br />Solo sentirte lejos.</h2>
            <p>
              Donde el desierto abraza al mar, cada camino tiene algo que contar.
              Un paseo en lancha, las calles de un pueblo mágico o una tarde sin
              mirar el reloj.
            </p>
            <a className="button" href="#destinos">Descubre tu destino</a
            ><small>Esto es Baja California Sur.</small>
          </div>
        </div>
      </section>
      <section id="como-funciona" className="wrap section" aria-labelledby="titulo-pasos">
        <div className="heading">
          <div>
            <p className="eyebrow">MENOS VUELTAS, MÁS AVENTURAS</p>
            <h2 id="titulo-pasos">Tu viaje empieza fácil.</h2>
          </div>
          <p>Así funcionará tu próxima reserva</p>
        </div>
        <div className="steps">
          <article>
            <span>01 /</span>
            <h3>Encuentra tu experiencia</h3>
            <p>Explora por destino y elige ese plan que va contigo.</p>
          </article>
          <article>
            <span>02 /</span>
            <h3>Conoce cada detalle</h3>
            <p>
              Consulta la duración, lo que incluye y las condiciones del tour.
            </p>
          </article>
          <article>
            <span>03 /</span>
            <h3>Reserva y disfruta</h3>
            <p>
              Cuando se habiliten las reservas, podrás consultar disponibilidad
              y contratar con el prestador.
            </p>
          </article>
        </div>
      </section>
    
  </>;
}
