from googleapiclient.discovery import build
import re
import requests
import mistune
from typing import List, Tuple
import datetime
from serpapi import GoogleSearch
from django.conf import settings
from django.core.cache import cache
from requests.exceptions import RequestException

SERVICE_ACCOUNT_FILE = settings.CREDENTIALS_FILE
SCOPES = ["https://www.googleapis.com/auth/documents", "https://www.googleapis.com/auth/drive"]
SERPAPI_KEY = settings.SERPAPI_KEY

def is_valid_link(url):
    try:
        response = requests.head(url, timeout=5, allow_redirects=True)
        return response.status_code in [200, 301, 302]
    except RequestException:
        try:
            response = requests.get(url, timeout=5, allow_redirects=True)
            return response.status_code in [200, 301, 302]
        except RequestException:
            return False

def search_serpapi_links(topic, is_update=False, max_results=10):
    if not hasattr(settings, 'SERPAPI_KEY') or not settings.SERPAPI_KEY:
        raise ValueError("Missing SERPAPI_KEY in settings.")

    cache_key = f"serpapi_{topic}_{is_update}_{max_results}"
    cached_results = cache.get(cache_key)
    if cached_results and len(cached_results) >= 3:
        return cached_results

    try:
        params = {
            "api_key": settings.SERPAPI_KEY,
            "hl": "en",
            "lr": "lang_en",
            "num": max_results,
        }

        if is_update:
            params["engine"] = "google_scholar"
            params["q"] = f"{topic} recent advancements 2023-2025"
            params["tbs"] = "qdr:y3"
        else:
            params["engine"] = "google"
            params["q"] = f"{topic} overview fundamentals open access"

        search = GoogleSearch(params)
        results = search.get_dict().get("organic_results", [])

        valid_links = [
            (r["title"], r["link"])
            for r in results
            if r.get("title") and r.get("link", "").startswith("http") and is_valid_link(r["link"])
        ]

        if len(valid_links) < 3:
            raise ValueError(f"Only {len(valid_links)} valid references found for topic '{topic}'. Minimum 3 required.")

        final_links = valid_links[:max_results]
        cache.set(cache_key, final_links, timeout=3600)
        return final_links

    except Exception as e:
        raise RuntimeError(f"SerpAPI search failed: {str(e)}")    

def extract_text_from_google_doc(doc_url, creds):
    match = re.search(r"/d/([a-zA-Z0-9-_]+)", doc_url)
    if not match:
        raise ValueError("Invalid Google Docs URL")
    doc_id = match.group(1)

    service = build("docs", "v1", credentials=creds)
    document = service.documents().get(documentId=doc_id).execute()

    content = document.get("body", {}).get("content", [])
    full_text = ""

    for elem in content:
        para = elem.get("paragraph")
        if not para:
            continue
        for e in para.get("elements", []):
            if "textRun" in e and "content" in e["textRun"]:
                full_text += e["textRun"]["content"]

    return full_text.strip()

def create_google_doc(title, content, creds, share_email):
    docs_service = build("docs", "v1", credentials=creds)
    drive_service = build("drive", "v3", credentials=creds)

    doc = docs_service.documents().create(body={"title": title}).execute()
    doc_id = doc.get("documentId")
    doc_url = f"https://docs.google.com/document/d/{doc_id}"

    docs_service.documents().batchUpdate(
        documentId=doc_id,
        body={"requests": [
            {
                "insertText": {
                    "endOfSegmentLocation": {},
                    "text": "\n" + content
                }
            }
        ]}
    ).execute()

    permission = {
        "type": "user",
        "role": "writer",
        "emailAddress": share_email,
    }
    drive_service.permissions().create(
        fileId=doc_id,
        body=permission,
        fields="id",
        sendNotificationEmail=False
    ).execute()

    return doc_url

def update_google_doc(doc_url, new_content, creds):
    match = re.search(r"/d/([a-zA-Z0-9-_]+)", doc_url)
    if not match:
        raise ValueError("Invalid Google Docs URL")
    doc_id = match.group(1)

    service = build("docs", "v1", credentials=creds)
    document = service.documents().get(documentId=doc_id).execute()
    content = document.get("body", {}).get("content", [])
    end_index = content[-1].get("endIndex", 1) if content else 1

    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    header_text = f"\n\nUpdate\nUpdated at: {timestamp}\n\n"

    combined_content = header_text + new_content
    requests = [
        {
            "insertText": {
                "location": {"index": end_index - 1},
                "text": combined_content
            }
        }
    ]

    if requests:
        service.documents().batchUpdate(documentId=doc_id, body={"requests": requests}).execute()


