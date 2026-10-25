// The working models on the Starchitect site: the dashboard, the client report and the
// site app share one project, so ticking a task or taking a photo shows up in all three.
(function () {
  // The RIBA Plan of Work 2020 template, as seeded by RIBA2020Seeder, with the plain
  // name the client sees for each stage
  const STAGES = [
    { riba: "Strategic Definition", plain: "Getting started",
      desc: "Determine the best means of achieving the client's requirements.",
      tasks: ["Prepare client requirements", "Review project risks", "Review project budget", "Ratify the option that best delivers the client's requirements", "Review feedback from previous projects", "Undertake site appraisals", "Strategic appraisal of planning considerations", "Appoint client team"] },
    { riba: "Preparation and Briefing", plain: "Brief and survey",
      desc: "Develop the detail of the brief, making sure it can be accommodated on the site.",
      tasks: [["Prepare project brief", "Including project outcomes, sustainability outcomes, quality aspirations and spatial requirements"], "Undertake feasibility studies", "Agree project budget", ["Source site information", "Including site surveys"], "Prepare project programme", "Prepare project execution plan", "Source pre-application planning advice", "Initiate collation of health and safety pre-construction information", "Appoint design team"] },
    { riba: "Concept Design", plain: "First designs",
      desc: "Refine the design concept so the look and feel of the project is in line with the client's brief, vision and budget.",
      tasks: ["Prepare architectural concept", "Agree project brief derogations", "Undertake design reviews with client and project stakeholders", "Prepare stage design programme", "Obtain pre-application planning advice", "Agree route to building regulations compliance", "Submit outline planning application", "Appoint contractor"] },
    { riba: "Spatial Coordination", plain: "Detailed designs",
      desc: "Develop the design to be dimensionally correct and coordinated, so the planning application rests on accurate information.",
      tasks: ["Undertake design studies, engineering analysis and cost exercises", "Initiate change control procedures", "Prepare stage design programme", "Review design against building regulations", "Prepare and submit planning application"] },
    { riba: "Technical Design", plain: "Construction drawings",
      desc: "Develop the information required to manufacture and construct the building.",
      tasks: ["Develop architectural and engineering technical design", "Prepare and coordinate design team building systems information", "Prepare and integrate specialist subcontractor building systems information", "Prepare stage design programme", "Submit building regulations application", "Discharge pre-commencement planning conditions", "Prepare construction phase plan", "Submit form F10 to HSE"] },
    { riba: "Manufacturing and Construction", plain: "Building work",
      desc: "Construction of the building, in line with the designs finalised in the previous stages.",
      tasks: ["Finalise site logistics", "Manufacture building systems and construct building", "Inspect construction quality", "Undertake commissioning of building", "Prepare building manual", "Carry out construction phase plan"] },
    { riba: "Handover", plain: "Handover",
      desc: "The building is handed over to the client following inspection.",
      tasks: ["Hand over building in line with plan for use strategy", "Undertake review of project performance", "Undertake seasonal commissioning", "Rectify defects", ["Complete initial aftercare tasks", "Including light-touch post-occupancy evaluation"]] },
    { riba: "Use", plain: "Living in it",
      desc: "The completed project is evaluated after occupation and reviewed alongside any ongoing services.",
      tasks: ["Implement facilities management and asset management", "Undertake post-occupancy evaluation of building performance in use", ["Verify project outcomes", "Including sustainability outcomes"]] }
  ];
  const CURRENT = 5;
  const done = STAGES.map((s, i) => s.tasks.map((_, j) => i < CURRENT || (i === CURRENT && (j === 0 || j === 2))));
  let selected = CURRENT;

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const countDone = (i) => done[i].filter(Boolean).length;

  // ---------- Dashboard ----------

  const stateOf = (i) => (i < CURRENT ? "done" : i === CURRENT ? "current" : "upcoming");
  const STATE_LABEL = { done: "Done", current: "Now", upcoming: "Next" };

  function renderRail() {
    $("rail").innerHTML = STAGES.map((s, i) => {
      const st = stateOf(i);
      const pct = Math.round(countDone(i) / s.tasks.length * 100);
      return `<li><button type="button" class="stage is-${st}" data-i="${i}" aria-pressed="${i === selected}">
        <span class="stage-top"><span class="stage-n">${i}</span><span class="stage-state">${STATE_LABEL[st]}</span></span>
        <span class="stage-t">${esc(s.riba)}</span>
        <span class="stage-bar"><i style="width:${pct}%"></i></span>
      </button></li>`;
    }).join("");
  }

  function renderTasks() {
    const s = STAGES[selected];
    $("stage-title").textContent = `Stage ${selected} · ${s.riba}`;
    $("stage-desc").textContent = s.desc;
    $("stage-count").textContent = `${countDone(selected)} of ${s.tasks.length} tasks done`;
    $("task-list").innerHTML = s.tasks.map((t, j) => {
      const [title, note] = Array.isArray(t) ? t : [t, ""];
      const id = `task-${selected}-${j}`;
      return `<li><label for="${id}"><input type="checkbox" id="${id}" data-j="${j}" ${done[selected][j] ? "checked" : ""}>
        <span>${esc(title)}${note ? `<small>${esc(note)}</small>` : ""}</span></label></li>`;
    }).join("");
  }

  $("rail").addEventListener("click", (e) => {
    const b = e.target.closest(".stage");
    if (!b) return;
    selected = Number(b.dataset.i);
    renderRail();
    renderTasks();
  });
  $("task-list").addEventListener("change", (e) => {
    const box = e.target.closest("input[type=checkbox]");
    if (!box) return;
    done[selected][Number(box.dataset.j)] = box.checked;
    $("stage-count").textContent = `${countDone(selected)} of ${STAGES[selected].tasks.length} tasks done`;
    renderRail();
    if (selected === CURRENT) {
      renderReportStage();
      if (box.checked) stamp();
    }
  });

  // The table of stages in "The dashboard"
  $("stage-table").innerHTML = STAGES.map((s, i) =>
    `<tr><td class="num">${i}</td><td>${esc(s.riba)}</td><td>${esc(s.plain)}</td><td class="num">${s.tasks.length}</td></tr>`).join("");

  // ---------- Client report ----------

  function renderReportStage() {
    const s = STAGES[CURRENT];
    const n = countDone(CURRENT), total = s.tasks.length;
    $("portal-stage-name").textContent = s.plain;
    $("portal-stage-count").textContent = `Stage ${CURRENT} of 7 · ${n} of ${total} milestones done`;
    $("segs").innerHTML = STAGES.map((st, i) => {
      const cls = i < CURRENT ? "done" : i === CURRENT ? "now" : "";
      const p = i === CURRENT ? ` style="--p:${Math.max(6, Math.round(n / total * 100))}%"` : "";
      return `<div class="seg ${cls}"${p}><i></i><span>${esc(st.plain)}</span></div>`;
    }).join("");
  }

  document.querySelectorAll(".choice").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".choice").forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      $("decision-status").textContent = `Thanks. Ellen can see you chose ${btn.dataset.choice}.`;
      $("dash-decision").textContent = `Chose ${btn.dataset.choice}`;
    });
  });

  // ---------- Photos ----------

  const KINDS = {
    roof: "Extension roof, felt and battens",
    scaffold: "Scaffold to rear elevation",
    brick: "New brickwork, rear wall",
    joists: "Loft floor joists",
    block: "Blockwork inner leaf",
    steel: "Steel beam over rear opening"
  };
  const SHORT = { roof: "Extension roof", scaffold: "Rear scaffold", brick: "Rear brickwork", joists: "Loft joists", block: "Blockwork", steel: "Rear opening" };
  const CYCLE = ["roof", "scaffold", "brick", "joists", "block", "steel"];
  const photos = [
    { id: "IMG_4093", k: "block", t: "Thu 23 Oct" },
    { id: "IMG_4091", k: "steel", t: "Tue 21 Oct" },
    { id: "IMG_4088", k: "brick", t: "Tue 21 Oct" },
    { id: "IMG_4072", k: "joists", t: "Fri 17 Oct" },
    { id: "IMG_4069", k: "scaffold", t: "Fri 17 Oct" },
    { id: "IMG_4051", k: "roof", t: "Mon 13 Oct" }
  ];
  let totalPhotos = 38;
  let freshId = null;

  function tile(p, caption) {
    const isNew = p.id === freshId ? " is-new" : "";
    return `<figure class="ph${isNew}" data-k="${p.k}" role="img" aria-label="${esc(KINDS[p.k])}"><figcaption>${esc(caption)}</figcaption></figure>`;
  }
  function renderPhotos() {
    const latest = photos.slice(0, 6);
    $("dash-photos").innerHTML = latest.map((p) => tile(p, p.id)).join("");
    $("portal-photos").innerHTML = latest.map((p) => tile(p, `${KINDS[p.k]} · ${p.t}`)).join("");
    $("dash-photo-count").textContent = `${totalPhotos} photos`;
  }

  // The models all take place on Thursday 23 October, on a clock that moves on a
  // minute for each photo
  let minutes = 14 * 60 + 2;
  const hhmm = () => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  function stamp() {
    const when = `Thu 23 Oct, ${hhmm()}`;
    $("portal-updated").textContent = `Updated ${when}`;
    $("dash-updated").textContent = when;
  }

  // ---------- Site app ----------

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const queue = [
    { id: "IMG_4091", k: "steel", p: 100 },
    { id: "IMG_4093", k: "block", p: 100 }
  ];
  let next = 0, seq = 4101;

  function renderQueue() {
    $("queue").innerHTML = queue.slice(-5).map((q) =>
      `<div class="qitem${q.p >= 100 ? " done" : ""}"><div class="ph" data-k="${q.k}"></div><div class="qbar"><i style="width:${q.p}%"></i></div></div>`).join("");
    const pending = queue.filter((q) => q.p < 100).length;
    $("queue-text").textContent = pending ? `Uploading ${pending} photo${pending > 1 ? "s" : ""}…` : "All photos synced";
  }
  function setViewfinder() {
    const k = CYCLE[next % CYCLE.length];
    $("viewfinder").dataset.k = k;
    $("vf-label").textContent = SHORT[k];
  }

  function arrive(item) {
    photos.unshift({ id: item.id, k: item.k, t: "Thu 23 Oct" });
    totalPhotos += 1;
    freshId = item.id;
    renderPhotos();
    stamp();
    const li = document.createElement("li");
    li.className = "fresh";
    li.innerHTML = `<time>Thu 23 Oct ${hhmm()}</time><span>${item.id} → <strong>Rowan House › Stage 5</strong><span class="ok">Added to the dashboard and the client report</span></span>`;
    const log = $("log");
    log.querySelectorAll(".fresh").forEach((el) => el.classList.remove("fresh"));
    log.prepend(li);
  }

  $("shutter").addEventListener("click", () => {
    const item = { id: `IMG_${seq++}`, k: CYCLE[next % CYCLE.length], p: 0 };
    next += 1;
    minutes += 1;
    $("phone-clock").textContent = hhmm();
    const f = $("flash");
    f.classList.remove("go"); void f.offsetWidth; f.classList.add("go");
    queue.push(item);
    setViewfinder();
    renderQueue();
    if (reduce) { item.p = 100; renderQueue(); arrive(item); return; }
    const timer = setInterval(() => {
      item.p = Math.min(100, item.p + 9 + Math.random() * 8);
      renderQueue();
      if (item.p >= 100) { clearInterval(timer); arrive(item); }
    }, 110);
  });

  renderRail();
  renderTasks();
  renderReportStage();
  renderPhotos();
  renderQueue();
  setViewfinder();
})();
