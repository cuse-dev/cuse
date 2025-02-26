# @cusedev/platforms-browser

Browser platform implementation for cuse using Playwright. This platform provides a REST API for controlling a browser environment through mouse, keyboard, and display interactions.

## Features

- Mouse control (move, click, drag)
- Keyboard input (type, hotkeys)
- Screen operations (screenshots, pixel color)
- Image recognition using OpenCV.js
- Browser-specific navigation
- Swagger/OpenAPI documentation

## Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm run build

# Start production server
pnpm start
```

## API Documentation

Once the server is running, visit `/quickstart-computer/swagger` to view the interactive API documentation.

### Endpoints

#### Mouse Operations

- `POST /api/mouse/move` - Move mouse cursor
- `POST /api/mouse/left-click` - Perform left click
- `POST /api/mouse/right-click` - Perform right click
- `POST /api/mouse/middle-click` - Perform middle click
- `POST /api/mouse/double-click` - Perform double click
- `POST /api/mouse/drag` - Perform drag operation
- `GET /api/mouse/position` - Get cursor position

#### Keyboard Operations

- `POST /api/keyboard/key` - Press a key
- `POST /api/keyboard/type` - Type text
- `POST /api/keyboard/hotkey` - Press hotkey combination
- `POST /api/keyboard/hold` - Hold a key
- `POST /api/keyboard/release` - Release a held key

#### Display Operations

- `GET /api/display/screenshot` - Take screenshot
- `GET /api/display/screen_size` - Get screen dimensions
- `POST /api/display/scroll` - Scroll screen

#### Browser-specific Operations

- `POST /api/navigation/goto` - Navigate to URL
- `POST /api/navigation/back` - Go back
- `POST /api/navigation/forward` - Go forward
- `POST /api/navigation/reload` - Reload page
- `GET /api/navigation/url` - Get current URL
- `GET /api/navigation/title` - Get page title

## Development

### Project Structure

```
src/
├── server/
│   ├── app.ts             # Main Elysia app
│   └── routes/            # API route handlers
├── controllers/           # Action controllers
│   ├── mouse.ts
│   ├── keyboard.ts
│   ├── display.ts
│   └── navigation.ts
├── services/             # Core services
│   ├── browser.ts
│   ├── screenshot.ts
│   └── element.ts
└── types/               # TypeScript types
    └── requests.ts
```

### Adding New Features

1. Define request/response types in `src/types/`
2. Create or update controller in `src/controllers/`
3. Add route handler in `src/server/app.ts`
4. Update OpenAPI documentation
5. Add tests if applicable

## License

MIT
