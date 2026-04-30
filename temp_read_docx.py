import zipfile
import xml.etree.ElementTree as ET
import sys

sys.stdout.reconfigure(encoding='utf-8')

docx_path = r'c:\Users\PC\Downloads\BA_Pack_Opener_v2_4.docx'

with zipfile.ZipFile(docx_path) as z:
    xml_content = z.read('word/document.xml')

root = ET.fromstring(xml_content)
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

all_text = []
for p in root.findall('.//w:p', ns):
    paragraph_text = ''
    for t in p.findall('.//w:t', ns):
        if t.text:
            paragraph_text += t.text
    if paragraph_text.strip():
        all_text.append(paragraph_text)

with open('docx_content.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(all_text))

print('\n'.join(all_text)[:10000])
