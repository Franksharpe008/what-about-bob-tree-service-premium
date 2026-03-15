(function () {
  "use strict";

  const FOCUS_TOKENS = {
    appointments: {
      frame: "#87efe1",
      orbit: "#87efe1",
      signal: "#f0c37c",
      rail: "#8fd4d2",
      halo: "#aef8ef",
      barFill: "#82dcd2",
      barStroke: "#d8fdf7",
      nodeFill: "#f2fbfb",
      nodeStroke: "#87efe1",
    },
    premium: {
      frame: "#f0c37c",
      orbit: "#f0c37c",
      signal: "#fff4d9",
      rail: "#d2af71",
      halo: "#ffe1aa",
      barFill: "#f0c37c",
      barStroke: "#fff2cb",
      nodeFill: "#fff7e6",
      nodeStroke: "#f0c37c",
    },
    recurring: {
      frame: "#82c9f3",
      orbit: "#82c9f3",
      signal: "#9ef0db",
      rail: "#73aee0",
      halo: "#b4e8ff",
      barFill: "#7fd1ef",
      barStroke: "#dff7ff",
      nodeFill: "#ecfbff",
      nodeStroke: "#82c9f3",
    },
  };

  const SCENE_INTENSITY = {
    "scene-1": 0.18,
    "scene-2": 0.34,
    "scene-3": 0.68,
    "scene-4": 0.92,
  };

  const DIRECTOR_PRINCIPLES = [
    {
      id: "clarity",
      rule: "Animate one selling idea at a time.",
      why: "Buyers trust controlled sequence more than visual noise.",
    },
    {
      id: "authority",
      rule: "Use structure to signal competence before detail.",
      why: "Premium work feels ordered before it feels loud.",
    },
    {
      id: "restraint",
      rule: "Keep motion subordinate to hierarchy.",
      why: "Decoration without guidance reads as template filler.",
    },
    {
      id: "progression",
      rule: "Reveal proof as a climb, not a dump.",
      why: "Sequenced progress keeps attention and lowers overwhelm.",
    },
  ];

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function mix(a, b, amount) {
    return a + (b - a) * amount;
  }

  function alpha(scope, hex, opacity) {
    const color = new scope.Color(hex);
    color.alpha = opacity;
    return color;
  }

  function setScale(item, scale, anchor) {
    const previous = item.data.currentScale || 1;
    if (!previous) return;
    item.scale(scale / previous, anchor || item.position);
    item.data.currentScale = scale;
  }

  function buildNodeSymbol(scope, tokens) {
    const seed = new scope.Group();
    seed.addChild(
      new scope.Path.Circle({
        center: [0, 0],
        radius: 3.2,
        fillColor: alpha(scope, tokens.nodeFill, 0.9),
      })
    );
    seed.addChild(
      new scope.Path.Circle({
        center: [0, 0],
        radius: 10,
        strokeWidth: 1.2,
        strokeColor: alpha(scope, tokens.nodeStroke, 0.34),
      })
    );
    const symbol = new scope.SymbolDefinition(seed);
    seed.remove();
    return symbol;
  }

  function buildComposition(scope, size, tokens) {
    const width = size.width;
    const height = size.height;
    const center = new scope.Point(width * 0.6, height * 0.5);
    const root = new scope.Group();

    const frame = new scope.Path.RoundRectangle({
      rectangle: new scope.Rectangle(14, 14, width - 28, height - 28),
      radius: 24,
      strokeWidth: 1.2,
      strokeColor: alpha(scope, tokens.frame, 0.28),
    });
    root.addChild(frame);

    const rails = [];
    const railGroup = new scope.Group();
    for (let index = 0; index < 8; index += 1) {
      const startX = width * (0.1 + index * 0.085);
      const drift = width * (0.02 + index * 0.004);
      const path = new scope.Path({
        strokeWidth: index % 3 === 0 ? 1.8 : 1.15,
        strokeCap: "round",
        strokeColor: alpha(scope, tokens.rail, 0.16 + index * 0.02),
        dashArray: [8 + index, 16 + index * 1.4],
      });
      path.add(new scope.Point(startX, -20));
      path.add(new scope.Point(startX + drift, height * 0.28));
      path.add(new scope.Point(startX - drift * 0.8, height * 0.7));
      path.add(new scope.Point(startX + drift * 0.6, height + 20));
      path.smooth({ type: "continuous" });
      path.data.baseX = path.position.x;
      rails.push(path);
      railGroup.addChild(path);
    }
    root.addChild(railGroup);

    const orbit = new scope.Path({
      strokeWidth: 2.4,
      strokeCap: "round",
      strokeColor: alpha(scope, tokens.orbit, 0.42),
      dashArray: [18, 14],
    });
    orbit.add(new scope.Point(width * 0.16, height * 0.26));
    orbit.add(new scope.Point(width * 0.4, height * 0.12));
    orbit.add(new scope.Point(width * 0.76, height * 0.2));
    orbit.add(new scope.Point(width * 0.86, height * 0.52));
    orbit.add(new scope.Point(width * 0.68, height * 0.82));
    orbit.add(new scope.Point(width * 0.3, height * 0.76));
    orbit.smooth({ type: "continuous" });
    root.addChild(orbit);

    const signal = new scope.Path({
      strokeWidth: 3,
      strokeCap: "round",
      strokeColor: alpha(scope, tokens.signal, 0.64),
      dashArray: [10, 10],
    });
    signal.add(new scope.Point(width * 0.2, height * 0.7));
    signal.add(new scope.Point(width * 0.38, height * 0.62));
    signal.add(new scope.Point(width * 0.54, height * 0.69));
    signal.add(new scope.Point(width * 0.7, height * 0.48));
    signal.add(new scope.Point(width * 0.84, height * 0.28));
    signal.smooth({ type: "continuous" });
    root.addChild(signal);

    const ladderBars = [];
    const ladderGroup = new scope.Group();
    for (let index = 0; index < 4; index += 1) {
      const barWidth = width * (0.16 + index * 0.034);
      const barHeight = height * 0.055;
      const x = width * (0.48 + index * 0.055);
      const y = height * (0.68 - index * 0.11);
      const bar = new scope.Path.RoundRectangle({
        rectangle: new scope.Rectangle(x, y, barWidth, barHeight),
        radius: 14,
        strokeWidth: 1.4,
        strokeColor: alpha(scope, tokens.barStroke, 0.22),
        fillColor: alpha(scope, tokens.barFill, 0.06),
      });
      bar.data.baseY = bar.position.y;
      ladderBars.push(bar);
      ladderGroup.addChild(bar);
    }
    root.addChild(ladderGroup);

    const haloOuter = new scope.Path.Circle({
      center,
      radius: Math.min(width, height) * 0.22,
      strokeWidth: 1.25,
      strokeColor: alpha(scope, tokens.halo, 0.18),
    });
    haloOuter.data.currentScale = 1;
    root.addChild(haloOuter);

    const haloInner = new scope.Path.Circle({
      center,
      radius: Math.min(width, height) * 0.09,
      strokeWidth: 1.8,
      strokeColor: alpha(scope, tokens.signal, 0.28),
    });
    haloInner.data.currentScale = 1;
    root.addChild(haloInner);

    const nodeSymbol = buildNodeSymbol(scope, tokens);
    const nodeGroup = new scope.Group();
    const nodeAnchors = [
      new scope.Point(width * 0.16, height * 0.26),
      new scope.Point(width * 0.5, height * 0.15),
      new scope.Point(width * 0.84, height * 0.28),
      new scope.Point(width * 0.76, height * 0.72),
      new scope.Point(width * 0.34, height * 0.78),
      new scope.Point(width * 0.7, height * 0.48),
    ];
    const nodes = nodeAnchors.map((point, index) => {
      const item = nodeSymbol.place(point);
      item.data.basePoint = point.clone();
      item.data.phase = index / nodeAnchors.length;
      nodeGroup.addChild(item);
      return item;
    });
    root.addChild(nodeGroup);

    const underline = new scope.Path({
      strokeWidth: 3.6,
      strokeCap: "round",
      strokeColor: alpha(scope, tokens.signal, 0.72),
    });
    underline.add(new scope.Point(width * 0.18, height * 0.84));
    underline.add(new scope.Point(width * 0.28, height * 0.86));
    underline.add(new scope.Point(width * 0.44, height * 0.82));
    underline.smooth({ type: "continuous" });
    root.addChild(underline);

    return {
      root,
      center,
      frame,
      rails,
      orbit,
      signal,
      ladderBars,
      haloOuter,
      haloInner,
      nodes,
      underline,
    };
  }

  function recolor(scope, stage, tokens) {
    stage.frame.strokeColor = alpha(scope, tokens.frame, 0.28);
    stage.orbit.strokeColor = alpha(scope, tokens.orbit, 0.42);
    stage.signal.strokeColor = alpha(scope, tokens.signal, 0.64);
    stage.haloOuter.strokeColor = alpha(scope, tokens.halo, 0.18);
    stage.haloInner.strokeColor = alpha(scope, tokens.signal, 0.28);
    stage.underline.strokeColor = alpha(scope, tokens.signal, 0.72);
    stage.rails.forEach((rail, index) => {
      rail.strokeColor = alpha(scope, tokens.rail, 0.16 + index * 0.02);
    });
    stage.ladderBars.forEach((bar) => {
      bar.strokeColor = alpha(scope, tokens.barStroke, 0.22);
      bar.fillColor = alpha(scope, tokens.barFill, 0.06);
    });
    stage.nodes.forEach((node) => {
      const seed = node.definition && node.definition.item;
      if (!seed || !seed.children || seed.children.length < 2) return;
      seed.children[0].fillColor = alpha(scope, tokens.nodeFill, 0.9);
      seed.children[1].strokeColor = alpha(scope, tokens.nodeStroke, 0.34);
    });
  }

  function mount(options) {
    if (!window.paper) return null;
    const canvas = document.querySelector((options && options.canvasSelector) || "#paper-hero-stage");
    if (!canvas) return null;

    const scope = new window.paper.PaperScope();
    scope.setup(canvas);

    const state = {
      focus: (options && options.initialFocus) || "appointments",
      sceneIntensity: 0.18,
      audioProgress: 0,
      pointer: null,
      pointerTarget: null,
      destroyed: false,
      reducedMotion: window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      stage: null,
    };

    function currentTokens() {
      return FOCUS_TOKENS[state.focus] || FOCUS_TOKENS.appointments;
    }

    function resizeCanvas() {
      const parentBox = canvas.parentElement
        ? canvas.parentElement.getBoundingClientRect()
        : { width: canvas.clientWidth || 640, height: canvas.clientHeight || 480 };
      const width = Math.max(Math.round(parentBox.width || 640), 1);
      const height = Math.max(Math.round(parentBox.height || 480), 1);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      scope.view.viewSize = new scope.Size(width, height);
      scope.project.clear();
      state.stage = buildComposition(scope, scope.view.viewSize, currentTokens());
      recolor(scope, state.stage, currentTokens());
      state.pointer = state.stage.center.clone();
      state.pointerTarget = state.stage.center.clone();
    }

    function onFocusChange(event) {
      state.focus = (event && event.detail && event.detail.focus) || "appointments";
      if (state.stage) recolor(scope, state.stage, currentTokens());
    }

    function onSceneChange(event) {
      const detail = (event && event.detail) || {};
      state.sceneIntensity = SCENE_INTENSITY[detail.scene] || 0.18;
      state.audioProgress = clamp(Number(detail.progress || 0), 0, 1);
    }

    function animationFrame(event) {
      if (state.destroyed || !state.stage) return;
      const pointerStep = state.pointerTarget.subtract(state.pointer).multiply(0.08);
      state.pointer = state.pointer.add(pointerStep);

      const rect = canvas.getBoundingClientRect();
      const viewport = Math.max(window.innerHeight || 1, 1);
      const centerDelta = Math.abs(rect.top + rect.height * 0.5 - viewport * 0.5);
      const visibility = clamp(1 - centerDelta / viewport, 0, 1);
      const motionEnergy = clamp(
        mix(state.sceneIntensity, state.audioProgress, 0.42) * 0.82 + visibility * 0.3,
        0.08,
        1
      );
      const pointerDriftX = (state.pointer.x - state.stage.center.x) * 0.018;
      const pointerDriftY = (state.pointer.y - state.stage.center.y) * 0.016;
      const time = event.time;

      state.stage.rails.forEach((rail, index) => {
        const drift = pointerDriftX * (index - 3.5);
        rail.position.x = rail.data.baseX + drift;
        rail.dashOffset = -time * (4 + index * 0.35) * (state.reducedMotion ? 0.08 : 1);
        rail.opacity = 0.08 + motionEnergy * 0.18 + (index % 2 ? 0.02 : 0);
      });

      state.stage.ladderBars.forEach((bar, index) => {
        const threshold = 0.16 + index * 0.17;
        const fill = clamp((motionEnergy - threshold) / 0.26, 0, 1);
        bar.fillColor.alpha = 0.04 + fill * 0.26;
        bar.strokeColor.alpha = 0.18 + fill * 0.54;
        bar.position.y = bar.data.baseY - Math.sin(time * 1.15 + index * 0.5) * (fill * 3 + 0.8);
      });

      state.stage.orbit.dashOffset = -time * (18 + motionEnergy * 12) * (state.reducedMotion ? 0.08 : 1);
      state.stage.orbit.opacity = 0.16 + motionEnergy * 0.36;
      state.stage.signal.dashOffset = -time * (24 + motionEnergy * 18) * (state.reducedMotion ? 0.08 : 1);
      state.stage.signal.opacity = 0.22 + motionEnergy * 0.5;
      state.stage.signal.position = new scope.Point(pointerDriftX * 0.24, pointerDriftY * 0.18);

      const outerScale = 0.94 + motionEnergy * 0.19 + Math.sin(time * 1.4) * (state.reducedMotion ? 0.002 : 0.015);
      const innerScale = 0.92 + motionEnergy * 0.12 + Math.cos(time * 2.1) * (state.reducedMotion ? 0.002 : 0.02);
      setScale(state.stage.haloOuter, outerScale, state.stage.center);
      setScale(state.stage.haloInner, innerScale, state.stage.center);
      state.stage.haloOuter.position = state.stage.center.add(new scope.Point(pointerDriftX * 0.18, pointerDriftY * 0.12));
      state.stage.haloInner.position = state.stage.center.add(new scope.Point(pointerDriftX * 0.26, pointerDriftY * 0.18));

      state.stage.nodes.forEach((node, index) => {
        const wave = Math.sin(time * 1.6 + index * 0.8);
        const yShift = wave * (state.reducedMotion ? 0.6 : 2.4);
        node.position = node.data.basePoint.add(new scope.Point(pointerDriftX * 0.08, yShift));
        const nodeEnergy = clamp(motionEnergy + node.data.phase * 0.14, 0, 1);
        node.opacity = 0.38 + nodeEnergy * 0.54;
      });

      state.stage.underline.opacity = 0.3 + motionEnergy * 0.5;
      state.stage.underline.dashOffset = -time * 10 * (state.reducedMotion ? 0.04 : 1);
      state.stage.root.position = new scope.Point(pointerDriftX * 0.18, pointerDriftY * 0.12);
    }

    const tool = new scope.Tool();
    tool.onMouseMove = function (event) {
      state.pointerTarget = event.point.clone();
    };

    canvas.addEventListener("mouseleave", function () {
      if (state.stage) state.pointerTarget = state.stage.center.clone();
    });

    const onResize = function () {
      resizeCanvas();
    };
    const resizeObserver =
      window.ResizeObserver && canvas.parentElement
        ? new window.ResizeObserver(function () {
            resizeCanvas();
          })
        : null;

    window.addEventListener("resize", onResize);
    window.addEventListener("sharpe-focus-change", onFocusChange);
    window.addEventListener("sharpe-scene-change", onSceneChange);
    window.addEventListener("load", onResize);
    if (resizeObserver) resizeObserver.observe(canvas.parentElement);

    resizeCanvas();
    scope.view.onFrame = animationFrame;

    return {
      destroy: function () {
        state.destroyed = true;
        window.removeEventListener("resize", onResize);
        window.removeEventListener("load", onResize);
        window.removeEventListener("sharpe-focus-change", onFocusChange);
        window.removeEventListener("sharpe-scene-change", onSceneChange);
        if (resizeObserver) resizeObserver.disconnect();
        scope.project.clear();
        scope.remove();
      },
      principles: DIRECTOR_PRINCIPLES.slice(),
    };
  }

  window.PaperDirector = {
    mount,
    principles: DIRECTOR_PRINCIPLES.slice(),
  };
})();
