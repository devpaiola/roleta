const prizes = [
  // Use '\n' para forçar quebra de linha no texto; espaços extras serão removidos.
  { label: 'Tente outra vez', weight: 20, type: 'mensagem' },
  { label: 'Poxa que pena', weight: 20, type: 'mensagem' },
  { label: 'Não foi dessa vez', weight: 20, type: 'mensagem' },
  { label: 'Protetor Webcam', weight: 17, type: 'fisico' },
  { label: 'Copo', weight: 8, type: 'fisico' },
  { label: 'Espelho', weight: 15, type: 'fisico' },
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
  const modal = document.getElementById('resultadoModal');
  const resultadoTexto = document.getElementById('resultadoTexto');
  const premioDescricao = document.getElementById('premioDescricao');
  const resultadoIcone = document.getElementById('resultadoIcone');
  const resultadoTitulo = document.getElementById('resultadoTitulo');
  
  // Remove classes anteriores
  modal.classList.remove('premio-bom', 'premio-ruim', 'shake');
  
  // Determina se é prêmio bom ou ruim
  const isPremioFisico = prize.type === 'fisico';
  
  if (isPremioFisico) {
    // Prêmio físico - BOM!
    modal.classList.add('premio-bom');
    resultadoTitulo.textContent = 'PARABÉNS!';
    resultadoTexto.innerHTML = `Você ganhou:<br><strong>${prize.label}</strong>`;
    premioDescricao.innerHTML = '🎁 Entre em contato para retirar seu prêmio!';
    
    // Ativa confetes
    setTimeout(() => createConfetti(), 300);
    
  } else {
    // Prêmio de mensagem - RUIM
    modal.classList.add('premio-ruim');
    resultadoTitulo.textContent = 'QUE PENA!';
    resultadoTexto.innerHTML = prize.label.replace(/\n/g, '<br>');
    premioDescricao.innerHTML = '💪 Não desista! Tente novamente!';
  }

  if (typeof modal.showModal === 'function') {
    modal.showModal();
  } else {
    const alertText = isPremioFisico 
      ? `PARABÉNS! Você ganhou: ${prize.label}` 
      : prize.label.replace(/\n/g, ' ');
    alert(alertText);
  }
}

function createConfetti() {
  const confetesContainer = document.getElementById('confetes');
  confetesContainer.innerHTML = ''; // Limpa confetes anteriores
  
  for (let i = 0; i < 50; i++) {
    const confete = document.createElement('div');
    confete.className = 'confete';
    confete.style.left = Math.random() * 100 + '%';
    confete.style.animationDelay = Math.random() * 2 + 's';
    confete.style.animationDuration = (Math.random() * 2 + 3) + 's';
    confetesContainer.appendChild(confete);
  }
  
  // Remove confetes após a animação
  setTimeout(() => {
    confetesContainer.innerHTML = '';
  }, 5000);
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

// Event listeners para os novos botões
document.getElementById('fecharModal').addEventListener('click', () => {
  modal.close();
});

document.getElementById('girarNovamente').addEventListener('click', () => {
  modal.close();
  setTimeout(() => {
    if (!spinning) {
      spin();
    }
  }, 300);
});

// ==================== FUNCIONALIDADE DE TELA CHEIA ====================

const fullscreenBtn = document.getElementById('fullscreenBtn');
const fullscreenIcon = document.querySelector('.fullscreen-icon');

function updateFullscreenButton() {
  if (document.fullscreenElement) {
    document.body.classList.add('fullscreen-active');
    fullscreenIcon.textContent = '⌐'; // Ícone discreto para sair da tela cheia
    fullscreenBtn.title = 'Sair da tela cheia';
    fullscreenBtn.setAttribute('aria-label', 'Sair da tela cheia');
  } else {
    document.body.classList.remove('fullscreen-active');
    fullscreenIcon.textContent = '⌐'; // Ícone discreto para entrar em tela cheia
    fullscreenBtn.title = 'Entrar em tela cheia';
    fullscreenBtn.setAttribute('aria-label', 'Entrar em tela cheia');
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    // Entra em tela cheia
    document.documentElement.requestFullscreen().catch(err => {
      console.error(`Erro ao ativar tela cheia: ${err.message}`);
      // Fallback para navegadores mais antigos
      if (document.documentElement.webkitRequestFullscreen) {
        document.documentElement.webkitRequestFullscreen();
      } else if (document.documentElement.mozRequestFullScreen) {
        document.documentElement.mozRequestFullScreen();
      } else if (document.documentElement.msRequestFullscreen) {
        document.documentElement.msRequestFullscreen();
      }
    });
  } else {
    // Sai da tela cheia
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
}

// Event listeners
fullscreenBtn.addEventListener('click', toggleFullscreen);

// Detecta mudanças no estado da tela cheia (incluindo F11)
document.addEventListener('fullscreenchange', updateFullscreenButton);
document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
document.addEventListener('mozfullscreenchange', updateFullscreenButton);
document.addEventListener('MSFullscreenChange', updateFullscreenButton);

// Atalho de teclado (opcional)
document.addEventListener('keydown', (e) => {
  // Ctrl + F para alternar tela cheia
  if (e.ctrlKey && e.key === 'f') {
    e.preventDefault();
    toggleFullscreen();
  }
});

// Inicializa o estado do botão
updateFullscreenButton();
