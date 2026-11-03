import { useState, useEffect } from 'react';

/** Filtros por tipo de lugar (pendientes vs. confirmados). */
export function useMapFilters() {
  const [pendingTypes, setPendingTypes] = useState<string[]>([]);
  const [confirmedTypes, setConfirmedTypes] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Inicializa pendingTypes al montar
  useEffect(() => {
    setPendingTypes(confirmedTypes);
  }, []);

  const handleApplyFilters = () => {
    setConfirmedTypes([...pendingTypes]);
    setHasChanges(false);
  };

  const toggleTypeSelection = (type: string) => {
    setPendingTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
    setHasChanges(true);
  };

  return { pendingTypes, confirmedTypes, hasChanges, handleApplyFilters, toggleTypeSelection };
}
