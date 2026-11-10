/**
 * Smart Projector Multi-Screen Window Management Utility
 * Uses window.getScreenDetails() (Multi-Screen Window Placement API)
 * with robust fallback for single-screen / blocked environments.
 */

export interface SmartProjectorResult {
  mode: 'secondary' | 'window';
  message: string;
  blocked: boolean;
}

export async function openSmartProjector(roomCode?: string): Promise<SmartProjectorResult> {
  if (typeof window === 'undefined') {
    return {
      mode: 'window',
      message: '🪟 Abierto en Modo Ventana (1 Monitor detectado)',
      blocked: false,
    };
  }

  const roomQuery = roomCode ? `&room=${encodeURIComponent(roomCode)}` : '';
  const projectorUrl = `${window.location.origin}${window.location.pathname}?view=projector${roomQuery}#projector`;

  // Try Multi-Screen Window Placement API first
  try {
    if (typeof (window as any).getScreenDetails === 'function') {
      const screenDetails = await (window as any).getScreenDetails();
      const screens = screenDetails.screens || [];
      const current = screenDetails.currentScreen;

      // Find secondary screen (not current screen, or not primary)
      const secondary = screens.find((s: any) => s !== current || !s.isPrimary);

      if (secondary && screens.length > 1) {
        const left = secondary.availLeft ?? secondary.left ?? 0;
        const top = secondary.availTop ?? secondary.top ?? 0;
        const width = secondary.availWidth ?? secondary.width ?? 1920;
        const height = secondary.availHeight ?? secondary.height ?? 1080;

        const features = `left=${left},top=${top},width=${width},height=${height},fullscreen=yes,menubar=no,toolbar=no,location=no,status=no,resizable=yes`;
        const newWin = window.open(projectorUrl, 'ProjectorWindow', features);

        if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
          return {
            mode: 'secondary',
            message: '🖥️ Proyectando en Monitor Secundario',
            blocked: true,
          };
        }

        try {
          newWin.focus();
        } catch {}

        return {
          mode: 'secondary',
          message: '🖥️ Proyectando en Monitor Secundario',
          blocked: false,
        };
      }
    }
  } catch (err) {
    console.info('Multi-Screen Window Placement API not granted or unsupported, proceeding with floating window fallback:', err);
  }

  // Fallback: 1 monitor or permissions denied / iframe sandbox
  const screenWidth = window.screen.availWidth || 1920;
  const screenHeight = window.screen.availHeight || 1080;
  const winWidth = Math.min(1024, Math.floor(screenWidth * 0.8));
  const winHeight = Math.min(576, Math.floor(screenHeight * 0.8));
  const left = Math.max(0, Math.floor((screenWidth - winWidth) / 2));
  const top = Math.max(0, Math.floor((screenHeight - winHeight) / 2));

  const features = `width=${winWidth},height=${winHeight},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes`;

  try {
    const newWin = window.open(projectorUrl, 'ProjectorWindow', features);
    if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
      return {
        mode: 'window',
        message: '🪟 Abierto en Modo Ventana (1 Monitor detectado)',
        blocked: true,
      };
    }

    try {
      newWin.focus();
    } catch {}

    return {
      mode: 'window',
      message: '🪟 Abierto en Modo Ventana (1 Monitor detectado)',
      blocked: false,
    };
  } catch (err) {
    console.warn('Window popup blocked by browser:', err);
    return {
      mode: 'window',
      message: '🪟 Abierto en Modo Ventana (1 Monitor detectado)',
      blocked: true,
    };
  }
}
