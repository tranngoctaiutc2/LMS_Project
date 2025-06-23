from googleapiclient.discovery import build
import mistune
import re
import requests
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
    if cached_results and len(cached_results) >= 2:
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

        if len(valid_links) < 2:
            raise ValueError(f"Only {len(valid_links)} valid references found for topic '{topic}'. Minimum 2 required.")

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

def parse_markdown_to_requests(content):
    """Chuyển đổi nội dung Markdown thành các yêu cầu định dạng cho Google Docs."""
    lines = content.split("\n")
    requests = []
    current_pos = 1

    header_sizes = {
        1: 17,
        2: 16,
        3: 15,
        4: 14 
    }

    for line in lines:
        if not line.strip():
            continue

        header_level = 0
        if line.startswith("####"):
            header_level = 4
            line = line[4:].lstrip() 
        elif line.startswith("###"):
            header_level = 3
            line = line[3:].lstrip()
        elif line.startswith("##"):
            header_level = 2
            line = line[2:].lstrip()
        elif line.startswith("#"):
            header_level = 1
            line = line[1:].lstrip()

        def process_text(text):
            segments = []
            bold = False
            italic = False
            start_idx = 0
            i = 0
            while i < len(text):
                if i + 1 < len(text) and text[i:i+2] == "**":
                    if not bold:
                        if i > start_idx:
                            segments.append((text[start_idx:i], bold, italic))
                        bold = True
                        start_idx = i + 2
                        i += 2
                    else:
                        segments.append((text[start_idx:i], bold, italic))
                        bold = False
                        start_idx = i + 2
                        i += 2
                elif text[i] == "*":
                    if not italic:
                        if i > start_idx:
                            segments.append((text[start_idx:i], bold, italic))
                        italic = True
                        start_idx = i + 1
                        i += 1
                    else:
                        segments.append((text[start_idx:i], bold, italic))
                        italic = False
                        start_idx = i + 1
                        i += 1
                else:
                    i += 1
            if start_idx < len(text):
                segments.append((text[start_idx:], bold, italic))
            return segments

        line = re.sub(r"(?<![\*])\*(?![\*])", "-", line)

        segments = process_text(line)
        for text, bold, italic in segments:
            requests.append({
                "insertText": {
                    "location": {"index": current_pos},
                    "text": text
                }
            })

            font_size = header_sizes.get(header_level, 13)

            requests.append({
                "updateTextStyle": {
                    "range": {
                        "startIndex": current_pos,
                        "endIndex": current_pos + len(text)
                    },
                    "textStyle": {
                        "fontSize": {"magnitude": font_size, "unit": "PT"},
                        "weightedFontFamily": {"fontFamily": "Times New Roman"},
                        "foregroundColor": {
                            "color": {"rgbColor": {"red": 0, "green": 0, "blue": 0}}
                        }
                    },
                    "fields": "fontSize,weightedFontFamily,foregroundColor"
                }
            })

            if bold:
                requests.append({
                    "updateTextStyle": {
                        "range": {
                            "startIndex": current_pos,
                            "endIndex": current_pos + len(text)
                        },
                        "textStyle": {"bold": True},
                        "fields": "bold"
                    }
                })

            if italic:
                requests.append({
                    "updateTextStyle": {
                        "range": {
                            "startIndex": current_pos,
                            "endIndex": current_pos + len(text)
                        },
                        "textStyle": {"italic": True},
                        "fields": "italic"
                    }
                })

            requests.append({
                "updateParagraphStyle": {
                    "range": {
                        "startIndex": current_pos,
                        "endIndex": current_pos + len(text)
                    },
                    "paragraphStyle": {
                        "spaceAbove": {"magnitude": 4, "unit": "PT"},
                        "spaceBelow": {"magnitude": 4, "unit": "PT"}
                    },
                    "fields": "spaceAbove,spaceBelow"
                }
            })

            current_pos += len(text)

        requests.append({
            "insertText": {
                "location": {"index": current_pos},
                "text": "\n"
            }
        })
        current_pos += 1

    return requests

def create_google_doc(title, content, creds, share_email):
    docs_service = build("docs", "v1", credentials=creds)
    drive_service = build("drive", "v3", credentials=creds)

    doc = docs_service.documents().create(body={"title": title}).execute()
    doc_id = doc.get("documentId")
    doc_url = f"https://docs.google.com/document/d/{doc_id}"

    requests = parse_markdown_to_requests(content)

    docs_service.documents().batchUpdate(
        documentId=doc_id,
        body={"requests": requests}
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


