# The Circles of purification e-stamp webapp

This is a simple HTML5 Single Page Application (SPA) that allows users to scan QR codes to complete tasks and earn e-stamps. The app is designed to be lightweight and easy to use, with a focus on user experience.

## Development

To run the app locally, you can use `vite` or any other static server. Here's how to do it with `vite`:

1. Navigate to the project directory:

   ```bash
   cd /path/to/circlesofpurification
    ```

2. Run the development server:
    ```bash
    npm run dev # or `npx vite dev`
    ```

# Adding tasks

Tasks are defined in `tasks.json`. A minimal example may look like this:

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
