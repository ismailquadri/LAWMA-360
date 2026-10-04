from pathlib import Path
import re, html
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table,
                                TableStyle, KeepTogether, HRFlowable, LongTable, Flowable)
from reportlab.pdfgen.canvas import Canvas

ROOT=Path(__file__).resolve().parents[1]
source=ROOT/'outputs/Fast_Speed_Solutions_LAWMA_client_point_of_view.md'
out=ROOT/'outputs/Fast_Speed_Solutions_LAWMA_Domain_Research_Report.pdf'

pdfmetrics.registerFont(TTFont('Arial', '/System/Library/Fonts/Supplemental/Arial.ttf'))
pdfmetrics.registerFont(TTFont('Arial-Bold', '/System/Library/Fonts/Supplemental/Arial Bold.ttf'))
pdfmetrics.registerFont(TTFont('Arial-Italic', '/System/Library/Fonts/Supplemental/Arial Italic.ttf'))
pdfmetrics.registerFont(TTFont('Arial-BoldItalic', '/System/Library/Fonts/Supplemental/Arial Bold Italic.ttf'))

INK=colors.HexColor('#172B2A')
GREEN=colors.HexColor('#1E599E')
MINT=colors.HexColor('#EAF1F8')
PALE=colors.HexColor('#F4F7FB')
GOLD=colors.HexColor('#C22221')
MUTED=colors.HexColor('#5F706C')
LINE=colors.HexColor('#D8E2DE')
WHITE=colors.white
PAGE_W,PAGE_H=A4

styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='BodyX',fontName='Arial',fontSize=9.2,leading=13.4,textColor=INK,spaceAfter=6.2,allowWidows=0,allowOrphans=0))
styles.add(ParagraphStyle(name='Lead',fontName='Arial',fontSize=11.2,leading=16.1,textColor=INK,spaceAfter=9))
styles.add(ParagraphStyle(name='H1X',fontName='Arial-Bold',fontSize=17.2,leading=21,textColor=GREEN,spaceBefore=13,spaceAfter=8,keepWithNext=True))
styles.add(ParagraphStyle(name='H2X',fontName='Arial-Bold',fontSize=12.3,leading=15.3,textColor=INK,spaceBefore=10,spaceAfter=5,keepWithNext=True))
styles.add(ParagraphStyle(name='H3X',fontName='Arial-Bold',fontSize=10.1,leading=13,textColor=GREEN,spaceBefore=7,spaceAfter=4,keepWithNext=True))
styles.add(ParagraphStyle(name='Small',fontName='Arial',fontSize=7.7,leading=10.2,textColor=MUTED,spaceAfter=3))
styles.add(ParagraphStyle(name='BulletX',fontName='Arial',fontSize=9,leading=12.8,textColor=INK,leftIndent=12,firstLineIndent=-8,spaceAfter=3.3))
styles.add(ParagraphStyle(name='QuoteX',fontName='Arial-Italic',fontSize=10.2,leading=15,textColor=INK,leftIndent=10,rightIndent=8,spaceBefore=4,spaceAfter=8,borderColor=GREEN,borderWidth=2,borderPadding=8,backColor=MINT))
styles.add(ParagraphStyle(name='Cell',fontName='Arial',fontSize=7.35,leading=9.5,textColor=INK,spaceAfter=0))
styles.add(ParagraphStyle(name='CellHead',fontName='Arial-Bold',fontSize=7.5,leading=9.5,textColor=WHITE,spaceAfter=0))
styles.add(ParagraphStyle(name='CoverTitle',fontName='Arial-Bold',fontSize=30,leading=34,textColor=WHITE,spaceAfter=12))
styles.add(ParagraphStyle(name='CoverSub',fontName='Arial',fontSize=15,leading=21,textColor=colors.HexColor('#D7EAE2'),spaceAfter=18))
styles.add(ParagraphStyle(name='CoverSmall',fontName='Arial',fontSize=9.5,leading=14,textColor=colors.HexColor('#E5EFEA')))
styles.add(ParagraphStyle(name='TOC',fontName='Arial',fontSize=9.4,leading=14,textColor=INK,spaceAfter=4))

# Minimal markdown inline parser: escapes text, then restores only safe formatting/link tags.
def inline(s):
    s=s.strip()
    # extract markdown links first
    links=[]
    def linkrepl(m):
        label=html.escape(m.group(1))
        url=html.escape(m.group(2), quote=True)
        token=f'@@LINK{len(links)}@@'
        links.append(f'<link href="{url}" color="#176B58"><u>{label}</u></link>')
        return token
    s=re.sub(r'\[([^\]]+)\]\((https?://[^)]+)\)',linkrepl,s)
    s=html.escape(s)
    s=re.sub(r'\*\*(.+?)\*\*',r'<b>\1</b>',s)
    s=re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)',r'<i>\1</i>',s)
    s=re.sub(r'`([^`]+)`',r'<font name="Arial">\1</font>',s)
    for i,val in enumerate(links): s=s.replace(f'@@LINK{i}@@',val)
    return s

def is_table_sep(line):
    return bool(re.match(r'^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$',line))

def split_row(line):
    return [x.strip() for x in line.strip().strip('|').split('|')]

# Cover page custom canvas
class Cover(Flowable):
    def __init__(self): super().__init__(); self.width=1; self.height=1
    def wrap(self, availWidth, availHeight): self.width=availWidth; self.height=PAGE_H-48*mm; return self.width,self.height
    def draw(self):
        c=self.canv
        w,h=self.width,self.height
        c.saveState()
        # Branded panel with restrained geometry that stays clear of all text.
        c.setFillColor(colors.HexColor('#1E599E'))
        c.roundRect(0,0,w,h,3*mm,fill=1,stroke=0)
        c.setFillColor(colors.HexColor('#C22221'))
        c.roundRect(15*mm,h-19*mm,25*mm,2.5*mm,1.2*mm,fill=1,stroke=0)
        # Subtle brand geometry is kept in the lower-right corner, away from copy.
        c.setStrokeColor(colors.HexColor('#477AB0'))
        c.setLineWidth(.8)
        for j in range(3):
            c.arc(w-52*mm, 20*mm+j*6*mm, w-10*mm, 62*mm+j*6*mm, 205, 125)
        x=15*mm
        title=Paragraph('LAWMA Digital<br/>Transformation',styles['CoverTitle'])
        _,th=title.wrap(w-38*mm,70*mm)
        title.drawOn(c,x,h-48*mm-th)
        sub=Paragraph('Domain assessment and recommended direction',styles['CoverSub'])
        _,sh=sub.wrap(w-38*mm,45*mm)
        sub.drawOn(c,x,h-105*mm-sh)
        c.setStrokeColor(colors.HexColor('#A9C2DC'))
        c.setLineWidth(.7)
        c.line(x,h-126*mm,x+52*mm,h-126*mm)
        meta=Paragraph('<b>PREPARED FOR</b><br/>Lagos Waste Management Authority (LAWMA)<br/><br/><b>PREPARED BY</b><br/>Fast Speed Solutions Limited<br/><br/><b>DATE</b><br/>3 October 2026',styles['CoverSmall'])
        _,mh=meta.wrap(w-40*mm,75*mm)
        meta.drawOn(c,x,h-143*mm-mh)
        c.setFillColor(colors.HexColor('#E1ECF6'))
        c.setFont('Arial-Bold',7.5)
        c.drawString(x,13*mm,'DOMAIN ASSESSMENT  /  MANAGEMENT REPORT')
        c.restoreState()

# Header/footer
class NumberedCanvas(Canvas):
    def __init__(self,*args,**kwargs):
        Canvas.__init__(self,*args,**kwargs); self._saved_page_states=[]
    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__)); self._startPage()
    def save(self):
        n=len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            if self._pageNumber>1:
                self.saveState()
                self.setStrokeColor(LINE); self.setLineWidth(.45)
                self.line(20*mm,PAGE_H-15*mm,PAGE_W-20*mm,PAGE_H-15*mm)
                self.setFont('Arial-Bold',7.2); self.setFillColor(GREEN)
                self.drawString(20*mm,PAGE_H-11.5*mm,'FAST SPEED SOLUTIONS LIMITED')
                self.setFont('Arial',7.2); self.setFillColor(MUTED)
                self.drawRightString(PAGE_W-20*mm,PAGE_H-11.5*mm,'LAWMA DIGITAL TRANSFORMATION')
                self.line(20*mm,14*mm,PAGE_W-20*mm,14*mm)
                self.setFont('Arial',7.3); self.setFillColor(MUTED)
                self.drawString(20*mm,9.5*mm,'Domain assessment and recommendations')
                self.drawRightString(PAGE_W-20*mm,9.5*mm,f'{self._pageNumber}  /  {n}')
                self.restoreState()
            Canvas.showPage(self)
        Canvas.save(self)

# Extract the report map from section headings (cover has its own page).
md=source.read_text(encoding='utf-8')
lines=md.splitlines()
body_lines=[]
for line in lines:
    if line.startswith('# LAWMA Digital Waste Management Transformation') or line.startswith('## Domain assessment and recommended direction'): continue
    if line.startswith('**Submitted to:**') or line.startswith('**Prepared by:**') or line.startswith('**Date:**') or line.startswith('**Report type:**'): continue
    if line.strip()=='---': continue
    body_lines.append(line)

story=[Cover(),PageBreak()]
# report map page
story.append(Paragraph('Contents',styles['H1X']))
for title in [
'Executive perspective','1. The service challenge','2. A connected operating model',
'3. What the research indicates','4. Recommended direction','5. Measures of success',
'6. Priorities for validation with LAWMA','7. Recommended immediate action','Conclusion','Sources']:
    story.append(Paragraph('•  '+html.escape(title),styles['TOC']))
story.append(PageBreak())

# Parse markdown blocks into reportlab flowables, ignoring final source register duplication not issue.
i=0; first_h1=True
while i<len(body_lines):
    line=body_lines[i].rstrip()
    if not line.strip(): i+=1; continue
    if line.startswith('# '):
        text=line[2:].strip()
        # first # in source is title; skip
        i+=1; continue
    if line.startswith('## '):
        title=line[3:].strip()
        if title=='Executive summary':
            story.append(Paragraph(title,styles['H1X']))
        else:
            story.append(Paragraph(inline(title),styles['H1X']))
        i+=1; continue
    if line.startswith('### '):
        story.append(Paragraph(inline(line[4:].strip()),styles['H2X'])); i+=1; continue
    if line.startswith('#### '):
        story.append(Paragraph(inline(line[5:].strip()),styles['H3X'])); i+=1; continue
    if line.startswith('|') and i+1<len(body_lines) and is_table_sep(body_lines[i+1]):
        raw=[split_row(line)]; i+=2
        while i<len(body_lines) and body_lines[i].strip().startswith('|'):
            raw.append(split_row(body_lines[i])); i+=1
        ncol=max(len(r) for r in raw)
        raw=[r+['']*(ncol-len(r)) for r in raw]
        data=[]
        for ri,row in enumerate(raw):
            st=styles['CellHead'] if ri==0 else styles['Cell']
            data.append([Paragraph(inline(cell),st) for cell in row])
        avail=PAGE_W-40*mm
        if ncol==3:
            widths=[avail*.21,avail*.39,avail*.40]
        elif ncol==4:
            widths=[avail*.18,avail*.26,avail*.27,avail*.29]
        else: widths=[avail/ncol]*ncol
        t=LongTable(data,colWidths=widths,repeatRows=1,hAlign='LEFT',splitByRow=1)
        t.setStyle(TableStyle([
            ('BACKGROUND',(0,0),(-1,0),GREEN),('TEXTCOLOR',(0,0),(-1,0),WHITE),
            ('VALIGN',(0,0),(-1,-1),'TOP'),('GRID',(0,0),(-1,-1),.35,LINE),
            ('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5),
            ('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),
            ('ROWBACKGROUNDS',(0,1),(-1,-1),[WHITE,PALE]),
        ]))
        story.extend([Spacer(1,3),t,Spacer(1,8)])
        continue
    if line.startswith('> '):
        quoted=[]
        while i<len(body_lines) and body_lines[i].startswith('> '):
            quoted.append(body_lines[i][2:].strip()); i+=1
        story.append(Paragraph(inline(' '.join(quoted)),styles['QuoteX'])); continue
    if re.match(r'^\s*-\s+',line):
        txt=re.sub(r'^\s*-\s+','',line)
        story.append(Paragraph('• '+inline(txt),styles['BulletX'])); i+=1; continue
    if re.match(r'^\s*\d+\.\s+',line):
        m=re.match(r'^\s*(\d+)\.\s+(.*)$',line)
        story.append(Paragraph('<b>'+m.group(1)+'.</b> '+inline(m.group(2)),styles['BulletX'])); i+=1; continue
    # join normal markdown paragraph lines until next block
    para=[line.strip()]; i+=1
    while i<len(body_lines) and body_lines[i].strip() and not body_lines[i].startswith(('#','>','|')) and not re.match(r'^\s*(-\s+|\d+\.\s+)',body_lines[i]):
        para.append(body_lines[i].strip()); i+=1
    story.append(Paragraph(inline(' '.join(para)),styles['BodyX']))

doc=SimpleDocTemplate(str(out),pagesize=A4,rightMargin=20*mm,leftMargin=20*mm,topMargin=21*mm,bottomMargin=20*mm,
                      title='LAWMA Digital Transformation: Domain Research, Problem Understanding and Recommendations',
                      author='Fast Speed Solutions Limited',subject='Discovery report and recommendations for LAWMA')
doc.build(story,canvasmaker=NumberedCanvas)
print(out)
