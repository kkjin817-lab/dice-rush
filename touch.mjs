// Move through reachable columns, never through settled dice.
export function moveToColumn(game, i, column) {
  const b=game.boards[i];
  if(!b.active||b.phase||game.over)return false;
  const width=1+Math.max(...b.active.cells.map(c=>c.x));
  const target=Math.max(0,Math.min(8-width,column));
  let moved=false;
  while(b.active.x!==target){
    if(!game.move(i,Math.sign(target-b.active.x)))break;
    moved=true;
  }
  return moved;
}
