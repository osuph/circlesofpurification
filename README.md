# The Circles of purification e-stamp webapp

This is a simple HTML5 Single Page Application (SPA) that allows users to scan QR codes to complete tasks and earn e-stamps. The app is designed to be lightweight and easy to use, with a focus on user experience.

## Tech Stack

- **TypeScript** - Type-safe JavaScript for better developer experience
- **Vite** - Fast build tool and dev server
- **Playwright** - End-to-end testing framework
- **Shoelace** - Web components library for UI
- **Barcode Detector API** - QR code scanning

## Development

To run the app locally, you can use `vite` or any other static server. Here's how to do it with `vite`:

1. Navigate to the project directory:

   ```bash
   cd /path/to/circlesofpurification
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev # or `npx vite dev`
   ```

4. Open your browser to `http://localhost:5173`

## Building for Production

To build the app for production:

```bash
npm run build
```

The built files will be in the `dist` directory.

To preview the production build locally:

```bash
npm run preview
```

## Testing

The app uses Playwright for end-to-end testing. To run the tests:

1. Install Playwright browsers (first time only):
   ```bash
   npx playwright install --with-deps chromium
   ```

2. Run tests:
   ```bash
   npm run test        # Run all tests
   npm run test:ui     # Run tests with UI mode
   npm run test:debug  # Run tests in debug mode
   npm run test:headed # Run tests in headed mode
   ```

### Test Coverage

The test suite includes:
- Home page rendering and quest display
- Challenge card interactions
- QR scanner functionality
- Quest completion workflow
- LocalStorage persistence

## Type Checking

To check types without emitting files:

```bash
npm run typecheck
```

# Adding tasks

Tasks are defined in `public/tasks.json`. A minimal example may look like this:

```json
[
    {
        "name": "The First Spark",
        "desc": "Locate the ancient glyph that ignites the journey.",
        "flag": "purification_01"
    }
]
```

Where:

- `name`: The name of the task.
- `desc`: A brief description of the task.
- `flag`: A unique identifier for the task, used to verify completion.

To be able to complete a task, the user must scan a QR code that contains the `flag` value. The app will then check if the scanned value matches any of the tasks defined in `tasks.json`. Make sure to generate QR codes for the `flag` values of your tasks. You can use any QR code generator, such as [qr-code-generator.com](https://www.qr-code-generator.com/).

## Deployment

The app is automatically deployed to GitHub Pages when changes are pushed to the `main` branch. The deployment workflow:

1. Installs dependencies
2. Builds the app with Vite
3. Deploys the `dist` folder to GitHub Pages

The workflow configuration can be found in `.github/workflows/deploy.yml`.

## Continuous Integration

The CI workflow runs on every push and pull request:

1. Type checks the code
2. Builds the project
3. Runs Playwright tests

The workflow configuration can be found in `.github/workflows/ci.yml`.
