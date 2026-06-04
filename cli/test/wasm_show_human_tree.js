const http = require("http");
const { spawn } = require("child_process");

const wasm = process.argv[2];

if (!wasm) {
  console.error("missing wasm bundle path");
  process.exit(1);
}

const responses = [
  {
    method: "thread-api/pull",
    transit:
      '["^ ","~:db/id",16764,"~:block/title","type system to strengthen codebase examples","~:block/name","type system to strengthen codebase examples"]',
  },
  {
    method: "thread-api/q",
    transit:
      '[[["^ ","~:db/id",16766,"~:block/title","use type system to ensure block validated, graph-name validated, etc..","~:block/order","a","~:block/parent",["^ ","~:db/id",16764]]],[["^ ","~:db/id",16767,"~:block/title","module type Block : sig\\ntype raw\\ntype validated\\n\\ntype _ t\\n\\nval of_edn : Edn.t -> raw t\\nval validate : raw t -> (validated t, string list) result\\n\\nval uuid : validated t -> Uuidm.t\\nval db_id : validated t -> Db_id.t\\nval title : validated t -> string option\\nval journal_day : validated t -> Journal_day.t option\\nend #Code","~:block/order","b","~:block/parent",["^ ","~:db/id",16766]]],[["^ ","~:db/id",16768,"~:block/title","split block into raw & validated 2 types, all fns need to operate on blocks only accept `validated block`","~:block/order","c","~:block/parent",["^ ","~:db/id",16764]]],[["^ ","~:db/id",16769,"~:block/title","-","~:block/order","d","~:block/parent",["^ ","~:db/id",16764]]]]',
  },
  {
    method: "thread-api/get-block-refs",
    transit: '[["^ ","~:db/id",16763]]',
  },
  {
    method: "thread-api/pull",
    transit:
      '["^ ","~:db/id",16763,"~:block/title","[[type system to strengthen codebase examples]]","~:block/page",["^ ","~:db/id",16760,"~:block/title","May 31st, 2026","~:block/name","may 31st, 2026"]]',
  },
];

let index = 0;

const server = http.createServer((req, res) => {
  let body = "";
  req.setEncoding("utf8");
  req.on("data", (chunk) => {
    body += chunk;
  });
  req.on("end", () => {
    try {
      if (req.method !== "POST" || req.url !== "/v1/invoke") {
        throw new Error(`unexpected request: ${req.method} ${req.url}`);
      }
      const response = responses[index++];
      if (!response) {
        throw new Error(`unexpected extra request: ${body}`);
      }
      if (!body.includes(response.method)) {
        throw new Error(`expected ${response.method}, got ${body}`);
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ resultTransit: response.transit }));
    } catch (error) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { message: error.message } }));
    }
  });
});

function finish(code) {
  server.close(() => process.exit(code));
}

server.listen(0, "127.0.0.1", () => {
  const port = server.address().port;
  const child = spawn(
    process.execPath,
    [wasm, "--graph", "alpha", "show", "--id", "16764"],
    {
      env: {
        ...process.env,
        LOGSEQ_CLI_BASE_URL: `http://127.0.0.1:${port}`,
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  child.on("exit", (code) => {
    try {
      if (code !== 0) {
        throw new Error(`exit ${code}\nstdout:\n${stdout}\nstderr:\n${stderr}`);
      }
      if (index !== responses.length) {
        throw new Error(`handled ${index} requests, expected ${responses.length}`);
      }
      if (stdout.includes("\ntype raw\n")) {
        throw new Error(`multiline tree title lost its prefix:\n${stdout}`);
      }
      if (!stdout.includes("\n      │       type raw\n")) {
        throw new Error(`multiline tree title does not keep tree context:\n${stdout}`);
      }
      if (!stdout.includes("\n      │\n      │       type _ t\n")) {
        throw new Error(`blank lines inside multiline tree title lose their guide:\n${stdout}`);
      }
      if (!stdout.includes("Linked References (1)\n16760 May 31st, 2026\n16763 └── [[type system to strengthen codebase examples]]")) {
        throw new Error(`linked reference page context missing:\n${stdout}`);
      }
      finish(0);
    } catch (error) {
      console.error(error.message);
      finish(1);
    }
  });
});
