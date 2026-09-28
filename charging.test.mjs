import assert from 'node:assert/strict';
import {empty,matches,resolve} from './rules.mjs';
import {practice} from './lessons.mjs';
for(let n=2;n<=6;n++){let g=empty();for(let x=0;x<n;x++)g[12][x]={n};assert.equal(matches(g).gain,1,`${n}-face group earns one row`)}
let g=empty();for(let x of [0,1,6,7])g[12][x]={n:2};assert.equal(matches(g).gain,2);
g=empty();[3,4,5].forEach((n,x)=>g[12][x]={n});assert.equal(matches(g).gain,0);assert.equal(resolve(g).gain,0);
g=empty();g[12][0]={n:2};g[11][0]={n:2};g[12][1]={n:3};g[12][2]={n:4};assert.ok(matches(g).same.size);assert.equal(matches(g).gain,0,'overlap with straight blast earns nothing');
// Explicit tutorial chain verifies separate groups each earn a row.
let game=practice(3);game.drop(0);for(let t=0;t<100;t++)game.tick(50);assert.equal(game.boards[0].gauge,2);
game=practice(5);for(let sent=1;sent<=3;sent++){assert.ok(game.fire(0));assert.equal(game.boards[0].gauge,3-sent);assert.equal(game.boards[1].stats.received,sent)}assert.equal(game.fire(0),false);
console.log('PASS: faces 2–6 each give one row, separate groups, straight/overlap no charge, combo charge, one click one row');

