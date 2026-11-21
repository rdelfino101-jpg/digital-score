import { createContext, useContext } from 'react';
import { DEFAULT_EVENT_BRAND, type EventBrand } from '../../../styles/eventBrand';

/** Marca del evento disponible para todas las escenas del proyector */
export const ProjectorBrandContext = createContext<EventBrand>(DEFAULT_EVENT_BRAND);

export function useProjectorBrand(): EventBrand {
  return useContext(ProjectorBrandContext);
}
