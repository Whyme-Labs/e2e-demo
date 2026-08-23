#!/usr/bin/env python3
"""Publish the Claim Interlock static pack preview to here.now anonymously."""
from __future__ import annotations
import hashlib, json, mimetypes, sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent / "site"
RESULT = Path(__file__).resolve().parent / "publish_result.json"
API = "https://here.now/api/v1/publish"

mimetypes.add_type("text/markdown; charset=utf-8", ".md")
mimetypes.add_type("application/zip", ".zip")
mimetypes.add_type("application/pdf", ".pdf")

def mime_for(path: Path) -> str:
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    if mime.startswith("text/") and "charset" not in mime:
        mime += "; charset=utf-8"
    return mime

def request_json(url: str, method: str, payload: dict | None = None, headers: dict | None = None) -> dict:
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    hdrs = {"Accept": "application/json", **(headers or {})}
    if data is not None:
        hdrs["Content-Type"] = "application/json"
    req = Request(url, data=data, headers=hdrs, method=method)
    try:
        with urlopen(req, timeout=120) as resp:
            body = resp.read()
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")
        raise RuntimeError(f"{method} {url} failed: HTTP {exc.code}: {detail}") from exc
    except URLError as exc:
        raise RuntimeError(f"{method} {url} failed: {exc}") from exc
    return json.loads(body or b"{}")

def main() -> int:
    if not ROOT.is_dir():
        raise SystemExit(f"site directory not found: {ROOT}")
    paths = sorted(p for p in ROOT.rglob("*") if p.is_file())
    files = []
    by_rel: dict[str, Path] = {}
    for path in paths:
        rel = path.relative_to(ROOT).as_posix()
        raw = path.read_bytes()
        by_rel[rel] = path
        files.append({
            "path": rel,
            "size": len(raw),
            "contentType": mime_for(path),
            "hash": hashlib.sha256(raw).hexdigest(),
        })
    manifest = {
        "files": files,
        "displayName": "Claim Interlock Product Pack",
        "displayDescription": "Research, architecture, hackathon plan and interactive MVP for secure federated blocker resolution in motor claims.",
        "viewer": {
            "title": "Claim Interlock — Product Pack",
            "description": "Secure cross-company agent coordination for stalled motor claims."
        }
    }
    created = request_json(API, "POST", manifest, {"X-HereNow-Client": "github-actions/claim-interlock"})
    upload = created["upload"]
    for item in upload.get("uploads", []):
        rel = item["path"]
        body = by_rel[rel].read_bytes()
        headers = dict(item.get("headers") or {})
        headers.setdefault("Content-Type", mime_for(by_rel[rel]))
        req = Request(item["url"], data=body, headers=headers, method=item.get("method", "PUT"))
        try:
            with urlopen(req, timeout=300) as resp:
                resp.read()
        except HTTPError as exc:
            detail = exc.read().decode("utf-8", "replace")
            raise RuntimeError(f"upload {rel} failed: HTTP {exc.code}: {detail}") from exc
    finalized = request_json(upload["finalizeUrl"], "POST", {"versionId": upload["versionId"]})
    result = {**created, "finalize": finalized}
    RESULT.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(created["siteUrl"])
    return 0

if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"publish failed: {exc}", file=sys.stderr)
        raise
