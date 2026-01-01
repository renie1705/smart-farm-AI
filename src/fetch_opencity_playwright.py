# path: src/fetch_opencity_playwright.py
"""
Playwright-based fetch to handle pages that generate download links via JavaScript.

Requirements:
  pip install playwright requests
  python -m playwright install   # installs browsers

Usage:
  python src/fetch_opencity_playwright.py --url "PAGE_URL" --out data/raw --debug

This corrected version:
 - validates Playwright is installed and provides a clear error if not
 - collects candidate hrefs via page.evaluate for robustness
 - uses Playwright download event (expect_download) when clicking links/buttons
 - falls back to using requests to download direct file URLs (safer for attachments)
 - sanitizes filenames and ensures output directory exists
 - saves an HTML snapshot when no downloadable link is found (for manual inspection)
"""
import argparse
import logging
import os
import re
import sys
from urllib.parse import urljoin, urlparse
from datetime import datetime

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
except Exception as e:
    sync_playwright = None  # handled below

import requests

USER_AGENT = "groundwater-monitor-playwright/1.0"
EXT_RE = re.compile(r".*\.(csv|xlsx|xls|zip|json|ods)(?:[?#].*)?$", re.IGNORECASE)
KEYWORDS = ("download", "csv", "xls", "xlsx", "resource", "file")


def ensure_dir(path):
    os.makedirs(path, exist_ok=True)
    return path


def sanitize_filename(s: str) -> str:
    s = str(s or "").strip()
    s = re.sub(r"[()/\\]", " ", s)
    s = re.sub(r"\s+", "_", s)
    s = re.sub(r"[^\w\-_\.]", "", s)
    return s or "downloaded_file"


def filename_from_url(url: str) -> str:
    p = urlparse(url).path
    name = os.path.basename(p)
    if not name:
        # try using netloc + timestamp
        name = f"file_{datetime.utcnow().strftime('%Y%m%dT%H%M%SZ')}"
    return sanitize_filename(name)


def save_snapshot(html: str, out_dir: str) -> str:
    ts = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    path = os.path.join(out_dir, f"{ts}_page_snapshot.html")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(html)
    return path


def download_via_requests(url: str, out_dir: str, session: requests.Session = None) -> str:
    session = session or requests.Session()
    session.headers.update({"User-Agent": USER_AGENT})
    r = session.get(url, stream=True, timeout=60)
    r.raise_for_status()
    # try to determine filename from content-disposition
    fn = None
    cd = r.headers.get("content-disposition", "")
    if cd:
        m = re.search(r'filename="?([^";]+)"?', cd)
        if m:
            fn = m.group(1)
    if not fn:
        fn = filename_from_url(r.url)
    out_path = os.path.join(out_dir, fn)
    # stream to file
    with open(out_path, "wb") as fh:
        for chunk in r.iter_content(chunk_size=8192):
            if chunk:
                fh.write(chunk)
    return out_path


def extract_candidate_links_with_playwright(page, base_url: str):
    """
    Use page.evaluate to collect all anchor hrefs and button attributes reliably.
    Returns a list of absolute URLs (strings) and None placeholders for click-needed hints.
    """
    # Collect anchor hrefs and text
    anchors = page.eval_on_selector_all(
        "a",
        """els => els.map(e => ({ href: e.getAttribute('href'), text: e.innerText || '' }))"""
    )
    candidates = []
    for a in anchors:
        href = a.get("href")
        text = (a.get("text") or "").lower()
        if href:
            full = urljoin(base_url, href)
            candidates.append(full)
        elif any(k in text for k in KEYWORDS):
            # anchors with no href but with download-like text
            candidates.append(None)

    # collect buttons that might trigger downloads
    buttons = page.eval_on_selector_all(
        "button, [data-href], [data-url], [data-download]",
        """els => els.map(e => ({ href: e.getAttribute('data-href') || e.getAttribute('data-url') || e.getAttribute('data-download') || e.getAttribute('href'), text: e.innerText || '' }))"""
    )
    for b in buttons:
        href = b.get("href")
        text = (b.get("text") or "").lower()
        if href:
            full = urljoin(base_url, href)
            candidates.append(full)
        elif any(k in text for k in KEYWORDS):
            candidates.append(None)

    # also search page HTML for absolute links to common extensions
    html = page.content()
    for m in re.findall(r"https?://[^\s'\"<>]+(?:csv|xlsx|xls|json|zip|ods)(?:\?[^\s'\"<>]*)?", html, flags=re.I):
        candidates.append(m)

    # dedupe preserving order
    seen = set()
    uniq = []
    for c in candidates:
        # leave None placeholders in (they indicate click attempts)
        if c is None:
            if None not in uniq:
                uniq.append(None)
            continue
        if c in seen:
            continue
        seen.add(c)
        uniq.append(c)
    return uniq


def try_click_and_download(page, element_selector, out_dir, timeout=5000):
    """
    Attempt to click an element (selector string) and capture a download event.
    Returns saved file path or raises.
    """
    with page.expect_download(timeout=timeout) as dl_info:
        page.click(element_selector)
    dl = dl_info.value
    # Save with suggested filename if available
    suggested = dl.suggested_filename if hasattr(dl, "suggested_filename") else None
    if suggested:
        save_name = sanitize_filename(suggested)
    else:
        save_name = filename_from_url(dl.url)
    save_path = os.path.join(out_dir, save_name)
    dl.save_as(save_path)
    return save_path


def download_with_playwright(url: str, out_dir: str, debug: bool = False) -> str:
    if sync_playwright is None:
        raise RuntimeError("Playwright is not installed. Please run: pip install playwright\nthen: python -m playwright install")
    ensure_dir(out_dir)
    saved = None
    # Use requests session as a fallback downloader for direct links
    req_session = requests.Session()
    req_session.headers.update({"User-Agent": USER_AGENT})

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(user_agent=USER_AGENT)
        page = context.new_page()
        try:
            page.goto(url, wait_until="networkidle", timeout=60000)
        except PlaywrightTimeoutError:
            # proceed even if networkidle times out; page content may still be usable
            logging.warning("Timed out waiting for networkidle; continuing with available content")

        # extract candidate links
        try:
            candidates = extract_candidate_links_with_playwright(page, url)
        except Exception:
            candidates = []

        # try direct candidates first (absolute URLs)
        for cand in candidates:
            if cand is None:
                continue
            try:
                if EXT_RE.match(cand):
                    # try requests first (reliable for attachments)
                    try:
                        saved = download_via_requests(cand, out_dir, session=req_session)
                        logging.info("Downloaded via requests: %s", saved)
                        return saved
                    except Exception as e:
                        if debug:
                            logging.exception("requests download failed, will try browser download: %s", e)
                        # Try browser navigation and expect_download
                        try:
                            with page.expect_download(timeout=15000) as dl_info:
                                page.goto(cand, wait_until="networkidle", timeout=30000)
                            dl = dl_info.value
                            suggested = dl.suggested_filename if hasattr(dl, "suggested_filename") else None
                            save_name = sanitize_filename(suggested) if suggested else filename_from_url(dl.url)
                            save_path = os.path.join(out_dir, save_name)
                            dl.save_as(save_path)
                            logging.info("Downloaded via browser: %s", save_path)
                            return save_path
                        except Exception:
                            if debug:
                                logging.exception("Browser download attempt failed for %s", cand)
                            continue
                else:
                    # navigate to candidate and re-check anchors there
                    try:
                        page.goto(cand, wait_until="networkidle", timeout=30000)
                    except PlaywrightTimeoutError:
                        logging.warning("Timeout navigating to candidate %s", cand)
                    # on the new page, look for anchors that look like files
                    new_candidates = extract_candidate_links_with_playwright(page, cand)
                    for nc in new_candidates:
                        if nc and EXT_RE.match(nc):
                            try:
                                saved = download_via_requests(nc, out_dir, session=req_session)
                                logging.info("Downloaded via requests (nested): %s", saved)
                                return saved
                            except Exception:
                                if debug:
                                    logging.exception("Nested requests download failed for %s", nc)
                                # try browser download
                                try:
                                    with page.expect_download(timeout=15000) as dl_info:
                                        page.goto(nc, wait_until="networkidle", timeout=30000)
                                    dl = dl_info.value
                                    save_name = sanitize_filename(dl.suggested_filename) if hasattr(dl, "suggested_filename") else filename_from_url(dl.url)
                                    save_path = os.path.join(out_dir, save_name)
                                    dl.save_as(save_path)
                                    logging.info("Downloaded via browser (nested): %s", save_path)
                                    return save_path
                                except Exception:
                                    if debug:
                                        logging.exception("Browser nested download failed for %s", nc)
                                    continue
            except Exception:
                if debug:
                    logging.exception("Candidate processing failed: %s", cand)
                continue

        # If we have None placeholder (click-needed), try clicking download-like elements
        if None in candidates:
            # look for clickable elements whose inner text contains keywords
            try:
                elements = page.query_selector_all("a, button, [role='button']")
                for el in elements:
                    try:
                        txt = (el.inner_text() or "").lower()
                        if any(k in txt for k in KEYWORDS):
                            # Try to click and capture download
                            if debug:
                                logging.info("Attempting to click element with text: %s", txt[:80])
                            try:
                                with page.expect_download(timeout=10000) as dl_info:
                                    el.click()
                                dl = dl_info.value
                                save_name = sanitize_filename(dl.suggested_filename) if hasattr(dl, "suggested_filename") else filename_from_url(dl.url)
                                save_path = os.path.join(out_dir, save_name)
                                dl.save_as(save_path)
                                logging.info("Downloaded via click: %s", save_path)
                                return save_path
                            except Exception:
                                if debug:
                                    logging.exception("Click-triggered download failed for element text: %s", txt[:80])
                                continue
                    except Exception:
                        continue
            except Exception:
                if debug:
                    logging.exception("Failed while searching clickable elements")

        # Nothing worked: save snapshot for manual inspection
        snap = save_snapshot(page.content(), out_dir)
        raise RuntimeError(f"No downloadable link found. Saved page snapshot to: {snap}")
    # end playwright context


def main(argv):
    parser = argparse.ArgumentParser(description="Playwright fetch for OpenCity resource page.")
    parser.add_argument("--url", required=True, help="OpenCity resource page URL")
    parser.add_argument("--out", default="data/raw", help="Directory to save downloaded file")
    parser.add_argument("--debug", action="store_true", help="Enable debug logging")
    args = parser.parse_args(argv)

    logging.basicConfig(level=logging.DEBUG if args.debug else logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
    try:
        out = download_with_playwright(args.url, args.out, debug=args.debug)
        print(out)
        return 0
    except Exception as e:
        logging.exception("Failed to fetch with Playwright: %s", e)
        print("ERROR:", e, file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))