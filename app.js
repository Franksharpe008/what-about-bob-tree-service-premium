(function () {
  const curtain = document.getElementById("launchCurtain");
  const enterButton = document.getElementById("enterButton");
  const playIntroButtons = [
    document.getElementById("playIntroButton"),
    document.getElementById("playIntroButtonHeader"),
  ].filter(Boolean);
  const musicButtons = [
    document.getElementById("toggleMusicButtonLaunch"),
    document.getElementById("toggleMusicButtonHeader"),
  ].filter(Boolean);
  const voiceIntro = document.getElementById("voiceIntro");
  const musicBed = document.getElementById("musicBed");
  const reveals = document.querySelectorAll(".reveal");
  const tiltCards = document.querySelectorAll(".tilt-card");
  const atlasSvg = document.getElementById("countyAtlas");
  const countyCards = document.getElementById("countyCards");
  const cityCloud = document.getElementById("cityCloud");
  const ENTRY_MUSIC_VOLUME = 0.42;
  const FULL_MUSIC_VOLUME = 0.52;

  let musicReady = false;
  let musicOn = false;
  let pendingMusicStart = false;
  let hasEntered = false;
  let musicRetryTimer = null;
  const searchParams = new URLSearchParams(window.location.search);

  if (musicBed) {
    musicBed.volume = FULL_MUSIC_VOLUME;
    const markMusicReady = () => {
      musicReady = true;
      syncMusicButtons();
      if (pendingMusicStart && !musicOn) {
        void startMusic(false);
      }
    };
    ["loadeddata", "canplay", "canplaythrough"].forEach((eventName) => {
      musicBed.addEventListener(eventName, markMusicReady);
    });
    musicBed.addEventListener("play", () => {
      musicOn = true;
      pendingMusicStart = false;
      syncMusicButtons();
    });
    musicBed.addEventListener("pause", () => {
      if (!musicBed.ended) {
        musicOn = false;
        syncMusicButtons();
      }
    });
    musicBed.addEventListener("error", () => {
      musicReady = false;
      syncMusicButtons();
    });
  }

  if (voiceIntro) {
    voiceIntro.volume = 1;
    voiceIntro.addEventListener("play", () => {
      if (musicBed && musicOn) {
        musicBed.volume = ENTRY_MUSIC_VOLUME;
      }
    });
    const restoreMusicVolume = () => {
      if (musicBed && musicOn) {
        musicBed.volume = FULL_MUSIC_VOLUME;
      }
    };
    voiceIntro.addEventListener("ended", restoreMusicVolume);
    voiceIntro.addEventListener("pause", restoreMusicVolume);
  }

  function syncMusicButtons() {
    musicButtons.forEach((button) => {
      if (!button) return;
      if (!musicBed) {
        button.disabled = true;
        button.textContent = "Music unavailable";
        return;
      }
      button.disabled = false;
      if (!musicReady && !musicOn) {
        button.textContent = "Music loading";
        return;
      }
      button.textContent = musicOn ? "Music on" : "Music off";
    });
  }

  syncMusicButtons();

  function setScrollDepth() {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const ratio = Math.min(1, window.scrollY / maxScroll);
    document.documentElement.style.setProperty("--scroll-depth", ratio.toFixed(4));
  }

  function openCurtain() {
    curtain?.classList.add("is-open");
  }

  function warmAudio() {
    if (voiceIntro) {
      voiceIntro.load();
    }
    if (musicBed) {
      musicBed.load();
    }
  }

  async function startMusic(deferIfNeeded = true) {
    if (!musicBed) return;
    if (musicOn) return;
    if (musicRetryTimer) {
      window.clearTimeout(musicRetryTimer);
      musicRetryTimer = null;
    }
    try {
      await musicBed.play();
      musicOn = true;
      pendingMusicStart = false;
    } catch {
      musicOn = false;
      if (deferIfNeeded) {
        pendingMusicStart = true;
        musicBed.load();
        musicRetryTimer = window.setTimeout(() => {
          if (!musicOn) {
            void startMusic(false);
          }
        }, 700);
      }
    }
    syncMusicButtons();
  }

  async function startEntryAudio() {
    const tasks = [];
    if (voiceIntro) {
      voiceIntro.currentTime = 0;
      tasks.push(
        voiceIntro.play().catch(() => {
          return null;
        })
      );
    }
    if (musicBed) {
      musicBed.currentTime = 0;
      musicBed.volume = ENTRY_MUSIC_VOLUME;
      tasks.push(startMusic(true));
    }
    await Promise.allSettled(tasks);
  }

  async function toggleMusic() {
    if (!musicBed) return;
    if (musicOn) {
      musicBed.pause();
      musicOn = false;
      pendingMusicStart = false;
    } else {
      await startMusic(true);
    }
    syncMusicButtons();
  }

  async function playIntroOnly() {
    if (!voiceIntro) return;
    voiceIntro.currentTime = 0;
    try {
      await voiceIntro.play();
    } catch {
      return;
    }
  }

  async function enterExperience() {
    if (hasEntered) {
      if (voiceIntro?.paused) {
        await playIntroOnly();
      }
      if (!musicOn) {
        await startMusic(true);
      }
      return;
    }

    hasEntered = true;
    openCurtain();
    await startEntryAudio();
  }

  async function handleCurtainEntry(event) {
    const interactive = event.target.closest("button, a, input, textarea, select");
    if (interactive && event.currentTarget === curtain) return;
    if (event.type === "pointerdown" && event.currentTarget === enterButton) {
      event.preventDefault();
    }
    if (event.currentTarget === enterButton || event.currentTarget === curtain) {
      event.stopPropagation();
    }
    await enterExperience();
  }

  function dispatchScene(section) {
    const scene = section?.dataset?.scene || "scene-1";
    const focus =
      scene === "scene-5"
        ? "conversion"
        : scene === "scene-4"
          ? "recurring"
          : scene === "scene-3"
            ? "appointments"
            : "premium";
    window.dispatchEvent(new CustomEvent("sharpe-focus-change", { detail: { focus } }));
    window.dispatchEvent(new CustomEvent("sharpe-scene-change", { detail: { scene, progress: 0.72 } }));
  }

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        dispatchScene(entry.target);
      });
    },
    { threshold: 0.18 }
  );

  function mountReveals() {
    reveals.forEach((item) => revealObserver.observe(item));
  }

  function mountTilt() {
    tiltCards.forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg) translateZ(0)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }

  function flattenCoordinates(geometry) {
    const coordinates = [];
    if (!geometry) return coordinates;

    function visit(node) {
      if (!Array.isArray(node)) return;
      if (typeof node[0] === "number" && typeof node[1] === "number") {
        coordinates.push(node);
        return;
      }
      node.forEach(visit);
    }

    visit(geometry.coordinates);
    return coordinates;
  }

  function createBounds(features, cities, hub) {
    const coords = [];
    features.forEach((feature) => coords.push(...flattenCoordinates(feature.geometry)));
    cities.forEach((city) => coords.push([city.lon, city.lat]));
    if (hub) coords.push([hub.lon, hub.lat]);
    const lons = coords.map((pair) => pair[0]);
    const lats = coords.map((pair) => pair[1]);
    return {
      minLon: Math.min(...lons),
      maxLon: Math.max(...lons),
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
    };
  }

  function createProjector(bounds, width, height, padding) {
    const lonRange = bounds.maxLon - bounds.minLon || 1;
    const latRange = bounds.maxLat - bounds.minLat || 1;
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;

    return ([lon, lat]) => {
      const x = padding + ((lon - bounds.minLon) / lonRange) * innerWidth;
      const y = height - padding - ((lat - bounds.minLat) / latRange) * innerHeight;
      return [x, y];
    };
  }

  function pathFromGeometry(geometry, project) {
    const groups = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
    return groups
      .map((polygon) =>
        polygon
          .map((ring) =>
            ring
              .map((coord, index) => {
                const [x, y] = project(coord);
                return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
              })
              .join(" ") + " Z"
          )
          .join(" ")
      )
      .join(" ");
  }

  function centroidForFeature(feature) {
    const coords = flattenCoordinates(feature.geometry);
    const sums = coords.reduce(
      (acc, [lon, lat]) => {
        acc.lon += lon;
        acc.lat += lat;
        return acc;
      },
      { lon: 0, lat: 0 }
    );
    return [sums.lon / coords.length, sums.lat / coords.length];
  }

  function countyClass(name) {
    if (name.includes("Orange")) return "county-outline county-outline-orange";
    if (name.includes("Seminole")) return "county-outline county-outline-seminole";
    return "county-outline county-outline-volusia";
  }

  function escapeText(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function renderAtlas(data) {
    if (!atlasSvg || !countyCards || !cityCloud) return;

    const width = 900;
    const height = 640;
    const padding = 58;
    const bounds = createBounds(data.counties, data.cities, data.hub);
    const project = createProjector(bounds, width, height, padding);

    const parts = [];

    data.counties.forEach((county) => {
      const d = pathFromGeometry(county.geometry, project);
      const [lon, lat] = centroidForFeature(county);
      const [labelX, labelY] = project([lon, lat]);
      parts.push(`
        <a class="county-link" href="${escapeText(county.google_maps_url)}" target="_blank" rel="noreferrer">
          <path class="${countyClass(county.name)}" d="${d}" />
          <text class="county-label" x="${labelX.toFixed(2)}" y="${(labelY + 6).toFixed(2)}" text-anchor="middle">${escapeText(county.name.replace(" County", ""))}</text>
        </a>
      `);
    });

    data.cities.forEach((city) => {
      const [x, y] = project([city.lon, city.lat]);
      const isHub = city.name === "Sanford";
      parts.push(`
        <a class="city-link" href="${escapeText(city.google_maps_url)}" target="_blank" rel="noreferrer">
          <circle class="city-dot${isHub ? " is-hub" : ""}" cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${isHub ? 9 : 6}" />
          <text class="city-label" x="${(x + 12).toFixed(2)}" y="${(y - 12).toFixed(2)}">${escapeText(city.name)}</text>
        </a>
      `);
    });

    atlasSvg.innerHTML = parts.join("");

    countyCards.innerHTML = data.counties
      .map(
        (county) => `
          <article class="county-card">
            <h3>${escapeText(county.name)}</h3>
            <p>County-wide visibility anchored around Sanford and the greater Orlando footprint.</p>
            <a class="atlas-open-link" href="${escapeText(county.google_maps_url)}" target="_blank" rel="noreferrer">View county map</a>
          </article>
        `
      )
      .join("");

    cityCloud.innerHTML = data.cities
      .map(
        (city) => `
          <a href="${escapeText(city.google_maps_url)}" target="_blank" rel="noreferrer">${escapeText(city.name)}</a>
        `
      )
      .join("");
  }

  async function mountAtlas() {
    try {
      const response = await fetch("./assets/data/service-atlas.json");
      if (!response.ok) {
        throw new Error(`Atlas load failed: ${response.status}`);
      }
      const data = await response.json();
      renderAtlas(data);
    } catch (error) {
      console.error(error);
    }
  }

  function mountAudioControls() {
    enterButton?.addEventListener("pointerdown", handleCurtainEntry);
    enterButton?.addEventListener("click", handleCurtainEntry);
    playIntroButtons.forEach((button) =>
      button.addEventListener("click", async (event) => {
        event.stopPropagation();
        if (!hasEntered) {
          await enterExperience();
          return;
        }
        await playIntroOnly();
      })
    );
    musicButtons.forEach((button) => button.addEventListener("click", toggleMusic));
    curtain?.addEventListener("click", handleCurtainEntry);
  }

  window.addEventListener("scroll", setScrollDepth, { passive: true });
  window.addEventListener("resize", setScrollDepth);

  mountAudioControls();
  mountReveals();
  mountTilt();
  mountAtlas();
  setScrollDepth();
  warmAudio();

  if (searchParams.get("preview") === "1") {
    hasEntered = true;
    openCurtain();
  }

  if (window.PaperDirector) {
    window.PaperDirector.mount({
      canvasSelector: "#paper-hero-stage",
      initialFocus: "premium",
    });
    window.dispatchEvent(
      new CustomEvent("sharpe-scene-change", {
        detail: { scene: "scene-1", progress: 0.24 },
      })
    );
  }
})();
