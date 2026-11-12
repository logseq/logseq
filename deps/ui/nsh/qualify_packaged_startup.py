#!/usr/bin/env python3
"""Qualify actual packaged OCaml/worker/resources with the real App Headless gate.

The default is the existing Headless gate. --native-background additionally
selects the real macOS package launcher/window flow without activation; it does
not establish pixel/UX parity or hardware input.
"""
from __future__ import annotations

import argparse
import base64
import importlib.util
import json
import math
import os
from pathlib import Path
import platform
import re
import signal
import socket
import struct
import subprocess
import tempfile
import time

REPO = Path(__file__).resolve().parents[3]


REMOVED_OVERRIDES = (
    "LUI_OCAML_LIBRARY", "LOGSEQ_NATIVE_ASSET_DIR", "LOGSEQ_DB_WORKER_BIN",
    "NSH_RUNTIME", "NSH_RUNTIME_DIR", "LD_LIBRARY_PATH", "DYLD_LIBRARY_PATH",
    "DYLD_FALLBACK_LIBRARY_PATH", "DYLD_INSERT_LIBRARIES",
)


def package_agent():
    source = Path(os.environ.get("LUI_SOURCE_ROOT", REPO.parent / "lui")).resolve()
    path = source / "tooling/test_nsh_packaged_app.py"
    if not path.is_file():
        raise ValueError(f"Actual LUI packaged agent helper is missing: {path}")
    spec = importlib.util.spec_from_file_location("logseq_packaged_lui_agent", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def native_environment(private, address, inherited):
    environment = inherited.copy()
    for name in REMOVED_OVERRIDES:
        environment.pop(name, None)
    for name, directory in {
        "HOME": "home", "LOGSEQ_ROOT_DIR": "root", "LOGSEQ_GRAPHS_DIR": "graphs",
        "LOGSEQ_UI_STATE_DIR": "state", "XDG_STATE_HOME": "state",
        "XDG_DATA_HOME": "data", "XDG_CACHE_HOME": "cache",
    }.items():
        path = private / directory
        path.mkdir(parents=True, exist_ok=True)
        environment[name] = str(path.resolve())
    environment.update(LOGSEQ_NO_LOGIN_DAEMON="1", LUI_AGENT_BACKGROUND="1",
                       LUI_AGENT_LISTEN=f"{address[0]}:{address[1]}")
    return environment


def save_png(reply, destination):
    if reply.get("format") != "png" or reply.get("capture") != "appkit-content":
        raise ValueError("Packaged host did not return actual AppKit content")
    encoded = reply.get("data")
    if not isinstance(encoded, str) or len(encoded) > 16 * 1024 * 1024:
        raise ValueError("Screenshot must be a bounded base64 PNG")
    png = base64.b64decode(encoded, validate=True)
    if len(png) < 33 or png[:8] != b"\x89PNG\r\n\x1a\n" or png[8:16] != b"\0\0\0\rIHDR":
        raise ValueError("Screenshot has no valid PNG header")
    width, height = struct.unpack(">II", png[16:24])
    if not width or not height or (width, height) != (reply.get("width"), reply.get("height")):
        raise ValueError("Screenshot dimensions disagree with its actual PNG")
    destination.write_bytes(png)
    return {"file": str(destination), "width": width, "height": height,
            "capture": "appkit-content", "pixelAndUxParity": "unqualified"}


def wait_find(agent, selector, deadline):
    while time.monotonic() < deadline:
        reply = agent.request(op="find", selector=selector)
        if reply.get("nodes"):
            return reply
        time.sleep(min(0.05, max(0, deadline - time.monotonic())))
    raise RuntimeError(f"Packaged native view did not become ready: {selector}")


def dated_journal_header(tree, helper):
    # Match the actual default English journal title, regardless of node kind.
    # The caller supplies only the canonical journals subtree, never the sidebar.
    pattern = r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) [0-9]{1,2}(?:st|nd|rd|th), [0-9]{4}"
    for node in helper.nodes(tree):
        text = node.get("props", {}).get("text")
        if isinstance(text, str) and re.fullmatch(pattern, text.strip()):
            return {"node": node.get("id"), "dateHeaderText": text.strip()}
    return None


def positive_bounds(value):
    return (isinstance(value, list) and len(value) == 4
            and all(type(number) in (int, float) and math.isfinite(number) for number in value)
            and value[2] > 0 and value[3] > 0)


def intersect_bounds(left, right):
    x, y = max(left[0], right[0]), max(left[1], right[1])
    width = min(left[0] + left[2], right[0] + right[2]) - x
    height = min(left[1] + left[3], right[1] + right[3]) - y
    return [x, y, width, height] if width > 0 and height > 0 else None


def visible_native_bounds(reply):
    diagnostics = reply.get("diagnostics", {})
    if (reply.get("ok") is not True or reply.get("op") != "native-bounds"
            or diagnostics.get("present") is not True
            or diagnostics.get("intersectsViewport") is not True
            or diagnostics.get("windowVisible") is not True
            or diagnostics.get("applicationHidden") is not False
            or diagnostics.get("scanTruncated") is not False
            or diagnostics.get("ancestryTruncated") is not False
            or diagnostics.get("coordinateSpace") !=
            "AppKit window content; not Core layout or desktop screen"):
        return None
    bounds, viewport = diagnostics.get("contentBounds"), diagnostics.get("viewport")
    if not positive_bounds(bounds) or not positive_bounds(viewport):
        return None
    ancestors = diagnostics.get("ancestors")
    if not isinstance(ancestors, list) or not ancestors or ancestors[-1].get("isContentRoot") is not True:
        return None
    for ancestor in ancestors:
        if ancestor.get("hidden") is not False or ancestor.get("hiddenByAncestor") is not False:
            return None
        for opacity in (ancestor.get("alpha"), ancestor.get("layerOpacity")):
            if opacity is not None and (type(opacity) not in (int, float)
                                       or not math.isfinite(opacity) or opacity <= 0):
                return None
        if ancestor.get("alpha") is None:
            return None
    return intersect_bounds(bounds, viewport)


def journal_native_bounds(agent, header):
    selectors = {
        "main": "prop:accessibility-identifier=main-content-container",
        "journals": "prop:accessibility-identifier=journals",
        "dateHeader": f"id:{header['node']}",
    }
    replies = {name: agent.request(op="native-bounds", selector=selector)
               for name, selector in selectors.items()}
    visible = {name: visible_native_bounds(reply) for name, reply in replies.items()}
    if any(bounds is None for bounds in visible.values()):
        return None
    # All three committed native regions must share visible window content.
    overlap = intersect_bounds(visible["dateHeader"], visible["journals"])
    if overlap is None or intersect_bounds(overlap, visible["main"]) is None:
        return None
    return replies


def wait_journal_body(agent, helper, deadline):
    selector = "prop:accessibility-identifier=journals"
    while time.monotonic() < deadline:
        matches = agent.request(op="find", selector=selector).get("nodes", [])
        if len(matches) > 1:
            raise RuntimeError("Packaged application has multiple canonical journals roots")
        if matches:
            subtree = agent.request(op="tree", selector=selector)
            header = dated_journal_header(subtree, helper)
            if header:
                bounds = journal_native_bounds(agent, header)
                if bounds is not None:
                    return subtree, {**header, "nativeBounds": bounds}
        time.sleep(min(0.05, max(0, deadline - time.monotonic())))
    raise RuntimeError("Actual dated journal body did not become natively visible before the deadline")



def open_sidebar_layout_ready(replies):
    if any(visible_native_bounds(reply) is None for reply in replies.values()):
        return False
    main, sidebar, contents = (replies[name]["diagnostics"] for name in ("main", "sidebar", "contents"))
    viewport = main["viewport"]
    if sidebar["viewport"] != viewport or contents["viewport"] != viewport:
        return False
    body, shell, inner = (item["contentBounds"] for item in (main, sidebar, contents))
    # The content column retains its authored width during the split's opening
    # transition. Matching only the narrow animated shell would accept a clipped
    # sidebar. One AppKit point allows the existing border/rounding difference.
    def close(left, right):
        return math.isclose(left, right, rel_tol=0, abs_tol=1.0)

    return (close(shell[0], viewport[0])
            and close(body[0], shell[0] + shell[2])
            and close(body[0], inner[0] + inner[2])
            and close(body[0] + body[2], viewport[0] + viewport[2]))


def wait_open_sidebar_layout(agent, deadline):
    selectors = {
        "main": "prop:accessibility-identifier=main-content-container",
        "sidebar": "prop:accessibility-identifier=left-sidebar",
        "contents": "prop:accessibility-identifier=left-sidebar-scroll",
    }
    while time.monotonic() < deadline:
        replies = {name: agent.request(op="native-bounds", selector=selector)
                   for name, selector in selectors.items()}
        if open_sidebar_layout_ready(replies):
            return replies
        time.sleep(min(0.05, max(0, deadline - time.monotonic())))
    raise RuntimeError("Packaged open sidebar did not reach its native content layout before capture")


def native_press(agent, selector):
    reply = agent.request(op="native-press", selector=selector)
    if reply.get("handled") is not True or reply.get("activation") != "native-controller":
        raise RuntimeError(f"Actual native controller did not handle {selector}: {reply}")
    return reply


def wait_native_visibility(agent, selector, expected, deadline):
    while time.monotonic() < deadline:
        reply = agent.request(op="native-bounds", selector=selector)
        if reply.get("ok") is not True:
            raise RuntimeError(f"Native menu inspection failed: {reply}")
        if (visible_native_bounds(reply) is not None) == expected:
            return reply
        time.sleep(min(0.05, max(0, deadline - time.monotonic())))
    raise RuntimeError(f"Native menu visibility did not become {expected}: {selector}")


def background_native(application, private, logs, deadline):
    helper = package_agent()
    executable = application / "Contents/MacOS/Logseq"
    if not executable.is_file() or not os.access(executable, os.X_OK):
        raise ValueError("Package is missing its actual executable Logseq launcher")
    logs.mkdir(parents=True, exist_ok=True)
    with socket.socket() as reservation:
        reservation.bind(("127.0.0.1", 0))
        address = reservation.getsockname()
    environment = native_environment(private, address, os.environ)
    result = {"qualified": False, "boundary": "qualified-background-native-window",
              "launcher": str(executable), "removedOverrides": list(REMOVED_OVERRIDES),
              "privateRoot": str(private), "pixelAndUxParity": "unqualified",
              "hardwareInput": "unqualified"}
    process = None
    agent = None
    try:
        with (logs / "native.log").open("wb") as output, \
                (logs / "agent.jsonl").open("w", encoding="utf-8") as transcript:
            process = subprocess.Popen([str(executable), "--startup-preflight", str(private)],
                                       cwd=private, env=environment, stdin=subprocess.DEVNULL,
                                       stdout=output, stderr=output, start_new_session=True)
            try:
                agent = helper.Agent(helper.connect(process, address, deadline), deadline, transcript)
                hello = agent.request(op="hello")
                if (hello.get("protocol") != "lui-agent" or hello.get("version") != 1
                        or hello.get("host") != "logseq-native"):
                    raise RuntimeError(f"Unexpected packaged agent protocol: {hello}")
                if not {"native-press", "native-bounds", "screenshot"}.issubset(hello.get("host_native_ops", [])):
                    raise RuntimeError("Package does not advertise the required actual native operations")
                if hello.get("backend_error"):
                    raise RuntimeError(f"Packaged renderer failed: {hello['backend_error']}")
                result["hello"] = hello
                own_listener = f"lui-agent listening on {address[0]}:{address[1]}"
                if own_listener not in (logs / "native.log").read_text(encoding="utf-8", errors="replace"):
                    raise RuntimeError("Launched process did not prove ownership of its agent endpoint")
                wait_find(agent, "prop:accessibility-identifier=left-menu", deadline)
                native_press(agent, "prop:accessibility-identifier=left-menu")
                wait_find(agent, "text:Journals", deadline)
                tree = agent.request(op="tree")
                if not any(node.get("props", {}).get("text") == "Journals" for node in helper.nodes(tree)):
                    raise RuntimeError("Actual packaged Journals semantic content is missing")
                (logs / "journal-tree.json").write_text(json.dumps(tree, indent=2) + "\n", encoding="utf-8")
                subtree, result["journalBody"] = wait_journal_body(agent, helper, deadline)
                (logs / "journal-body-tree.json").write_text(json.dumps(subtree, indent=2) + "\n", encoding="utf-8")
                result["openSidebarLayout"] = wait_open_sidebar_layout(agent, deadline)
                result["screenshots"] = [save_png(agent.request(op="screenshot"), logs / "journal.png")]
                graph_trigger = "prop:accessibility-identifier=graphs-selector-trigger"
                graph_item = "kind:menu-item&text:Create db graph"
                result["graphMenuOpen"] = native_press(agent, graph_trigger)
                result["graphMenuBounds"] = wait_native_visibility(agent, graph_item, True, deadline)
                result["screenshots"].append(save_png(agent.request(op="screenshot"), logs / "graph-menu.png"))
                result["graphMenuClose"] = native_press(agent, graph_trigger)
                result["graphMenuClosedBounds"] = wait_native_visibility(agent, graph_item, False, deadline)
                result["more"] = native_press(agent, "prop:accessibility-identifier=toolbar-dots-btn")
                wait_find(agent, "kind:menu-item&text:Appearance", deadline)
                result["moreBounds"] = wait_native_visibility(
                    agent, "kind:menu-item&text:Appearance", True, deadline)
                result["screenshots"].append(save_png(agent.request(op="screenshot"), logs / "more.png"))
                result["appearance"] = native_press(agent, "kind:menu-item&text:Appearance")
                wait_find(agent, "prop:accessibility-identifier=appearance_settings", deadline)
                result["screenshots"].append(save_png(agent.request(op="screenshot"), logs / "appearance.png"))
                if process.poll() is not None:
                    raise RuntimeError("Packaged application exited during the native flow")
                output.flush()
                state = re.findall(r"Logseq background window: active=(true|false), hidden=(true|false)",
                                   (logs / "native.log").read_text(encoding="utf-8", errors="replace"))
                if not state or any(pair != ("false", "false") for pair in state):
                    raise RuntimeError(f"Background launch did not prove inactive, unhidden state: {state}")
                result["backgroundState"] = {"active": False, "hidden": False,
                                             "evidence": "actual startup log"}
                result["qualified"] = True
            finally:
                if agent:
                    agent.close()
                if process:
                    result["shutdown"] = helper.stop(process)
                    # A crashed parent can leave a worker in its original group;
                    # helper.stop returns early when that parent already exited.
                    # This is only the fresh group this qualifier created.
                    try:
                        os.killpg(process.pid, signal.SIGKILL)
                    except ProcessLookupError:
                        pass
                    result["exitCode"] = process.returncode
    except Exception as error:
        result.update(qualified=False, error=str(error))
        raise
    finally:
        (logs / "result.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    return result


def installed_artifacts(application, system):
    if system == "Darwin":
        resources = application / "Contents/Resources"
        return application / "Contents/MacOS/logseq-nsh", resources, resources / "liblogseq_ui.dylib"
    if system == "Linux":
        resources = application / "Resources"
        return application / "logseq-nsh", resources, resources / "liblogseq_ui.so"
    raise ValueError("Packaged App startup currently requires native macOS or Linux")


def qualify(archive, evidence, native_background=False):
    archive = archive.resolve(strict=True)
    system = platform.system()
    if native_background and system != "Darwin":
        raise ValueError("--native-background requires actual native macOS")
    deadline = time.monotonic() + 50 if native_background else None
    if system not in ("Darwin", "Linux"):
        raise ValueError("Packaged App startup currently requires native macOS or Linux")
    with tempfile.TemporaryDirectory(prefix="logseq-nsh-package-") as directory:
        outside = Path(directory).resolve()
        if outside == REPO or REPO in outside.parents:
            raise ValueError("Package extraction must be outside the checkout; change TMPDIR")
        if system == "Darwin":
            subprocess.run(["ditto", "-x", "-k", str(archive), str(outside)], check=True,
                           timeout=max(0.01, deadline-time.monotonic()) if deadline else None)
            application = outside / "Logseq NSH.app"
            subprocess.run(["codesign", "--verify", "--deep", "--strict", str(application)], check=True,
                           timeout=max(0.01, deadline-time.monotonic()) if deadline else None)
        else:
            subprocess.run(["tar", "-xzf", str(archive), "-C", str(outside)], check=True,
                           timeout=max(0.01, deadline-time.monotonic()) if deadline else None)
            application = outside / "Logseq-NSH"
        executable, resources, library = installed_artifacts(application, system)
        worker = resources / "logseq-db-worker"
        for artifact in (executable, library, worker, resources / "dicts/en.edn"):
            if not artifact.is_file():
                raise ValueError(f"The actual package is missing {artifact.relative_to(outside)}")
        if not os.access(executable, os.X_OK) or not os.access(worker, os.X_OK):
            raise ValueError("Packaged native host/worker must retain executable permissions")
        if native_background:
            private = outside / "private"
            private.mkdir()
            result = background_native(application, private.resolve(),
                                       evidence.resolve().with_suffix(""), deadline)
            result.update(archive=str(archive), platform=system, outsideCheckout=True,
                          nativeWindowLaunch="qualified-background-native-window")
            evidence.parent.mkdir(parents=True, exist_ok=True)
            evidence.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
            return result
        environment = os.environ.copy()
        environment.update(LUI_OCAML_LIBRARY=str(library),
                           LOGSEQ_NATIVE_ASSET_DIR=str(resources), LOGSEQ_DB_WORKER_BIN=str(worker))
        subprocess.run(["cargo", "test", "--locked", "--manifest-path", "deps/ui/nsh/Cargo.toml",
                        "--test", "startup_preflight", "--", "--exact",
                        "real_application_startup_preflight", "--nocapture"],
                       cwd=REPO, env=environment, check=True)
        result = {
            "qualified": True, "archive": str(archive), "platform": system,
            "extractionDirectory": str(outside), "outsideCheckout": True,
            "boundary": "actual packaged OCaml library, worker and resources in real App Headless startup",
            "nativeWindowLaunch": "unqualified", "pixelAndUxParity": "unqualified",
        }
        evidence.parent.mkdir(parents=True, exist_ok=True)
        evidence.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
        return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    parser.add_argument("--evidence", type=Path, required=True)
    parser.add_argument("--native-background", action="store_true",
                        help="Qualify the actual macOS launcher/window and native menu without activation")
    args = parser.parse_args()
    try:
        print(json.dumps(qualify(args.archive, args.evidence, args.native_background)))
    except (OSError, ValueError, RuntimeError, subprocess.SubprocessError) as error:
        parser.exit(1, f"Actual packaged App startup failed: {error}\n")


if __name__ == "__main__":
    main()
