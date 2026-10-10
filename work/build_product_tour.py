from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import subprocess, json, os
root=Path('outputs/presentation-assets'); out=root/'tour-source';out.mkdir(exist_ok=True)
font='/System/Library/Fonts/Supplemental/Arial.ttf'
scenes=[('mobile-preview.png','A clearer view.\nA cleaner city.','See priorities across partners,\nservice delivery and site incidents.','Meet Smart Waste three sixty. Bring authority oversight, partner delivery, and resident care into one connected view.'),('service-preview.png','Follow every\nhandoff.','Assignment. Collection evidence.\nFacility intake. Verified receipt.','Open a service record. Follow the assignment, collection evidence, facility intake, and disposal receipt, with a clear next action at every handoff.'),('camera-preview.png','See the signal.\nTake the next step.','Review observations and route\nexceptions to the right team.','Explore camera and sensor scenarios, then route exceptions to the right team. This presentation uses simulated records. Open the demo to explore the complete workflows.')]
manifest=[]
for n,(shot,title,desc,voice) in enumerate(scenes):
 im=Image.new('RGB',(1920,1080),'#f6f7f1');d=ImageDraw.Draw(im)
 d.text((130,105),'SmartWaste360',font=ImageFont.truetype(font,40),fill='#cf5200')
 d.text((130,240),f'0{n+1} / PRODUCT TOUR',font=ImageFont.truetype(font,20),fill='#596564')
 d.multiline_text((125,310),title,font=ImageFont.truetype(font,86),fill='#172323',spacing=8)
 d.multiline_text((130,550),desc,font=ImageFont.truetype(font,32),fill='#596564',spacing=16)
 d.rounded_rectangle((130,735,700,810),radius=12,fill='#ef6200')
 d.text((162,756),'Explore the interactive demo',font=ImageFont.truetype(font,28),fill='white')
 d.text((130,955),'Prepared for LAWMA | Fastspeed Solutions Limited',font=ImageFont.truetype(font,22),fill='#596564')
 d.text((130,1000),'Demonstration data • Proposed workflows',font=ImageFont.truetype(font,18),fill='#67716c')
 screenshot=Image.open(root/shot).convert('RGB');screenshot.thumbnail((435,940),Image.Resampling.LANCZOS)
 x,y=1250,64;d.rounded_rectangle((x-13,y-13,x+screenshot.width+13,y+screenshot.height+13),radius=42,fill='#1c2925')
 mask=Image.new('L',screenshot.size,0);ImageDraw.Draw(mask).rounded_rectangle((0,0,*screenshot.size),radius=30,fill=255);im.paste(screenshot,(x,y),mask)
 frame=out/f'scene-{n}.png';im.save(frame);txt=out/f'narration-{n}.txt';txt.write_text(voice)
 audio=out/f'voice-{n}.mp3';subprocess.run([os.environ.get('EDGE_TTS_BIN','edge-tts'),'--voice','en-GB-SoniaNeural','--file',str(txt),'--write-media',str(audio)],check=True)
 duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(audio)]))+1
 clip=out/f'clip-{n}.mp4';subprocess.run(['ffmpeg','-y','-loglevel','error','-loop','1','-i',str(frame),'-i',str(audio),'-t',str(duration),'-vf',f'fade=t=in:st=0:d=0.35,fade=t=out:st={duration-.35}:d=0.35','-af','apad','-c:v','libx264','-preset','fast','-crf','24','-r','24','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k',str(clip)],check=True)
 manifest.append({'scene':n+1,'duration':round(duration,2),'narration':voice,'screenshot':shot})
(out/'scenes.json').write_text(json.dumps(manifest,indent=2));(out/'concat.txt').write_text('\n'.join(f"file 'clip-{n}.mp4'" for n in range(3)))
subprocess.run(['ffmpeg','-y','-loglevel','error','-f','concat','-safe','0','-i',str(out/'concat.txt'),'-c','copy','-movflags','+faststart',str(root/'product-tour.mp4')],check=True)
print('Tour created',sum(x['duration'] for x in manifest),'seconds')
