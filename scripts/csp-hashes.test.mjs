import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { inlineScriptHashes } from "./csp-hashes.mjs";

const sha = (s) => `'sha256-${createHash("sha256").update(s).digest("base64")}'`;

describe("inlineScriptHashes", () => {
  it("hashes inline scripts and ignores external or empty ones", () => {
    const html =
      '<script src="/_next/a.js" async></script><script>a()</script>' +
      '<script id="x">b()</script><script></script><script>a()</script>';
    expect([...inlineScriptHashes(html)]).toEqual([sha("a()"), sha("b()")]);
  });
});
