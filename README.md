# BoardRoute

Live demo: [BoardRoute](https://agonczidemos.github.io/BoardRoute/)

BoardRoute is a browser-based demo for interactive obstacle-aware routing. It generates a simple 2D board, places rectangular obstacles, routes between two pads, and updates the route live as the user changes clearance or edits the board.

The project is meant to show a deployable geometry and routing application that combines browser interaction, TypeScript, C++, WebAssembly, Emscripten, CMake, and Boost.Graph. The editable board state is owned by the React frontend, while the routing computation runs through a C++ module compiled to WASM.

## Features

* Generate randomized rectangular obstacle layouts.
* Route between two pads on a 2D board.
* Adjust obstacle clearance with a live slider.
* Show success or no-path routing results.
* Display route length, bend count, and C++ runtime.
* Drag the route start and end pads.
* Select, move, and resize rectangular obstacles.
* Add new obstacles by clicking on the board.
* Delete the selected obstacle from the control panel.
* Deploy as a static GitHub Pages demo.

## Tech Stack

* TypeScript
* React
* Vite
* Canvas 2D
* C++20
* Boost.Graph A*
* WebAssembly
* Emscripten
* CMake
* GitHub Pages

## Project Structure

```text
src/
  App.tsx                       Main React app, board state, routing state, controls.
  App.css                       App layout and control styling.

  components/
    BoardCanvas.tsx             Canvas component and pointer-event wiring.
    MetricsPanel.tsx            Route metrics display.

    board/
      boardDrawing.ts           Canvas drawing helpers for board, route, pads, obstacles.
      boardGeometry.ts          Coordinate transforms, clamping, and resize geometry.
      boardHitTesting.ts        Pad, obstacle, and resize-handle hit testing.
      boardInteractionTypes.ts  Drag state, cursor types, resize-handle constants.

  demo/
    demoBoard.ts                Initial fallback board and route data.

  routing/
    routeTypes.ts               Shared board, pad, obstacle, route, and metric types.
    routerModule.ts             TypeScript wrapper around the WASM router module.

  types/
    router-module.d.ts          TypeScript declarations for the generated WASM module.

  wasm/
    CMakeLists.txt              C++/Emscripten build configuration.

    src/
      board_types.hpp           Shared C++ board geometry types.
      board_generator.hpp/.cpp  Random board generation and obstacle expansion.
      routing_graph.hpp/.cpp    Boost.Graph A* grid routing.
      route_metrics.hpp/.cpp    Route length, bend, and runtime metric helpers.
      router.hpp/.cpp           Native routing API and orchestration.

    wasm/
      router_module.cpp         Emscripten binding registration.
      router_module_api.hpp     JavaScript/C++ conversion boundary.

    dist/
      router.js                 Generated Emscripten JavaScript module.
      router.wasm               Generated WebAssembly module.
```

## How It Works

The React frontend owns the editable board state: pads, obstacles, selected obstacle, add-obstacle mode, and drag interactions.

When the board changes, the frontend sends the current pads, obstacles, and clearance value to the C++ router through WebAssembly. The C++ side expands the obstacle rectangles by the requested clearance, builds a grid routing graph, runs A* with Boost.Graph, compresses the path to bend points, and returns route geometry and metrics back to TypeScript.

This keeps the demo interactive while still showing native C++ geometry and routing code integrated into a browser application.

## Build

Install dependencies:

```bash
npm install
```

Run the app locally:

```bash
npm run dev
```

Build the frontend:

```bash
npm run build
```

## C++ / WASM

The generated router module is written to:

```text
src/wasm/dist/
```

To recompile the C++ router locally:

```bash
cd src/wasm
emcmake cmake -S . -B build
cmake --build build
```

The frontend imports the generated module from `src/wasm/dist/router.js` and loads the generated `router.wasm` asset through Vite.

## Deployment

BoardRoute is deployed as a static GitHub Pages site.

The current deployment path commits the generated WASM output in `src/wasm/dist/`, then uses GitHub Actions to run the Vite production build and publish the generated `dist/` folder to GitHub Pages.

## Usage

1. Open the demo.
2. Move the clearance slider to expand or shrink obstacle keepouts.
3. Drag the start or end pad to change the route endpoints.
4. Click an obstacle to select it.
5. Drag a selected obstacle to move it.
6. Drag a corner handle to resize it.
7. Use Add obstacle, then click the board to place a new square obstacle.
8. Use Delete selected obstacle to remove the selected rectangle.

## License

No license has been selected yet.
