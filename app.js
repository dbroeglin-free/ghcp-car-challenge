const RESORTS_URL = './resorts.json';
const grid = document.getElementById('resorts-grid');

function iconForCode(code){
  // Open-Meteo weathercode mapping (simplified)
  if(code === 0) return 'icon-sun';
  if(code >= 1 && code <=3) return 'icon-sun';
  if((code >= 45 && code <= 48) || (code>=51 && code<=57)) return 'icon-fog';
  if((code>=61 && code<=67) || (code>=80 && code<=82)) return 'icon-rain';
  if((code>=71 && code<=77) || (code===85) || (code===86)) return 'icon-snow';
  if(code>=95) return 'icon-thunder';
  return 'icon-cloud';
}

function createCard(resort){
  const card = document.createElement('article');
  card.className = 'card';
  card.innerHTML = `
    <div class="top">
      <div>
        <div class="place">${resort.name}, ${resort.country}</div>
        <div class="meta small">Lat ${resort.lat} • Lon ${resort.lon}</div>
      </div>
      <svg class="icon" role="img"><use href="#icon-cloud"></use></svg>
    </div>
    <div class="body">
      <div class="temps">
        <div class="temp-current">–°</div>
        <div class="small">Conditions</div>
      </div>
      <div class="kpi">
        <span class="small">Vent: –</span>
        <span class="small">Précip.: –</span>
        <span class="small">Neige (3j): –</span>
      </div>
      <div class="status small"></div>
    </div>
  `;
  return card;
}

async function fetchWeather(resort, card){
  const statusEl = card.querySelector('.status');
  try{
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${resort.lat}&longitude=${resort.lon}&current_weather=true&daily=snowfall_sum,weathercode,temperature_2m_max,temperature_2m_min&forecast_days=3&timezone=auto&temperature_unit=celsius&windspeed_unit=kmh`;
    const res = await fetch(url, {cache: 'no-store'});
    if(!res.ok) throw new Error('Météo non disponible');
    const data = await res.json();

    const cw = data.current_weather || {};
    const daily = data.daily || {};

    const icon = iconForCode(cw.weathercode ?? daily.weathercode?.[0] ?? 0);
    card.querySelector('svg.icon use').setAttribute('href', `#${icon}`);
    card.querySelector('.temp-current').textContent = cw.temperature ? Math.round(cw.temperature) + '°C' : '–';
    card.querySelector('.temps + .small').textContent = cw.weathercode ? '' : '';
    const wind = cw.windspeed ? `${Math.round(cw.windspeed)} km/h` : '–';
    const precip = (daily.precipitation_sum && daily.precipitation_sum[0]) ? `${daily.precipitation_sum[0]} mm` : '–';
    const snow3 = (daily.snowfall_sum && daily.snowfall_sum.length) ? `${daily.snowfall_sum.reduce((a,b)=>a+b,0).toFixed(1)} cm` : '–';

    const kpis = card.querySelectorAll('.kpi span');
    kpis[0].textContent = `Vent: ${wind}`;
    kpis[1].textContent = `Précip.: ${precip}`;
    kpis[2].textContent = `Neige (3j): ${snow3}`;

    statusEl.textContent = `Dernière mise à jour: ${cw.time ?? '–'}`;
  }catch(e){
    statusEl.textContent = '';
    const err = document.createElement('div');
    err.className = 'error small';
    err.textContent = 'Impossible de charger la météo.';
    card.appendChild(err);
    console.error(e);
  }
}

async function init(){
  try{
    const res = await fetch(RESORTS_URL);
    const resorts = await res.json();
    resorts.forEach(r => {
      const card = createCard(r);
      grid.appendChild(card);
      fetchWeather(r, card);
    });
  }catch(e){
    grid.innerHTML = '<div class="error">Erreur interne: impossible de charger les stations.</div>';
    console.error(e);
  }
}

init();
