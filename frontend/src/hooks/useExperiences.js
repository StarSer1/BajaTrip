import { useState } from 'react';

export default function useExperiences(experiences) {
  const [destination, setDestination] = useState('');
  const [category, setCategory] = useState('');
  const [travelers, setTravelers] = useState(2);
  const [filters, setFilters] = useState({ destination: '', category: '' });
  const [selected, setSelected] = useState(null);
  const results = experiences.filter((t) => (!filters.destination || t.destination === filters.destination) && (!filters.category || t.category === filters.category));
  const scrollToResults = () => document.getElementById('experiencias')?.scrollIntoView();

  return {
    destination, setDestination, category, setCategory, travelers, setTravelers, filters, results, selected,
    openDetails: (experience) => setSelected({ experience, travelers }),
    closeDetails: () => setSelected(null),
    search(event) { event.preventDefault(); setFilters({ destination, category }); scrollToResults(); },
    chooseCategory(value) { setCategory(value); setFilters({ destination, category: value }); },
    chooseDestination(value) { setDestination(value); setCategory(''); setFilters({ destination: value, category: '' }); scrollToResults(); },
    reset() { setDestination(''); setCategory(''); setFilters({ destination: '', category: '' }); },
  };
}
