// Cached canvas sprites keep the tactile desktop dice inexpensive to redraw.
const colors=['','#dd9b99','#e2bb7e','#99c5b2','#8ebbcf','#b7a4d2','#d6a7bf'];
const pips=[[],[[0,0]],[[-1,-1],[1,1]],[[-1,-1],[0,0],[1,1]],[[-1,-1],[1,-1],[-1,1],[1,1]],[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],[[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]]];
const sprites=new Map();
function tint(hex,f){let rgb=hex.slice(1).match(/../g).map(v=>parseInt(v,16));return `rgb(${rgb.map(v=>Math.round(f>0?v+(255-v)*f:v*(1+f))).join(',')})`}
function sprite(n,attack){let key=n+':'+attack;if(sprites.has(key))return sprites.get(key);let c=document.createElement('canvas');c.width=c.height=192;let ctx=c.getContext('2d');ctx.scale(2,2);let base=colors[n];
 const box=(x,y,w,h,r)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r)};
 ctx.shadowColor='#0009';ctx.shadowBlur=6;ctx.shadowOffsetY=4;let side=ctx.createLinearGradient(0,55,0,85);side.addColorStop(0,tint(base,-.12));side.addColorStop(1,tint(base,-.48));ctx.fillStyle=side;box(12,15,72,70,14);ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;
 let face=ctx.createLinearGradient(15,9,77,76);face.addColorStop(0,tint(base,.47));face.addColorStop(.22,tint(base,.18));face.addColorStop(.65,base);face.addColorStop(1,tint(base,-.2));ctx.fillStyle=face;box(12,9,72,69,14);ctx.fill();
 ctx.strokeStyle=tint(base,-.22);ctx.lineWidth=1;ctx.stroke();let shine=ctx.createLinearGradient(0,11,0,72);shine.addColorStop(0,'#ffffffcc');shine.addColorStop(.5,'#ffffff20');shine.addColorStop(1,'#ffffff00');ctx.strokeStyle=shine;ctx.lineWidth=2;box(14,11,68,64,12);ctx.stroke();
 for(let [x,y]of pips[n]){let px=48+x*17,py=43+y*17;ctx.fillStyle='#ffffff80';ctx.beginPath();ctx.arc(px,py+1,6.1,0,Math.PI*2);ctx.fill();let hole=ctx.createRadialGradient(px-1,py+2,1,px,py,6);hole.addColorStop(0,'#263c4a');hole.addColorStop(.65,'#152734');hole.addColorStop(1,'#071521');ctx.fillStyle=hole;ctx.beginPath();ctx.arc(px,py,5.5,0,Math.PI*2);ctx.fill()}
 if(attack){ctx.shadowColor='#ff8775';ctx.shadowBlur=5;ctx.strokeStyle='#ff9686';ctx.lineWidth=2.5;box(11,8,74,78,15);ctx.stroke()}
 sprites.set(key,c);return c;
}
export function drawDie(ctx,n,x,y,size=65,alpha=1,attack=false){ctx.save();ctx.globalAlpha=alpha;let extent=size*96/72;ctx.drawImage(sprite(n,attack),x-extent/2,y-extent/2,extent,extent);ctx.restore()}
