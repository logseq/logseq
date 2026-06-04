const http = require("http");
const { spawn } = require("child_process");

const wasm = process.argv[2];

if (!wasm) {
  console.error("missing wasm bundle path");
  process.exit(1);
}

let sawStatusSelector = false;
let sawWildcardSelector = false;

const responses = [
  {
    method: "thread-api/pull",
    transit:
      '["^ ","~:db/id",1,"~:block/title","Home","~:block/name","home"]',
  },
  {
    method: "thread-api/q",
    transitFor(body) {
      sawStatusSelector = body.includes("~:logseq.property/status");
      sawWildcardSelector = body.includes("~$*");
      const childFields = [
        '"~:db/id",2',
        '"~:block/title","Ship CLI"',
        '"~:block/order","a"',
        '"~:block/parent",["^ ","~:db/id",1]',
        '"~:block/tags",[["^ ","~:db/ident","~:logseq.class/Task","~:block/title","Task"]]',
      ];
      if (sawStatusSelector) {
        childFields.push(
          '"~:logseq.property/status",["^ ","~:db/ident","~:logseq.property/status.todo","~:block/title","Todo"]'
        );
      }
      if (sawWildcardSelector) {
        childFields.push('"~:user.property/owner",["~:db/id",9]');
        childFields.push('"~:user.property/agent-skills",[[ "~:db/id",10 ]]');
        childFields.push(
          '"~:user.property/reproducible-steps",["~:db/id",11,["~:db/id",12],["~:db/id",13]]'
        );
        childFields.push('"~:user.property/empty-list",[]');
        childFields.push('"~:logseq.property/assignee",[["~:db/id",14]]');
        childFields.push('"~:logseq.property/reviewer",[["~:db/id",18]]');
      }
      return `[[["^ ",${childFields.join(",")}]]]`;
    },
  },
  {
    method: "thread-api/pull",
    transit:
      '["^ ","~:db/id",7,"~:db/ident","~:user.property/owner","~:block/title","Owner","~:logseq.property/type","~:default"]',
  },
  {
    method: "thread-api/pull",
    transit:
      '["^ ","~:db/id",8,"~:db/ident","~:user.property/agent-skills","~:block/title","agent-skills","~:logseq.property/type","~:default"]',
  },
  {
    method: "thread-api/pull",
    transit:
      '["^ ","~:db/id",16,"~:db/ident","~:user.property/reproducible-steps","~:block/title","Reproducible steps","~:logseq.property/type","~:default"]',
  },
  {
    method: "thread-api/pull",
    transit:
      '["^ ","~:db/id",17,"~:db/ident","~:user.property/empty-list","~:block/title","empty-list","~:logseq.property/type","~:default"]',
  },
  {
    method: "thread-api/pull",
    transit:
      '["^ ","~:db/id",15,"~:db/ident","~:logseq.property/assignee","~:block/title","Assignee","~:logseq.property/type","~:default"]',
  },
  {
    method: "thread-api/pull",
    transit:
      '["^ ","~:db/id",19,"~:db/ident","~:logseq.property/reviewer","~:block/title","Reviewer","~:logseq.property/type","~:default"]',
  },
  {
    method: "thread-api/pull",
    transit: '["^ ","~:db/id",9,"~:block/title","Alice"]',
  },
  {
    method: "thread-api/pull",
    transit:
      '["^ ","~:db/id",10,"~:block/title","logseq-answer-machine"]',
  },
  {
    method: "thread-api/pull",
    transit:
      '["^ ","~:db/id",11,"~:logseq.property/value","Type `[[assig` and only see [[Assignee(legacy)]]"]',
  },
  {
    method: "thread-api/pull",
    transit:
      '["^ ","~:db/id",12,"~:logseq.property/value","Expect to see two entries"]',
  },
  {
    method: "thread-api/pull",
    transit:
      '["^ ","~:db/id",13,"~:logseq.property/value","Expected to see the built-in property"]',
  },
  {
    method: "thread-api/pull",
    transit:
      '["^ ","~:db/id",14,"~:block/title","czys-Mac-Studio.local"]',
  },
  {
    method: "thread-api/pull",
    transit:
      '["^ ","~:db/id",18,"~:block/title","general-reviewer.local"]',
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
      const transit =
        typeof response.transitFor === "function"
          ? response.transitFor(body)
          : response.transit;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ resultTransit: transit }));
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
    [wasm, "--graph", "alpha", "show", "--page", "home", "--linked-references=false"],
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
      if (!sawStatusSelector) {
        throw new Error("show tree selector did not request task status");
      }
      if (!sawWildcardSelector) {
        throw new Error("show tree selector did not request custom properties");
      }
      if (!stdout.includes("2 └── Todo Ship CLI #Task")) {
        throw new Error(`task status missing from human show output:\n${stdout}`);
      }
      if (!stdout.includes("  Owner: Alice")) {
        throw new Error(`property line missing from human show output:\n${stdout}`);
      }
      if (!stdout.includes("agent-skills: logseq-answer-machine")) {
        throw new Error(`single cardinality-many property was not rendered inline:\n${stdout}`);
      }
      if (
        !stdout.includes(
          "Reproducible steps:\n        - Type `[[assig` and only see [[Assignee(legacy)]]\n        - Expect to see two entries\n        - Expected to see the built-in property"
        )
      ) {
        throw new Error(`multi-value property was not rendered as outline bullets:\n${stdout}`);
      }
      if (stdout.includes("empty-list")) {
        throw new Error(`empty cardinality-many property should be hidden:\n${stdout}`);
      }
      if (!stdout.includes("Assignee: czys-Mac-Studio.local")) {
        throw new Error(`built-in assignee property missing from human show output:\n${stdout}`);
      }
      if (!stdout.includes("Reviewer: general-reviewer.local")) {
        throw new Error(`non-assignee logseq property missing from human show output:\n${stdout}`);
      }
      if (stdout.includes(":db/id")) {
        throw new Error(`property values should not render :db/id:\n${stdout}`);
      }
      if (index !== responses.length) {
        throw new Error(`handled ${index} requests, expected ${responses.length}`);
      }
      finish(0);
    } catch (error) {
      console.error(error.message);
      finish(1);
    }
  });
});
