import ws from "websocket";
if (typeof (global) !== "undefined") {
  global.WebSocket = ws.w3cwebsocket as unknown as typeof WebSocket;
}

import { Pool } from "@neondatabase/serverless";
import { drizzle, type NeonClient } from "drizzle-orm/neon-serverless";
import { pgTable, serial, varchar } from "drizzle-orm/pg-core";

import { component$, useSignal, useVisibleTask$ } from "@builder.io/qwik";
import { server$, type DocumentHead } from "@builder.io/qwik-city";
import Counter from "~/components/starter/counter/counter";
import Hero from "~/components/starter/hero/hero";
import Infobox from "~/components/starter/infobox/infobox";
import Starter from "~/components/starter/next-steps/next-steps";


const books = pgTable('books', {
  id: serial('id').primaryKey(),
  title: varchar("title"),
  author: varchar("author")
});


export const doDatabaseThing = server$(async function () {
  const connectionString = this.env.get("DATABASE_URL");
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL environment variable");
  }
  const pool = new Pool({ connectionString });
  const db = drizzle(pool as NeonClient);
  const result = await db.select().from(books).execute();
  console.log(result);
  return result;
});


export async function pause(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const streamMultipleDatabaseThingsArbitrarily = server$(async function* () {
  const connectionString = this.env.get("DATABASE_URL");
  if (!connectionString) {
    throw new Error("Missing DATABASE_URL environment variable");
  }
  const pool = new Pool({ connectionString });
  const db = drizzle(pool as NeonClient);
  for (let i = 0; i < 10; i++) {
    const result = await db.select().from(books).execute();
    yield {
      serverTime: Date.now(),
      dbResult: result
    };
    await pause(1000);
  }
});

export default component$(() => {
  const dbResultsDisplay = useSignal("");

  useVisibleTask$(({cleanup})=> { 
    const abortController = new AbortController();
    streamMultipleDatabaseThingsArbitrarily(abortController.signal).then(async (stream)=> { 
        for await (const output of stream) {
          console.log(output);
          dbResultsDisplay.value = JSON.stringify({ 
            time: output.serverTime,
            result: output.dbResult
          });
        }
    });

    cleanup(()=> abortController.abort())
  })

  return (
    <>
      <Hero />
      <button onClick$={() => doDatabaseThing().then(console.log)}>
        Do the database thing
      </button>

      <div>
        {`Streamed DB stuff:`}
        <p>{dbResultsDisplay.value}</p>
      </div>

      <Starter />

      <div role="presentation" class="ellipsis"></div>
      <div role="presentation" class="ellipsis ellipsis-purple"></div>

      <div class="container container-center container-spacing-xl">
        <h3>
          You can <span class="highlight">count</span>
          <br /> on me
        </h3>
        <Counter />
      </div>

      <div class="container container-flex">
        <Infobox>
          <div q: slot="title" class="icon icon-cli">
            CLI Commands
          </div>
          <>
            <p>
              <code>npm run dev</code>
              <br />
              Starts the development server and watches for changes
            </p>
            <p>
              <code>npm run preview</code>
              <br />
              Creates production build and starts a server to preview it
            </p>
            <p>
              <code>npm run build</code>
              <br />
              Creates production build
            </p>
            <p>
              <code>npm run qwik add</code>
              <br />
              Runs the qwik CLI to add integrations
            </p>
          </>
        </Infobox>

        <div>
          <Infobox>
            <div q: slot="title" class="icon icon-apps">
              Example Apps
            </div>
            <p>
              Have a look at the <a href="/demo/flower">Flower App</a> or the{" "}
              <a href="/demo/todolist">Todo App</a>.
            </p>
          </Infobox>

          <Infobox>
            <div q: slot="title" class="icon icon-community">
              Community
            </div>
            <ul>
              <li>
                <span>Questions or just want to say hi? </span>
                <a href="https://qwik.builder.io/chat" target="_blank">
                  Chat on discord!
                </a>
              </li>
              <li>
                <span>Follow </span>
                <a href="https://twitter.com/QwikDev" target="_blank">
                  @QwikDev
                </a>
                <span> on Twitter</span>
              </li>
              <li>
                <span>Open issues and contribute on </span>
                <a href="https://github.com/BuilderIO/qwik" target="_blank">
                  GitHub
                </a>
              </li>
              <li>
                <span>Watch </span>
                <a href="https://qwik.builder.io/media/" target="_blank">
                  Presentations, Podcasts, Videos, etc.
                </a>
              </li>
            </ul>
          </Infobox>
        </div>
      </div>
    </>
  );
});

export const head: DocumentHead = {
  title: "Welcome to Qwik",
  meta: [
    {
      name: "description",
      content: "Qwik site description",
    },
  ],
};
