import { port } from "./constants.ts";
import { handleRequest } from "./worker.ts";

const shutdownController = new AbortController();

function shutdown(signal: "SIGINT" | "SIGTERM"): void {
  console.log(`Received ${signal}, shutting down...`);
  shutdownController.abort();
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  Deno.addSignalListener(signal, () => shutdown(signal));
}

Deno.serve(
  {
    hostname: "0.0.0.0",
    onListen: ({ port: listeningPort }) => {
      console.log(`Image worker listening on port ${listeningPort}`);
    },
    port,
    signal: shutdownController.signal,
  },
  handleRequest,
);
