import assert from 'node:assert/strict';
import {practice} from './lessons.mjs';
let g=practice(5);g.fire(0);assert.equal(g.boards[1].stats.received,0);g.tick(1000);g.fire(0);assert.deepEqual(g.boards[1].incoming.map(p=>p.due),[3000,4000]);g.tick(1999);assert.equal(g.boards[1].stats.received,0);g.tick(1);assert.equal(g.boards[1].stats.received,1);assert.equal(g.boards[1].incoming.length,1);g.tick(1000);assert.equal(g.boards[1].stats.received,2);
g=practice(5);for(let i=0;i<3;i++)g.fire(0);g.boards[1].gauge=2;g.fire(1);g.fire(1);assert.equal(g.boards[1].incoming.length,1);assert.equal(g.boards[0].incoming.length,0);assert.equal(g.boards[1].stats.counter,2);g.tick(3000);assert.equal(g.boards[1].stats.received,1);
g=practice(5);g.fire(0);g.boards[1].gauge=2;g.fire(1);g.fire(1);assert.equal(g.boards[1].incoming.length,0);assert.equal(g.boards[0].incoming.length,1);assert.equal(g.boards[1].stats.sent,1);
g=practice(6);g.tick(9000);assert.equal(g.boards[0].incoming[0].due-g.time,3000);for(let i=0;i<3;i++)g.fire(0);assert.equal(g.boards[0].stats.counter,3);assert.equal(g.boards[0].gauge,0);
// Incoming attacks arrive on time even while the receiver is clearing dice.
g=practice(1);g.boards[1].gauge=1;g.fire(1);g.tick(2900);g.drop(0);assert.equal(g.boards[0].phase.type,'clear');g.tick(100);assert.equal(g.boards[0].stats.received,1);assert.equal(g.boards[0].stats.clear,2);assert.equal(g.boards[0].gauge,2);
g=practice(4);g.boards[1].g[0][7]={n:6};g.fire(0);assert.equal(g.over,false);g.tick(3000);assert.equal(g.over,true);
console.log('PASS: exact 3s delay, independent deadlines, oldest-first cancellation, remaining rows, fire after cancellation, tutorial, clearing interruption, delayed overflow');
