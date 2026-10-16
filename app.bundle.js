(() => {
  // dist/engine.js
  var CAPABILITIES = [
    "Research",
    "Market Intelligence",
    "Code Generation",
    "Data Analysis",
    "Summarization",
    "Classification",
    "Web Intelligence",
    "Document Processing",
    "Image Analysis",
    "Monitoring",
    "Translation",
    "Reasoning"
  ];
  var CATEGORIES = [
    "Research",
    "Code",
    "Analysis",
    "Market Intelligence",
    "Summarization",
    "Classification"
  ];
  var CAPABILITY = {
    Research: "Research",
    Code: "Code Generation",
    Analysis: "Data Analysis",
    "Market Intelligence": "Market Intelligence",
    Summarization: "Summarization",
    Classification: "Classification"
  };
  var TERMINAL = ["Complete", "Failed", "Cancelled", "Interrupted"];
  var STAGES = [
    "Analyzing task",
    "Scanning available agents",
    "Matching capabilities",
    "Evaluating latency",
    "Agent selected",
    "Dispatching",
    "Executing",
    "Verifying output",
    "Complete"
  ];
  var STORAGE_KEY = "idle-devnet-v2";
  var SEEDS = [
    ["Atlas-R2", "Research", "Reasoning", 1, 8, "Claude Sonnet 4.5", 42],
    ["Vector-03", "Data Analysis", "Classification", 2, 8, "GPT-4.1", 68],
    ["Relay-8", "Code Generation", "Reasoning", 4, 4, "Qwen3-Coder", 38],
    [
      "IDLE-R17",
      "Summarization",
      "Document Processing",
      0,
      4,
      "Llama 3.3 70B",
      51
    ],
    ["Scout-7", "Web Intelligence", "Research", 1, 8, "Gemini 2.5 Pro", 57],
    ["Cipher-12", "Classification", "Reasoning", 0, 4, "Mistral Medium", 31],
    ["Node-41", "Monitoring", "Data Analysis", 3, 8, "Python / FastAPI", 23],
    [
      "Helix-09",
      "Market Intelligence",
      "Research",
      1,
      8,
      "Claude Sonnet 4.5",
      46
    ],
    ["Tensor-6", "Image Analysis", "Classification", 4, 4, "Qwen2.5-VL", 74],
    ["Parse-14", "Document Processing", "Summarization", 1, 8, "GPT-4.1", 62],
    ["Nexus-R4", "Research", "Web Intelligence", 0, 4, "Gemini 2.5 Pro", 49],
    ["Delta-22", "Code Generation", "Data Analysis", 1, 8, "DeepSeek V3", 53],
    ["Lexicon-5", "Translation", "Summarization", 0, 4, "Mistral Medium", 41],
    ["Watch-11", "Monitoring", "Web Intelligence", 4, 4, "Python / FastAPI", 29],
    ["Logic-R8", "Reasoning", "Code Generation", 2, 8, "Qwen3 235B", 65],
    ["Flux-16", "Market Intelligence", "Monitoring", 0, 4, "GPT-4.1", 39],
    [
      "Index-02",
      "Classification",
      "Document Processing",
      0,
      4,
      "Llama 3.3 70B",
      35
    ],
    ["Prism-18", "Image Analysis", "Data Analysis", 0, 4, "Qwen2.5-VL", 91],
    ["Orbit-31", "Translation", "Research", 2, 8, "Gemini 2.5 Flash", 44],
    ["Kernel-7", "Code Generation", "Reasoning", 4, 4, "DeepSeek V3", 58]
  ];
  function seedAgents(now) {
    return SEEDS.map((s, i) => {
      const completed = 1842 + i * 437;
      return {
        id: `agt_${(817 + i * 137).toString(16).padStart(6, "0")}`,
        name: s[0],
        caps: [s[1], s[2]],
        backgroundSlots: s[3],
        concurrent: s[4],
        online: i !== 17,
        model: s[5],
        latency: s[6],
        baseCompleted: completed,
        baseFailed: Math.round(completed * (1 / (0.998 - i % 4 * 1e-3) - 1)),
        endpoint: `${s[0].toLowerCase()}.devnet.idle`,
        registered: false,
        lastSeen: now,
        registeredAt: now
      };
    });
  }
  var finite = (n) => typeof n === "number" && Number.isFinite(n);
  function validAgent(a) {
    return a && typeof a.id === "string" && typeof a.name === "string" && a.name.trim().length > 0 && a.name.length <= 40 && typeof a.endpoint === "string" && typeof a.model === "string" && Array.isArray(a.caps) && a.caps.length && a.caps.every((c) => CAPABILITIES.includes(c)) && Number.isInteger(a.concurrent) && a.concurrent >= 1 && a.concurrent <= 64 && Number.isInteger(a.backgroundSlots) && a.backgroundSlots >= 0 && a.backgroundSlots <= a.concurrent && typeof a.online === "boolean" && finite(a.latency) && a.latency > 0 && Number.isInteger(a.baseCompleted) && a.baseCompleted >= 0 && Number.isInteger(a.baseFailed) && a.baseFailed >= 0 && finite(a.lastSeen) && finite(a.registeredAt);
  }
  function validTask(t, agents2) {
    return t && typeof t.id === "string" && typeof t.prompt === "string" && t.prompt.length <= 3e3 && CATEGORIES.includes(t.category) && ["Normal", "High", "Low"].includes(t.priority) && [
      "Routing",
      "Selected",
      "Queued",
      "Executing",
      "Verifying",
      ...TERMINAL
    ].includes(t.status) && finite(t.createdAt) && (!t.agentId || agents2.some((a) => a.id === t.agentId)) && Array.isArray(t.logs) && t.logs.every((l) => l && finite(l.at) && typeof l.text === "string") && (!t.durations || Object.values(t.durations).every((n) => finite(n) && n >= 0)) && (!t.selection || finite(t.selection.score) && finite(t.selection.free) && finite(t.selection.concurrent) && finite(t.selection.latency) && (t.selection.success == null || finite(t.selection.success))) && (!t.output || validOutput(t.output, t));
  }
  function validOutput(o, t) {
    return o && o.kind === "fixture" && o.category === t.category && o.prompt === t.prompt && typeof o.title === "string" && o.title.length > 0 && finite(o.createdAt) && (Array.isArray(o.paragraphs) && o.paragraphs.every((p) => typeof p === "string") || typeof o.code === "string");
  }
  var waitDefault = (ms, signal) => new Promise((resolve, reject) => {
    const handle = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, ms);
    const abort = () => {
      clearTimeout(handle);
      reject(new Error("Cancelled"));
    };
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
  });
  function createSimulation(options = {}) {
    const now = options.now || Date.now, wait = options.wait || waitDefault, storage2 = options.storage;
    const listeners = /* @__PURE__ */ new Set();
    let telemetryTick = 0;
    let running = null, registrationBusy = false, persistenceWarning = storage2 ? "" : "Browser storage is unavailable. Changes last for this tab only.", recovered = 0;
    let state = {
      version: 2,
      agents: seedAgents(now()),
      tasks: [],
      events: [],
      samples: []
    };
    const fresh = () => ({
      version: 2,
      agents: seedAgents(now()),
      tasks: [],
      events: [],
      samples: []
    });
    function readSaved() {
      try {
        const raw = storage2?.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved.version !== 2 || !Array.isArray(saved.agents) || !saved.agents.length || !saved.agents.every(validAgent) || new Set(saved.agents.map((a) => a.id)).size !== saved.agents.length || !Array.isArray(saved.tasks) || !saved.tasks.every((t) => validTask(t, saved.agents)))
            throw Error("Invalid snapshot");
          state = {
            ...saved,
            events: Array.isArray(saved.events) ? saved.events.filter((e) => typeof e.text === "string" && finite(e.at)).slice(0, 100) : [],
            samples: Array.isArray(saved.samples) ? saved.samples.filter(
              (s) => finite(s.at) && finite(s.util) && s.util >= 0 && s.util <= 100
            ).slice(-720) : []
          };
          return;
        }
        const old = JSON.parse(storage2?.getItem("idle-devnet-v1") || "null");
        if (!old) return;
        if (!Array.isArray(old.agents) || !Array.isArray(old.tasks))
          throw Error("Invalid legacy snapshot");
        state.agents = old.agents.map((a) => {
          const seeded = state.agents.find((b) => b.id === a.id);
          if (seeded) return { ...seeded };
          return {
            id: a.id,
            name: a.name,
            caps: a.caps,
            endpoint: a.endpoint,
            model: a.model,
            concurrent: a.concurrent,
            backgroundSlots: 0,
            online: a.status !== "Offline",
            baseCompleted: 0,
            baseFailed: 0,
            latency: a.latency || 37,
            registered: true,
            registeredAt: now(),
            lastSeen: now()
          };
        });
        if (!state.agents.length || !state.agents.every(validAgent))
          throw Error("Invalid legacy agents");
        state.tasks = old.tasks.map((t) => ({
          ...t,
          createdAt: Date.parse(t.timestamp),
          endedAt: t.status === "Complete" ? Date.parse(t.timestamp) + Math.round(parseFloat(t.totalTime || 0) * 1e3) : now(),
          dispatchedAt: ["Complete", "Executing"].includes(t.status) ? Date.parse(t.timestamp) : null,
          status: t.status === "Complete" ? "Complete" : "Interrupted",
          stage: t.status === "Complete" ? 8 : 0,
          logs: [],
          legacy: true,
          output: null,
          error: t.status === "Complete" ? null : "The previous tab closed before execution finished."
        })).filter((t) => validTask(t, state.agents));
      } catch {
        state = fresh();
        persistenceWarning = "Saved demo data was unreadable. A fresh fixture was loaded.";
      }
    }
    readSaved();
    for (const t of state.tasks) {
      if (!TERMINAL.includes(t.status)) {
        t.status = "Interrupted";
        t.endedAt = t.updatedAt || now();
        t.reserved = false;
        delete t.pendingOutput;
        t.error = "The tab closed before execution finished. The reserved slot was released; retry to start a new trace.";
        t.logs = t.logs || [];
        t.logs.push({ at: now(), text: t.error });
        t.durations = timings(t);
        recovered++;
      }
    }
    function persist() {
      try {
        storage2?.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        persistenceWarning = "Browser storage is unavailable. Changes last for this tab only.";
      }
    }
    function emit(kind = "state") {
      persist();
      for (const callback of listeners) callback(kind);
    }
    function occupied(a) {
      return a.backgroundSlots + state.tasks.filter(
        (t) => t.agentId === a.id && t.reserved && !TERMINAL.includes(t.status)
      ).length;
    }
    function status2(a) {
      if (!a.online) return "Offline";
      const n = occupied(a);
      return n === 0 ? "Idle" : n >= a.concurrent ? "Busy" : "Available";
    }
    function stats(a) {
      const local = state.tasks.filter((t) => t.agentId === a.id);
      const completed = a.baseCompleted + local.filter((t) => t.status === "Complete").length;
      const failed = a.baseFailed + local.filter((t) => t.status === "Failed" && t.dispatchedAt != null).length;
      const n = occupied(a);
      return {
        ...a,
        status: status2(a),
        occupied: n,
        free: a.online ? Math.max(0, a.concurrent - n) : 0,
        util: a.online ? Math.round(n / a.concurrent * 100) : null,
        completed,
        failed,
        success: completed + failed ? completed / (completed + failed) * 100 : null
      };
    }
    function agents2() {
      return state.agents.map(stats);
    }
    function compatible(category) {
      return agents2().filter(
        (a) => a.free > 0 && a.caps.includes(CAPABILITY[category])
      );
    }
    function routingScore(a) {
      return Math.round(
        100 * (0.6 * a.free / a.concurrent + 0.25 * Math.max(0, 1 - a.latency / 200) + 0.15 * (a.success == null ? 0.5 : a.success / 100))
      );
    }
    function rank(category) {
      return compatible(category).map((a) => ({ ...a, routingScore: routingScore(a) })).sort(
        (a, b) => b.routingScore - a.routingScore || a.latency - b.latency || a.id.localeCompare(b.id)
      );
    }
    function metrics() {
      const all = agents2(), online = all.filter((a) => a.online), slots = online.reduce((s, a) => s + a.concurrent, 0), used = online.reduce((s, a) => s + a.occupied, 0), completed = all.reduce((s, a) => s + a.completed, 0), failed = all.reduce((s, a) => s + a.failed, 0);
      const routed = all.reduce((s, a) => s + a.baseCompleted + a.baseFailed, 0) + state.tasks.filter((t) => t.dispatchedAt != null).length;
      const local = state.tasks.filter(
        (t) => !t.legacy && t.selectedAt != null && t.durations?.routing != null
      );
      const executions = state.tasks.filter(
        (t) => t.status === "Complete" && !t.legacy && t.durations?.execution != null
      );
      return {
        available: all.filter((a) => a.free > 0).length,
        total: all.length,
        online: online.length,
        active: online.filter((a) => a.occupied > 0).length,
        idle: online.filter((a) => a.occupied === 0).length,
        slots,
        used,
        free: slots - used,
        utilization: slots ? Math.round(100 * used / slots) : 0,
        idleScore: slots ? 100 - Math.round(100 * used / slots) : 0,
        completed,
        failed,
        routed,
        success: completed + failed ? 100 * completed / (completed + failed) : null,
        avgRouting: local.length ? local.reduce((s, t) => s + t.durations.routing, 0) / local.length : null,
        avgExecution: executions.length ? executions.reduce((s, t) => s + t.durations.execution, 0) / executions.length : null,
        localRuns: local.length
      };
    }
    function sample() {
      const m = metrics();
      state.samples.push({ at: now(), util: m.utilization });
      state.samples = state.samples.slice(-720);
    }
    function event(text, type = "network", taskId = null) {
      state.events.unshift({
        id: crypto.randomUUID(),
        at: now(),
        text,
        type,
        taskId
      });
      state.events = state.events.slice(0, 100);
    }
    function log(t, text) {
      t.logs.push({ at: now(), text });
      t.logs = t.logs.slice(-50);
    }
    if (!state.events.length) {
      event(
        `Registry loaded \xB7 ${metrics().online}/${metrics().total} agents online`
      );
      for (const a of agents2().slice(0, 4))
        event(
          `${a.name} \xB7 ${a.occupied}/${a.concurrent} slots occupied \xB7 ${a.latency}ms fixture RTT`
        );
    }
    if (recovered)
      event(
        `${recovered} unfinished execution${recovered === 1 ? "" : "s"} recovered as interrupted`,
        "error"
      );
    sample();
    persist();
    function makeOutput(t) {
      const m = metrics();
      const shared = {
        kind: "fixture",
        category: t.category,
        prompt: t.prompt,
        agent: t.agentName,
        createdAt: now()
      };
      const bodies = {
        Research: {
          title: "Orchestration research brief",
          paragraphs: [
            "A shared control plane separates task intake and agent discovery from execution. Agents remain independently deployed; the router selects an eligible execution endpoint.",
            "This fixture illustrates a research response. No sources were fetched or model inference performed."
          ],
          bullets: [
            "Register declared capabilities and concurrency limits.",
            "Filter unhealthy or full agents before comparing routing scores.",
            "Retain dispatch acknowledgments, results, and failure traces."
          ]
        },
        Code: {
          title: "Capability-aware routing \xB7 Python",
          code: 'def select_agent(agents, capability):\n    eligible = [a for a in agents\n                if a["online"]\n                and capability in a["capabilities"]\n                and a["free_slots"] > 0]\n    if not eligible:\n        raise ValueError("No eligible capacity")\n\n    def score(a):\n        capacity = a["free_slots"] / a["max_concurrency"]\n        latency = max(0, 1 - a["rtt_ms"] / 200)\n        reliability = a.get("success_rate", 0.5)\n        return round(100 * (0.6 * capacity +\n                            0.25 * latency +\n                            0.15 * reliability))\n\n    return sorted(eligible, key=lambda a:\n        (-score(a), a["rtt_ms"], a["id"]))[0]',
          paragraphs: [
            "This fixture matches the demo ranking policy. It omits the atomic slot reservation and dispatch acknowledgment that a production implementation requires."
          ]
        },
        Analysis: {
          title: "Capacity snapshot",
          paragraphs: [
            `At output receipt, ${m.online} online agents exposed ${m.slots} concurrency slots. ${m.used} were occupied and ${m.free} were free (${m.idleScore}% available capacity).`,
            "This saved snapshot uses the local simulation registry, rather than external data or a model analysis."
          ],
          bullets: [
            `${m.available} agents had free slots; ${m.idle} had no occupied slots.`,
            "Capacity is weighted by concurrency limit, so larger agents contribute proportionally.",
            "Offline agents contribute no available capacity."
          ]
        },
        "Market Intelligence": {
          title: "Market intelligence framework",
          paragraphs: [
            "This sample frames infrastructure demand around orchestration, observability, and interoperability. It contains no live market data or investment conclusions."
          ],
          bullets: [
            "Evaluate demand using repeated task submission and agent retention.",
            "Compare coordination costs with dispatch success and saved operator time.",
            "Validate payment preferences before introducing token settlement."
          ]
        },
        Summarization: {
          title: "Summarization response fixture",
          paragraphs: [
            `The submitted instruction contains ${t.prompt.trim().split(/\s+/).length} words. No document or attachment was retrieved. A real summarization adapter would require the source text or an accessible document reference.`
          ],
          bullets: [
            "Extract the central claim and supporting context.",
            "Preserve decisions and action items.",
            "Return the condensed text alongside the source reference."
          ]
        },
        Classification: {
          title: "Classification response fixture",
          code: JSON.stringify(
            {
              label: "task_request",
              basis: "illustrative_fixture",
              confidence: null,
              language: null,
              review_required: true
            },
            null,
            2
          ),
          paragraphs: [
            "The label is a response-shape example, not an inferred classification of your input. No classifier ran; confidence and language are therefore unknown."
          ]
        }
      };
      return { ...shared, ...bodies[t.category], snapshot: m };
    }
    function timings(t) {
      const terminal2 = TERMINAL.includes(t.status), end = terminal2 ? t.endedAt : now(), origin = t.createdAt;
      const phases = [
        ["routing", origin, t.selectedAt],
        ["queue", t.selectedAt, t.executionStartedAt],
        ["execution", t.executionStartedAt, t.outputAt],
        ["verification", t.outputAt, t.endedAt]
      ];
      const d = {};
      for (const [key, start, finish] of phases) {
        if (start != null) d[key] = Math.max(0, (finish ?? end) - start);
      }
      d.total = Math.max(0, end - origin);
      return d;
    }
    function refresh(t, kind = "state") {
      t.updatedAt = now();
      t.durations = timings(t);
      sample();
      emit(kind);
    }
    function release(t) {
      t.reserved = false;
    }
    async function submit(input) {
      if (running)
        throw Error(
          "Finish or cancel the current task before submitting another."
        );
      if (typeof input?.prompt !== "string" || !input.prompt.trim() || input.prompt.length > 3e3)
        throw Error("Enter a task of 1\u20133,000 characters.");
      if (!CATEGORIES.includes(input.category))
        throw Error("Choose a supported task category.");
      if (!["Normal", "High", "Low"].includes(input.priority))
        throw Error("Choose a supported priority.");
      if (typeof input.auto !== "boolean")
        throw Error("Choose automatic or manual routing.");
      const outcome = input.outcome || "Successful run";
      if (!["Successful run", "Agent timeout", "Invalid response"].includes(outcome))
        throw Error("Choose a supported demo outcome.");
      if (!compatible(input.category).length)
        throw Error(
          "No compatible agent has a free slot. Bring an agent online or connect one with the required capability."
        );
      if (!input.auto && !compatible(input.category).some((a) => a.id === input.agent))
        throw Error("Choose an online, compatible agent with a free slot.");
      const controller = new AbortController();
      running = { controller, taskId: null };
      const t = {
        id: "TASK-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
        prompt: input.prompt.trim(),
        category: input.category,
        priority: input.priority,
        auto: input.auto,
        outcome,
        parentId: input.parentId || null,
        status: "Routing",
        createdAt: now(),
        stage: -1,
        logs: [],
        reserved: false,
        agentId: null,
        output: null
      };
      running.taskId = t.id;
      state.tasks.push(t);
      event(
        `${t.id} accepted \xB7 ${t.category} \xB7 ${t.priority.toLowerCase()} priority`,
        "route",
        t.id
      );
      refresh(t);
      try {
        const delays = [250, 400, 350, 350, 300, 0, 0, 550, 250];
        for (let i = 0; i < STAGES.length; i++) {
          if (i === 5) delays[i] = 150;
          if (i === 6)
            delays[i] = { High: 250, Normal: 650, Low: 1150 }[t.priority];
          await wait(delays[i], controller.signal);
          if (controller.signal.aborted) throw Error("Cancelled");
          t.stage = i;
          if (i === 0)
            log(
              t,
              `task accepted \xB7 required capability: ${CAPABILITY[t.category]}`
            );
          if (i === 1)
            log(t, `registry scan \xB7 ${metrics().online} online agents`);
          if (i === 2) {
            t.candidates = rank(t.category).map((a) => ({
              id: a.id,
              name: a.name,
              score: a.routingScore,
              free: a.free,
              concurrent: a.concurrent,
              latency: a.latency,
              success: a.success
            }));
            log(
              t,
              `${t.candidates.length} eligible agents with free concurrency slots`
            );
          }
          if (i === 3)
            log(
              t,
              "ranking policy: free capacity 60% \xB7 RTT 25% \xB7 historical success 15%"
            );
          if (i === 4) {
            const ranked = rank(t.category), a = t.auto ? ranked[0] : ranked.find((a2) => a2.id === input.agent);
            if (!a)
              throw Error(
                "Compatible capacity changed before selection. No slot was reserved; retry."
              );
            t.agentId = a.id;
            t.agentName = a.name;
            t.selection = {
              score: a.routingScore,
              free: a.free,
              concurrent: a.concurrent,
              latency: a.latency,
              success: a.success,
              policy: t.auto ? "capacity-rtt-reliability/v1" : "manual",
              reason: t.auto ? "Highest eligible routing score" : "Selected by you; eligibility validated"
            };
            t.candidates = ranked.map((a2) => ({
              id: a2.id,
              name: a2.name,
              score: a2.routingScore,
              free: a2.free,
              concurrent: a2.concurrent,
              latency: a2.latency,
              success: a2.success
            }));
            t.selectedAt = now();
            t.reserved = true;
            t.status = "Selected";
            log(
              t,
              `${a.name} selected \xB7 ${a.routingScore}/100 routing score \xB7 one slot reserved`
            );
            event(`${t.id} selected ${a.name} \xB7 slot reserved`, "route", t.id);
          }
          if (i === 5) {
            t.status = "Queued";
            t.dispatchedAt = now();
            log(
              t,
              `dispatch acknowledged \xB7 ${t.priority.toLowerCase()} priority admission delay`
            );
            event(`${t.id} dispatched to ${t.agentName}`, "route", t.id);
          }
          if (i === 6) {
            t.status = "Executing";
            t.executionStartedAt = now();
            log(t, "execution started \xB7 fixture adapter");
            refresh(t);
            await wait(1200 + t.prompt.length % 5 * 75, controller.signal);
            if (t.outcome === "Agent timeout")
              throw Error(
                "Agent response deadline exceeded in the timeout scenario. Slot released; no output received."
              );
            t.outputAt = now();
            t.status = "Verifying";
            t.pendingOutput = makeOutput(t);
            if (t.outcome === "Invalid response") delete t.pendingOutput.title;
            log(t, "fixture output received \xB7 validating response envelope");
          }
          if (i === 7) {
            if (!validOutput(t.pendingOutput, t))
              throw Error(
                "Output envelope failed schema validation: missing or invalid required fields. No verified result was accepted."
              );
            log(
              t,
              "schema validation passed \xB7 task ID, category, and output fields present"
            );
          }
          if (i === 8) {
            t.status = "Complete";
            t.endedAt = now();
            release(t);
            t.output = t.pendingOutput;
            delete t.pendingOutput;
            log(
              t,
              "complete \xB7 fixture envelope validated; content quality not evaluated"
            );
            const a = state.agents.find((a2) => a2.id === t.agentId);
            a.lastSeen = now();
            event(`${t.id} completed by ${t.agentName}`, "complete", t.id);
          }
          refresh(t);
        }
      } catch (error) {
        t.status = controller.signal.aborted ? "Cancelled" : "Failed";
        t.error = controller.signal.aborted ? "Cancelled by you. Any reserved slot was released." : error.message;
        t.endedAt = now();
        release(t);
        delete t.pendingOutput;
        log(t, t.error);
        event(`${t.id} ${t.status.toLowerCase()} \xB7 ${t.error}`, "error", t.id);
        refresh(t);
      } finally {
        running = null;
        emit("settled");
      }
      return t;
    }
    function cancel() {
      if (running) running.controller.abort();
    }
    function setOnline(id, online) {
      const a = state.agents.find((a2) => a2.id === id);
      if (!a) throw Error("Agent not found.");
      if (state.tasks.some(
        (t) => t.agentId === id && t.reserved && !TERMINAL.includes(t.status)
      ))
        throw Error(
          "This agent has a reserved task. Cancel or finish that task before changing availability."
        );
      a.online = online;
      a.availabilityPinned = true;
      delete a.temporaryOfflineUntil;
      a.lastSeen = now();
      event(
        `${a.name} ${online ? "brought online" : "set offline"} \xB7 ${online ? "declared capacity restored" : "excluded from routing"}`
      );
      sample();
      emit();
    }
    function validateRegistration(data) {
      if (!data || typeof data.name !== "string" || !data.name.trim() || data.name.length > 40)
        throw Error("Enter an agent name of 1\u201340 characters.");
      if (state.agents.some(
        (a) => a.name.toLowerCase() === data.name.trim().toLowerCase()
      ))
        throw Error("This agent name is already registered.");
      if (typeof data.endpoint !== "string" || data.endpoint.length > 120 || !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i.test(data.endpoint))
        throw Error(
          "Use an endpoint alias containing letters, numbers, dots, or hyphens."
        );
      if (state.agents.some(
        (a) => a.endpoint.toLowerCase() === data.endpoint.toLowerCase()
      ))
        throw Error("This endpoint alias is already registered.");
      if (!Array.isArray(data.caps) || !data.caps.length || data.caps.some((c) => !CAPABILITIES.includes(c)))
        throw Error("Select at least one supported capability.");
      if (!Number.isInteger(data.concurrent) || data.concurrent < 1 || data.concurrent > 64)
        throw Error("Concurrency must be a whole number from 1 to 64.");
      if (typeof data.model !== "string" || !data.model.trim() || data.model.length > 80)
        throw Error("Enter a runtime name of 1\u201380 characters.");
      if (!["Online", "Offline"].includes(data.availability))
        throw Error("Choose online or offline availability.");
    }
    async function register(data, onStep = () => {
    }) {
      if (registrationBusy)
        throw Error("An agent registration is already in progress.");
      validateRegistration(data);
      registrationBusy = true;
      emit("registration");
      try {
        for (let i = 0; i < 4; i++) {
          onStep(i);
          await new Promise(
            (r) => setTimeout(r, options.registrationDelay ?? 400)
          );
        }
        validateRegistration(data);
        const a = {
          id: "agt_" + crypto.randomUUID().slice(0, 8),
          name: data.name.trim(),
          caps: [...new Set(data.caps)],
          endpoint: data.endpoint,
          model: data.model.trim(),
          concurrent: data.concurrent,
          backgroundSlots: 0,
          online: data.availability === "Online",
          baseCompleted: 0,
          baseFailed: 0,
          latency: 37,
          registered: true,
          registeredAt: now(),
          lastSeen: now()
        };
        state.agents.push(a);
        event(
          `${a.name} registered \xB7 ${a.online ? "online, idle" : "offline, not eligible"} \xB7 ${a.concurrent} declared slots`
        );
        sample();
        emit();
        return stats(a);
      } finally {
        registrationBusy = false;
        emit("registration");
      }
    }
    function reset() {
      if (running || registrationBusy)
        throw Error("Finish the active task or registration before resetting.");
      state = fresh();
      event("Demo reset \xB7 baseline registry restored");
      sample();
      try {
        storage2?.removeItem("idle-devnet-v1");
      } catch {
      }
      emit();
    }
    function heartbeat() {
      const tick = telemetryTick++;
      const reserved = (a2) => state.tasks.some(
        (t) => t.agentId === a2.id && t.reserved && !TERMINAL.includes(t.status)
      );
      for (const a2 of state.agents) {
        if (a2.temporaryOfflineUntil && now() >= a2.temporaryOfflineUntil && !a2.availabilityPinned) {
          a2.online = true;
          delete a2.temporaryOfflineUntil;
          a2.lastSeen = now();
          event(`${a2.name} returned online \xB7 simulated heartbeat restored`);
        }
      }
      if (!running) {
        const workers = state.agents.filter(
          (a2) => a2.online && !a2.registered && !a2.availabilityPinned && !reserved(a2)
        );
        const chosen = [
          ...new Set(
            [0, 6, 12].map((offset) => workers[(tick + offset) % workers.length]).filter(Boolean)
          )
        ];
        for (const [index, a2] of chosen.entries()) {
          const before = stats(a2);
          let next = tick % 4 === 0 && index === 0 ? a2.backgroundSlots === a2.concurrent ? Math.max(1, Math.floor(a2.concurrent / 4)) : a2.concurrent : a2.backgroundSlots === 0 ? 1 : a2.backgroundSlots === a2.concurrent ? a2.concurrent - 1 : a2.backgroundSlots + ((tick + index) % 2 ? -1 : 1);
          if (next === a2.concurrent && a2.caps.some(
            (cap) => agents2().filter((b) => b.free > 0 && b.caps.includes(cap)).every((b) => b.id === a2.id)
          ))
            next = a2.concurrent - 1;
          a2.backgroundSlots = Math.max(0, Math.min(a2.concurrent, next));
          a2.lastSeen = now();
          const after = stats(a2);
          if (before.occupied !== after.occupied)
            event(
              `${a2.name} ${before.status !== after.status ? `became ${after.status.toLowerCase()} \xB7 ` : ""}${after.occupied}/${a2.concurrent} slots occupied \xB7 simulated load`
            );
        }
        if (tick > 0 && tick % 6 === 0) {
          const a2 = workers.find(
            (a3) => a3.backgroundSlots === 0 && a3.caps.every(
              (cap) => agents2().some(
                (b) => b.id !== a3.id && b.free > 0 && b.caps.includes(cap)
              )
            )
          );
          if (a2) {
            a2.online = false;
            a2.temporaryOfflineUntil = now() + 15e3;
            event(`${a2.name} temporarily offline \xB7 simulated heartbeat gap`);
          }
        }
      }
      const online = state.agents.filter((a2) => a2.online);
      const a = online[tick % online.length];
      if (a) a.lastSeen = now();
      sample();
      emit("telemetry");
    }
    return {
      subscribe(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
      },
      get state() {
        return state;
      },
      get running() {
        return running;
      },
      get registrationBusy() {
        return registrationBusy;
      },
      get persistenceWarning() {
        return persistenceWarning;
      },
      agents: agents2,
      stats,
      metrics,
      compatible,
      rank,
      routingScore,
      status: status2,
      submit,
      cancel,
      setOnline,
      register,
      reset,
      heartbeat,
      timings
    };
  }

  // dist/app.js
  var $ = (s) => document.querySelector(s);
  var esc = (s) => String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  );
  var icons = {
    introduction: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v.1"/>',
    overview: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
    network: '<circle cx="12" cy="5" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="M11 7L6 16m7-9 5 9M7 18h10"/>',
    route: '<path d="m4 12 16-8-7 16-2-7zM11 13l9-9"/>',
    activity: '<path d="M2 12h5l3-8 4 16 3-8h5"/>',
    docs: '<path d="M4 4h6l2 2 2-2h6v16h-6l-2 2-2-2H4zM12 6v16"/>',
    search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
    check: '<path d="m5 12 4 4 10-10"/>'
  };
  var icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[n] || icons.network}</svg>`;
  var storage;
  try {
    storage = localStorage;
  } catch {
  }
  var sim = createSimulation({ storage });
  var page = validPage(location.hash.slice(1));
  var range = "Live";
  var feedPaused = false;
  var pausedEvents = null;
  var modalView = null;
  var filter = {
    query: "",
    cap: "All capabilities",
    status: "All statuses",
    sort: "Recommended"
  };
  var doc = "What is IDLE?";
  var toastTimer;
  var viewedTaskId = sim.state.tasks.at(-1)?.id || null;
  var draft = {
    prompt: "",
    category: "Research",
    priority: "Normal",
    auto: true,
    agent: "",
    outcome: "Successful run"
  };
  var terminal = (t) => !t || TERMINAL.includes(t.status);
  var task = () => sim.state.tasks.find((t) => t.id === viewedTaskId);
  var agents = () => sim.agents();
  var tasks = () => sim.state.tasks;
  function validPage(p) {
    return [
      "introduction",
      "overview",
      "network",
      "route",
      "activity",
      "docs"
    ].includes(p) ? p : "introduction";
  }
  var secs = (ms) => ms == null ? "\u2014" : (ms / 1e3).toFixed(2) + "s";
  var rate = (r) => r == null ? "\u2014" : r.toFixed(1) + "%";
  var stamp = (at) => new Date(at).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "medium"
  });
  function ago(at) {
    if (!Number.isFinite(at)) return "Not observed";
    const s = Math.max(0, Math.floor((Date.now() - at) / 1e3));
    return s < 5 ? "Just now" : s < 60 ? `${s}s ago` : s < 3600 ? `${Math.floor(s / 60)}m ago` : `${Math.floor(s / 3600)}h ago`;
  }
  function toast(t) {
    $("#toast").textContent = t;
    $("#toast").classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 4e3);
  }
  var opts = (list, selected) => list.map(
    (s) => `<option ${s === selected ? "selected" : ""}>${esc(s)}</option>`
  ).join("");
  function header(title, subtitle, action = "") {
    return `<div class="page-heading"><div><div class="eyebrow">AGENT COORDINATION / LOCAL DEVNET</div><h1>${title}</h1><p>${subtitle}</p></div><div class="heading-right">${action}</div></div>`;
  }
  function nav() {
    const entries = [
      ["introduction", "Introduction"],
      ["overview", "Overview"],
      ["network", "Agent network"],
      ["activity", "Activity"],
      ["docs", "Documentation"],
      ["route", "Route a task"]
    ];
    if ($("#nav").dataset.page !== page) {
      $("#nav").dataset.page = page;
      $("#nav").innerHTML = entries.map(
        ([k, v]) => `<button data-nav="${k}" class="nav-link ${page === k ? "active" : ""} ${k === "route" ? "route-link" : ""}" aria-label="${v}" title="${v}" ${page === k ? 'aria-current="page"' : ""}>${icon(k)}<span>${v}</span>${k === "overview" && page === "introduction" ? '<svg class="overview-pointer" viewBox="0 0 32 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M29 4C23 4 25 10 17 10H3m6-6-6 6 6 6"/></svg>' : ""}${k === "route" ? '<span class="key">R</span>' : ""}</button>`
      ).join("");
    }
    $("#crumb").textContent = entries.find((x) => x[0] === page)[1];
    const m = sim.metrics();
    $(".system-state").innerHTML = `<i class="dot"></i> ${m.online}/${m.total} agents online \xB7 demo`;
    $("#storage-notice").textContent = sim.persistenceWarning;
    $("#storage-notice").hidden = !sim.persistenceWarning;
    $("#connect-top").disabled = sim.registrationBusy;
  }
  function metric(label, value, suffix, note, ic) {
    return `<div class="metric"><div class="metric-label">${label}${icon(ic)}</div><div class="metric-number">${value}<em>${suffix}</em></div><div class="metric-change">${note}</div></div>`;
  }
  function chart() {
    const end = Date.now(), duration = {
      Live: 12e4,
      "1h": 36e5,
      "24h": 864e5,
      "7d": 6048e5
    }[range], start = end - duration, samples = sim.state.samples, current = sim.metrics().utilization, first = samples[0];
    const vals = Array.from({ length: 45 }, (_, i) => {
      const at = start + i * duration / 44;
      let value;
      if (at >= (first?.at ?? end)) {
        const observed = samples.filter((s) => s.at <= at).at(-1);
        value = observed?.util ?? current;
      } else
        value = Math.max(
          0,
          Math.min(
            100,
            (first?.util ?? current) + Math.sin(at / (range === "Live" ? 16e3 : 17e5)) * 8 + Math.sin(at / (range === "Live" ? 33e3 : 33e5)) * 5
          )
        );
      if (i === 44) value = current;
      return { at, value };
    });
    const pts = vals.map((v, i) => `${40 + i * 12.1},${140 - v.value * 1.2}`).join(" ");
    const labels = Array.from({ length: 7 }, (_, i) => {
      const at = start + i * duration / 6;
      if (i === 6) return "Now";
      if (range === "Live") return `${Math.round((end - at) / 1e3)}s ago`;
      return new Date(at).toLocaleString(
        "en-GB",
        range === "7d" ? { day: "2-digit", month: "short" } : { hour: "2-digit", minute: "2-digit" }
      );
    });
    return `<svg class="chart" viewBox="0 0 600 170" preserveAspectRatio="none" role="img" aria-label="${range} utilization: illustrative fixture history and saved local samples; latest ${current}%"><defs><pattern id="chart-fill" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 5L5 0" stroke="#c5ccb5" stroke-width=".5"/></pattern></defs>${[20, 50, 80, 110, 140].map((y, i) => `<path class="grid" d="M40 ${y}H582"/><text x="0" y="${y + 3}">${100 - i * 25}%</text>`).join("")}<polygon data-chart-area points="40,140 ${pts} 572,140" fill="url(#chart-fill)" opacity=".6"/><polyline data-chart-line points="${pts}" fill="none" stroke="#6c7e51" stroke-width="1.7" vector-effect="non-scaling-stroke"/><circle data-chart-marker cx="572.4" cy="${140 - current * 1.2}" r="3" fill="#6c7e51"/>${labels.map((s, i) => `<text x="${40 + i * 89}" y="164" text-anchor="${i === 6 ? "end" : "start"}">${esc(s)}</text>`).join("")}</svg>`;
  }
  function status(a) {
    return `<span class="status ${a.status === "Busy" ? "busy" : a.status === "Offline" ? "offline" : ""}"><i class="dot"></i>${a.status}</span>`;
  }
  function rows(list, full = false) {
    return list.map(
      (a) => `<tr data-agent-row="${esc(a.id)}"><td><button class="agent-name agent-open" data-agent="${esc(a.id)}"><span class="agent-icon">\u25C8</span><span><strong>${esc(a.name)}</strong><small>${esc(a.id)}</small></span></button></td><td>${status(a)}</td><td class="tags-cell">${a.caps.map((c) => `<span class="tag">${esc(c)}</span>`).join("")}</td><td><div class="capacity"><span class="capacity-bar"><i style="width:${a.util ?? 0}%"></i></span>${a.util == null ? "\u2014" : a.util + "%"}</div><small>${a.online ? `${a.occupied}/${a.concurrent} slots` : "Offline"}</small></td><td class="mono">${a.latency}ms</td>${full ? `<td class="mono">${a.completed.toLocaleString()}</td><td class="mono">${rate(a.success)}</td>` : ""}</tr>`
    ).join("");
  }
  function agentTable(list, full = false) {
    return `<div class="table-container"><table><thead><tr><th>Agent</th><th>Status</th><th>Capabilities</th><th>Utilization</th><th title="Simulated endpoint round-trip time, not model inference time">Endpoint RTT</th>${full ? "<th>Completed</th><th>Success rate</th>" : ""}</tr></thead><tbody>${rows(list, full) || `<tr><td colspan="${full ? 7 : 5}" class="empty">No agents match these filters. Try another capability or status.</td></tr>`}</tbody></table><div class="table-footer"><span>${list.length} of ${agents().length} agents</span><span>FIXTURE + LOCAL STATE</span></div></div>`;
  }
  function feedMarkup(limit = 5) {
    return (feedPaused && pausedEvents ? pausedEvents : sim.state.events).slice(0, limit).map(
      (e) => `<div class="event"><span class="event-icon">${e.type === "complete" ? "\u2713" : e.type === "error" ? "!" : e.type === "route" ? "\u2927" : "\u25C8"}</span><div><p>${e.taskId ? `<button class="event-link" data-task="${esc(e.taskId)}">${esc(e.text)}</button>` : esc(e.text)}</p><small>${ago(e.at)} \xB7 ${new Date(e.at).toLocaleTimeString("en-GB")}</small></div></div>`
    ).join("");
  }
  function overview() {
    const m = sim.metrics();
    const capacity = m.slots === 0 ? "No online capacity" : m.idleScore >= 65 ? "High available capacity" : m.idleScore >= 30 ? "Moderate available capacity" : "Limited available capacity";
    return `${header("Put idle intelligence to work.", "A control plane for capability discovery, task dispatch, and execution traces.", `<button class="primary" data-nav="route">${icon("route")} Route a task</button>`)}<div class="stats">${metric("Available agents", m.available, "/ " + m.total, "Online with free concurrency slots", "network")}${metric("Tasks dispatched", m.routed.toLocaleString(), "", "Fixture archive + local dispatches", "route")}${metric("Avg. routing time", m.avgRouting == null ? "\u2014" : (m.avgRouting / 1e3).toFixed(2), m.avgRouting == null ? "" : "s", `${m.localRuns} timed local selection${m.localRuns === 1 ? "" : "s"}`, "clock")}${metric("Success rate", m.success == null ? "\u2014" : m.success.toFixed(1), m.success == null ? "" : "%", "Completed / (completed + failed)", "check")}</div><div class="chart-row"><section class="panel"><div class="panel-head"><h2>Network utilization</h2><span class="chart-legend"><i></i> Occupied slots</span><div class="segmented">${["Live", "1h", "24h", "7d"].map((r) => `<button data-range="${r}" aria-pressed="${range === r}" class="${range === r ? "active" : ""}">${r}</button>`).join("")}</div></div><div id="util-chart" class="chart-wrap">${chart()}</div><div class="chart-summary"><span>Utilization <strong>${m.utilization}%</strong></span><span>Occupied slots <strong>${m.used}/${m.slots}</strong></span><span>Active agents <strong>${m.active}</strong></span></div><div class="chart-note">Illustrative history; saved local samples since ${new Date(sim.state.samples[0]?.at || Date.now()).toLocaleTimeString("en-GB")}.</div></section><section class="idle-panel"><div class="eyebrow">IDLE SCORE <span>CAPACITY</span></div><div class="score-number">${m.idleScore}<span>/ 100</span></div><div class="score-bar"><i style="width:${m.idleScore}%"></i></div><h3>${capacity}</h3><p>${m.free} free slots across ${m.online} online agents. Weighted by concurrency; offline agents are excluded. Capacity is not a latency guarantee.</p></section></div><div class="lower-grid"><section><div class="section-head"><h2>Agent network <span>${m.total}</span></h2><button class="text-button" data-nav="network">View all agents</button></div>${agentTable(agents().slice(0, 5))}<div class="quick-route"><div><h3>One task. An eligible execution endpoint.</h3><p>Inspect the routing decision and follow the execution trace.</p></div><button class="primary" data-nav="route">${icon("route")} Try the router</button></div></section><section class="activity-section"><div class="section-head"><h2>Network activity</h2><span class="count-label">${feedPaused ? "PAUSED" : "LOCAL SIMULATION"}</span></div><div class="feed" id="activity-feed">${feedMarkup()}</div><button class="text-button" data-nav="activity" style="margin-top:12px">View all activity</button></section></div><div class="submetrics"><div><span>Tasks completed</span><strong>${m.completed.toLocaleString()}</strong></div><div><span>Online agents</span><strong>${m.online} / ${m.total}</strong></div><div><span>Idle agents</span><strong>${m.idle} agents</strong></div><div><span>Avg. local execution</span><strong>${secs(m.avgExecution)}</strong></div></div>`;
  }
  function filtered() {
    return agents().filter(
      (a) => (a.name + " " + a.id + " " + a.model + " " + a.caps.join(" ")).toLowerCase().includes(filter.query.toLowerCase()) && (filter.cap === "All capabilities" || a.caps.includes(filter.cap)) && (filter.status === "All statuses" || a.status === filter.status)
    ).sort(
      (a, b) => filter.sort === "Lowest RTT" ? a.latency - b.latency : filter.sort === "Most free slots" ? b.free - a.free : filter.sort === "Most tasks completed" ? b.completed - a.completed : filter.sort === "Name A\u2013Z" ? a.name.localeCompare(b.name) : (b.free > 0) - (a.free > 0) || b.free - a.free || a.latency - b.latency
    );
  }
  function network() {
    const m = sim.metrics();
    return `${header("The agent network.", "Declared capabilities, endpoint health, and available concurrency.", `<button class="primary" id="connect-network" ${sim.registrationBusy ? "disabled" : ""}>\uFF0B Connect agent</button>`)}<div class="status-banner">${m.total} registered \xB7 ${m.online} online \xB7 ${m.available} eligible for new work \xB7 ${m.free} free slots</div><div class="filters"><div class="search">${icon("search")}<input id="agent-search" aria-label="Search agents" placeholder="Search agents, IDs, or runtimes\u2026" value="${esc(filter.query)}"></div><select id="cap-filter" aria-label="Filter by capability">${opts(["All capabilities", ...CAPABILITIES], filter.cap)}</select><select id="status-filter" aria-label="Filter by status">${opts(["All statuses", "Available", "Idle", "Busy", "Offline"], filter.status)}</select><select id="sort-filter" aria-label="Sort agents">${opts(["Recommended", "Lowest RTT", "Most free slots", "Most tasks completed", "Name A\u2013Z"], filter.sort)}</select><button class="outline small" id="clear-filters">Reset</button></div><p class="table-explainer">Idle: no occupied slots. Available: some free slots. Busy: all slots occupied. RTT is a fixture endpoint round trip, not inference time.</p><div id="network-table">${agentTable(filtered(), true)}</div>`;
  }
  var examples = [
    [
      "Research",
      "Research the trade-offs between centralized and distributed AI agent orchestration."
    ],
    [
      "Code",
      "Write a Python function that routes tasks to eligible agents by available capacity and latency."
    ],
    [
      "Analysis",
      "Analyze the current simulated registry and report available concurrency."
    ]
  ];
  function routingSteps() {
    const t = task(), s = t?.stage ?? -1;
    return ["Connect", "Discover", "Route", "Execute"].map(
      (label, i) => `<span class="${i === 0 || i === 1 && s >= 1 || i === 2 && s >= 4 || i === 3 && s >= 6 ? "on" : ""}"><b class="step-num">${i + 1}</b>${label}</span>`
    ).join("<span>\u2014</span>");
  }
  function manualOptions() {
    return sim.rank(draft.category).map(
      (a) => `<option value="${esc(a.id)}" ${draft.agent === a.id ? "selected" : ""}>${esc(a.name)} \xB7 ${a.free} free slots \xB7 ${a.routingScore}/100</option>`
    ).join("");
  }
  function route() {
    const busy = !!sim.running;
    return `${header("Route work across available agents.", "Capability first. Then capacity, endpoint RTT, and execution history.")}<div class="routing-steps" id="routing-steps">${routingSteps()}</div><div class="route-layout"><section class="panel route-form"><div class="form-head"><h2>Task router</h2><p>Match a capability, reserve capacity, and inspect the execution trace.</p></div><form id="task-form"><fieldset id="task-fields" ${busy ? "disabled" : ""}><label for="prompt">Task instruction</label><textarea id="prompt" maxlength="3000" placeholder="Describe your task in a little detail\u2026" required>${esc(draft.prompt)}</textarea><div class="form-row"><div><label for="category">Task category</label><select id="category">${opts(CATEGORIES, draft.category)}</select></div><div><label for="priority">Priority</label><select id="priority">${opts(["Normal", "High", "Low"], draft.priority)}</select></div></div><div class="form-bottom"><label class="check-label"><input id="auto-route" type="checkbox" ${draft.auto ? "checked" : ""}>Auto route</label><span id="compatible-count" class="count-label">${sim.compatible(draft.category).length} eligible agents</span></div><div id="manual-wrap" class="${draft.auto ? "hidden" : ""}"><label for="manual-agent">Select an agent</label><select id="manual-agent">${manualOptions()}</select></div><label for="demo-outcome">Demo outcome</label><select id="demo-outcome">${opts(["Successful run", "Agent timeout", "Invalid response"], draft.outcome)}</select><p class="field-note">Priority changes simulated admission delay. Outputs are fixtures; no AI model processes the instruction.</p><div id="route-error" class="error" role="alert"></div><button class="primary" type="submit">${icon("route")}<span id="submit-label">${busy ? "Task in progress\u2026" : "Route task"}</span></button></fieldset></form><div id="cancel-area">${busy ? '<button class="outline cancel-button" id="cancel-task">Cancel task</button>' : ""}</div><div class="example-label">TRY AN EXAMPLE</div><div class="examples">${examples.map((e, i) => `<button class="example" data-example="${i}" ${busy ? "disabled" : ""}>${e[0]}</button>`).join("")}</div></section><section><div id="agent-selection">${selectionMarkup()}</div><div class="terminal"><div class="terminal-head"><span>EXECUTION TRACE</span><span id="terminal-state">${esc(task()?.status || "AWAITING TASK")}</span></div><div id="terminal-output" aria-live="polite" aria-relevant="additions">${terminalMarkup()}</div></div><div class="route-meta"><span>local / fixture-adapter</span><span>Wall-clock demo durations</span></div></section></div><div id="task-result">${terminal(task()) && task() ? resultMarkup(task()) : ""}</div><section class="history-section"><div class="section-head"><h2>Your task history <span>${tasks().length}</span></h2><span class="count-label">Local traces \xB7 latest 100 shown</span></div><div id="task-history">${historyMarkup()}</div></section>`;
  }
  function selectionMarkup() {
    const t = task();
    if (!t?.selection) return "";
    const s = t.selection;
    return `<div class="selection"><div class="selection-top"><strong>${esc(t.agentName)} selected</strong><span class="match">${s.score}/100 ROUTING SCORE</span></div><p>${esc(s.reason)} \xB7 ${esc(CAPABILITY[t.category])}<br>${s.free}/${s.concurrent} slots free at selection \xB7 ${s.latency}ms fixture RTT<br>Historical success ${rate(s.success)}${s.success == null ? " (no completed attempts)" : ""}</p><details class="routing-explanation"><summary>Why this agent?</summary><p>Score = 60% free-slot ratio + 25% normalized RTT + 15% historical success. Unknown success uses a neutral 0.5. This is a policy score, not confidence in the output.</p><div class="candidate-list">${(t.candidates || []).map((a) => `<div><span>${esc(a.name)} ${a.id === t.agentId ? "\xB7 selected" : ""}</span><b>${a.score}/100</b></div>`).join("")}</div></details></div>`;
  }
  function terminalMarkup() {
    const t = task();
    if (!t?.logs?.length)
      return '<div class="terminal-empty">$ idle route --adapter fixture<br>Registry ready. Submit a task to begin. <span class="cursor"></span></div>';
    return `<div class="terminal-lines">${t.logs.map((l) => `<div class="terminal-line"><span>[${new Date(l.at).toLocaleTimeString("en-GB")}]</span>${esc(l.text)}</div>`).join("")}${!terminal(t) ? '<span class="cursor"></span>' : ""}</div>`;
  }
  function historyMarkup() {
    if (!tasks().length)
      return '<div class="panel empty">No local task traces yet. Route an example to inspect selection, dispatch, and output validation.</div>';
    return `<div class="table-container"><table><thead><tr><th>Task ID</th><th>Category</th><th>Routed agent</th><th>Status</th><th>Total time</th><th>Created</th></tr></thead><tbody>${tasks().slice(-100).reverse().map(
      (t) => `<tr><td><button class="text-button mono" data-task="${esc(t.id)}">${esc(t.id)}</button></td><td>${esc(t.category)}</td><td>${esc(t.agentName || "Not selected")}</td><td><span class="task-status ${t.status.toLowerCase()}">${esc(t.status)}</span></td><td class="mono">${t.legacy ? esc(t.totalTime || "\u2014") : secs(t.durations?.total)}</td><td class="mono">${stamp(t.createdAt)}</td></tr>`
    ).join("")}</tbody></table></div>`;
  }
  function resultBody(t) {
    const o = t.output;
    if (!o)
      return `<p class="field-note">This older trace has no saved result snapshot. Retry with a new task ID to create a complete trace.</p>`;
    return `<div class="output-disclosure"><span class="tag">FIXTURE OUTPUT</span> Response-envelope validation only; no model inference or factual verification.</div><h3>${esc(o.title)}</h3>${(o.paragraphs || []).map((p) => `<p>${esc(p)}</p>`).join("")}${o.bullets?.length ? `<ul>${o.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}${o.code ? `<pre>${esc(o.code)}</pre>` : ""}`;
  }
  function resultMarkup(t) {
    const d = t.durations || {};
    return `<section class="result"><div class="result-head"><h3>${t.status === "Complete" ? "Task completed" : `Task ${t.status.toLowerCase()}`}</h3><span class="tag mono">${esc(t.id)}</span></div><p class="task-input"><strong>Instruction:</strong> ${esc(t.prompt)}</p>${t.parentId ? `<p class="field-note">Retry of ${esc(t.parentId)} \xB7 new trace</p>` : ""}${t.status === "Complete" ? resultBody(t) : t.error ? `<div class="failure-callout" role="status">${esc(t.error)}</div>` : "<p>Execution is in progress. The trace below shows its current state.</p>"}<div class="result-meta"><div><small>Routed agent</small>${esc(t.agentName || "Not selected")}</div><div><small>Routing</small>${secs(d.routing)}</div><div><small>Queue / admission</small>${secs(d.queue)}</div><div><small>Execution</small>${secs(d.execution)}</div><div><small>Verification</small>${secs(d.verification)}</div><div><small>Total wall time</small>${t.legacy ? esc(t.totalTime || "\u2014") : secs(d.total)}</div><div><small>Status</small>${esc(t.status)}</div><div><small>Priority</small>${esc(t.priority)}</div><div><small>Routing policy</small>${t.auto ? "Automatic" : "Manual"}</div><div><small>Created</small>${stamp(t.createdAt)}</div><div><small>Finished</small>${t.endedAt ? stamp(t.endedAt) : "In progress"}</div><div><small>Demo scenario</small>${esc(t.outcome || "Legacy run")}</div></div><div class="result-actions">${t.status === "Complete" ? `<button class="outline small" data-copy-task="${esc(t.id)}">Copy result</button>` : ""}${terminal(t) ? `<button class="outline small" data-retry-task="${esc(t.id)}" ${sim.running ? "disabled" : ""}>Retry with a new task ID</button>` : ""}</div></section>`;
  }
  var docTitles = [
    "What is IDLE?",
    "How routing works",
    "Connecting an agent",
    "Task API",
    "Agent capabilities",
    "Devnet",
    "$IDLE asset"
  ];
  function docContent() {
    if (doc === "What is IDLE?")
      return '<h2>A control plane for available intelligence.</h2><p>IDLE coordinates task dispatch across independently deployed agents. An agent advertises its declared capabilities, endpoint, and maximum concurrency; the registry exposes that capacity to the router.</p><div class="doc-callout">Register an endpoint \u2192 discover eligible capacity \u2192 reserve a slot \u2192 dispatch and trace execution.</div><h3>What coordination means</h3><p>IDLE selects an eligible endpoint and tracks its execution lifecycle. The model or runtime behind the endpoint does the work. Endpoint round-trip time is distinct from model inference time, and a declared capability is not proof of output quality.</p><h3>Implemented in this demo</h3><p>A local capability registry, deterministic routing policy, slot reservations, execution traces, cancellation, failure recovery, and fixture response validation. No remote endpoints, AI models, payments, or actual network are connected.</p><h3>What a production system would need</h3><p>Authenticated agent adapters, independent health checks, durable task storage, atomic reservations across workers, dispatch acknowledgments, idempotency, deadlines, and workload-specific output evaluation. These are proposed architecture requirements, not shipped functionality.</p>';
    if (doc === "How routing works")
      return "<h2>Eligibility before ranking.</h2><ol><li><strong>Capability:</strong> use the category selected by the user; the demo does not infer intent from the prompt.</li><li><strong>Availability:</strong> require an online endpoint with at least one free concurrency slot.</li><li><strong>Ranking:</strong> compare the remaining agents using the same documented score shown in the task decision.</li><li><strong>Reservation:</strong> recheck eligibility, then reserve one slot before dispatch.</li><li><strong>Execution:</strong> acknowledge dispatch, run a fixture adapter, and validate the output envelope.</li></ol><h3>Routing score / 100</h3><pre>60 \xD7 (free slots / maximum concurrency)\n+ 25 \xD7 max(0, 1 \u2212 endpoint RTT / 200ms)\n+ 15 \xD7 historical success fraction\n\nUnknown success fraction: 0.5 (neutral prior)\nTies: lowest RTT, then stable agent ID</pre><p>A routing score ranks eligible endpoints. It is not a model confidence score or a guarantee of quality. Manual routing validates eligibility and reserves capacity without overriding your choice.</p><h3>Priority and timing</h3><p>High, Normal, and Low priorities use 250ms, 650ms, and 1,150ms simulated admission delays. One foreground task runs at a time; this demonstrates priority latency, not a shared production scheduler. Routing, queue, execution, and verification timings are measured from browser wall-clock timestamps and sum to total duration.</p><h3>Failure and cancellation</h3><p>Choose an agent timeout or invalid-response scenario to see a failed trace. Cancellation, failure, and completion release the reserved slot. Closing or reloading the tab marks an unfinished execution Interrupted on the next load. Retries receive new task IDs and preserve the original trace.</p><h3>Idle Score</h3><p>Idle Score = 100 minus the rounded percentage of occupied online slots. Offline capacity is excluded. No online capacity returns zero. Agent utilization = occupied slots / concurrency limit. Larger agents contribute proportionally to network capacity.</p>";
    if (doc === "Connecting an agent")
      return '<h2>Declare an execution endpoint.</h2><p>Enter a unique name and endpoint alias, select a runtime, declare capabilities, and set maximum concurrency from 1 to 64. An online agent starts idle with all slots free. An offline registration contributes no routable capacity.</p><ol><li>Validate the endpoint alias locally.</li><li>Simulate an authenticated adapter handshake.</li><li>Validate declared capability names.</li><li>Register the endpoint in this browser.</li></ol><div class="doc-callout">No endpoint is contacted and no credentials are required. The displayed RTT is a fixture value. Registration does not prove that a runtime supports a capability.</div><p>New agents have no historical success rate until a dispatched task finishes. Agent details let you bring an endpoint online or set it offline. Availability cannot be changed while it holds a reserved local task.</p>';
    if (doc === "Task API")
      return '<h2>A proposed task contract.</h2><p>The following API and SDK illustrate a future integration contract. Neither is implemented or published. The demo has no authenticated server API.</p><h3>Submit with idempotency</h3><pre>POST /v1/tasks\nAuthorization: Bearer &lt;YOUR_API_KEY&gt;\nIdempotency-Key: &lt;CLIENT_REQUEST_ID&gt;\nContent-Type: application/json\n\n{\n  "instruction": "Summarize the supplied text",\n  "required_capability": "summarization",\n  "input": { "text": "Source text here" },\n  "routing": "auto",\n  "priority": "normal",\n  "deadline_ms": 30000\n}</pre><h3>Accepted response concept</h3><pre>202 Accepted\n{\n  "id": "TASK-84F21CA0",\n  "status": "accepted",\n  "trace_url": "/v1/tasks/TASK-84F21CA0"\n}</pre><h3>SDK concept</h3><pre>// Proposed API only; this package is not available.\nconst task = await idle.tasks.create(request);\nconst result = await idle.tasks.wait(task.id);\n// Inspect failed/cancelled status before using output.</pre><button class="outline small" id="copy-api">Copy API example</button>';
    if (doc === "Agent capabilities")
      return `<h2>A registry of declared skills.</h2><p>Capability names describe advertised work types. The demo matches names exactly. A production adapter would also need input schemas, limits, and an independently evaluated capability contract.</p><div class="capability-grid">${CAPABILITIES.map((c, i) => `<div><h3>${c}</h3><p>${["Evidence gathering and structured research.", "Context and signals for market research.", "Generate, review, and explain code.", "Explore datasets and identify patterns.", "Condense supplied documents and conversations.", "Apply a supplied label schema to inputs.", "Gather and interpret public web information.", "Parse documents and extract structured content.", "Interpret supplied visual inputs.", "Observe systems and report changes.", "Translate supplied text across languages.", "Work through multi-step problems."][i]}</p></div>`).join("")}</div>`;
    if (doc === "Devnet")
      return '<h2>A local control-plane simulation.</h2><p>This is a browser-only demo, not a connected distributed devnet. The registry and historical counters start from a sample fixture. Your registered agents, task traces, telemetry, and capacity snapshots are saved locally when browser storage is available.</p><h3>Metric scope</h3><p>Network completion and failure totals are the sum of agent fixture counters plus local dispatched outcomes. Dispatch counts include in-flight, cancelled, and interrupted dispatches; success rate includes only completed and failed dispatched attempts. Pre-dispatch failures, cancellations, and interruptions are excluded from that rate. Local timing averages use measured, non-legacy traces. No percentage comparisons or uptime claims are fabricated.</p><h3>Chart and telemetry</h3><p>The chart uses illustrative history before the first saved local sample. Saved slot snapshots supply recent values, and its final point always equals current utilization. Every five seconds, fixture workers gain or release occupied slots and may briefly go offline. Reserved agents, your registrations, and manual availability overrides are protected. No completed tasks are invented. Pausing the feed freezes its visible events while telemetry and task execution continue.</p><h3>Results and verification</h3><p>Each category returns a saved response fixture. Your instruction is retained, but no model answers it. Verification checks the simulated response envelope, not factual accuracy. Historical results are snapshots and do not change when the registry changes.</p><h3>Local persistence</h3><p>Refresh recovers unfinished traces as Interrupted and releases reserved capacity. Older v0.4.2 data is migrated; older results without snapshots remain identifiable as legacy traces. This is designed for one active demo tab, with no server synchronization or multi-user coordination.</p><button class="outline" id="reset-demo">Reset local demo data</button>';
    return '<h2>A proposed coordination asset.</h2><p>$IDLE is a proposed asset for a future network. The product workflow can be explored without a wallet or token.</p><h3>Potential roles, subject to product validation</h3><ul><li>Task settlement</li><li>Agent incentives</li><li>Priority routing</li><li>Network participation</li><li>Capacity rewards</li></ul><div class="doc-callout">No token, payment, economic incentive, or settlement functionality is implemented. The priorities in this demo are free local simulation settings.</div>';
  }
  function introduction() {
    return `${header("An introduction to IDLE.", "Put idle intelligence to work.", `<img class="introduction-logo" src="logo.svg" alt="IDLE logo" width="80" height="80" />`)}
  <div class="introduction-layout">
    <section class="introduction-project"><div class="eyebrow">THE PROJECT</div><h2>Available intelligence. Useful work.</h2><p>IDLE is a coordination layer that routes tasks across available AI agents. It matches the capabilities a task needs with an eligible endpoint, reserves capacity, and makes each execution easy to follow.</p><p>Explore the network, try the router, and see how specialized agents can work together through one workspace.</p></section>
    <aside class="introduction-goal"><div class="eyebrow">THE GOAL</div><h2>Make unused capability useful.</h2><p>Build a reliable network where independently deployed agents can contribute available capacity and receive compatible work\u2014with clear routing decisions and traceable outcomes.</p></aside>
  </div>
  <section class="introduction-guide"><div class="eyebrow">HOW TO USE THE WORKSPACE</div><h2>Start with one task.</h2><ol>
    <li><span class="intro-step">01</span><div><h3>Discover agents</h3><p>Open Agent network to search capabilities, inspect agents, and see their free capacity.</p></div></li>
    <li><span class="intro-step">02</span><div><h3>Route a task</h3><p>Enter an instruction, choose a category and priority, then use Auto route or select an eligible agent.</p></div></li>
    <li><span class="intro-step">03</span><div><h3>Follow the execution</h3><p>Watch the routing decision and terminal trace. Review the result, or try a failure scenario and retry.</p></div></li>
    <li><span class="intro-step">04</span><div><h3>Contribute capacity</h3><p>Use Connect agent to register a sample endpoint, declare its capabilities, and add it to your local network.</p></div></li>
  </ol><div class="intro-actions"><button class="outline" data-nav="network">Explore agent network</button><button class="primary" data-nav="route">${icon("route")} Route your first task</button></div></section>
  <p class="intro-environment"><span class="tag">LOCAL DEVNET</span> This MVP uses simulated agents, execution, and outputs. The goal is to demonstrate coordination; real agent connections and model inference are future work.</p>`;
  }
  function docs() {
    return `${header("The control plane, explained.", "Implemented behavior, metric definitions, and proposed integration contracts.")}<div class="docs"><nav class="docs-nav">${docTitles.map((d) => `<button data-doc="${esc(d)}" class="${d === doc ? "active" : ""}" aria-pressed="${d === doc}">${esc(d)}</button>`).join("")}</nav><article class="doc-article">${docContent()}</article></div>`;
  }
  function activity() {
    const m = sim.metrics();
    return `${header("Execution, with a trace.", "Registry observations and local task lifecycle events.", `<button class="outline small" id="pause-feed">${feedPaused ? "Resume feed" : "Pause feed"}</button>`)}<div class="activity-layout"><section><div class="section-head"><h2>Network telemetry</h2><span id="feed-state" class="count-label">${feedPaused ? "PAUSED \xB7 VIEW FROZEN" : "LOCAL SIMULATION"}</span></div><div class="feed" id="activity-feed">${feedMarkup(20)}</div></section><div><div class="simulation-note"><h3>Observability over spectacle.</h3><p>Simulated workers gain and release occupied slots, with occasional short offline periods. Reserved agents and your registrations stay protected. Task events come from the same state machine as your execution trace.</p><p style="margin-top:12px">Pausing freezes this view. Tasks continue running; resume to catch up. No remote traffic is monitored.</p></div><div class="submetrics" id="activity-metrics" style="grid-template-columns:1fr 1fr"><div><span>Registered agents</span><strong>${m.total}</strong></div><div><span>Your local traces</span><strong>${tasks().length}</strong></div></div><button class="primary" data-nav="route">${icon("route")} Route a task</button></div></div><section class="history-section"><div class="section-head"><h2>Execution history</h2><span class="count-label">Your local tasks</span></div><div id="task-history">${historyMarkup()}</div></section>`;
  }
  function render() {
    nav();
    $("#app").innerHTML = {
      introduction,
      overview,
      network,
      route,
      activity,
      docs
    }[page]();
    bindView();
  }
  function navigate(p) {
    page = validPage(p);
    if (location.hash !== "#" + page) history.pushState(null, "", "#" + page);
    render();
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function updateRouter() {
    if (page !== "route") return;
    const busy = !!sim.running;
    $("#task-fields").disabled = busy;
    $("#submit-label").textContent = busy ? "Task in progress\u2026" : "Route task";
    $("#cancel-area").innerHTML = busy ? '<button class="outline cancel-button" id="cancel-task">Cancel task</button>' : "";
    document.querySelectorAll(".example").forEach((b) => b.disabled = busy);
    $("#compatible-count").textContent = sim.compatible(draft.category).length + " eligible agents";
    if (!busy) {
      const select = $("#manual-agent"), old = select.value;
      select.innerHTML = manualOptions();
      if ([...select.options].some((o) => o.value === old)) select.value = old;
    }
    $("#terminal-output").innerHTML = terminalMarkup();
    $("#terminal-state").textContent = task()?.status || "AWAITING TASK";
    $("#agent-selection").innerHTML = selectionMarkup();
    $("#routing-steps").innerHTML = routingSteps();
    $("#task-result").innerHTML = task() && terminal(task()) ? resultMarkup(task()) : "";
    $("#task-history").innerHTML = historyMarkup();
  }
  function bindView() {
    if (page === "network") {
      $("#agent-search").addEventListener("input", (e) => {
        filter.query = e.target.value;
        $("#network-table").innerHTML = agentTable(filtered(), true);
      });
      [
        ["cap-filter", "cap"],
        ["status-filter", "status"],
        ["sort-filter", "sort"]
      ].forEach(
        ([id, k]) => $("#" + id).addEventListener("change", (e) => {
          filter[k] = e.target.value;
          $("#network-table").innerHTML = agentTable(filtered(), true);
        })
      );
    }
    if (page === "route") {
      $("#prompt").addEventListener(
        "input",
        (e) => draft.prompt = e.target.value
      );
      $("#category").addEventListener("change", (e) => {
        draft.category = e.target.value;
        draft.agent = "";
        viewedTaskId = null;
        render();
      });
      $("#priority").addEventListener(
        "change",
        (e) => draft.priority = e.target.value
      );
      $("#demo-outcome").addEventListener(
        "change",
        (e) => draft.outcome = e.target.value
      );
      $("#auto-route").addEventListener("change", (e) => {
        draft.auto = e.target.checked;
        $("#manual-wrap").classList.toggle("hidden", draft.auto);
      });
      $("#manual-agent").addEventListener(
        "change",
        (e) => draft.agent = e.target.value
      );
      $("#task-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        draft.agent = $("#manual-agent").value;
        draft.parentId = draft.parentId || null;
        $("#route-error").textContent = "";
        try {
          const t = await sim.submit({ ...draft });
          toast(
            t.status === "Complete" ? "Fixture execution completed." : `Task ${t.status.toLowerCase()}. ${t.error}`
          );
        } catch (err) {
          $("#route-error").textContent = err.message;
        }
      });
    }
  }
  function showModal(html, view) {
    $("#modal-content").innerHTML = html;
    modalView = view;
    $("#modal").setAttribute("aria-labelledby", "modal-title");
    if (!$("#modal").open) $("#modal").showModal();
  }
  function modalHeader(title, sub) {
    return `<div class="modal-header"><div><h2 id="modal-title">${title}</h2><p>${sub}</p></div><button class="close-button" aria-label="Close dialog" id="close-modal">\xD7</button></div>`;
  }
  function closeModal() {
    if (sim.registrationBusy) return;
    $("#modal").close();
    modalView = null;
  }
  function connectModal() {
    if (sim.registrationBusy) return;
    showModal(
      `${modalHeader("Register an agent.", "Declare an endpoint and its available concurrency.")}<form id="connect-form" class="modal-body"><div class="form-row"><div><label for="new-name">Agent name</label><input id="new-name" placeholder="e.g. Atlas-R3" maxlength="40" required></div><div><label for="new-runtime">Runtime / model</label><select id="new-runtime">${opts(["Claude Sonnet 4.5", "GPT-4.1", "Gemini 2.5 Pro", "Llama 3.3 70B", "Qwen3-Coder", "Python / FastAPI", "Custom runtime"])}</select></div></div><div id="custom-runtime-wrap" class="hidden"><label for="custom-runtime">Custom runtime name</label><input id="custom-runtime" maxlength="80" placeholder="e.g. Internal research adapter"></div><fieldset class="capability-fieldset"><legend>Declared capabilities <small>Select at least one</small></legend><div class="cap-checks">${CAPABILITIES.map((c) => `<label><input type="checkbox" name="capabilities" value="${esc(c)}">${c}</label>`).join("")}</div></fieldset><label for="new-endpoint">Endpoint alias</label><input id="new-endpoint" placeholder="e.g. atlas-r3.devnet.local" maxlength="120" required><div class="form-row"><div><label for="new-max">Maximum concurrent tasks</label><input type="number" id="new-max" min="1" max="64" step="1" value="4" required></div><div><label for="new-availability">Availability</label><select id="new-availability">${opts(["Online", "Offline"])}</select></div></div><div class="error" id="connect-error" role="alert"></div><div class="modal-actions"><small>Local simulation. Endpoint aliases are not contacted; capabilities are self-declared.</small><button type="submit" class="primary">Register agent</button></div></form>`,
      { type: "connect" }
    );
    $("#new-runtime").addEventListener("change", (e) => {
      const custom = e.target.value === "Custom runtime";
      $("#custom-runtime-wrap").classList.toggle("hidden", !custom);
      $("#custom-runtime").required = custom;
    });
    $("#connect-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = {
        name: $("#new-name").value.trim(),
        caps: [
          ...document.querySelectorAll("input[name=capabilities]:checked")
        ].map((e2) => e2.value),
        endpoint: $("#new-endpoint").value.trim(),
        model: $("#new-runtime").value === "Custom runtime" ? $("#custom-runtime").value.trim() : $("#new-runtime").value,
        concurrent: Number($("#new-max").value),
        availability: $("#new-availability").value
      };
      const steps = [
        "Validate endpoint alias",
        "Simulate adapter authentication",
        "Validate capability declarations",
        "Register local endpoint"
      ];
      try {
        const a = await sim.register(data, (i) => {
          showModal(
            `${modalHeader("Registering your agent.", "Simulated adapter setup; no endpoint is contacted.")}<div class="connect-progress">${steps.map((s, j) => `<div class="${j < i ? "done" : j === i ? "current" : ""}">${j < i ? "\u2713" : j === i ? "\u25CC" : "\u25CB"} ${s}${j === i ? "\u2026" : ""}</div>`).join("")}</div>`,
            { type: "registration" }
          );
          $("#close-modal").disabled = true;
        });
        closeModal();
        filter = {
          query: a.name,
          cap: "All capabilities",
          status: "All statuses",
          sort: "Recommended"
        };
        navigate("network");
        toast(
          `${a.name} registered ${a.online ? "online and idle" : "offline; excluded from routing"}.`
        );
      } catch (err) {
        if ($("#connect-error")) $("#connect-error").textContent = err.message;
        else {
          closeModal();
          toast(err.message);
        }
      }
    });
  }
  function agentDetailContent(id) {
    const a = agents().find((a2) => a2.id === id);
    if (!a) return "";
    const hist = tasks().filter((t) => t.agentId === id).slice(-8).reverse(), reserved = tasks().some(
      (t) => t.agentId === id && t.reserved && !terminal(t)
    );
    return `${modalHeader(esc(a.name), esc(a.id) + " \xB7 " + esc(a.model))}<div class="modal-body"><div class="detail-stats"><div><strong>${a.online ? a.free : "\u2014"}</strong><small>Free concurrency slots</small></div><div><strong>${a.latency}ms</strong><small>Fixture endpoint RTT</small></div><div><strong>${rate(a.success)}</strong><small>${a.success == null ? "No completed attempts" : "Historical + local success"}</small></div></div><div class="detail-line"><span>Status</span>${status(a)}</div><div class="detail-line"><span>Occupied slots</span><b>${a.occupied} / ${a.concurrent}${!a.online ? " (not routable)" : ""}</b></div><div class="detail-line"><span>Completed attempts</span><b>${a.completed.toLocaleString()}</b></div><div class="detail-line"><span>Failed dispatched attempts</span><b>${a.failed.toLocaleString()}</b></div><div class="detail-line"><span>Last registry observation</span><b>${ago(a.lastSeen)}</b></div><div class="detail-line"><span>Endpoint alias</span><b class="break-word">${esc(a.endpoint)}</b></div><div class="detail-line"><span>Observation scope</span><b>${a.registered ? "Local registration" : "Sample archive + local traces"}</b></div><h3>Declared capabilities</h3>${a.caps.map((c) => `<span class="tag">${esc(c)}</span>`).join("")}<h3>Local execution traces</h3>${hist.length ? hist.map((t) => `<div class="detail-line"><button class="text-button mono" data-task="${esc(t.id)}">${esc(t.id)}</button><b>${esc(t.status)} \xB7 ${secs(t.durations?.total)}</b></div>`).join("") : '<p class="count-label">No local executions. Archived fixture counters have no individual traces in this demo.</p>'}<div class="agent-actions"><button class="outline small" data-online="${esc(a.id)}" ${reserved ? "disabled" : ""}>${a.online ? "Set offline" : "Bring online"}</button><span class="field-note">${reserved ? "Availability locked while a task holds a reserved slot." : "Changes eligibility in the local registry."}</span></div><small style="margin-top:15px">Declared skills and fixture RTT do not prove model quality or endpoint health. Uptime is not measured.</small></div>`;
  }
  function agentDetail(id) {
    showModal(agentDetailContent(id), { type: "agent", id });
  }
  function taskDetail(id) {
    const t = tasks().find((t2) => t2.id === id);
    if (!t) {
      toast("This trace is no longer available.");
      return;
    }
    showModal(
      `${modalHeader("Execution details", esc(t.id))}<div class="modal-body">${resultMarkup(t)}<h3>Execution trace</h3><div class="terminal"><div class="terminal-lines">${(t.logs || []).map((l) => `<div class="terminal-line"><span>[${new Date(l.at).toLocaleTimeString("en-GB")}]</span>${esc(l.text)}</div>`).join("") || "<p>Legacy trace; terminal lines were not saved.</p>"}</div></div></div>`,
      { type: "task", id }
    );
  }
  function retry(id) {
    const t = tasks().find((t2) => t2.id === id);
    if (!t || sim.running) return;
    draft = {
      prompt: t.prompt,
      category: t.category,
      priority: t.priority,
      auto: t.auto,
      agent: t.agentId || "",
      outcome: "Successful run",
      parentId: t.id
    };
    viewedTaskId = null;
    closeModal();
    navigate("route");
    toast("Retry prepared. Review the instruction and route a new task.");
    $("#prompt").focus();
  }
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied to clipboard.");
    } catch {
      toast("Clipboard unavailable. Select and copy the text manually.");
    }
  }
  function copyResult(id) {
    const t = tasks().find((t2) => t2.id === id);
    if (!t) return;
    const o = t.output;
    const result = [
      t.id,
      `Agent: ${t.agentName}`,
      `Status: ${t.status}`,
      `Instruction: ${t.prompt}`,
      "Fixture output \u2014 no model inference.",
      o?.title,
      ...o?.paragraphs || [],
      ...o?.bullets || [],
      o?.code,
      `Created: ${stamp(t.createdAt)}`,
      `Total wall time: ${secs(t.durations?.total)}`
    ].filter(Boolean).join("\n\n");
    copyText(result);
  }
  function showReset() {
    if (sim.running || sim.registrationBusy) {
      toast("Finish or cancel the active operation before resetting.");
      return;
    }
    showModal(
      `${modalHeader("Reset local demo data?", "Remove your registered agents, traces, and saved telemetry.")}<div class="modal-body"><p>The original sample registry and archive counters will be restored. This affects only this browser.</p><div class="modal-actions"><button class="outline" id="cancel-reset">Cancel</button><button class="primary" id="confirm-reset">Reset demo</button></div></div>`,
      { type: "reset" }
    );
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b || b.disabled) return;
    try {
      if (b.dataset.nav) navigate(b.dataset.nav);
      else if (b.id === "connect-top" || b.id === "connect-network")
        connectModal();
      else if (b.id === "close-modal" || b.id === "cancel-reset") closeModal();
      else if (b.dataset.agent) agentDetail(b.dataset.agent);
      else if (b.dataset.range) {
        range = b.dataset.range;
        render();
      } else if (b.id === "clear-filters") {
        filter = {
          query: "",
          cap: "All capabilities",
          status: "All statuses",
          sort: "Recommended"
        };
        render();
      } else if (b.dataset.example !== void 0) {
        if (sim.running) return;
        const ex = examples[Number(b.dataset.example)];
        draft = { ...draft, prompt: ex[1], category: ex[0], parentId: null };
        viewedTaskId = null;
        render();
        $("#prompt").focus();
      } else if (b.dataset.doc) {
        doc = b.dataset.doc;
        render();
      } else if (b.id === "pause-feed") {
        feedPaused = !feedPaused;
        pausedEvents = feedPaused ? structuredClone(sim.state.events) : null;
        render();
      } else if (b.dataset.task) taskDetail(b.dataset.task);
      else if (b.dataset.copyTask) copyResult(b.dataset.copyTask);
      else if (b.dataset.retryTask) retry(b.dataset.retryTask);
      else if (b.dataset.online) {
        const a = agents().find((a2) => a2.id === b.dataset.online);
        sim.setOnline(a.id, !a.online);
        toast(`${a.name} ${a.online ? "set offline" : "brought online"}.`);
      } else if (b.id === "cancel-task") sim.cancel();
      else if (b.id === "copy-api") copyText($(".doc-article pre").textContent);
      else if (b.id === "reset-demo") showReset();
      else if (b.id === "confirm-reset") {
        sim.reset();
        draft = {
          prompt: "",
          category: "Research",
          priority: "Normal",
          auto: true,
          agent: "",
          outcome: "Successful run"
        };
        viewedTaskId = null;
        pausedEvents = null;
        feedPaused = false;
        closeModal();
        render();
        toast("Local data reset; baseline fixture restored.");
      }
    } catch (error) {
      toast(error.message);
    }
  });
  function patchNode(current, incoming) {
    if (current.nodeType !== incoming.nodeType || current.nodeName !== incoming.nodeName) {
      current.replaceWith(incoming.cloneNode(true));
      return;
    }
    if (current.nodeType === Node.TEXT_NODE) {
      if (current.nodeValue !== incoming.nodeValue)
        current.nodeValue = incoming.nodeValue;
      return;
    }
    if (current.nodeType !== Node.ELEMENT_NODE) return;
    for (const attribute of [...current.attributes])
      if (!incoming.hasAttribute(attribute.name))
        current.removeAttribute(attribute.name);
    for (const attribute of incoming.attributes)
      if (current.getAttribute(attribute.name) !== attribute.value)
        current.setAttribute(attribute.name, attribute.value);
    if (current.tagName === "TBODY") {
      const keyed = new Map(
        [...current.children].filter((row) => row.dataset.agentRow).map((row) => [row.dataset.agentRow, row])
      );
      if (keyed.size && [...incoming.children].every((row) => row.dataset.agentRow)) {
        const wanted = /* @__PURE__ */ new Set();
        for (const row of incoming.children) {
          const id = row.dataset.agentRow;
          wanted.add(id);
          const old = keyed.get(id);
          if (old) {
            patchNode(old, row);
            current.appendChild(old);
          } else current.appendChild(row.cloneNode(true));
        }
        for (const [id, row] of keyed) if (!wanted.has(id)) row.remove();
        return;
      }
    }
    const desired = [...incoming.childNodes];
    for (let i = 0; i < desired.length; i++) {
      const old = current.childNodes[i];
      if (old) patchNode(old, desired[i]);
      else current.appendChild(desired[i].cloneNode(true));
    }
    while (current.childNodes.length > desired.length) current.lastChild.remove();
  }
  function patchHTML(element, html) {
    const fragment = document.createElement("div");
    fragment.innerHTML = html;
    const incoming = element.cloneNode(false);
    incoming.append(...fragment.childNodes);
    patchNode(element, incoming);
  }
  var chartFrame;
  function updateOverview() {
    const line = $("[data-chart-line]"), area = $("[data-chart-area]"), marker = $("[data-chart-marker]");
    const previous = {
      line: line?.getAttribute("points"),
      area: area?.getAttribute("points"),
      cy: marker?.getAttribute("cy"),
      score: Number($(".score-number")?.firstChild?.nodeValue)
    };
    patchHTML($("#app"), overview());
    cancelAnimationFrame(chartFrame);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const currentLine = $("[data-chart-line]"), currentArea = $("[data-chart-area]"), currentMarker = $("[data-chart-marker]"), scoreNode = $(".score-number")?.firstChild;
    const points = (s) => s?.trim().split(/[,\s]+/).map(Number);
    const fromLine = points(previous.line), toLine = points(currentLine?.getAttribute("points")), fromArea = points(previous.area), toArea = points(currentArea?.getAttribute("points"));
    if (!fromLine || fromLine.length !== toLine?.length || !fromArea || fromArea.length !== toArea?.length)
      return;
    const toY = Number(currentMarker.getAttribute("cy")), toScore = sim.metrics().idleScore, start = performance.now();
    const interpolate = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t).reduce((out, v, i) => out + (i % 2 ? "," : " ") + v.toFixed(2), "").trim();
    function frame(at) {
      if (page !== "overview") return;
      const progress = Math.min(1, (at - start) / 3600), ease = progress * progress * (3 - 2 * progress);
      currentLine.setAttribute("points", interpolate(fromLine, toLine, ease));
      currentArea.setAttribute("points", interpolate(fromArea, toArea, ease));
      currentMarker.setAttribute(
        "cy",
        Number(previous.cy) + (toY - Number(previous.cy)) * ease
      );
      if (scoreNode)
        scoreNode.nodeValue = String(
          Math.round(previous.score + (toScore - previous.score) * ease)
        );
      if (progress < 1) chartFrame = requestAnimationFrame(frame);
    }
    chartFrame = requestAnimationFrame(frame);
  }
  sim.subscribe((kind) => {
    if (sim.running) viewedTaskId = sim.running.taskId;
    nav();
    if (page === "route") updateRouter();
    if (page === "overview") updateOverview();
    if (page === "network") {
      patchHTML($("#network-table"), agentTable(filtered(), true));
      const m = sim.metrics();
      $(".status-banner").textContent = `${m.total} registered \xB7 ${m.online} online \xB7 ${m.available} eligible for new work \xB7 ${m.free} free slots`;
      if ($("#connect-network"))
        $("#connect-network").disabled = sim.registrationBusy;
    }
    if (page === "activity") {
      if (!feedPaused) $("#activity-feed").innerHTML = feedMarkup(20);
      $("#task-history").innerHTML = historyMarkup();
    }
    if ($("#modal").open) {
      if (modalView?.type === "agent")
        $("#modal-content").innerHTML = agentDetailContent(modalView.id);
      if (modalView?.type === "task") taskDetail(modalView.id);
    }
  });
  $("#modal").addEventListener("cancel", (e) => {
    if (sim.registrationBusy) e.preventDefault();
    else modalView = null;
  });
  $("#modal").addEventListener("close", () => modalView = null);
  window.addEventListener("hashchange", () => {
    const next = validPage(location.hash.slice(1));
    if (next !== page) navigate(next);
  });
  window.addEventListener("popstate", () => {
    page = validPage(location.hash.slice(1));
    render();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "r" && !e.ctrlKey && !e.metaKey && !e.altKey && !["INPUT", "TEXTAREA", "SELECT", "BUTTON", "SUMMARY"].includes(
      e.target.tagName
    ) && !e.target.isContentEditable && !$("#modal").open)
      navigate("route");
  });
  setInterval(() => {
    if (!document.hidden) sim.heartbeat();
  }, 5e3);
  if (document.modelContext?.registerTool) {
    const lifecycle = new AbortController();
    const tools = [
      {
        name: "list_idle_agents",
        description: "Read all simulated IDLE agents, including online state, capabilities, and free slots.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false
        },
        annotations: { readOnlyHint: true },
        execute: () => agents().map(
          ({ id, name, status: status2, caps, free, concurrent, latency }) => ({
            id,
            name,
            status: status2,
            capabilities: caps,
            freeSlots: free,
            maxConcurrency: concurrent,
            fixtureRttMs: latency
          })
        )
      },
      {
        name: "route_idle_task",
        description: "Submit and finish a local fixture task in IDLE. No model inference occurs. Returns the terminal outcome.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: { type: "string", minLength: 1, maxLength: 3e3 },
            category: { type: "string", enum: CATEGORIES },
            priority: { type: "string", enum: ["Normal", "High", "Low"] }
          },
          required: ["prompt", "category"],
          additionalProperties: false
        },
        annotations: { readOnlyHint: false },
        execute: async (input) => {
          navigate("route");
          const t = await sim.submit({
            prompt: input?.prompt,
            category: input?.category,
            priority: input?.priority || "Normal",
            auto: true,
            outcome: "Successful run"
          });
          return {
            id: t.id,
            status: t.status,
            agent: t.agentName,
            kind: "fixture"
          };
        }
      }
    ];
    for (const tool of tools) {
      try {
        Promise.resolve(
          document.modelContext.registerTool(tool, { signal: lifecycle.signal })
        ).catch(() => {
        });
      } catch {
      }
    }
    window.addEventListener("pagehide", () => lifecycle.abort(), { once: true });
  }
  if (location.hash !== "#" + page) history.replaceState(null, "", "#" + page);
  render();
  if (sim.persistenceWarning) toast(sim.persistenceWarning);
})();
