# path: src/fetch_data.py
"""
Fetch dataset files from the provided OpenCity dataset page URL.

Usage:
    python src/fetch_data.py --url "https://data.opencity.in/dataset/....resource/..." --out data/raw

The script will:
 - try to download the URL directly (handles redirect/file responses)
 - if the URL returns HTML it will parse for .csv/.xlsx/.xls links and try to download the first match
 - save the downloaded file under out_dir with a timestamped filename
"""
import argparse
import os
import re
import sys
from datetime import datetime
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

USER_AGENT = "groundwater-monitor/1.0 (+https://github.com/)"

def ensure_dir(path):
    os.makedirs(path, exist_ok=True)
    return path

def filename_from_url(url):
    path = urlparse(url).path
    name = os.path.basename(path)
    if not name:
        # fallback to timestamp
        name = "downloaded_file"
    return name

def save_content(content, out_path):
    with open(out_path, "wb") as f:
        f.write(content)
    return out_path

def download_file(url, out_dir):
    headers = {"User-Agent": USER_AGENT}
    print(f"Downloading: {url}")
    resp = requests.get(url, headers=headers, allow_redirects=True, timeout=30)
    resp.raise_for_status()
    # determine filename
    fn = None
    if "content-disposition" in resp.headers:
        cd = resp.headers.get("content-disposition")
        m = re.search(r'filename="?([^";]+)"?', cd)
        if m:
            fn = m.group(1)
    if not fn:
        fn = filename_from_url(resp.url)
    timestamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    out_path = os.path.join(out_dir, f"{timestamp}_{fn}")
    save_content(resp.content, out_path)
    print(f"Saved to: {out_path}")
    return out_path

def find_first_data_link(html, base_url):
    soup = BeautifulSoup(html, "lxml")
    # Look for anchor tags with csv/xlsx/xls
    tags = soup.find_all("a", href=True)
    candidates = []
    for a in tags:
        href = a["href"]
        href_l = href.lower()
        if href_l.endswith(".csv") or href_l.endswith(".xlsx") or href_l.endswith(".xls"):
            candidates.append(urljoin(base_url, href))
    # Also look for links in scripts (sometimes direct). If none found, try to find links to data.opencity storage or raw github content
    if candidates:
        return candidates[0]
    # If none, try to look for links that contain "download" or "resource"
    for a in tags:
        href = a["href"]
        if "download" in href.lower() or "resource" in href.lower():
            return urljoin(base_url, href)
    return None

def download_from_page(url, out_dir):
    headers = {"User-Agent": USER_AGENT}
    print(f"Fetching page: {url}")
    resp = requests.get(url, headers=headers, timeout=30)
    resp.raise_for_status()
    content_type = resp.headers.get("content-type", "").lower()
    if "text/html" not in content_type:
        # Likely a direct file
        return download_file(url, out_dir)
    # Parse HTML
    data_link = find_first_data_link(resp.text, url)
    if not data_link:
        raise RuntimeError("Could not find a CSV/XLSX link on the page. Please provide the direct file URL if possible.")
    return download_file(data_link, out_dir)

def main(args):
    out_dir = ensure_dir(args.out)
    try:
        path = download_from_page(args.url, out_dir)
        print("Download complete:", path)
    except Exception as e:
        print("Error while downloading:", e)
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Download dataset file(s) from a dataset page or a direct link.")
    parser.add_argument("--url", required=True, help="Page URL or direct file URL to download.")
    parser.add_argument("--out", default="data/raw", help="Output directory to save files.")
    args = parser.parse_args()
    main(args)