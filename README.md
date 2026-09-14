CallSim — Call Center Queue Formation Simulator

A client-side discrete-event simulation (DES) web application that models customer arrivals, agent service times, and queue dynamics in a call center. Built on the classical M/M/c queueing model, it evaluates system performance and surfaces actionable staffing recommendations to reduce waiting time and maximize operational efficiency.

Overview

CallSim is a single-page React application powered by Vite. It implements a discrete-event engine entirely in the browser — every call arrival, service start, and departure is processed as an individual event in a priority-sorted timeline, producing statistically accurate M/M/c queue dynamics without any backend or external API dependency.

The application provides a three-step workflow: set parameters → run simulation → analyze results. Users can either enter parameters manually, choose from preset scenarios, or upload a CSV file to batch-run multiple configurations at once.

Features

· Discrete-Event Engine — Faithfully simulates each call arrival and departure as an individual event in a priority-sorted timeline, giving statistically accurate M/M/c queue dynamics.
· Real-Time Metrics — Tracks queue length, agent utilization, average wait time, and service-level agreement (SLA) compliance across the full simulated period.
· CSV Data Upload — Upload scenario parameters as a CSV file to batch-run multiple configurations (morning peak, afternoon, evening, etc.) all at once.
· Visual Analytics — Interactive charts (powered by Recharts) display queue depth and utilization over time, plus a wait-time distribution histogram to spot bottlenecks at a glance.
· Staffing Recommendations — Automatically surfaces insights about under- or over-staffing and whether your SLA target (answer within 2 minutes) is being met.
· Reproducible Results — Every run uses a seeded pseudo-random number generator (LCG) so results can be replicated exactly for reporting and comparison.
· Preset Scenarios — Quick-start presets including Morning Peak, Afternoon Low, Evening Rush, and Understaffed configurations.

Architecture

The application is entirely client-side — there is no backend or API layer.

```
┌────────────────────────────────────────────────────────────┐
│                     Browser (React SPA)                     │
│                                                            │
│  ┌────────────┐   ┌──────────────────┐   ┌─────────────┐   │
│  │   Home     │──>│   Simulation     │──>│   Results   │   │
│  │  (landing) │   │  (parameters)    │   │  (metrics)  │   │
│  └────────────┘   └────────┬─────────┘   └──────▲──────┘   │
│                            │                     │          │
│                            ▼                     │          │
│                  ┌──────────────────┐            │          │
│                  │   DES Engine     │            │          │
│                  │  (des.js, pure   │            │          │
│                  │   JS M/M/c)      │            │          │
│                  └────────┬─────────┘            │          │
│                           │                      │          │
│                           └──────────────────────┘          │
│                    results passed via React state            │
└────────────────────────────────────────────────────────────┘
```

Simulation results are passed from the Simulation page to the Results page through React state (via useNavigate). No server, database, or external API is involved.

The Model

CallSim implements the classical M/M/c queueing model:

· Arrivals follow a Poisson process with rate λ (calls per hour)
· Service times are exponentially distributed with rate μ per agent (calls per hour per agent)
· c parallel servers (agents)

The traffic intensity ρ = λ / (c·μ) must remain below 1 for the queue to remain stable. The simulator traces each discrete event (arrival, service start, departure) to accumulate time-averaged statistics with full temporal resolution.

Key implementation details from src/simulation/des.js:

· Seedable RNG — A linear congruential generator (LCG) ensures reproducible runs.
· Exponential distribution — Sampled via -ln(U) / rate.
· Event queue — Sorted array acting as a min-heap ordered by event time.
· Time-averaged accumulators — Area under the queue-length curve and area under the busy-agent curve are integrated over time to compute time-average queue length and agent utilization.
· Snapshots — The simulation captures ~300 time snapshots across the simulated period for charting.

Tech Stack

Layer Technology
Framework React 18
Build Tool Vite 5
Routing React Router DOM 6
Charts Recharts 2
CSV Parsing PapaParse 5
Styling Plain CSS (per-component stylesheets)
Deployment Vercel (static SPA with rewrites)

Project Structure

```
callcenter/
├── public/
│   ├── favicon.svg
│   └── sample-data.csv          # Example batch-scenario CSV
├── src/
│   ├── components/
│   │   ├── MetricCard.css
│   │   ├── MetricCard.jsx        # Reusable stat/metric display card
│   │   ├── Navbar.css
│   │   └── Navbar.jsx            # Top navigation bar
│   ├── pages/
│   │   ├── Home.css
│   │   ├── Home.jsx              # Landing page (hero, features, theory)
│   │   ├── Results.css
│   │   ├── Results.jsx           # Charts, metrics, recommendations
│   │   ├── Simulation.css
│   │   └── Simulation.jsx        # Parameter input & CSV upload
│   ├── simulation/
│   │   └── des.js                # Discrete-event M/M/c engine
│   ├── styles/
│   │   └── global.css            # Global styles & CSS variables
│   ├── App.jsx                   # Router & layout
│   └── main.jsx                  # React entry point
├── .gitignore
├── index.html                    # Vite HTML entry point
├── package.json
├── package-lock.json
├── vercel.json                   # SPA rewrite config
└── vite.config.js                # Vite + React plugin config
```

Setup Instructions

Prerequisites

· Node.js 18 or higher
· npm (or yarn / pnpm)

Local Development

1. Clone the repository
   ```bash
   git clone https://github.com/bhousxrenz/callcenter.git
   cd callcenter
   ```
2. Install dependencies
   ```bash
   npm install
   ```
3. Start the development server
   ```bash
   npm run dev
   ```
   Vite will print the local URL (typically http://localhost:5173). Open it in your browser.
4. Build for production
   ```bash
   npm run build
   ```
   The optimized output is written to the dist/ directory.
5. Preview the production build locally
   ```bash
   npm run preview
   ```

Available Scripts

Script Description
npm run dev Start the Vite development server with hot module replacement
npm run build Build the production bundle into dist/
npm run preview Serve the production build locally for testing

Environment Variables

None required. CallSim is a fully client-side application with no backend, database, or third-party API keys. It can be deployed as a static site anywhere.

Deployment

The project is pre-configured for deployment on Vercel via vercel.json, which contains a single SPA rewrite rule:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This ensures that all routes (/simulation, /results, etc.) resolve to index.html so React Router can handle client-side navigation without 404 errors on refresh.

Deploy to Vercel

1. Push your code to a GitHub repository.
2. Import the repository in Vercel.
3. Vercel will auto-detect the Vite framework and configure the build settings (npm run build, output directory dist).
4. Deploy.

Deploy Elsewhere

Because the output is a static dist/ folder, you can host it on Netlify, GitHub Pages, Cloudflare Pages, or any static file server. If your host doesn't support SPA rewrites natively, add a rewrite rule equivalent to the one in vercel.json.

Usage

1. Set Parameters

Navigate to the Simulation page and choose one of two input modes:

· Manual — Enter values for arrival rate (λ, calls/hour), service rate (μ, calls/hour/agent), number of agents (c), and simulation duration (hours). You can also set a random seed for reproducibility.
· CSV Upload — Drag and drop (or click to browse) a CSV file containing multiple scenarios to batch-run. The expected columns are:
  Column Description
  scenario_name Label for the scenario (optional)
  arrival_rate λ — calls per hour
  service_rate μ — calls per hour per agent
  num_agents c — number of parallel servers
  simulation_hours Total simulated wall-clock hours

A sample file is provided at public/sample-data.csv:

```csv
scenario_name,arrival_rate,service_rate,num_agents,simulation_hours
Morning Peak,120,20,8,4
Afternoon,80,20,5,4
Evening Peak,150,20,10,4
Night Shift,30,20,3,4
Weekend Low,50,20,4,8
```

2. Run the Simulation

Click Run Simulation. The DES engine processes thousands of events in milliseconds and navigates you to the Results page.

3. Analyze Results

The Results page displays:

· Summary metric cards — Total arrivals, calls served, average wait time, max queue length, agent utilization %, and SLA compliance (percentage of calls answered within 2 minutes).
· Queue depth over time — Area chart showing queue length across the simulated period.
· Agent utilization over time — Line/area chart showing busy agents as a percentage of total agents.
· Wait-time distribution — Histogram showing how many callers experienced each wait-time bucket.
· Staffing recommendations — Automated insights such as:
  · High utilization warnings with suggested agent additions
  · Low utilization suggestions to reduce staffing
  · SLA compliance assessments against the ≥90% benchmark
  · Peak queue length alerts recommending callback queuing
  · Average wait time warnings recommending IVR deflection

Preset Scenarios

For quick experimentation, the Simulation page offers one-click presets:

Preset Arrival Rate Service Rate Agents Hours
Morning Peak 150 20 10 4
Afternoon Low 60 20 4 4
Evening Rush 130 20 9 4
Understaffed 120 20 4 4

Defaults

When you first open the Simulation page, the parameters default to:

Parameter Default
Arrival rate (λ) 120 calls/hour
Service rate (μ) 20 calls/hour/agent
Number of agents (c) 8
Simulation hours 8
Seed 42

Contributing

Contributions are welcome. To contribute:

1. Fork the repository.
2. Create a feature branch (git checkout -b feature/amazing-feature).
3. Commit your changes (git commit -m 'Add amazing feature').
4. Push to the branch (git push origin feature/amazing-feature).
5. Open a Pull Request.

License

This project is provided as-is for educational and commercial use. See the repository for license details.

---
