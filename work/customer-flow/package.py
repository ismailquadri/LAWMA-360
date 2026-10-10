from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root=Path(__file__).resolve().parents[2]
out=root/'outputs/customer-flow'
def portable(text):
    return text.replace('../outputs/customer-flow/','./').replace('CUSTOMER-APP-USER-FLOW.html','index.html').replace('CUSTOMER-APP-USER-FLOW.md','FLOW-SPECIFICATION.md')
with ZipFile(out/'SmartWaste360-Customer-Flow-Pack.zip','w',ZIP_DEFLATED) as pack:
    for source,target in [('CUSTOMER-APP-USER-FLOW.html','index.html'),('CUSTOMER-APP-USER-FLOW.md','FLOW-SPECIFICATION.md'),('CUSTOMER-APP-PARTNER-SERVICE-AND-IOT-BIN-PROVISIONING.md','CUSTOMER-APP-PARTNER-SERVICE-AND-IOT-BIN-PROVISIONING.md')]:
        pack.writestr(target,portable((root/'docs'/source).read_text()))
    for path in sorted(out.iterdir()):
        if path.suffix in ('.svg','.pdf','.png'):pack.write(path,path.name)
print(out/'SmartWaste360-Customer-Flow-Pack.zip')
