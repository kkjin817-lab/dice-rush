import {moveToColumn} from './touch.mjs';
import {drawDie} from './dice-art.mjs';
const desktopView=matchMedia('(min-width:751px)');
import {Game,W,H,cells} from './engine.mjs';
import {lessons,practice} from './lessons.mjs';
import {audio} from './sound.mjs';
const $=id=>document.getElementById(id),boards=[$('board0'),$('board1')],colors=['','#dd9b99','#e2bb7e','#99c5b2','#8ebbcf','#b7a4d2','#d6a7bf'];
const pips=[[],[[0,0]],[[-1,-1],[1,1]],[[-1,-1],[0,0],[1,1]],[[-1,-1],[1,-1],[-1,1],[1,1]],[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],[[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]]];
let game=new Game(),running=false,paused=false,lesson=-1,passed=false,moved=false,rotated=false,dropped=false,seen=0,effects=[],held=new Map(),last=0;
function die(ctx,n,x,y,size=65,alpha=1,attack=false){drawDie(ctx,n,x,y,size,alpha,attack)}
function drawBoard(i){let b=game.boards[i],ctx=boards[i].getContext('2d');ctx.clearRect(0,0,640,1040);for(let y=0;y<H;y++)for(let x=0;x<W;x++){ctx.fillStyle=(x+y)%2?'#172632':'#1a2b37';ctx.beginPath();ctx.roundRect(x*80+2,y*80+2,76,76,6);ctx.fill()}ctx.fillStyle='#efd09b33';ctx.fillRect(160,0,240,8);
 let moving=b.phase?.type==='fall'?b.phase.moves:[],dest=new Set(moving.map(m=>m.to*W+m.x));for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(b.g[y][x]&&!dest.has(y*W+x))die(ctx,b.g[y][x].n,x*80+40,y*80+40,65,1,b.g[y][x].attack);
 if(moving.length){let t=1-b.phase.left/b.phase.duration,tween=1-(1-t)**2;for(let m of moving)die(ctx,m.n,m.x*80+40,(m.from+(m.to-m.from)*tween)*80+40)}
 if(b.active&&!b.phase){for(let c of game.projected(b))die(ctx,c.n,c.x*80+40,c.y*80+40,65,.2);let list=cells(b.active);ctx.strokeStyle='#dfd8c95c';ctx.lineWidth=10;ctx.beginPath();for(let a of list)for(let c of list)if(Math.abs(a.x-c.x)+Math.abs(a.y-c.y)===1){ctx.moveTo(a.x*80+40,a.y*80+40);ctx.lineTo(c.x*80+40,c.y*80+40)}ctx.stroke();for(let c of list)die(ctx,c.n,c.x*80+40,c.y*80+40)}
 if(b.phase?.type==='clear'){ctx.fillStyle='#fff7d4';ctx.globalAlpha=.25+.4*Math.sin((1-b.phase.left/b.phase.duration)*Math.PI);for(let k of b.phase.removed){ctx.beginPath();ctx.roundRect(k%W*80+5,Math.floor(k/W)*80+5,70,70,12);ctx.fill()}ctx.globalAlpha=1}
 $('chain'+i).textContent=b.phase?.type==='clear'?(b.phase.kind==='mega'?'ALL CLEAR!':b.chain>1?b.chain+' CHAIN!':b.phase.kind==='same'?'MATCH!':'STRAIGHT!'):'';
 $('stock'+i).textContent='공격 '+b.gauge+'줄 준비';let rack=$('rack'+i);for(let j=0;j<10;j++)rack.children[j].classList.toggle('ready',j<b.gauge);rack.setAttribute('aria-label','보낼 공격 '+b.gauge+'줄, 최대 10줄');$('note'+i).textContent=b.note;
 let incoming=b.incoming.length,remaining=incoming?Math.max(0,Math.min(...b.incoming.map(p=>p.due))-game.time):0;let alert=$('alert'+i);alert.classList.toggle('active',incoming>0);$('alertText'+i).textContent=incoming?'⚠ '+incoming+'줄 도착 · '+(remaining/1000).toFixed(1)+'초':'대기 공격 없음';$('countdown'+i).style.width=(remaining/3000*100)+'%';let button=$('fire'+i);button.classList.toggle('counter',incoming>0);let label=incoming?'1줄 상쇄':i===1&&game.mode==='ai'?'공격 대기':'공격';let key=i===0?'F':'/';if(button.dataset.label!==label){button.innerHTML=label+(i===0||game.mode==='local'?' <kbd>'+key+'</kbd>':'');button.dataset.label=label}
 let pc=$('preview'+i).getContext('2d');pc.clearRect(0,0,144,96);if(b.next)for(let c of b.next.cells)die(pc,c.n,c.x*45+25,c.y*45+25,37);
}
function actionable(i){return running&&!paused&&!game.over&&(i===0||game.mode==='local'&&lesson<0)}
function permitted(action){if(lesson<0)return true;if(passed)return false;if(lesson===0)return ['left','right','rotate','drop'].includes(action);if([1,2,3,7].includes(lesson))return action==='drop';return action==='fire'}
function render(){drawBoard(0);drawBoard(1);for(let el of document.querySelectorAll('[data-action]')){let i=Number(el.dataset.player);el.disabled=!actionable(i)||!game.boards[i].active||!!game.boards[i].phase||!permitted(el.dataset.action)}for(let i=0;i<2;i++)$('fire'+i).disabled=!actionable(i)||!game.boards[i].gauge||!permitted('fire')}
function point(i,x=3,y=6){let r=boards[i].getBoundingClientRect();return {x:r.left+(x+.5)/W*r.width,y:r.top+(y+.5)/H*r.height}}
function fx(now){let c=$('fx'),d=devicePixelRatio||1;if(c.width!==Math.round(innerWidth*d)||c.height!==Math.round(innerHeight*d)){c.width=Math.round(innerWidth*d);c.height=Math.round(innerHeight*d)}let ctx=c.getContext('2d');ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,innerWidth,innerHeight);for(let e of game.events){if(e.id<=seen)continue;seen=e.id;audio.event(e);if(e.type==='rise'||e.type==='counter')effects.push({...e,start:now})}effects=effects.filter(e=>now-e.start<700);for(let e of effects){let t=(now-e.start)/700,r=boards[e.i].getBoundingClientRect();ctx.globalAlpha=1-t;ctx.fillStyle='#f58e7b';ctx.fillRect(r.left,r.bottom-8,r.width,8);ctx.font='bold 25px sans-serif';ctx.textAlign='center';ctx.fillText(e.type==='counter'?'1줄 상쇄!':'↑ '+e.rows+'줄!',r.left+r.width/2,r.bottom-50-t*40);ctx.globalAlpha=1}}

function action(i,type){if(!actionable(i)||!permitted(type))return;audio.unlock();if(type==='left'||type==='right'){if(game.move(i,type==='left'?-1:1)&&lesson===0)moved=true}if(type==='rotate'){if(game.rotate(i)&&lesson===0)rotated=true}if(type==='drop'){if(lesson===0&&(!moved||!rotated)){$('feedback').textContent=desktopView.matches?'이동과 회전을 각각 한 번 해본 뒤 놓아보세요.':'회전을 한 번 누르고, 보드를 터치해 옆 열로 움직인 뒤 손을 떼세요.';return}if(game.drop(i))dropped=true}if(type==='fire'){if(game.fire(i)){let button=$('fire'+i);button.classList.remove('fired');void button.offsetWidth;button.classList.add('fired')}};checkLesson()}
function checkLesson(){if(lesson<0||passed)return;let b=game.boards[0],success=false;if(lesson===0)success=dropped&&!b.phase;if(lesson===1)success=b.stats.clear>=2&&!b.phase;if(lesson===2)success=game.events.some(e=>e.kind==='straight')&&!b.phase;if(lesson===3)success=b.maxChain>=2&&!b.phase;if(lesson===4)success=game.boards[1].stats.received===1;if(lesson===5)success=b.stats.sent===3&&game.boards[1].stats.received===3;if(lesson===6)success=b.stats.counter===3;if(lesson===7)success=game.events.some(e=>e.type==='mega')&&!b.phase;if(success){passed=true;$('next').disabled=false;$('feedback').textContent=lessons[lesson][2];audio.play('win')}}
function lessonInstruction(n){
 if(desktopView.matches)return lessons[n][1];
 if(n===0)return '먼저 ↻ 회전을 누르세요. 보드를 터치하고 좌우로 움직여 위치를 고른 뒤 손을 떼세요. 흐린 주사위가 착지 위치예요.';
 return lessons[n][1].replaceAll('⇓ 놓기를 누르세요.','보드를 터치했다가 손을 떼세요.').replaceAll('⇓ 놓기를 누르고','보드를 터치했다가 손을 떼고').replaceAll('⇓ 놓기로','보드를 터치했다 떼어').replaceAll('한 줄 보내기','공격');
}
let gesture=null;
const board=boards[0];
board.addEventListener('pointerdown',e=>{
 if(desktopView.matches||gesture||!e.isPrimary||e.button!==0||!actionable(0)||!permitted('drop'))return;
 let b=game.boards[0];if(!b.active||b.phase)return;
 audio.unlock();gesture={id:e.pointerId,game,piece:b.active.cells};board.setPointerCapture(e.pointerId);aim(e);
});
function aim(e){
 if(!gesture||gesture.id!==e.pointerId||gesture.game!==game)return;
 if(game.boards[0].active?.cells!==gesture.piece)return;
 if(permitted('left')){let r=board.getBoundingClientRect();if(moveToColumn(game,0,Math.floor((e.clientX-r.left)/r.width*W))&&lesson===0)moved=true;}
}
board.addEventListener('pointermove',aim);
board.addEventListener('pointerup',e=>{
 if(!gesture||gesture.id!==e.pointerId)return;
 const valid=gesture.game===game&&game.boards[0].active?.cells===gesture.piece;
 aim(e);gesture=null;
 const r=board.getBoundingClientRect();
 if(valid&&e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom)action(0,'drop');
});
board.addEventListener('pointercancel',()=>gesture=null);
board.addEventListener('lostpointercapture',()=>gesture=null);
function syncMode(){let option=$('mode').querySelector('[value=local]');option.disabled=!desktopView.matches;if(!desktopView.matches){$('mode').value='ai';$('difficultyLabel').hidden=false;}}
syncMode();
desktopView.addEventListener('change',()=>{syncMode();gesture=null;if(lesson>=0)$('instruction').textContent=lessonInstruction(lesson);});
function setup(n){lesson=n;game=practice(n);running=true;paused=false;passed=false;moved=false;rotated=false;dropped=false;seen=0;effects=[];held.clear();$('pauseVeil').hidden=true;$('pause').textContent='일시정지';document.body.classList.add('training');$('lesson').hidden=false;$('step').textContent='PLAY TO LEARN · '+(n+1)+' / '+lessons.length;$('lessonTitle').textContent=lessons[n][0];$('instruction').textContent=lessonInstruction(n);$('feedback').textContent=n===6?'상쇄 연습에서는 공격 시간을 멈춰두었어요. 실제 대전은 3초입니다.':'연습에서는 자동 낙하가 멈춰 있어요.';$('next').disabled=true;$('next').textContent=n===7?'대전 선택 →':'다음 →';$('name0').textContent='나의 연습 보드';$('name1').textContent='상대 연습 보드';$('keys1').textContent='실전과 같은 화면 · 같은 조작 · 같은 규칙'}
function newGame(){game=new Game(Date.now(),Number($('difficulty').value),(desktopView.matches?$('mode').value:'ai'));lesson=-1;running=true;paused=false;seen=0;effects=[];held.clear();$('pauseVeil').hidden=true;$('pause').textContent='일시정지';$('lesson').hidden=true;document.body.classList.remove('training');$('name0').textContent='1P';$('name1').textContent=game.mode==='local'?'2P':'AI';$('keys1').textContent=game.mode==='local'?'← → 이동 · ↑ 회전 · ↓ 빠르게 · Enter 놓기 · / 한 줄':'상대의 새 블록이 들어올 공간을 막으면 승리!';$('start').close();$('result').close();audio.unlock();audio.play('start')}
function menu(){running=false;paused=false;held.clear();$('pauseVeil').hidden=true;$('result').close();if(!$('start').open)$('start').showModal()}
function tutorial(){audio.unlock();$('start').close();$('result').close();setup(0)}
function pause(){if(!running)return;paused=!paused;held.clear();$('pauseVeil').hidden=!paused;$('pause').textContent=paused?'계속하기':'일시정지'}
document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>action(Number(b.dataset.player),b.dataset.action));$('fire0').onclick=()=>action(0,'fire');$('fire1').onclick=()=>action(1,'fire');$('play').onclick=newGame;$('again').onclick=newGame;$('menu').onclick=menu;$('resultMenu').onclick=menu;$('learn').onclick=tutorial;$('tutorial').onclick=tutorial;$('pause').onclick=pause;$('resume').onclick=pause;$('sound').onclick=()=>{audio.toggle();$('sound').textContent=audio.enabled?'소리 켜짐':'소리 꺼짐'};$('retry').onclick=()=>setup(lesson);$('next').onclick=()=>{if(!passed)return;if(lesson<7)setup(lesson+1);else menu()};$('skip').onclick=menu;$('mode').onchange=()=>{$('difficultyLabel').hidden=$('mode').value==='local'};$('start').addEventListener('cancel',e=>e.preventDefault());
const keys={KeyA:[0,'left'],KeyD:[0,'right'],KeyW:[0,'rotate'],KeyS:[0,'soft'],Space:[0,'drop'],KeyF:[0,'fire'],ArrowLeft:[1,'left'],ArrowRight:[1,'right'],ArrowUp:[1,'rotate'],ArrowDown:[1,'soft'],Enter:[1,'drop'],NumpadEnter:[1,'drop'],Slash:[1,'fire']};
window.addEventListener('keydown',e=>{if(e.target?.id?.startsWith('fire')&&['Space','Enter','NumpadEnter'].includes(e.code)){e.preventDefault();if(!e.repeat)action(Number(e.target.id.slice(-1)),'fire');return}if($('start').open||$('result').open)return;if(e.code==='Escape'){e.preventDefault();if(!e.repeat)pause();return}let mapping=keys[e.code];if(!mapping)return;let [i,type]=mapping;if(game.mode==='ai')i=0;if(!actionable(i)||!permitted(type))return;e.preventDefault();if(e.repeat)return;if(type!=='soft')action(i,type);if(['left','right','soft'].includes(type))held.set(e.code,{i,type,time:0,next:210})});window.addEventListener('keyup',e=>held.delete(e.code));window.addEventListener('blur',()=>{held.clear();if(running&&!paused&&!$('start').open)pause()});
function frame(now){let dt=Math.min(50,now-last||16);last=now;if(running&&!paused&&!game.over){let soft=[false,false];for(let v of held.values()){if(v.type==='soft')soft[v.i]=true;else{v.time+=dt;if(v.time>=v.next){action(v.i,v.type);v.next+=95}}}game.tick(dt,soft);checkLesson()}if(running&&game.over){running=false;held.clear();$('resultTitle').textContent=game.result;$('resultText').textContent='최대 '+game.boards[0].maxChain+'연쇄 · 제거 '+game.boards[0].stats.clear+'개 · 발사 '+game.boards[0].stats.sent+'회';$('result').showModal();audio.play(game.boards[0].dead?'lose':'win')}render();fx(now);requestAnimationFrame(frame)}
for(let i=0;i<2;i++)$('rack'+i).replaceChildren(...Array.from({length:10},()=>document.createElement('i')));render();$('start').showModal();requestAnimationFrame(frame);




