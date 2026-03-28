FROM denoland/deno:2.1.4

WORKDIR /app

COPY deno.json deno.lock ./
COPY src ./src

RUN deno cache --lock=deno.lock --frozen --allow-scripts=npm:sharp --allow-env --allow-net --allow-read src/main.ts

ENV PORT=8080

EXPOSE 8080

CMD ["run", "--allow-scripts=npm:sharp", "--allow-env", "--allow-net", "--allow-read", "--allow-ffi", "src/main.ts"]
