# FormDesign

FormDesign is an Angular form designer. While the production API is unavailable, the application uses a browser-local mock API so the form creation and preview flows can be exercised without external services.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:4200`. Create a form, select the **demo** calculation, save the details, then drag fields from the toolbox onto the canvas. The demo calculation accepts a **monto** and **tasa** and returns **total**. Save the design or open its preview from the editor.

Forms, configurations, and uploaded images are stored in the browser's `localStorage` under `form-design.local-api.v1`. They are not sent to a server and are not shared across browsers or devices. The UI displays a local-mode banner to make that limitation clear. Clearing this site's browser data removes the mock records.

The local API preserves the service boundary used by the UI and returns typed errors for invalid input, missing records, unsupported images, and storage failures. Replace `FormsService`'s local implementation with the real API adapter when a backend is available.

## Validation

```bash
npm run build
npm test
```

## Deploy to Netlify

Netlify must publish `dist/form-design/browser`, where Angular writes `index.html`.
The included `netlify.toml` configures this for Git-based deploys; `npm run deploy`
uses the same directory for a CLI deploy.
