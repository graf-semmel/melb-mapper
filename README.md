# OZMAPPER (former MELBMAPPER) 🎮

A fun and interactive game to learn Melbourne's (and Sydney's) suburbs! Test your knowledge by finding suburbs on the map.

🎮 [PLAY NOW ](https://ozmapper.app/) 🎮

## Features

- **Game Mode**: Challenge yourself to find 5 random suburbs on the map
- **Search Mode**: Easily locate any suburb using the search feature
- **Interactive Map**: Hover over suburbs to see their names
- **Score Tracking**: Keep track of your performance with a summary at the end

## Screenshots

![Home Screenshot](/docs/home.png)
_Home screen with city and game/search mode selection_

![Game Screenshot](/docs/game.png)
_Game mode showing the current suburb to find_

![Summary Screenshot](/docs/summary.png)
_End game summary showing your score_

![Search Screenshot](/docs/search.png)
_Search mode with suburb autocomplete_

## Technical Details

Built using:

- Vanilla JavaScript (ES Modules)
- [Leaflet.js](https://leafletjs.com/) for interactive maps
- [Vite](https://vitejs.dev/) for frontend tooling (dev server, build)
- [npm](https://www.npmjs.com/) for package management
- [BiomeJS](https://biomejs.dev/) for code formatting and linting
- Geographical data sourced from OpenStreetMap via Overpass API

## Development

The project uses a modular architecture with the following key files in the `src/` directory:

- `app.js` - Manages UI elements, event handling, and transitions between application views (hero, game, search).
- `game.js` - Contains the core game logic, including round management, scoring, timing, and state tracking.
- `geo.js` - Handles fetching and processing of geographical data (suburbs, boundaries) for different cities.
- `main.js` - Acts as the main application entry point, initializes the map and game, loads city data, and orchestrates interactions between different modules.
- `map.js` - Manages Leaflet map creation, configuration, styling, feature layers, and user interactions (zoom, pan, click, hover).
- `style.css` - Provides all CSS styles, variables, layout rules, and animations for the application interface.
- `utils.js` - Contains miscellaneous utility functions used across the application.

The main user interface is defined in `index.html` in the root directory.

## Local Development

To run the project locally:

1.  Clone the repository:
    ```bash
    git clone https://github.com/graf-semmel/melb-mapper.git
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    This will open the application in your default browser.

## License

This project is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License (CC BY-NC-SA 4.0). See the [LICENSE](LICENSE) file for details.
