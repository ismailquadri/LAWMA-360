// Subtle warm ambient underscore: slow stereo pad swells, soft sub root, no percussion.
// Designed to sit far beneath the voiceover (mixed low + sidechain-ducked at master).
import fs from 'node:fs';
const rate=44100,duration=70,n=rate*duration,b=Buffer.alloc(44+n*4);
b.write('RIFF',0);b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);
b.writeUInt16LE(1,20);b.writeUInt16LE(2,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*4,28);
b.writeUInt16LE(4,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(n*4,40);
// Warm progression (Fmaj7 · Dm9 · Bbmaj7 · C6), one chord per 10s bar, long crossfades.
const chords=[[174.61,220,261.63,329.63],[146.83,220,261.63,293.66],[116.54,174.61,220,293.66],[130.81,196,220,329.63]];
const harmonic=(f,t,det)=>{let v=0;for(let h=1;h<=4;h++){v+=Math.sin(2*Math.PI*f*h*(1+det)*t+Math.sin(t*0.37)*0.02)/(h*h*1.4)}return v};
for(let i=0;i<n;i++){
 const t=i/rate,bar=Math.floor(t/10)%4,phase=t%10;
 const fadeIn=Math.min(1,t/6),fadeOut=Math.min(1,(70-t)/5),fade=Math.min(fadeIn,fadeOut);
 const blend=Math.min(1,phase/3.5);                    // slow 3.5s chord crossfade
 const swell=0.75+0.25*Math.sin(2*Math.PI*t/16-1.2);   // gentle 16s breathing
 const cur=chords[bar],old=chords[(bar+3)%4];
 let L=0,R=0;
 for(let c=0;c<4;c++){
  const amp=(c===0?0.5:0.3);                            // root slightly stronger
  L+=(harmonic(cur[c],t,-0.0012)*blend+harmonic(old[c],t,-0.0012)*(1-blend))*amp;
  R+=(harmonic(cur[c],t,+0.0012)*blend+harmonic(old[c],t,+0.0012)*(1-blend))*amp;
 }
 const sub=Math.sin(2*Math.PI*(cur[0]/2)*t)*0.22*blend+Math.sin(2*Math.PI*(old[0]/2)*t)*0.22*(1-blend);
 L=(L*0.22+sub*0.5)*swell*fade; R=(R*0.22+sub*0.5)*swell*fade;
 b.writeInt16LE(Math.max(-32767,Math.min(32767,Math.round(L*9000))),44+i*4);
 b.writeInt16LE(Math.max(-32767,Math.min(32767,Math.round(R*9000))),46+i*4);
}
fs.writeFileSync('outputs/presentation-assets/release-film/score.wav',b);
console.log('score rendered');
