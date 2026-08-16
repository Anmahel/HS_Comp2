import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { api } from '../api';

export function useCatalogs() {
  const [catalogs, setCatalogs] = useState({
    brands: [],
    cores: [],
    designs: [],
    skus: [],
    tamanhos: [],
    tipos: [],
  });
  const [catalogsLoaded, setCatalogsLoaded] = useState(false);

  const fetchCatalogs = useCallback(async () => {
    try {
      const [brands, cores, designs, skus, tamanhos, tipos] = await Promise.all([
        api.getBrands(),
        api.getCores(),
        api.getDesigns(),
        api.getSkus(),
        api.getTamanhos(),
        api.getTipos(),
      ]);

      setCatalogs({
        brands: brands || [],
        cores: cores || [],
        designs: designs || [],
        skus: skus || [],
        tamanhos: tamanhos || [],
        tipos: tipos || [],
      });
      setCatalogsLoaded(true);
    } catch (err) {
      toast.error(`Falha ao carregar catálogos: ${err.message}`);
    }
  }, []);

  return {
    catalogs,
    catalogsLoaded,
    fetchCatalogs,
    setCatalogs,
  };
}
