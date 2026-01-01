# path: src/fetch_opencity_improved.py
"""
Improved OpenCity fetch using requests + more aggressive link discovery.

Changes vs. your version:
 - More robust extraction of href/data-* attributes (handles lists and missing values)
 - Skips javascript:, mailto:, tel: and fragment-only links
 - Searches onclick attributes for embedded URLs
 - Rejects candidate links that return HTML (avoids saving HTML snapshots as CSV)
 - Adds HTTP retry/backoff using requests.adapters.Retry for transient network issues
 - Better logging and clearer error messages
 - Keeps previous behavior of saving a page snapshot when no candidates are found

Usage:
  python src/fetch_opencity_improved.py --url "PAGE_URL" --out data/raw --debug
"""
import argparse
import logging
import os
import re
import sys
import time
from datetime import datetime
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter, Retry

USER_AGENT = "groundwater-monitor-fetch/1.2"

EXT_CANDIDATES = (".csv", ".xlsx", ".xls", ".ods", ".json", ".zip")
KEYWORD_CANDIDATES = ("download", "resource", "file", "csv", "xls", "xlsx", "storage", "bulk")


def ensure_dir(path):
    os.makedirs(path, exist_ok=True)
    return path


def filename_from_url(url):
    p = urlparse(url).path
    name = os.path.basename(p)
    return name or "downloaded_file"


def save_bytes(content, out_path):
    with open(out_path, "wb") as fh:
        fh.write(content)
    return out_path


def ext_from_content_type(ct):
    if not ct:
        return ""
    ct = ct.split(";")[0].strip().lower()
    mapping = {
        "text/csv": ".csv",
        "application/csv": ".csv",
        "application/vnd.ms-excel": ".xls",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
        "application/zip": ".zip",
        "application/json": ".json",
    }
    return mapping.get(ct, "")


def create_session():
    session = requests.Session()
    retries = Retry(total=3, backoff_factor=1, status_forcelist=(429, 500, 502, 503, 504))
    adapter = HTTPAdapter(max_retries=retries)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    session.headers.update({"User-Agent": USER_AGENT})
    return session


def is_probable_file_response(resp):
    # check headers first
    ct = (resp.headers.get("content-type") or "").lower()
    if any(k in ct for k in ("text/csv", "application/csv", "excel", "spreadsheet", "zip", "json")):
        return True
    # peek at content: if it looks like HTML, it's not a file we want
    head = resp.content[:512].lstrip().lower()
    if head.startswith(b"<!doctype") or head.startswith(b"<html") or b"<script" in head:
        return False
    return True


def download_url(url, out_dir, session, tries=3):
    last_exc = None
    for attempt in range(1, tries + 1):
        try:
            logging.info("Downloading: %s (attempt %d)", url, attempt)
            resp = session.get(url, timeout=30, allow_redirects=True)
            resp.raise_for_status()
            # If response appears to be HTML, don't save as data file
            if not is_probable_file_response(resp):
                raise RuntimeError("URL returned HTML (not a data file)")
            # determine filename
            fn = None
            cd = resp.headers.get("content-disposition", "")
            if cd:
                m = re.search(r'filename="?([^";]+)"?', cd)
                if m:
                    fn = m.group(1)
            if not fn:
                fn = filename_from_url(resp.url)
            base, ext = os.path.splitext(fn)
            if not ext:
                guessed = ext_from_content_type(resp.headers.get("content-type", ""))
                fn = fn + guessed
            ts = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
            out_path = os.path.join(out_dir, f"{ts}_{fn}")
            save_bytes(resp.content, out_path)
            logging.info("Saved file to: %s", out_path)
            return out_path
        except Exception as e:
            logging.warning("Download attempt %d failed for %s: %s", attempt, url, e)
            last_exc = e
            time.sleep(attempt)
    raise last_exc


def clean_candidate_link(href, base_url):
    if not href:
        return None
    # href may be a list (BeautifulSoup sometimes returns lists for attributes), handle that
    if isinstance(href, (list, tuple)):
        for h in href:
            if isinstance(h, str) and h.strip():
                href = h
                break
        else:
            return None
    href = str(href).strip()
    # skip JS handlers and fragments and mail/tel links
    if href.lower().startswith(("javascript:", "mailto:", "tel:", "#")):
        return None
    # convert relative -> absolute
    full = urljoin(base_url, href)
    # avoid data: URIs
    if full.lower().startswith("data:"):
        return None
    return full


def find_data_links(html, base_url):
    soup = BeautifulSoup(html, "lxml")
    candidates = []

    # anchors and link tags with file extensions or keywords
    for tag in soup.find_all(["a", "link"], href=True):
        raw = tag.get("href")
        href = clean_candidate_link(raw, base_url)
        if not href:
            continue
        low = href.lower()
        if any(low.endswith(ext) for ext in EXT_CANDIDATES):
            candidates.append(href)
            continue
        if any(k in low for k in KEYWORD_CANDIDATES):
            candidates.append(href)

    # data-* attributes often contain URLs (handle list values)
    for tag in soup.find_all(True):
        for attr in ("data-download", "data-resource", "data-url", "data-href", "data-src", "href"):
            if attr in tag.attrs:
                raw = tag.attrs.get(attr)
                if raw:
                    if isinstance(raw, (list, tuple)):
                        vals = raw
                    else:
                        vals = [raw]
                    for val in vals:
                        href = clean_candidate_link(val, base_url)
                        if not href:
                            continue
                        candidates.append(href)

    # look into onclick and other attributes for embedded URLs
    for tag in soup.find_all(attrs=True):
        for attr_name, attr_val in tag.attrs.items():
            if not isinstance(attr_val, str):
                continue
            # try to find http(s):// URLs inside attribute values (e.g., onclick)
            for m in re.findall(r"https?://[^\s'\"<>]+", attr_val):
                href = clean_candidate_link(m, base_url)
                if href:
                    candidates.append(href)

    # look into scripts for absolute links (CSV/XLS/JSON/ZIP)
    url_re = re.compile(r"https?://[^\s'\"<>]+(?:csv|xlsx|xls|json|zip)(?:\?[^\s'\"<>]*)?", re.IGNORECASE)
    for s in soup.find_all("script"):
        text = s.string or s.get_text() or ""
        for m in url_re.findall(text):
            candidates.append(m)

    # additional heuristic: search the whole HTML for absolute links with extensions
    for m in re.findall(r"https?://[^\s'\"<>]+(?:csv|xlsx|xls|json|zip)(?:\?[^\s'\"<>]*)?", html, flags=re.I):
        candidates.append(m)

    # preserve order and dedupe
    seen = set()
    uniq = []
    for c in candidates:
        if not c:
            continue
        if c in seen:
            continue
        seen.add(c)
        uniq.append(c)
    return uniq


def save_page_snapshot(html, out_dir):
    try:
        ts = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
        fn = os.path.join(out_dir, f"{ts}_page_snapshot.html")
        with open(fn, "w", encoding="utf-8") as fh:
            fh.write(html)
        logging.info("Saved page snapshot to: %s", fn)
        return fn
    except Exception as e:
        logging.warning("Failed to save page snapshot: %s", e)
        return None


def fetch_from_page(url, out_dir, session):
    logging.info("Fetching page: %s", url)
    resp = session.get(url, timeout=30)
    resp.raise_for_status()
    ctype = (resp.headers.get("content-type") or "").lower()
    # If the initial URL is already a file (not HTML), download it directly
    if "text/html" not in ctype:
        return download_url(url, out_dir, session)
    links = find_data_links(resp.text, url)
    if not links:
        snap = save_page_snapshot(resp.text, out_dir)
        raise RuntimeError(f"No direct data link found on page. Saved HTML snapshot to: {snap}")
    last_exc = None
    for link in links:
        try:
            logging.info("Trying candidate link: %s", link)
            return download_url(link, out_dir, session)
        except Exception as e:
            logging.warning("Candidate link failed: %s -> %s", link, e)
            last_exc = e
    raise RuntimeError(f"All candidate links failed. Last error: {last_exc}")


def main(argv):
    parser = argparse.ArgumentParser(description="Fetch data file from OpenCity resource page (improved).")
    parser.add_argument("--url", required=True, help="OpenCity resource page URL or direct file URL")
    parser.add_argument("--out", default="data/raw", help="Directory to save downloaded file")
    parser.add_argument("--debug", action="store_true", help="Enable debug logging")
    args = parser.parse_args(argv)

    lvl = logging.DEBUG if args.debug else logging.INFO
    logging.basicConfig(level=lvl, format="%(asctime)s %(levelname)s: %(message)s")

    out_dir = ensure_dir(args.out)
    session = create_session()

    try:
        saved = fetch_from_page(args.url, out_dir, session)
        print(saved)
        return 0
    except Exception as e:
        logging.exception("Failed to fetch dataset: %s", e)
        print("ERROR:", e, file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))