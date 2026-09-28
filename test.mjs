import assert from 'node:assert/strict';
import {Game,empty,cells,rotatePiece,compact} from './engine.mjs';
import {practice} from './lessons.mjs';
const settle=g=>{for(let i=0;i<500&&g.boards.some(b=>b.phase);i++)g.tick(50);assert.ok(g.boards.every(b=>!b.phase))};
let g=new Game(1,900,'local'),p={x:2,y:0,cells:[{x:0,y:0,n:2},{x:0,y:1,n:4},{x:1,y:1,n:6}]},r=p;for(let n=0;n<4;n++)r=rotatePiece(r);assert.deepEqual(r,p);g.boards[0].active=p;g.rotate(0);assert.deepEqual(g.boards[0].active.cells.map(c=>c.n),[2,4,6]);
g.boards[0].active={...p,x:7,cells:[{x:0,y:0,n:2},{x:0,y:1,n:5},{x:0,y:2,n:6}]};assert.ok(g.rotate(0));assert.ok(g.valid(g.boards[0],g.boards[0].active));assert.equal(g.move(0,1),false);
let grid=empty();grid[10][0]={n:5};grid[8][0]={n:3};compact(grid);assert.equal(grid[12][0].n,5);assert.equal(grid[11][0].n,3);
for(let n of [1,2,3,7]){g=practice(n);assert.ok(g.drop(0));settle(g);if(n===1){assert.equal(g.boards[0].gauge,1);assert.equal(g.boards[0].stats.clear,2)}if(n===2)assert.ok(g.events.some(e=>e.kind==='straight'));if(n===3)assert.equal(g.boards[0].maxChain,2);if(n===7){assert.ok(g.events.some(e=>e.type==='mega'));assert.ok(g.boards[0].g.flat().every(t=>!t));assert.equal(g.boards[0].gauge,0)}}
g=new Game(2,900,'local');g.boards[0].g[0][2]={n:6};g.boards[0].next={x:2,y:0,cells:[{x:0,y:0,n:1},{x:1,y:0,n:2},{x:2,y:0,n:3}]};g.spawn(g.boards[0]);assert.equal(g.result,'2P 승리!');
// Seeded games exercise both AI navigation and falling/clear/attack phase transitions.
for(let seed=1;seed<=12;seed++){g=new Game(seed,200,'ai');for(let frame=0;frame<1600&&!g.over;frame++){if(frame%19===0){g.rotate(0);g.move(0,frame%2?1:-1);g.drop(0)}if(frame%13===0)g.fire(0);g.tick(50);for(let b of g.boards){assert.ok(b.gauge>=0&&b.gauge<=10);if(b.active&&!b.phase)assert.ok(g.valid(b,b.active),'active piece overlaps board');for(let row of b.g)for(let t of row)if(t)assert.ok(t.n>=1&&t.n<=6)}}}
g=practice(4);g.credit(g.boards[0],100,15);assert.equal(g.boards[0].gauge,10);
g=practice(4);g.boards[1].g[12][0]={n:6};assert.ok(g.fire(0));assert.equal(g.boards[0].gauge,0);assert.equal(g.boards[1].g[11][0].n,6);assert.ok(g.boards[1].g[12].every(t=>t&&t.n>=1&&t.n<=6));assert.equal(g.boards[1].stats.received,1);
g=practice(5);for(let j=0;j<3;j++)g.fire(0);assert.equal(g.boards[0].gauge,0);assert.equal(g.boards[1].g.slice(10).flat().filter(Boolean).length,24);assert.equal(g.boards[1].stats.received,3);settle(g);
g=practice(5);g.boards[0].gauge=10;for(let j=0;j<10;j++)g.fire(0);assert.equal(g.boards[1].g.slice(3).flat().filter(Boolean).length,80);assert.equal(g.boards[0].stats.sent,10);
g=practice(4);g.boards[1].g[0][7]={n:6};g.fire(0);assert.ok(g.over);assert.ok(g.boards[1].dead);
// Row attack during an already flashing clear credits that clear exactly once.
g=practice(1);g.drop(0);assert.equal(g.boards[0].phase.type,'clear');g.boards[1].gauge=1;g.fire(1);assert.equal(g.boards[0].stats.clear,2);settle(g);assert.equal(g.boards[0].gauge,1);
// Full boards do not cancel or consume the recipient's saved attack.
g=practice(4);g.boards[1].gauge=5;g.fire(0);assert.equal(g.boards[1].gauge,5);
console.log('PASS: rotation, gravity, tutorial, chains, one attack per group, cap 10, instant 1/3/10 rows, overflow, no cancellation, interrupted clear, 12 seeded AI matches');


