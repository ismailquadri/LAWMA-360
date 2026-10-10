"""Render the authored SVG primitives directly into a vector PDF; no browser required."""
from pathlib import Path
import runpy, re, math, xml.etree.ElementTree as ET
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A3, landscape
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from xml.sax.saxutils import escape

D=runpy.run_path(str(Path(__file__).with_name('build.py')))
ROOT=D['ROOT']; OUT=D['OUT']; FLOWS=D['FLOWS']; POLICIES=D['POLICIES']
pdfmetrics.registerFont(TTFont('Atlas','/System/Library/Fonts/Supplemental/Arial.ttf'))
pdfmetrics.registerFont(TTFont('AtlasBold','/System/Library/Fonts/Supplemental/Arial Bold.ttf'))
PW,PH=landscape(A3)
C=canvas.Canvas(str(OUT/'SmartWaste360-Customer-User-Flows.pdf'),pagesize=(PW,PH))
C.setTitle('SmartWaste 360 — Customer App End-to-End User Flows')
C.setAuthor('Fastspeed Solutions Limited')
C.setSubject('Native customer app; user flows, scenario coverage and open policy decisions')

def text(x,y,s,size=11,bold=False,color='#26392e',align='left'):
    C.setFont('AtlasBold' if bold else 'Atlas',size);C.setFillColor(HexColor(color))
    getattr(C,{'left':'drawString','center':'drawCentredString','right':'drawRightString'}[align])(x,y,s)
def para(s,x,y,w,size=11,leading=15,color='#5b6a5d'):
    p=Paragraph(escape(s),ParagraphStyle('body',fontName='Atlas',fontSize=size,leading=leading,textColor=HexColor(color)))
    aw,h=p.wrap(w,1000);p.drawOn(C,x,y-h);return h
def header(title,intent,no):
    text(38,PH-32,'SMARTWASTE 360  /  CUSTOMER EXPERIENCE',9,True,'#9a4f13')
    text(PW-38,PH-32,'FASTSPEED SOLUTIONS LIMITED · LAWMA',9,False,'#64705f','right')
    text(38,PH-67,title,25,True)
    para(intent,38,PH-80,PW-76,10.5,14)
    C.setStrokeColor(HexColor('#dce2d8'));C.setLineWidth(.6);C.line(38,PH-108,PW-38,PH-108)
    text(38,25,'Native iOS / Android product design · 07 October 2026 · Based on the customer product brief',8.5,False,'#7c8676')
    text(PW-38,25,f'{no:02d} / 13',8.5,False,'#7c8676','right')
def shape_style(a):
    fill=a.get('fill','none');stroke=a.get('stroke','none')
    if fill!='none':C.setFillColor(HexColor(fill))
    if stroke!='none':C.setStrokeColor(HexColor(stroke))
    C.setLineWidth(float(a.get('stroke-width','1')))
    return int(stroke!='none'),int(fill!='none')
def draw_svg(svg,x,y,w,h):
    root=ET.fromstring(svg);vb=list(map(float,root.attrib['viewBox'].split()));sw,sh=vb[2:]
    scale=min(w/sw,h/sh);px=x+(w-sw*scale)/2;py=y+(h-sh*scale)/2
    C.saveState();C.translate(px,py);C.scale(scale,scale)
    for el in root.iter():
        tag=el.tag.split('}')[-1];a=el.attrib
        if tag in ('rect','circle','path'):
            # The arrow-marker path in <defs> is drawn explicitly for each connector below.
            if tag=='path' and a.get('d','').startswith('M0 0L10'):continue
            stroke,fill=shape_style(a)
            if tag=='rect':
                xx,yy,ww,hh=[float(a.get(k,0)) for k in ('x','y','width','height')]
                C.roundRect(xx,sh-yy-hh,ww,hh,float(a.get('rx',0)),stroke=stroke,fill=fill)
            elif tag=='circle':C.circle(float(a['cx']),sh-float(a['cy']),float(a['r']),stroke=stroke,fill=fill)
            elif tag=='path':
                tokens=re.findall(r'[MLZmlz]|-?\d+(?:\.\d+)?',a['d']);i=0;p=C.beginPath();points=[]
                while i<len(tokens):
                    cmd=tokens[i];i+=1
                    if cmd.upper()=='Z':p.close();continue
                    xx,yy=float(tokens[i]),float(tokens[i+1]);i+=2;points.append((xx,sh-yy))
                    if cmd.upper()=='M':p.moveTo(xx,sh-yy)
                    else:p.lineTo(xx,sh-yy)
                C.drawPath(p,stroke=stroke,fill=fill)
                if 'marker-end' in a and len(points)>1:
                    end=points[-1];prev=next((q for q in reversed(points[:-1]) if q!=end),points[-2]);ang=math.atan2(end[1]-prev[1],end[0]-prev[0]);size=8
                    arrow=C.beginPath();arrow.moveTo(*end)
                    arrow.lineTo(end[0]-size*math.cos(ang-.43),end[1]-size*math.sin(ang-.43));arrow.lineTo(end[0]-size*math.cos(ang+.43),end[1]-size*math.sin(ang+.43));arrow.close();C.setFillColor(HexColor('#84948b'));C.drawPath(arrow,stroke=0,fill=1)
        elif tag=='text':
            text(float(a['x']),sh-float(a['y']),el.text or '',float(a.get('font-size',12)),a.get('font-weight')=='700',a.get('fill','#26392e'),{'middle':'center','end':'right'}.get(a.get('text-anchor'),'left'))
    C.restoreState()
    return px,py,scale,sh

for i,f in enumerate(FLOWS,1):
    C.bookmarkPage(f['id']);C.addOutlineEntry(f['title'],f['id'],0,False)
    header(f['title'],f['intent'],i)
    x=38
    for owner,(fill,stroke,ink) in D['COLORS'].items():
        C.setFillColor(HexColor(fill));C.setStrokeColor(HexColor(stroke));C.roundRect(x,PH-130,8,8,2,stroke=1,fill=1);text(x+13,PH-129,owner,8.5,False);x+=len(owner)*5+42
    text(PW-38,PH-129,'Select linked steps to open their detailed map',8.5,False,'#747e6e','right')
    px,py,s,sh=draw_svg(f['svg'],25,81,PW-50,PH-225)
    for n in f['nodes']:
        if n['to']:
            nx,ny=D['pos'](n);C.linkRect('',n['to'],(px+nx*s,py+(sh-ny-D['BH'])*s,px+(nx+D['BW'])*s,py+(sh-ny)*s),relative=0,thickness=0)
    para(f['note'],38,69,PW-76,10,13)
    C.showPage()

for k in range(2):
    header(f'Scenario coverage / {k+1}','Captured product requirements and proposed recovery paths. These are design scenarios, not completed research findings.',11+k)
    cols=[PH-132,PH-132];cw=(PW-96)/2
    for f in FLOWS[k*5:k*5+5]:
        col=0 if cols[0]>=cols[1] else 1;x=38+col*(cw+20);y=cols[col]
        text(x,y,f['title'],13,True);y-=13
        for case in f['cases']:
            text(x,y-11,'•',11,False,'#a8672c');hh=para(case,x+13,y,cw-13,10.5,14);y-=hh+4
        cols[col]=y-23
    assert min(cols)>50,cols
    C.showPage()
header('Open policy decisions','Gold markers in the flow maps refer to these decisions. No price, deadline or bin entitlement is invented.',13)
cw=(PW-100)/2;ys=[PH-137,PH-137]
for i,(id,title,body) in enumerate(POLICIES):
    col=i//5;x=38+col*(cw+24);y=ys[col]
    text(x,y,id+' / '+title,12.5,True);y-=12;hh=para(body,x,y,cw,11,15);ys[col]=y-hh-26
para('Confirmed direction: standalone native customer app; choice of eligible nearby partners; new IoT bins through LAWMA → partner → residence; a shared premise allocation with flexible bin quantities and sizes; personal wallets; automatic payment at pickup acceptance; continued app access before bin allocation. Interaction safeguards are proposed UX. Remaining rules are explicitly open.',38,145,PW-76,11,16)
C.save()
print('Created '+str(OUT/'SmartWaste360-Customer-User-Flows.pdf'))
