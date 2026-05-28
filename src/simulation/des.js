/**
 * Discrete-Event Simulation (DES) Engine
 * Models M/M/c queue (multi-server with Poisson arrivals & exponential service times)
 */

// Simple seedable pseudo-random number generator (LCG)
function createRng(seed = 42) {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(s ^ (s >>> 17), 0x45d9f3b);
    s = Math.imul(s ^ (s >>> 11), 0x4c957f2d);
    s ^= s >>> 16;
    return ((s >>> 0) / 0xFFFFFFFF);
  };
}

// Exponential distribution: -ln(1-U) / rate
function expDist(rng, rate) {
  const u = Math.max(1e-10, rng());
  return -Math.log(u) / rate;
}

/**
 * runSimulation(params) → SimulationResult
 *
 * params:
 *   arrivalRate      {number}  calls per hour
 *   serviceRate      {number}  calls per hour per agent (μ)
 *   numAgents        {number}  c — number of parallel servers
 *   simulationHours  {number}  total simulated wall-clock hours
 *   seed             {number?} random seed for reproducibility
 *
 * returns: { summary, timeSeriesData, waitTimeHistogram, rawWaitTimes }
 */
export function runSimulation({
  arrivalRate,
  serviceRate,
  numAgents,
  simulationHours,
  seed = 42,
}) {
  const rng = createRng(seed);
  const simEnd = simulationHours;           // hours
  const agents = numAgents;

  // ── Event queue (min-heap by time via sorted push) ──
  const events = [];
  const pushEvent = (evt) => {
    events.push(evt);
    // Insertion sort is fine for typical event queue sizes here
    events.sort((a, b) => a.t - b.t);
  };

  // ── State ──
  let busyAgents = 0;
  const waitQueue = [];          // { arrivalT }
  let clock = 0;

  // ── Accumulators ──
  let totalArrivals = 0;
  let totalServed = 0;
  const allWaitMinutes = [];     // individual wait times in minutes
  let maxQLen = 0;
  let areaUnderQueue = 0;        // for time-average queue length
  let areaUnderBusy = 0;         // for utilization
  let lastEventT = 0;

  const SNAPSHOT_COUNT = 300;
  const snapshotInterval = simEnd / SNAPSHOT_COUNT;
  let nextSnapshotT = 0;
  const timeSeriesData = [];

  // ── Helper: update time-average accumulators ──
  const updateArea = () => {
    const dt = clock - lastEventT;
    areaUnderQueue += waitQueue.length * dt;
    areaUnderBusy  += busyAgents * dt;
    lastEventT = clock;
  };

  // ── Snapshot ──
  const takeSnapshot = () => {
    while (clock >= nextSnapshotT && nextSnapshotT <= simEnd) {
      timeSeriesData.push({
        time:        Math.round(nextSnapshotT * 60),    // minutes
        timeH:       +nextSnapshotT.toFixed(2),
        queueLength: waitQueue.length,
        utilization: agents > 0 ? Math.round((busyAgents / agents) * 100) : 0,
        busyAgents,
      });
      nextSnapshotT += snapshotInterval;
    }
  };

  // ── Schedule first arrival ──
  pushEvent({ t: expDist(rng, arrivalRate), type: 'ARR' });

  // ── Main loop ──
  while (events.length > 0) {
    const evt = events.shift();
    if (evt.t > simEnd) break;
    clock = evt.t;
    updateArea();
    takeSnapshot();

    if (evt.type === 'ARR') {
      totalArrivals++;

      if (busyAgents < agents) {
        // Serve immediately
        busyAgents++;
        allWaitMinutes.push(0);
        const svcTime = expDist(rng, serviceRate);
        pushEvent({ t: clock + svcTime, type: 'DEP', waitMin: 0 });
      } else {
        // Join queue
        waitQueue.push({ arrivalT: clock });
        if (waitQueue.length > maxQLen) maxQLen = waitQueue.length;
      }

      // Schedule next arrival
      const nextArrT = clock + expDist(rng, arrivalRate);
      if (nextArrT < simEnd) {
        pushEvent({ t: nextArrT, type: 'ARR' });
      }

    } else if (evt.type === 'DEP') {
      totalServed++;

      if (waitQueue.length > 0) {
        const next = waitQueue.shift();
        const waitMin = (clock - next.arrivalT) * 60;
        allWaitMinutes.push(waitMin);
        const svcTime = expDist(rng, serviceRate);
        pushEvent({ t: clock + svcTime, type: 'DEP', waitMin });
      } else {
        busyAgents--;
      }
    }
  }

  // ── Summary ──
  const avgWaitMin = allWaitMinutes.length
    ? allWaitMinutes.reduce((a, b) => a + b, 0) / allWaitMinutes.length
    : 0;

  const avgQueueLen = simEnd > 0 ? areaUnderQueue / simEnd : 0;
  const avgBusy     = simEnd > 0 ? areaUnderBusy  / simEnd : 0;
  const utilPct     = agents > 0 ? (avgBusy / agents) * 100 : 0;

  // Service level: % answered within 2 minutes
  const sla2Min = allWaitMinutes.length
    ? (allWaitMinutes.filter(w => w <= 2).length / allWaitMinutes.length) * 100
    : 0;

  // Theoretical traffic intensity (Erlang A)
  const rho = arrivalRate / (agents * serviceRate); // utilisation per server

  // ── Wait-time histogram (20 buckets up to 99th-pctile) ──
  const sorted = [...allWaitMinutes].sort((a, b) => a - b);
  const p99   = sorted[Math.floor(sorted.length * 0.99)] ?? 0;
  const maxBin = Math.max(p99, 1);
  const nBins  = 20;
  const bSize  = maxBin / nBins;

  const histogram = Array.from({ length: nBins }, (_, i) => ({
    label: `${(i * bSize).toFixed(1)}–${((i + 1) * bSize).toFixed(1)}`,
    min:   i * bSize,
    max:   (i + 1) * bSize,
    count: 0,
  }));
  allWaitMinutes.forEach(w => {
    const idx = Math.min(Math.floor(w / bSize), nBins - 1);
    histogram[idx].count++;
  });

  return {
    summary: {
      totalArrivals,
      totalServed,
      avgWaitMin:    +avgWaitMin.toFixed(2),
      maxQueueLen,
      avgQueueLen:   +avgQueueLen.toFixed(2),
      utilPct:       +utilPct.toFixed(1),
      sla2Min:       +sla2Min.toFixed(1),
      rho:           +rho.toFixed(3),
      numAgents:     agents,
      arrivalRate,
      serviceRate,
      simulationHours,
    },
    timeSeriesData,
    waitTimeHistogram: histogram,
    rawWaitTimes: allWaitMinutes,
  };
}

/**
 * parseCSV row → simulation params (one set per row)
 * Expected columns: scenario_name, arrival_rate, service_rate, num_agents, simulation_hours
 */
export function parseCSVParams(rows) {
  return rows
    .filter(r => r.arrival_rate && r.service_rate && r.num_agents)
    .map(r => ({
      scenarioName:    r.scenario_name   || 'Scenario',
      arrivalRate:     +r.arrival_rate,
      serviceRate:     +r.service_rate,
      numAgents:       +r.num_agents,
      simulationHours: +r.simulation_hours || 8,
    }));
}
