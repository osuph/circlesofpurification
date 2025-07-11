class BarcodePage extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
        <style>
            body {
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
            color: #333;
            padding: 20px;
            }
        </style>
        <h1>Barcode Scanner Test Page</h1>
        <p>This page is for testing barcode scanning functionality.</p>
        <video id="video" width="360" height="480"></video>
        <button id="scan">Scan</button>
        <button id="stop">Stop</button>
        <div id="value"></div>
        `;

        const scan = this.shadowRoot.getElementById("scan");
        const stop = this.shadowRoot.getElementById("stop");
        const video = this.shadowRoot.getElementById("video");
        const value = this.shadowRoot.getElementById("value");

        let abort = null;

        const enable = (state) => {
            stop.disabled = state;
            scan.disabled = !state;
        };

        enable(true);

        scan.addEventListener('click', async () => {
            abort = new AbortController();
            abort.signal.addEventListener('abort', () => {
                enable(true);
            });


            enable(false);

            const result = await detect(video, abort.signal);

            if (!result) {
                enable(true);
                return;
            }

            value.innerText = `Result: ${result}`;

            enable(true);
            abort = null;
        });

        stop.addEventListener('click', async () => {
            if (abort) {
                abort.abort();
                abort = null;
            }
        });

        BarcodeDetector.getSupportedFormats()
            .then(formats => console.log(`Supported formats: ${formats.join(", ")}`));
    }
}

customElements.define('barcode-test', BarcodePage);
