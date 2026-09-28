import {W,H,empty,rng,matches,hasMega} from './rules.mjs';
export {W,H,empty};
export const clone=g=>g.map(row=>row.map(t=>t&&({...t})));
export function cells(p){return p.cells.map(c=>({x:p.x+c.x,y:p.y+c.y,n:c.n}))}
export function rotatePiece(p){let list=p.cells.map(c=>({x:-c.y,y:c.x,n:c.n})),minX=Math.min(...list.map(c=>c.x)),minY=Math.min(...list.map(c=>c.y));return {...p,cells:list.map(c=>({...c,x:c.x-minX,y:c.y-minY}))}}
export function compact(g){let moves=[];for(let x=0;x<W;x++){let bottom=H-1;for(let y=H-1;y>=0;y--)if(g[y][x]){let t=g[y][x];if(y!==bottom){g[bottom][x]=t;g[y][x]=null;moves.push({x,from:y,to:bottom,n:t.n})}bottom--}}return moves}
function wave(g){if(hasMega(g)){let removed=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(g[y][x])removed.push(y*W+x);return {removed,gain:0,kind:'mega'}}let m=matches(g);return {removed:[...m.removed],gain:m.gain,kind:m.wide.size?'expanded':m.straight.size?'straight':'same'}}
export function simulate(g){compact(g);let total=0,count=0,chain=0;for(let n=0;n<128;n++){let w=wave(g);if(!w.removed.length)break;chain++;total+=w.gain;count+=w.removed.length;for(let k of w.removed)g[Math.floor(k/W)][k%W]=null;compact(g)}return {total,count,chain}}
export class Game{
 constructor(seed=Date.now(),speed=700,mode='ai'){this.random=rng(seed^991);this.speed=speed;this.mode=mode;this.time=0;this.id=0;this.events=[];this.over=false;this.practice=false;this.boards=[0,1].map(()=>({g:empty(),random:rng(seed),active:null,next:null,gauge:0,phase:null,fall:0,contact:0,ai:0,chain:0,maxChain:0,dead:false,note:'같은 눈을 모으거나 스트레이트를 만드세요.',stats:{clear:0,sent:0,received:0}}));this.boards.forEach(b=>this.spawn(b))}
 piece(b){let shape=b.random()<.5?[[0,0],[1,0],[2,0]]:[[0,0],[0,1],[1,1]];return {x:2,y:0,cells:shape.map(([x,y])=>({x,y,n:1+Math.floor(b.random()*6)}))}}
 valid(b,p){return cells(p).every(c=>c.x>=0&&c.x<W&&c.y>=0&&c.y<H&&!b.g[c.y][c.x])}
 spawn(b){if(this.practice)return;b.active=b.next||this.piece(b);b.next=this.piece(b);b.fall=0;b.contact=0;if(!this.valid(b,b.active)){b.active=null;b.dead=true;this.finish()}}
 event(type,i,data={}){this.events.push({id:++this.id,type,i,time:this.time,...data});if(this.events.length>180)this.events.shift()}
 move(i,dx){let b=this.boards[i];if(this.over||b.phase||!b.active)return false;let p={...b.active,x:b.active.x+dx};if(!this.valid(b,p))return false;b.active=p;b.contact=0;return true}
 rotate(i){let b=this.boards[i];if(this.over||b.phase||!b.active)return false;let p=rotatePiece(b.active);for(let dx of [0,-1,1,-2,2]){let q={...p,x:p.x+dx};if(this.valid(b,q)){b.active=q;b.contact=0;this.event('rotate',i);return true}}return false}
 down(i){let b=this.boards[i];if(!b.active||b.phase||this.over)return false;let p={...b.active,y:b.active.y+1};if(!this.valid(b,p))return false;b.active=p;return true}
 landing(b){if(!b.active)return null;let p={...b.active};while(this.valid(b,{...p,y:p.y+1}))p.y++;return p}
 projected(b){let p=this.landing(b);if(!p)return [];let g=clone(b.g),placed=cells(p).sort((a,c)=>c.y-a.y),result=[];for(let c of placed){let y=c.y;while(y+1<H&&!g[y+1][c.x])y++;g[y][c.x]={n:c.n};result.push({...c,y})}return result}
 drop(i){let b=this.boards[i];if(this.over||b.phase||!b.active)return false;b.active=this.landing(b);this.lock(i);return true}
 lock(i){let b=this.boards[i];if(!b.active)return;for(let c of cells(b.active))b.g[c.y][c.x]={n:c.n};b.active=null;b.chain=0;this.event('place',i);this.gravity(i,true)}
 gravity(i,charge){let b=this.boards[i],before=clone(b.g),moves=compact(b.g);if(moves.length)b.phase={type:'fall',left:300,duration:300,before,moves,charge};else this.scan(i,charge)}
 scan(i,charge){let b=this.boards[i],w=wave(b.g);if(!w.removed.length){b.phase=null;if(b.active&&!this.valid(b,b.active)){let candidate={...b.active};while(candidate.y>0&&!this.valid(b,candidate))candidate.y--;if(this.valid(b,candidate))b.active=candidate;else{b.dead=true;b.active=null;this.finish();return}}if(!b.active)this.spawn(b);return}b.chain++;b.maxChain=Math.max(b.maxChain,b.chain);b.phase={type:'clear',left:420,duration:420,...w,charge};b.note=w.kind==='mega'?'1 열 개 연결! 전체 폭발':(b.chain>1?b.chain+'연쇄! ':'')+(w.kind==='same'?'같은 눈 연결':w.kind==='expanded'?'1 포함 스트레이트 · 두 겹 폭발':'스트레이트 · 한 겹 폭발');this.event(w.kind==='mega'?'mega':w.kind==='expanded'?'expanded':'clear',i,{chain:b.chain,kind:w.kind})}
 phaseTick(i,dt){let b=this.boards[i],p=b.phase;p.left-=dt;if(p.left>0)return;b.phase=null;if(p.type==='fall'){this.scan(i,p.charge);return}for(let k of p.removed)b.g[Math.floor(k/W)][k%W]=null;this.credit(b,p.removed.length,p.gain);this.gravity(i,p.charge)}
 credit(b,count,gain){b.stats.clear+=count;b.gauge=Math.min(10,b.gauge+gain)}
 fire(i){let b=this.boards[i];if(this.over||b.gauge<=0)return false;let count=1;b.gauge-=count;b.stats.sent+=count;b.note=count+'줄 공격!';this.event('fire',i,{rows:count,n:6});this.receiveRows(1-i,count);return true}
 receiveRows(i,count){let b=this.boards[i];
 // Complete an already flashing removal once, then replace any stale animation.
 if(b.phase?.type==='clear'){let p=b.phase;for(let k of p.removed)b.g[Math.floor(k/W)][k%W]=null;this.credit(b,p.removed.length,p.gain)}
 b.phase=null;let overflow=b.g.slice(0,count).some(row=>row.some(Boolean));
 b.g=b.g.slice(count).concat(Array.from({length:count},()=>Array.from({length:W},()=>({n:1+Math.floor(this.random()*6),attack:true}))));
 b.stats.received+=count;b.note=count+'줄이 즉시 올라왔어요!';this.event('rise',i,{rows:count});
 if(overflow){b.dead=true;b.active=null;this.finish();return}
 if(b.active)b.active={...b.active,y:Math.max(0,b.active.y-count)};
 b.chain=0;this.scan(i,true);
 }
 aiAct(){let b=this.boards[1];if(b.gauge>0){this.fire(1);return}if(!b.active||b.phase)return;let start=b.active,queue=[{p:start,first:null}],seen=new Set(),best=null;while(queue.length){let {p,first}=queue.shift(),key=p.x+':'+p.cells.map(c=>c.x+','+c.y+','+c.n).join(';');if(seen.has(key))continue;seen.add(key);let q={...p};while(this.valid(b,{...q,y:q.y+1}))q.y++;let g=clone(b.g);for(let c of cells(q))g[c.y][c.x]={n:c.n};let r=simulate(g),height=0,max=0,near=0;for(let x=0;x<W;x++){let top=g.findIndex(row=>row[x]);let h=top<0?0:H-top;height+=h;max=Math.max(max,h)}for(let y=0;y<H;y++)for(let x=0;x<W-1;x++)if(g[y][x]&&g[y][x].n===g[y][x+1]?.n)near++;let score=r.count*3+r.total*2+r.chain*5-height*.8-max*3+near*.6;if(!best||score>best.score)best={score,first};for(let dx of [-1,1]){let next={...p,x:p.x+dx};if(this.valid(b,next))queue.push({p:next,first:first||{type:'move',dx}})}let rot=rotatePiece(p);if(this.valid(b,rot))queue.push({p:rot,first:first||{type:'rotate'}})}if(best?.first){if(best.first.type==='move')this.move(1,best.first.dx);else this.rotate(1)}else this.drop(1)}
 finish(){if(this.boards.some(b=>b.dead)){this.over=true;this.result=this.boards.every(b=>b.dead)?'무승부':this.boards[0].dead?(this.mode==='local'?'2P 승리!':'다음에는 이길 수 있어요!'):'1P 승리!'}}
 tick(dt,soft=[false,false]){if(this.over)return;this.time+=dt;for(let i=0;i<2;i++){let b=this.boards[i];if(b.phase){this.phaseTick(i,dt);continue}if(!this.practice&&b.active){b.fall+=dt;let interval=soft[i]?65:Math.max(430,1000-this.time/1000*2);if(b.fall>=interval){b.fall%=interval;this.down(i)}if(!this.valid(b,{...b.active,y:b.active.y+1})){b.contact+=dt;if(b.contact>450)this.lock(i)}else b.contact=0}if(i===1&&this.mode==='ai'&&!this.practice){b.ai+=dt;if(b.ai>=this.speed){b.ai=0;this.aiAct()}}}this.finish()}
}


