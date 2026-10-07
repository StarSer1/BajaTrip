import { useState } from 'react';
import useSessionState from './useSessionState.js';

// La búsqueda vive en sessionStorage: al recargar o pasar del inicio al catálogo no se pierde.
export const SEARCH_KEY = 'bajatrip:busqueda';
export const DEFAULT_SEARCH = { destination: '', category: '', travelers: 2, filters: { destination: '', category: '' } };

export default function useExperiences(experiences) {
  const [search, setSearch] = useSessionState(SEARCH_KEY, DEFAULT_SEARCH);
  const [selected, setSelected] = useState(null);
  const { destination, category, travelers, filters } = search;
  const update = (changes) => setSearch((current) => ({ ...current, ...changes }));
  const results = experiences.filter((t) => (!filters.destination || t.destination === filters.destination) && (!filters.category || t.category === filters.category));
  const scrollToResults = () => document.getElementById('experiencias')?.scrollIntoView();

  return {
    destination, category, travelers, filters, results, selected,
    setDestination: (value) => update({ destination: value }),
    setCategory: (value) => update({ category: value }),
    setTravelers: (value) => update({ travelers: value }),
    openDetails: (experience) => setSelected({ experience, travelers }),
    closeDetails: () => setSelected(null),
    search(event) { event.preventDefault(); update({ filters: { destination, category } }); scrollToResults(); },
    chooseCategory(value) { update({ category: value, filters: { destination, category: value } }); },
    chooseDestination(value) { update({ destination: value, category: '', filters: { destination: value, category: '' } }); scrollToResults(); },
    reset() { update({ destination: '', category: '', filters: { destination: '', category: '' } }); },
  };
}
