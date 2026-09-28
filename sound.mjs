// Short synthesized cues; no external audio downloads.
class Sound {
constructor(){this.enabled=true;this.ctx=null;this.voices=new Set();this.last={}}
unlock(){try{const A=globalThis.AudioContext||globalThis.webkitAudioContext;if(!A)return;if(!this.ctx){this.ctx=new A();this.master=this.ctx.createGain();this.master.gain.value=.2;this.master.connect(this.ctx.destination)}if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{})}catch{}}
stop(){for(let o of this.voices){try{o.stop()}catch{}}this.voices.clear()}
toggle(){this.enabled=!this.enabled;this.stop();if(this.enabled){this.unlock();this.play('start')}}
tone(f,to,d,delay=0,type='sine',vol=.3){if(!this.enabled||!this.ctx||this.ctx.state!=='running'||this.voices.size>=16)return;let c=this.ctx,t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,to),t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.007);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(this.master);this.voices.add(o);o.onended=()=>{this.voices.delete(o);o.disconnect();g.disconnect()};o.start(t);o.stop(t+d+.02)}
play(type,quiet=false){if(!this.enabled)return;let now=this.ctx?.currentTime||0;if(now-(this.last[type]??-10)<.07)return;this.last[type]=now;let v=quiet?.12:.3;if(type==='place')this.tone(230,130,.065,0,'sine',v);else if(type==='fire')this.tone(420,850,.13,0,'triangle',v);else if(type==='counter'||type==='block'){this.tone(900,500,.1,0,'sine',v);this.tone(1200,800,.1,.045,'sine',v)}else if(type==='mega'){this.tone(150,35,.55,0,'triangle',v);[330,440,660,880].forEach((f,i)=>this.tone(f,f*1.05,.2,i*.06,'sine',v))}else if(type==='lose'){[440,330,220].forEach((f,i)=>this.tone(f,f*.8,.2,i*.12,'sine',v))}else{let notes=type==='expanded'?[440,660,880]:type==='win'?[523,659,784,1047]:[520,780];notes.forEach((f,i)=>this.tone(f,f,.13,i*.065,'sine',v))}}
event(e){if(e.type==='place'&&e.i===1)return;if(['place','clear','fire','counter','block','mega','expanded'].includes(e.type))this.play(e.type,e.i===1)}
}
export const audio=new Sound();
