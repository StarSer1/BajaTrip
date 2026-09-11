(() => {
  const tours = [
    {id:'isla',name:'Un día en Espíritu Santo',destination:'La Paz',category:'Mar y playa',duration:7,price:1800,image:'photo-1500375592092-40eb2168fd21',description:'Una propuesta para navegar entre bahías y descubrir el paisaje de la isla.',includes:['Recorrido en lancha','Equipo de snorkel y chaleco','Comida ligera y agua']},
    {id:'arco',name:'El Arco desde el mar',destination:'Los Cabos',category:'Mar y playa',duration:2,price:650,image:'photo-1512813195386-6cf811ad3542',description:'Contempla las formaciones rocosas de Cabo San Lucas desde una nueva perspectiva.',includes:['Paseo en embarcación','Chaleco salvavidas','Guía durante el recorrido']},
    {id:'pueblo',name:'Entre calles, arte y sabores',destination:'Todos Santos',category:'Cultura y sabores',duration:4,price:950,image:'photo-1518659526054-190340b32735',description:'Un paseo para descubrir rincones, conocer propuestas de arte local y saborear una tarde en Todos Santos.',includes:['Caminata guiada','Visita a espacios de arte','Degustación de ejemplo']},
    {id:'kayak',name:'Kayak en el mar de Cortés',destination:'Loreto',category:'Aventura',duration:3,price:1200,image:'photo-1500534623283-312aade485b7',description:'Una propuesta para remar junto a la costa y observar el encuentro del desierto con el mar.',includes:['Kayak y remo','Chaleco salvavidas','Introducción a la actividad']},
    {id:'balandra',name:'Balandra, sin prisa',destination:'La Paz',category:'Mar y playa',duration:5,price:850,image:'photo-1510414842594-a61c69b5ae57',description:'Disfruta los colores del mar y una caminata tranquila por el paisaje costero. El acceso depende del aforo y de las reglas del área.',includes:['Traslado de ejemplo desde La Paz','Acompañamiento de guía','Agua durante la salida']},
    {id:'bahia',name:'Escapada a Bahía Concepción',destination:'Mulegé',category:'Aventura',duration:6,price:1400,image:'photo-1476514525535-07fb3b4ae5f1',description:'Un día para explorar la bahía y conocer otra cara de Baja Sur.',includes:['Recorrido guiado de ejemplo','Paradas para fotografías','Agua durante la salida']}
  ];
  const destination=document.querySelector('#destination'), activity=document.querySelector('#activity'), travelers=document.querySelector('#travelers'), grid=document.querySelector('#grid'), dialog=document.querySelector('#details');
  const money=value=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(value);
  const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  function render(){
    const results=tours.filter(t=>(!destination.value||t.destination===destination.value)&&(!activity.value||t.category===activity.value));
    grid.innerHTML=results.map(t=>`<article class="card"><div class="photo"><img src="https://images.unsplash.com/${t.image}?auto=format&fit=crop&w=800&q=80" alt="Fotografía ilustrativa: ${t.name}" loading="lazy" width="800" height="900"><span class="badge">${t.category}</span><button class="arrow" data-tour="${t.id}" aria-label="Ver detalles de ${t.name}">↗</button></div><p class="meta">${t.destination.toUpperCase()} &nbsp; · &nbsp; ${t.duration} horas &nbsp; · &nbsp; Ejemplo</p><h3><button data-tour="${t.id}">${t.name}</button></h3><div class="price">Desde <strong>${money(t.price)}</strong> MXN / persona</div></article>`).join('');
    document.querySelector('#count').textContent=`${results.length} experiencias${destination.value?' en '+destination.value:''}`;
    document.querySelector('#empty').hidden=results.length>0;
    document.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.category===activity.value)));
  }
  document.querySelector('#search').addEventListener('submit',e=>{e.preventDefault();render();document.querySelector('#experiencias').scrollIntoView();});
  document.querySelectorAll('[data-category]').forEach(b=>b.addEventListener('click',()=>{activity.value=b.dataset.category;render();}));
  document.querySelectorAll('[data-destination]').forEach(b=>b.addEventListener('click',()=>{destination.value=b.dataset.destination;activity.value='';render();document.querySelector('#experiencias').scrollIntoView();}));
  document.querySelector('#reset').addEventListener('click',()=>{destination.value='';activity.value='';render();});
  grid.addEventListener('click',e=>{
    const button=e.target.closest('[data-tour]');if(!button)return;
    const t=tours.find(t=>t.id===button.dataset.tour), people=Number(travelers.value);
    document.querySelector('#dialog-content').innerHTML=`<p class="eyebrow">${t.destination} · ${t.duration} horas</p><h2 id="dialog-title">${t.name}</h2><p>${t.description}</p><h3>Qué incluiría</h3><ul>${t.includes.map(i=>`<li>${i}</li>`).join('')}</ul><p>El itinerario, los requisitos y la disponibilidad se confirmarán cuando el prestador publique el servicio.</p><p><strong>${money(t.price*people)} MXN</strong> para ${people} ${people===1?'persona':'personas'} · precio ilustrativo.</p><p class="notice">Demostración: las fotografías, servicios y precios son ilustrativos. No se realizan cobros ni reservas reales.</p><form id="reservation"><label>Fecha de tu aventura<input type="date" name="fecha" required min="${today()}"></label><button class="button">Probar reserva de ejemplo ↗</button><p class="result" role="status"></p></form>`;
    document.querySelector('#reservation').addEventListener('submit',e=>{e.preventDefault();const field=e.currentTarget.elements.fecha;field.min=today();if(!e.currentTarget.reportValidity())return;const date=new Date(field.value+'T12:00:00').toLocaleDateString('es-MX',{day:'numeric',month:'long',year:'numeric'});document.querySelector('.result').textContent=`Tu selección de ejemplo: ${t.name}, ${date}, ${people} ${people===1?'persona':'personas'}. No se envió ninguna solicitud. Las reservas estarán disponibles al conectar a los prestadores.`;});
    dialog.showModal();
  });
  document.querySelector('.close').addEventListener('click',()=>dialog.close());
  render();
})();
