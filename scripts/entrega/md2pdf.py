#!/usr/bin/env python3
"""Converte um .md em PDF (Markdown -> HTML -> Chrome headless).
Requer: pip install markdown, e Google Chrome. Uso: md2pdf.py entrada.md saida.pdf"""
import sys, subprocess, tempfile, pathlib, os
try:
    import markdown
except ImportError:
    sys.exit('Instale: pip install markdown')

CSS = """
@page { size: A4; margin: 18mm 16mm 18mm 16mm; }
body { font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif; font-size: 10.5pt; line-height: 1.45; color: #1a1a1a; }
h1 { font-size: 24pt; margin: 0 0 8pt; border-bottom: 3px solid #1f4e79; padding-bottom: 6pt; color: #1f4e79; }
h2 { font-size: 16pt; color: #1f4e79; margin-top: 22pt; border-bottom: 1px solid #b7c4d4; padding-bottom: 3pt; page-break-after: avoid; }
h3 { font-size: 13pt; color: #1f4e79; margin-top: 16pt; page-break-after: avoid; }
h4 { font-size: 11.5pt; margin-top: 12pt; page-break-after: avoid; }
h5 { font-size: 11pt; color: #1f4e79; margin-top: 12pt; page-break-after: avoid; }
h6 { font-size: 10.5pt; margin-top: 10pt; page-break-after: avoid; }
table { border-collapse: collapse; width: 100%; margin: 8pt 0; font-size: 9pt; page-break-inside: auto; }
tr { page-break-inside: avoid; }
th, td { border: 1px solid #b9c2cc; padding: 3pt 5pt; vertical-align: top; text-align: left; }
th { background: #e8eef5; }
code { font-family: Menlo, Consolas, monospace; font-size: 8.8pt; background: #f1f3f5; padding: 0 2pt; border-radius: 2pt; }
pre { background: #f1f3f5; padding: 7pt; border-radius: 4pt; font-size: 8.5pt; overflow-wrap: anywhere; white-space: pre-wrap; page-break-inside: avoid; }
pre code { background: none; padding: 0; }
a { color: #1f4e79; text-decoration: none; }
blockquote { border-left: 3px solid #b7c4d4; margin-left: 0; padding-left: 10pt; color: #444; }
"""

def main(src, dst):
    html = markdown.markdown(pathlib.Path(src).read_text(encoding='utf-8'),
                             extensions=['tables', 'fenced_code', 'sane_lists'])
    import re
    html = re.sub(r'(\d{4}-\d{2}-\d{2})', r'<span style="white-space:nowrap">\1</span>', html)
    html = re.sub(r'<thead>\s*<tr>\s*(<th>\s*</th>\s*)+</tr>\s*</thead>', '', html)
    m = re.search(r'<h1[^>]*>(.*?)</h1>', html, flags=re.S)
    titulo = re.sub(r'<[^>]+>', '', m.group(1)).strip() if m else 'Documento'
    doc = f'<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>{titulo}</title><style>{CSS}</style></head><body>{html}</body></html>'
    with tempfile.TemporaryDirectory() as t:
        h = pathlib.Path(t) / 'doc.html'; h.write_text(doc, encoding='utf-8')
        chrome = os.environ.get('CHROME', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
        subprocess.run([chrome, '--headless=new', '--disable-gpu', '--no-pdf-header-footer',
                        f'--print-to-pdf={os.path.abspath(dst)}', h.as_uri()], check=True,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
main(sys.argv[1], sys.argv[2])
