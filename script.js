const prizes = [
  // Use '\n' para forçar quebra de linha no texto; espaços extras serão removidos.
  { label: 'Indique mais e \n tente outra vez', weight: 25, type: 'mensagem' },
  { label: 'Poxa que pena', weight: 25, type: 'mensagem' },
  { label: 'Não foi dessa vez', weight: 20, type: 'mensagem' },
  { label: 'Protetor Webcam', weight: 17, type: 'fisico' },
  { label: 'Copo', weight: 6, type: 'fisico' },
  { label: 'Espelho', weight: 7, type: 'fisico' },
];
const totalWeight = prizes.reduce((acc, p) => acc + p.weight, 0); // 100

const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');
const modal = document.getElementById('resultadoModal');
const resultadoTexto = document.getElementById('resultadoTexto');

// Cores alternadas para segmentos (usando paleta)
const segmentColors = [
  '#04d38a', // verde claro
  '#ff9700', // laranja
  '#03b373', // variação verde
  '#ffb340', // laranja clara
  '#029c62', // verde escuro médio
  '#ff8a00', // laranja escuro
];

let currentRotation = 0; // em radianos
let spinning = false;

function drawWheel() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = canvas.width / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(currentRotation);

  // NOVO: usar ângulo fixo para cada segmento (visual uniforme)
  const equalSliceAngle = (Math.PI * 2) / prizes.length;

  for (let index = 0; index < prizes.length; index++) {
    const prize = prizes[index];
    const startAngle = index * equalSliceAngle;
    const endAngle = startAngle + equalSliceAngle;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = segmentColors[index % segmentColors.length];
    ctx.fill();

    ctx.strokeStyle = '#003c30';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Texto
    ctx.save();
    ctx.fillStyle = '#003c30';
    ctx.font = 'bold 16px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const midAngle = startAngle + equalSliceAngle / 2;
    ctx.rotate(midAngle);

  const text = prize.label;
  // Converte sequência literal "\n" em newline real e divide
  const manualLines = text.replace(/\\n/g, '\n').split(/\n+/);
  // Remove espaços extras no começo/fim de cada linha
  const cleanedBlocks = manualLines.map(l => l.trim()).filter(l => l.length);
    const maxWidth = radius * 0.55;
    const lines = [];

  cleanedBlocks.forEach(block => {
      const words = block.split(' ');
      let currentLine = '';
      for (let w of words) {
        const test = currentLine.length ? currentLine + ' ' + w : w;
        if (ctx.measureText(test).width > maxWidth) {
          if (currentLine) lines.push(currentLine);
            currentLine = w;
        } else {
          currentLine = test;
        }
      }
      if (currentLine) lines.push(currentLine);
    });

    const lineHeight = 18;
    const textRadius = radius * 0.65;
    const totalTextHeight = lines.length * lineHeight;

    lines.forEach((line, i) => {
      ctx.save();
      ctx.translate(textRadius, -totalTextHeight / 2 + i * lineHeight);
      ctx.rotate(Math.PI / 2);
      ctx.fillText(line, 0, 0);
      ctx.restore();
    });

    ctx.restore();
  }

  ctx.restore();
}

drawWheel();

function weightedRandom(prizes) {
  const r = Math.random() * totalWeight;
  let acc = 0;
  for (let p of prizes) {
    acc += p.weight;
    if (r <= acc) return p;
  }
  return prizes[prizes.length - 1];
}

function findPrizeIndex(prize) {
  return prizes.indexOf(prize);
}

function spin() {
  if (spinning) return;
  spinning = true;
  spinBtn.disabled = true;

  const selectedPrize = weightedRandom(prizes); // continua ponderado pelos pesos
  const prizeIndex = findPrizeIndex(selectedPrize);

  // Cada segmento agora tem tamanho igual
  const equalSliceAngle = (Math.PI * 2) / prizes.length;
  const targetSegmentCenter = prizeIndex * equalSliceAngle + equalSliceAngle / 2;

  const pointerAngle = -Math.PI / 2;
  const fullRotations = 6 + Math.floor(Math.random() * 2);
  const finalRotation = (pointerAngle - targetSegmentCenter) + fullRotations * Math.PI * 2;
  const startRotation = currentRotation;
  const delta = finalRotation - startRotation;

  const duration = 5500;
  const start = performance.now();

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function animate(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);

    currentRotation = startRotation + delta * eased;
    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      currentRotation = ((currentRotation % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      drawWheel();
      spinning = false;
      spinBtn.disabled = false;
      showResult(selectedPrize);
    }
  }

  requestAnimationFrame(animate);
}

function showResult(prize) {
  const prefix = prize.type === 'fisico' ? 'Parabéns! Você ganhou: ' : '';
  resultadoTexto.textContent = prefix + prize.label;
  if (typeof modal.showModal === 'function') {
    modal.showModal();
  } else {
    alert(resultadoTexto.textContent);
  }
}

spinBtn.addEventListener('click', spin);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !spinning && document.activeElement === spinBtn) {
    spin();
  }
});

modal.addEventListener('close', () => {
  spinBtn.focus();
});
