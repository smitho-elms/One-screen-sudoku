const puzzle = [
  // 0 means empty
  [5,3,0, 0,7,0, 0,0,0],
  [6,0,0, 1,9,5, 0,0,0],
  [0,9,8, 0,0,0, 0,6,0],

  [8,0,0, 0,6,0, 0,0,3],
  [4,0,0, 8,0,3, 0,0,1],
  [7,0,0, 0,2,0, 0,0,6],

  [0,6,0, 0,0,0, 2,8,0],
  [0,0,0, 4,1,9, 0,0,5],
  [0,0,0, 0,8,0, 0,7,9]
];

// Solution for puzzle
const solution = [
  [5,3,4,6,7,8,9,1,2],
  [6,7,2,1,9,5,3,4,8],
  [1,9,8,3,4,2,5,6,7],
  [8,5,9,7,6,1,4,2,3],
  [4,2,6,8,5,3,7,9,1],
  [7,1,3,9,2,4,8,5,6],
  [9,6,1,5,3,7,2,8,4],
  [2,8,7,4,1,9,6,3,5],
  [3,4,5,2,8,6,1,7,9]
];

const sudokuEl = document.getElementById('sudoku');
const statusEl = document.getElementById('status');
let selectedCell = null;

function renderGrid(){
  sudokuEl.innerHTML = '';
  for(let r=0;r<9;r++){
    for(let c=0;c<9;c++){
      const idx = r*9 + c + 1;
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = r;
      cell.dataset.col = c;
      

      const val = puzzle[r][c];
      if(val && val>0){
        cell.classList.add('given');
        cell.textContent = val;
        cell.setAttribute('aria-label', `Given ${val} at row ${r+1} column ${c+1}`);
      } else {
        const input = document.createElement('input');
        input.type = 'text';
        input.inputMode = 'numeric';
        input.maxLength = 1;
        input.autocomplete = 'off';
        input.spellcheck = false;
        input.id = `cell-${r}-${c}`;
        input.setAttribute('aria-label', `Row ${r+1} Column ${c+1}`);
        input.addEventListener('input', onCellInput);
        input.addEventListener('focus', ()=>selectCell(r,c));
        input.addEventListener('keydown', onCellKeyDown);
        cell.appendChild(input);
      }

      cell.addEventListener('click', ()=>{
        const inp = cell.querySelector('input');
        if(inp){ inp.focus(); }
      });

      sudokuEl.appendChild(cell);
    }
  }
}

function onCellInput(e){
  const input = e.target;
  let v = input.value.replace(/[^1-9]/g,'');
  if(v.length>1) v = v.slice(-1);
  input.value = v;
  validateAll();
}

function onCellKeyDown(e){
  const input = e.target;
  const id = input.id;
  const [_, rStr, cStr] = id.split('-');
  const r = Number(rStr), c = Number(cStr);
  if(e.key >= '1' && e.key <= '9'){
    setTimeout(validateAll, 0);
    selectCell(r,c);
    return;
  }
  if(e.key === 'Backspace' || e.key === 'Delete' || e.key === '0'){
    input.value = '';
    validateAll();
    e.preventDefault();
    return;
  }
  // Arrow navigation
  if(e.key === 'ArrowUp') { moveSelection(r-1,c); e.preventDefault(); }
  if(e.key === 'ArrowDown') { moveSelection(r+1,c); e.preventDefault(); }
  if(e.key === 'ArrowLeft') { moveSelection(r,c-1); e.preventDefault(); }
  if(e.key === 'ArrowRight') { moveSelection(r,c+1); e.preventDefault(); }
}

function moveSelection(r,c){
  if(r<0||r>8||c<0||c>8) return;
  const inp = document.getElementById(`cell-${r}-${c}`);
  if(inp){ inp.focus(); }
}

function selectCell(r,c){
  const prev = sudokuEl.querySelector('.cell.selected');
  if(prev) prev.classList.remove('selected');
  const cell = getCellEl(r,c);
  if(cell){ cell.classList.add('selected'); selectedCell = {r,c}; }
}

function getCellEl(r,c){
  return sudokuEl.querySelector(`.cell[data-row='${r}'][data-col='${c}']`);
}

function getInputValue(r,c){
  const cell = getCellEl(r,c);
  if(!cell) return null;
  const inp = cell.querySelector('input');
  return inp ? (inp.value ? Number(inp.value) : 0) : puzzle[r][c] || 0;
}

function validateAll(){
  // removes all error classes
  sudokuEl.querySelectorAll('.cell').forEach(el=>el.classList.remove('error'));

  // row, col, box checks
  function markDuplicates(positions){
    const map = {};
    positions.forEach(([r,c])=>{
      const v = getInputValue(r,c);
      if(!v) return;
      const key = v;
      if(!map[key]) map[key] = [];
      map[key].push([r,c]);
    });
    Object.values(map).forEach(list=>{
      if(list.length>1){
        list.forEach(([r,c])=>{
          const cell = getCellEl(r,c);
          if(cell) cell.classList.add('error');
        });
      }
    });
  }

  // rows
  for(let r=0;r<9;r++){
    const pos = [];
    for(let c=0;c<9;c++) pos.push([r,c]);
    markDuplicates(pos);
  }
  // cols
  for(let c=0;c<9;c++){
    const pos = [];
    for(let r=0;r<9;r++) pos.push([r,c]);
    markDuplicates(pos);
  }
  // boxes
  for(let br=0;br<3;br++){
    for(let bc=0;bc<3;bc++){
      const pos = [];
      for(let r=br*3;r<br*3+3;r++){
        for(let c=bc*3;c<bc*3+3;c++) pos.push([r,c]);
      }
      markDuplicates(pos);
    }
  }
}


document.getElementById('hint').addEventListener('click', ()=>{
  // finds empty inputs
  const empties = [];
  for(let r=0;r<9;r++) for(let c=0;c<9;c++){
    if(puzzle[r][c]===0){
      const val = getInputValue(r,c);
      if(!val) empties.push([r,c]);
    }
  }
  if(empties.length===0){ statusEl.textContent = 'No empty cells to hint.'; return; }
  const [r,c] = empties[Math.floor(Math.random()*empties.length)];
  const inp = document.getElementById(`cell-${r}-${c}`);
  if(inp){ inp.value = solution[r][c]; inp.focus(); selectCell(r,c); validateAll(); statusEl.textContent = `Hint: filled row ${r+1} col ${c+1}.`; }
});

document.getElementById('reset').addEventListener('click', ()=>{
  // clear all non-given inputs
  for(let r=0;r<9;r++) for(let c=0;c<9;c++){
    const cell = getCellEl(r,c);
    if(!cell) continue;
    const inp = cell.querySelector('input');
    if(inp) inp.value = '';
  }
  statusEl.textContent = '';
  validateAll();
});

document.getElementById('check').addEventListener('click', ()=>{
  let wrong = 0, empty = 0;
  for(let r=0;r<9;r++) for(let c=0;c<9;c++){
    const val = getInputValue(r,c);
    if(!val) empty++;
    else if(val !== solution[r][c]) wrong++;
  }
  if(empty>0) statusEl.textContent = `Not complete — ${empty} empty cell(s).`;
  else if(wrong>0) statusEl.textContent = `Some numbers are incorrect — ${wrong} mismatches.`;
  else statusEl.textContent = 'Congratulations — puzzle solved correctly!';
});

// Global keyboard shortcuts: if no input is focused, use selected cell
document.addEventListener('keydown', (e)=>{
  const active = document.activeElement;
  const focusIsInput = active && active.tagName === 'INPUT';
  if(focusIsInput) return;
  if(!selectedCell) return;
  if(e.key >= '1' && e.key <= '9'){
    const inp = document.getElementById(`cell-${selectedCell.r}-${selectedCell.c}`);
    if(inp){ inp.value = e.key; validateAll(); inp.focus(); }
  }
  if(e.key === 'Backspace' || e.key === 'Delete' || e.key==='0'){
    const inp = document.getElementById(`cell-${selectedCell.r}-${selectedCell.c}`);
    if(inp){ inp.value = ''; validateAll(); inp.focus(); }
  }
});

// Initialization
renderGrid();
validateAll();
