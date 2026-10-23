// Decorative, muted YouTube background. YouTube chooses streaming quality.
(() => {
  const hero = document.querySelector('.hero');
  const layer = document.querySelector('.hero-video');
  if (!hero || !layer) return;
  // YouTube requires an HTTP Referer / client origin. file:// has neither.
  if (location.protocol === 'file:') {
    hero.dataset.videoState = 'local-file';
    const notice = document.querySelector('.hero-local-notice');
    if (notice) notice.hidden = false;
    return;
  }
  // Start from one of several curated moments so repeat visits feel less static.
  // The requested values are 00:42, 00:51, 01:35 and 02:05.
  const startPoints = [42, 51, 95, 125];
  const startSeconds = startPoints[Math.floor(Math.random() * startPoints.length)];
  const endSeconds = 174;
  let player;
  let ready = false;
  let loopTimer;
  let inView = true;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const wantsMotion = () => !reduced.matches && !document.documentElement.classList.contains('motion-paused');
  const shouldPlay = () => wantsMotion() && inView && !document.hidden;

  // Overscan the decorative video so YouTube's edge information stays outside
  // the clipped hero. showinfo=0 is deprecated and does not hide that UI.
  const sizePlayer = () => {
    const edgeInset = 120;
    const width = Math.max(hero.clientWidth, (hero.clientHeight + edgeInset * 2) * 16 / 9);
    layer.style.setProperty('--video-width', `${Math.ceil(width)}px`);
    layer.style.setProperty('--video-height', `${Math.ceil(width * 9 / 16)}px`);
  };
  new ResizeObserver(sizePlayer).observe(hero);
  sizePlayer();

  const disableCaptions = target => {
    // Clear the selected caption track as well as unloading it. Some iframe API
    // versions expose setOption but not unloadModule; relying on the latter alone
    // leaves the visitor's saved "captions on" preference active.
    try { target?.setOption?.('captions', 'track', {}); } catch { /* Keep playing. */ }
    try { target?.unloadModule?.('captions'); } catch { /* Keep playing. */ }
  };

  const syncPlayback = () => {
    if (!ready) return;
    if (shouldPlay()) {
      player.mute();
      const time = player.getCurrentTime();
      if (time >= endSeconds || time < startSeconds - 1) player.seekTo(startSeconds, true);
      player.playVideo();
    } else {
      player.pauseVideo();
    }
  };
  const initPlayer = () => {
    if (player || !window.YT?.Player) return;
    player = new YT.Player('hero-youtube', {
      width: 1920,
      height: 1080,
      videoId: 'ZIqLCFjUMIY',
      host: 'https://www.youtube.com',
      playerVars: {
        autoplay: 1, mute: 1, controls: 0, disablekb: 1, fs: 0, cc_load_policy: 0,
        playsinline: 1, rel: 0, start: startSeconds, end: endSeconds,
        origin: location.origin
      },
      events: {
        onReady(event) {
          ready = true;
          const iframe = event.target.getIframe();
          iframe.tabIndex = -1;
          iframe.setAttribute('aria-hidden', 'true');
          iframe.setAttribute('title', 'CMU Nursing background video');
          event.target.mute();
          disableCaptions(event.target);
          event.target.seekTo(startSeconds, true);
          syncPlayback();
          startLoop();
        },
        onStateChange(event) {
          if (event.data === YT.PlayerState.PLAYING) {
            disableCaptions(player);
            layer.classList.add('is-playing');
            hero.dataset.videoState = 'playing';
            if (!shouldPlay()) player.pauseVideo();
          } else if (event.data === YT.PlayerState.ENDED && shouldPlay()) {
            player.seekTo(startSeconds, true);
            player.playVideo();
          } else if (event.data === YT.PlayerState.PAUSED) {
            hero.dataset.videoState = 'paused';
          }
        },
        onApiChange(event) {
          disableCaptions(event.target);
        },
        onAutoplayBlocked() {
          hero.dataset.videoState = 'blocked';
          layer.classList.remove('is-playing');
          // A normal page interaction can retry muted playback after a browser block.
          document.addEventListener('pointerdown', syncPlayback, { once: true });
          document.addEventListener('keydown', syncPlayback, { once: true });
        },
        onError() {
          hero.dataset.videoState = 'unavailable';
          layer.classList.remove('is-playing');
          clearInterval(loopTimer);
        }
      }
    });
  };
  function startLoop() {
    clearInterval(loopTimer);
    loopTimer = setInterval(() => {
      if (!ready || !shouldPlay()) return;
      const time = player.getCurrentTime();
      if (time >= endSeconds || time < startSeconds - 1) player.seekTo(startSeconds, true);
    }, 200);
  }
  const loadPlayer = () => {
    if (!wantsMotion() || player) return;
    if (window.YT?.Player) return initPlayer();
    if (document.querySelector('script[data-hero-youtube-api]')) return;
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { previousReady?.(); initPlayer(); };
    const api = document.createElement('script');
    api.src = 'https://www.youtube.com/iframe_api';
    api.dataset.heroYoutubeApi = '';
    api.async = true;
    api.onerror = () => { hero.dataset.videoState = 'unavailable'; };
    document.head.append(api);
  };
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) loadPlayer();
    syncPlayback();
  }).observe(hero);
  new MutationObserver(() => { loadPlayer(); syncPlayback(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', syncPlayback);
  reduced.addEventListener('change', () => { loadPlayer(); syncPlayback(); });
  window.addEventListener('pagehide', () => clearInterval(loopTimer));
  window.addEventListener('pageshow', event => {
    if (event.persisted && ready) { startLoop(); syncPlayback(); }
  });
  loadPlayer();
})();
