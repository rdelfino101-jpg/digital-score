/**
 * Utilities for "8. Adivina la Canción (YouTube / YT Music Quiz)"
 */

/**
 * Extracts the 11-character YouTube video ID from various URL formats,
 * including YouTube Music (music.youtube.com), youtu.be, standard watch URLs,
 * embed links, or bare 11-char IDs.
 */
export function extractYouTubeVideoId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();

  // If already a clean 11-character ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex matching youtube.com, music.youtube.com, youtu.be, embed, etc.
  const regExp =
    /(?:(?:youtube|music\.youtube)\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  const match = trimmed.match(regExp);
  return match ? match[1] : null;
}

/**
 * Parses time formats such as "0:45", "1:30", "90", or number to seconds.
 */
export function parseTimeToSeconds(input: string | number): number {
  if (typeof input === 'number') {
    return isNaN(input) || input < 0 ? 0 : Math.floor(input);
  }
  if (!input) return 0;
  const trimmed = input.trim();
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    if (parts.length === 2) {
      const mins = parseInt(parts[0], 10) || 0;
      const secs = parseInt(parts[1], 10) || 0;
      return mins * 60 + secs;
    }
    if (parts.length === 3) {
      const hrs = parseInt(parts[0], 10) || 0;
      const mins = parseInt(parts[1], 10) || 0;
      const secs = parseInt(parts[2], 10) || 0;
      return hrs * 3600 + mins * 60 + secs;
    }
  }
  const parsed = parseInt(trimmed, 10);
  return isNaN(parsed) || parsed < 0 ? 0 : parsed;
}

/**
 * Formats numeric seconds to MM:SS string.
 */
export function formatSecondsToMMSS(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const remainingSecs = s % 60;
  return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
}

/**
 * Returns the high-resolution or default thumbnail URL for a YouTube video.
 */
export function getYouTubeThumbnailUrl(videoId?: string): string {
  if (!videoId) return '';
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}
