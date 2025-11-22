// Simple calculator logic
const expressionEl = document.getElementById('expression');
const resultEl = document.getElementById('result');
const buttons = document.querySelectorAll('.btn');

let expression = ''; // store the current expression string
let lastInputType = null; // 'num', 'op', 'dot'

// helper: safe evaluate using Function (we parse %, etc.)
function safeEval(expr) {
  // Replace Unicode ops if any and handle percentage
  try {
    // Convert percent: 50% -> (50/100)
    expr = expr.replace(/%/g, '/100');

    // Disallow any characters other than digits, operators, parentheses, dot, /, * , + , - and whitespace
    if (/[^0-9+\-*/().\s]/.test(expr)) throw new Error('Invalid characters');

    // Evaluate using Function constructor
    // eslint-disable-next-line no-new-func
    return Function('"use strict"; return (' + expr + ')')();
  } catch (e) {
    return null;
  }
}

function updateDisplay() {
  expressionEl.textContent = expression || '0';
  const value = safeEval(expression || '0');
  if (value === null || value === undefined || Number.isNaN(value)) {
    resultEl.textContent = '';
  } else {
    // Show a rounded result (avoid long floats)
    resultEl.textContent = Math.round((value + Number.EPSILON) * 1000000) / 1000000;
  }
}

// button clicks
buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    const val = btn.dataset.value;
    const action = btn.dataset.action;

    if (action === 'clear') {
      expression = '';
      lastInputType = null;
      updateDisplay();
      return;
    }

    if (action === 'back') {
      expression = expression.slice(0, -1);
      // set lastInputType reliably
      const last = expression.slice(-1);
      if (!last) lastInputType = null;
      else if (/[0-9]/.test(last)) lastInputType = 'num';
      else if (/\./.test(last)) lastInputType = 'dot';
      else lastInputType = 'op';
      updateDisplay();
      return;
    }

    if (action === 'equals') {
      const value = safeEval(expression || '0');
      if (value === null) {
        resultEl.textContent = 'Error';
      } else {
        expression = String(Math.round((value + Number.EPSILON) * 1000000) / 1000000);
        lastInputType = 'num';
        updateDisplay();
      }
      return;
    }

    // handle input values (digits, dot, operators)
    if (btn.classList.contains('num')) {
      if (val === '.') {
        // prevent multiple dots in the current number
        // find the part after the last operator
        const parts = expression.split(/[\+\-\*\/]/);
        const lastPart = parts[parts.length - 1];
        if (lastPart.includes('.')) return;
        // if empty or last was op, add '0.' when starting with dot
        if (lastPart === '') {
          expression += '0.';
        } else {
          expression += '.';
        }
        lastInputType = 'dot';
      } else {
        // digit
        // If previous result is shown as expression (after equals), continue normally
        expression += val;
        lastInputType = 'num';
      }
      updateDisplay();
      return;
    }

    if (btn.classList.contains('op')) {
      // operator clicked
      // prevent multiple operators in a row: replace last operator with new one
      if (expression === '' && val === '-') {
        // allow negative numbers at start
        expression = '-';
        lastInputType = 'op';
        updateDisplay();
        return;
      }
      if (expression === '') return; // ignore other operators at start
      const lastChar = expression.slice(-1);
      if (/[\+\-\*\/\.]/.test(lastChar)) {
        // replace last operator (but if last is dot, remove it first)
        expression = expression.slice(0, -1) + val;
      } else {
        expression += val;
      }
      lastInputType = 'op';
      updateDisplay();
      return;
    }
  });
});

// keyboard support
window.addEventListener('keydown', (e) => {
  const key = e.key;
  if ((/^[0-9]$/).test(key)) {
    document.querySelector(`.btn.num[data-value="${key}"]`)?.click();
    return;
  }
  if (key === '.') { document.querySelector(`.btn.num[data-value="."]`)?.click(); return; }
  if (key === '+' || key === '-' || key === '*' || key === '/') {
    // map * stays *, / stays /, + and - stay same
    const mapping = key;
    document.querySelector(`.btn.op[data-value="${mapping}"]`)?.click();
    return;
  }
  if (key === 'Enter' || key === '=') {
    document.querySelector('.btn.equal')?.click(); return;
  }
  if (key === 'Backspace') {
    document.querySelector('.btn.func[data-action="back"]')?.click(); return;
  }
  if (key.toLowerCase() === 'c') {
    document.querySelector('.btn.func[data-action="clear"]')?.click(); return;
  }
});

// initialize
updateDisplay();
