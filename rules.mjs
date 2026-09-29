export const W=8,H=13;
export function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
export const empty=()=>Array.from({length:H},()=>Array(W).fill(null));
export function oneGroups(g){let seen=new Set(),groups=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++){let k=y*W+x;if(g[y][x]?.n!==1||seen.has(k))continue;let q=[k],cells=[];seen.add(k);while(q.length){let v=q.pop(),a=v%W,b=Math.floor(v/W);cells.push(v);for(let [c,d]of [[a-1,b],[a+1,b],[a,b-1],[a,b+1]])if(c>=0&&c<W&&d>=0&&d<H&&g[d][c]?.n===1&&!seen.has(d*W+c)){seen.add(d*W+c);q.push(d*W+c)}}groups.push(cells)}return groups.sort((a,b)=>b.length-a.length)}
export function largestOnes(g){return oneGroups(g)[0]||[]}
export function nextNumber(b){return 1+Math.floor(b.random()*6)}
export function hasPlayerDie(g,cells){return cells.some(k=>!g[Math.floor(k/W)][k%W].attack)}
export function hasMega(g){return oneGroups(g).some(group=>group.length>=10&&hasPlayerDie(g,group))}
export function matches(g){let groups=[],same=new Set(),straight=new Set(),wide=new Set(),seen=new Set();const key=(x,y)=>y*W+x;for(let y=0;y<H;y++)for(let x=0;x<W;x++){let n=g[y][x]?.n,k=key(x,y);if(!n||n===1||seen.has(k))continue;let q=[[x,y]],cells=[];seen.add(k);while(q.length){let [a,b]=q.pop();cells.push(key(a,b));for(let [c,d]of [[a-1,b],[a+1,b],[a,b-1],[a,b+1]])if(c>=0&&c<W&&d>=0&&d<H&&g[d][c]?.n===n&&!seen.has(key(c,d))){seen.add(key(c,d));q.push([c,d])}}if(cells.length>=n&&hasPlayerDie(g,cells)){groups.push(cells);cells.forEach(v=>same.add(v))}}
for(let y=0;y<H;y++)for(let x=0;x<W;x++)for(let [dx,dy]of [[1,0],[0,1]])for(let sign of [-1,1]){let cells=[],n=g[y][x]?.n;if(!n)continue;for(let a=x,b=y;a<W&&b<H&&g[b][a]?.n===n+sign*cells.length;a+=dx,b+=dy)cells.push(key(a,b));if(cells.length>=3&&hasPlayerDie(g,cells)){cells.forEach(v=>straight.add(v));if(cells.some(v=>g[Math.floor(v/W)][v%W].n===1))cells.forEach(v=>wide.add(v))}}
let blast=new Set(straight);for(let k of straight){let x=k%W,y=Math.floor(k/W),radius=wide.has(k)?2:1;for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){let a=x+dx,b=y+dy;if(Math.abs(dx)+Math.abs(dy)<=radius&&a>=0&&a<W&&b>=0&&b<H&&g[b][a])blast.add(b*W+a)}}let removed=new Set([...same,...blast]),gain=0;
// Only independently valid same-face components outside the blast earn attacks.
for(let group of groups){let remaining=new Set(group.filter(k=>!blast.has(k)));while(remaining.size){let first=remaining.values().next().value,q=[first],part=[];remaining.delete(first);while(q.length){let k=q.pop(),x=k%W,y=Math.floor(k/W);part.push(k);for(let [a,b]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){let next=b*W+a;if(a>=0&&a<W&&b>=0&&b<H&&remaining.delete(next))q.push(next)}}if(part.length>=g[Math.floor(first/W)][first%W].n&&hasPlayerDie(g,part))gain+=g[Math.floor(first/W)][first%W].n}}
return{same,straight,wide,removed,blast,gain}}
export function resolve(g,charge=true){let gain=0,count=0,lines=0,flash=[],mega=false,expanded=false;for(let loop=0;loop<128;loop++){if(hasMega(g)){mega=true;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(g[y][x]){flash.push(y*W+x);count++;g[y][x]=null}break}let m=matches(g);expanded||=m.wide.size>0;if(!m.removed.size)break;gain+=charge?m.gain:0;count+=m.removed.size;lines+=m.straight.size?1:0;flash.push(...m.removed);for(let k of m.removed)g[Math.floor(k/W)][k%W]=null;for(let x=0;x<W;x++){let col=[];for(let y=H-1;y>=0;y--)if(g[y][x])col.push(g[y][x]);for(let y=H-1;y>=0;y--)g[y][x]=col[H-1-y]||null}}return{gain,count,lines,flash,mega,expanded}}



