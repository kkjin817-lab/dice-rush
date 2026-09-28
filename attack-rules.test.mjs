import assert from 'node:assert/strict';
import {empty,matches,hasMega,resolve} from './rules.mjs';
import {simulate,Game} from './engine.mjs';
const attack=n=>({n,attack:true});
let g=empty();g[12][0]=attack(2);g[12][1]=attack(2);assert.equal(matches(g).removed.size,0);g[12][0]={n:2};assert.equal(matches(g).same.size,2);
g=empty();[3,4,5].forEach((n,x)=>g[12][x]=attack(n));g[11][2]=attack(6);assert.equal(matches(g).removed.size,0);g[12][0]={n:3};assert.ok(matches(g).removed.has(11*8+2),'valid straight blasts nearby attack dice');
g=empty();for(let x=0;x<8;x++)g[12][x]=attack(1);g[11][0]=attack(1);g[11][1]=attack(1);assert.equal(hasMega(g),false);assert.equal(resolve(g).count,0);g[11][1]={n:1};assert.equal(hasMega(g),true);assert.equal(resolve(g).count,10);
// The second cascade must not activate merely because the first was valid.
function chain(mixed){let b=empty();b[12][0]={n:2};b[11][0]=attack(2);b[10][0]=attack(3);b[12][1]=mixed?{n:3}:attack(3);b[12][2]=attack(3);return b}
g=chain(false);let r=simulate(g);assert.equal(r.chain,1);assert.equal(r.count,2);assert.equal(g[12][0].attack,true);assert.equal(g[12][1].attack,true);
g=chain(true);r=simulate(g);assert.equal(r.chain,2);assert.equal(r.count,5);
// Even ten random rows on an empty board stay intact, across many seeds.
for(let seed=1;seed<=50;seed++){let game=new Game(seed);game.practice=true;game.boards.forEach(b=>{b.g=empty();b.active=null});game.boards[0].gauge=10;for(let j=0;j<10;j++)game.fire(0);for(let i=0;i<100;i++)game.tick(50);assert.equal(game.boards[1].g.flat().filter(Boolean).length,80);assert.equal(game.boards[1].stats.clear,0);assert.equal(game.boards[1].gauge,0)}
console.log('PASS: attack-only groups/straights/mega blocked, mixed matches and collateral allowed, cascade recheck, persistent provenance, 50 ten-row attacks');

