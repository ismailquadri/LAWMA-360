"""Build offline gallery, runtime bundle and sprites from individual source SVGs."""
from pathlib import Path
import json
import xml.etree.ElementTree as ET
root=Path(__file__).resolve().parent
manifest=json.loads((root/'manifest.json').read_text())
ET.register_namespace('', 'http://www.w3.org/2000/svg')
assets={}; sprite=ET.Element('{http://www.w3.org/2000/svg}svg', {'fill':'none'}); defs=ET.SubElement(sprite,'{http://www.w3.org/2000/svg}defs')
for item in manifest['assets']:
    markup=(root/item['file']).read_text(); assets[item['id']]=markup
    source=ET.fromstring(markup)
    if source.attrib.get('viewBox') != '0 0 48 48':
        raise ValueError(f"{item['id']}: expected a 48-unit icon canvas")
    symbol=ET.SubElement(defs,'{http://www.w3.org/2000/svg}symbol',{'id':item['id'],'viewBox':source.attrib['viewBox']})
    symbol.extend(list(source))
(root/'smartwaste-library.svg').write_text(ET.tostring(sprite,encoding='unicode'))
runtime=(root/'runtime.js').read_text().replace('/*ASSETS*/',json.dumps(assets)).replace('/*METADATA*/',json.dumps(manifest['assets']))
(root/'smartwaste-icons.js').write_text(runtime)
gallery=(root/'gallery.template.html').read_text().replace('/*RUNTIME*/',runtime)
(root.parent.parent/'docs/ICON-LIBRARY.html').write_text(gallery)
print(f"Built {len(assets)} icons, runtime, sprite and standalone gallery.")
