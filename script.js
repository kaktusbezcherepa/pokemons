const input = document.getElementById("input");
const pokemonsList = document.getElementById("pokemons_list");
const pokemonCard = document.getElementById("pokemon_card");
const loader = document.getElementById("loader");

const state = {
  pokemonNames: [],
  loading: false,
};

async function fetchAllPokemonNames() {
  try {
    const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=10000");
    const data = await res.json();
    state.pokemonNames = data.results.map(p => p.name);
  } catch (err) {
    console.error(err);
  }
}

function debounce(cb, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => cb(...args), delay);
  };
}

function showLoader() {
  loader.classList.remove("hidden");
}

function hideLoader() {
  loader.classList.add("hidden");
}

function clearSuggestions() {
  pokemonsList.replaceChildren();
}

const handleInput = debounce((value) => {
  const search = value.trim().toLowerCase();
  if (!search) {
    clearSuggestions();
    pokemonCard.innerHTML = "";
    return;
  }

  const filtered = state.pokemonNames
    .filter(name => name.startsWith(search))
    .slice(0, 10);

  showSuggestions(filtered);
}, 500);

input.addEventListener("input", (e) => {
  handleInput(e.target.value);
});

function showSuggestions(filtered) {
  clearSuggestions();
  pokemonCard.innerHTML = "";

  if (filtered.length === 0) {
    const p = document.createElement("p");
    p.textContent = "Нет совпадений";
    pokemonsList.appendChild(p);
    return;
  }

  filtered.forEach(name => {
    const item = document.createElement("div");
    item.textContent = name;
    item.classList.add("pokemon_suggestion");
    pokemonsList.appendChild(item);
  });

  renderMultiplePokemonCards(filtered);
}

async function renderMultiplePokemonCards(names) {
  showLoader();
  pokemonCard.innerHTML = "";

  const cards = await Promise.all(names.map(async (name) => {
    try {
      const pokemon = await fetchPokemon(name);
      const species = await fetchPokemonSpecies(name);
      return createPokemonCard(pokemon, species);
    } catch {
      return null;
    }
  }));

  cards.filter(Boolean).forEach(card => pokemonCard.appendChild(card));
  hideLoader();
}

async function fetchPokemon(name) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
  if (!res.ok) throw new Error("Покемон не найден");
  return await res.json();
}

async function fetchPokemonSpecies(name) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${name}`);
  if (!res.ok) throw new Error("Ошибка загрузки описания");
  const data = await res.json();
  return data;
}

function createPokemonCard(pokemon, species) {
  const card = document.createElement("div");
  card.className = "pokemon-card";

  const img = document.createElement("img");
  img.src = pokemon.sprites.other["official-artwork"].front_default;
  img.alt = pokemon.name;
  img.loading = "lazy";

  const name = document.createElement("h2");
  name.textContent = capitalize(pokemon.name);

  const types = document.createElement("div");
  types.className = "types";
  pokemon.types.forEach(t => {
    const badge = document.createElement("span");
    badge.textContent = t.type.name;
    badge.className = "type";
    badge.style.background = `var(--type-${t.type.name})`;
    types.appendChild(badge);
  });

  const stats = document.createElement("div");
  stats.className = "stats";
  const importantStats = ["hp", "attack", "defense", "speed"];

  pokemon.stats
    .filter(stat => importantStats.includes(stat.stat.name))
    .forEach(stat => {
      const statEl = document.createElement("div");
      statEl.className = "stat";

      const label = document.createElement("strong");
      label.textContent = capitalize(stat.stat.name) + ":";

      const bar = document.createElement("div");
      bar.className = "bar";

      const fill = document.createElement("div");
      fill.className = "bar-fill";
      fill.style.width = `${stat.base_stat}%`;

      bar.appendChild(fill);
      statEl.appendChild(label);
      statEl.appendChild(bar);
      stats.appendChild(statEl);
    });

  const desc = document.createElement("p");
  desc.textContent = species.description;

  card.append(img, name, types, stats, desc);
  return card;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

fetchAllPokemonNames();