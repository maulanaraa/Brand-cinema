export function getYoutubeVideoId(url?: string): string | null {
  if (!url?.trim()) return null;

  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      return parsed.pathname.slice(1).split('/')[0] || null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname.startsWith('/embed/')) {
        return parsed.pathname.split('/')[2] || null;
      }
      if (parsed.pathname.startsWith('/shorts/')) {
        return parsed.pathname.split('/')[2] || null;
      }
      return parsed.searchParams.get('v');
    }
  } catch {
    return null;
  }

  return null;
}

export function getYoutubeEmbedUrl(url?: string): string | null {
  const id = getYoutubeVideoId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

export function getYoutubeAutoplayEmbedUrl(url?: string): string | null {
  const id = getYoutubeVideoId(url);
  if (!id) return null;

  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    controls: '0',
    loop: '1',
    playlist: id,
    playsinline: '1',
    rel: '0',
    modestbranding: '1',
    disablekb: '1',
    fs: '0',
    iv_load_policy: '3',
  });

  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}

export function getYoutubeFocusEmbedUrl(url?: string): string | null {
  const id = getYoutubeVideoId(url);
  if (!id) return null;

  const params = new URLSearchParams({
    autoplay: '1',
    mute: '0',
    controls: '1',
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    fs: '1',
    enablejsapi: '1',
  });

  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}
