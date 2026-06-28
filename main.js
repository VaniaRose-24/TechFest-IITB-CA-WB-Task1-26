/* ==========================================================================
   CYBORG 3.0 // NEUROFORGE JS CONTROLLER
   ========================================================================== */

// --- GLOBAL VARIABLES & STATE ---
let audioCtx = null;
let audioEnabled = false;

// --- DYNAMIC SYS INFO STATS FLUCUATOR ---
function initDynamicStats() {
  const tempDisplay = document.getElementById('cpu-temp-display');
  const pingDisplay = document.getElementById('ping-display');

  if (tempDisplay && pingDisplay) {
    setInterval(() => {
      const mockTemp = (36.8 + Math.random() * 0.8).toFixed(1);
      tempDisplay.textContent = `${mockTemp}°C`;

      const mockPing = (0.05 + Math.random() * 0.12).toFixed(2);
      pingDisplay.textContent = `${mockPing}ms`;
    }, 3000);
  }
}

// --- TEXT SCRAMBLE DECRYPTOR EFFECT ---
class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#________';
    this.update = this.update.bind(this);
  }
  setText(newText) {
    const oldText = this.el.innerText;
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise((resolve) => this.resolve = resolve);
    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || '';
      const to = newText[i] || '';
      const start = Math.floor(Math.random() * 30);
      const end = start + Math.floor(Math.random() * 30);
      this.queue.push({ from, to, start, end });
    }
    cancelAnimationFrame(this.frameId);
    this.frame = 0;
    this.update();
    return promise;
  }
  update() {
    let output = '';
    let complete = 0;
    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { from, to, start, end, char } = this.queue[i];
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.randomChar();
          this.queue[i].char = char;
        }
        output += `<span class="cyan-text">${char}</span>`;
      } else {
        output += from;
      }
    }
    this.el.innerHTML = output;
    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frameId = requestAnimationFrame(this.update);
      this.frame++;
    }
  }
  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
}

function initTextDecryption() {
  const heroTitle = document.querySelector('.hero-title');
  const sectionTags = document.querySelectorAll('.section-tag');
  
  if (heroTitle) {
    const titleScrambler = new TextScramble(heroTitle);
    titleScrambler.setText('CYBORG 3.0');
  }

  sectionTags.forEach(tag => {
    const tagScrambler = new TextScramble(tag);
    const originalText = tag.innerText;
    tag.innerText = '';
    
    // Scramble on intersection (scroll trigger)
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          tagScrambler.setText(originalText);
          observer.unobserve(tag);
        }
      });
    }, { threshold: 0.5 });
    
    observer.observe(tag);
  });
}

// --- WEB AUDIO SYNTHESIZER ---
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playSynthesizedSound(type) {
  if (!audioEnabled) return;
  
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'click') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.06);
      gainNode.gain.setValueAtTime(0.04, now);
      gainNode.gain.linearRampToValueAtTime(0.0001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'success') {
      osc.type = 'triangle';
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      
      freqs.forEach((freq, idx) => {
        const oscNode = ctx.createOscillator();
        const gNode = ctx.createGain();
        oscNode.type = 'sine';
        oscNode.frequency.setValueAtTime(freq, now + idx * 0.08);
        
        gNode.gain.setValueAtTime(0.03, now + idx * 0.08);
        gNode.gain.linearRampToValueAtTime(0.0001, now + idx * 0.08 + 0.4);
        
        oscNode.connect(gNode);
        gNode.connect(ctx.destination);
        oscNode.start(now + idx * 0.08);
        oscNode.stop(now + idx * 0.08 + 0.45);
      });
    } else if (type === 'warn') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.15);
      
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(150, now + 0.15);
      osc2.frequency.linearRampToValueAtTime(80, now + 0.3);
      
      gainNode.gain.setValueAtTime(0.05, now);
      gainNode.gain.linearRampToValueAtTime(0.0001, now + 0.15);
      
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      gain2.gain.setValueAtTime(0.05, now + 0.15);
      gain2.gain.linearRampToValueAtTime(0.0001, now + 0.3);
      
      osc.start(now);
      osc.stop(now + 0.15);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.3);
    } else if (type === 'keyboard') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gainNode.gain.setValueAtTime(0.015, now);
      gainNode.gain.linearRampToValueAtTime(0.0001, now + 0.02);
      osc.start(now);
      osc.stop(now + 0.02);
    }
  } catch (err) {
    console.warn("Audio Context init/playback failed: ", err);
  }
}

// --- INTERACTIVE NEURAL CANVAS BACKGROUND ---
function initNeuralCanvas() {
  const canvas = document.getElementById('neural-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  let points = [];
  const maxPoints = Math.min(100, Math.floor((width * height) / 15000));
  const maxDistance = 140;
  
  let mouse = { x: null, y: null, radius: 180 };

  class Point {
    constructor() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.8;
      this.vy = (Math.random() - 0.5) * 0.8;
      this.baseRadius = 1.5 + Math.random() * 2;
      this.radius = this.baseRadius;
      this.color = Math.random() > 0.4 ? '0, 240, 255' : '255, 0, 85'; 
    }

    update() {
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
      
      this.x += this.vx;
      this.y += this.vy;

      if (mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          this.x -= dx * force * 0.03;
          this.y -= dy * force * 0.03;
          this.radius = this.baseRadius + force * 2;
        } else {
          this.radius = this.baseRadius;
        }
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color}, 0.8)`;
      ctx.shadowBlur = this.radius * 2;
      ctx.shadowColor = `rgb(${this.color})`;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function setup() {
    points = [];
    for (let i = 0; i < maxPoints; i++) {
      points.push(new Point());
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      p1.update();
      p1.draw();

      for (let j = i + 1; j < points.length; j++) {
        const p2 = points[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDistance) {
          const opacity = (1 - dist / maxDistance) * 0.35;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(${p1.color}, ${opacity})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      if (mouse.x !== null && mouse.y !== null) {
        const dx = p1.x - mouse.x;
        const dy = p1.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < mouse.radius) {
          const opacity = (1 - dist / mouse.radius) * 0.45;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(0, 240, 255, ${opacity})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
    }
    
    requestAnimationFrame(animate);
  }

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    setup();
  });

  setup();
  animate();
}

// --- SPECIFICATIONS TABS NAVIGATION ---
function initSpecsTabs() {
  const tabs = document.querySelectorAll('.spec-tab-btn');
  const contents = document.querySelectorAll('.spec-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      
      playSynthesizedSound('click');
      
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      contents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `spec-${targetTab}`) {
          content.classList.add('active');
          
          const fills = content.querySelectorAll('.bar-fill');
          fills.forEach(fill => {
            const widthVal = fill.parentElement.previousElementSibling.lastElementChild.textContent;
            let targetPercent = "0%";
            if (widthVal.includes('%')) {
              targetPercent = widthVal;
            } else if (widthVal.includes('GHz') || widthVal.includes('FLOPS') || widthVal.includes('ms') || widthVal.includes('KG')) {
              if (widthVal.includes('4.8')) targetPercent = "88%";
              if (widthVal.includes('0.04')) targetPercent = "98%";
              if (widthVal.includes('12')) targetPercent = "25%";
              if (widthVal.includes('850')) targetPercent = "90%";
              if (widthVal.includes('420')) targetPercent = "92%";
              if (widthVal.includes('16,384')) targetPercent = "85%";
            }
            fill.style.width = '0';
            setTimeout(() => {
              fill.style.width = targetPercent;
            }, 50);
          });
        }
      });
    });
  });
}

// --- DIAGNOSTIC CLI TERMINAL SIMULATOR ---
function initTerminal() {
  const input = document.getElementById('terminal-input');
  const output = document.getElementById('terminal-output');
  const body = document.getElementById('terminal-body');
  
  if (!input || !output) return;

  body.addEventListener('click', () => input.focus());

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const command = input.value.trim();
      input.value = '';
      
      if (command) {
        handleTerminalCommand(command);
      }
    } else {
      if (Math.random() > 0.3) {
        playSynthesizedSound('keyboard');
      }
    }
  });

  function printLine(text, className = '') {
    const line = document.createElement('div');
    line.className = `line ${className}`;
    line.innerHTML = text;
    output.appendChild(line);
    body.scrollTop = body.scrollHeight;
  }

  function handleTerminalCommand(rawCommand) {
    const command = rawCommand.toLowerCase();
    
    printLine(`<span class="prompt">guest@neuroforge:~$</span> ${rawCommand}`, 'echo-line');
    playSynthesizedSound('click');

    setTimeout(() => {
      switch (command) {
        case 'help':
          printLine('AVAILABLE COMMANDS:');
          printLine('  <span class="cyan-text">about</span>      Display lab and techfest lore details');
          printLine('  <span class="cyan-text">specs</span>      View cybernetic sub-dural hardware details');
          printLine('  <span class="cyan-text">status</span>     Retrieve mock system diagnostics & resources');
          printLine('  <span class="cyan-text">sync</span>       Initialize alignment handshake simulation');
          printLine('  <span class="cyan-text">hack</span>       Activate core grid neural bypass override');
          printLine('  <span class="cyan-text">clear</span>      Clear current console logs');
          break;
          
        case 'about':
          printLine('// NEUROFORGE RESEARCH FACILITY //');
          printLine('Dedicated to bridging biological nodes with advanced quantum architectures.');
          printLine('Cyborg 3.0 represents a convergence of cybernetic carbon limbs, subdural nano-networks, and cognitive co-processors to establish direct consciousness-to-network linkage.');
          break;
          
        case 'specs':
          printLine('// NANO-MESH HARWARE INVENTORY //');
          printLine('- Synapse Cohesor: Quantum-Spin Link, 4.8 GHz clock.');
          printLine('- Frame Actuation: GR-Titanium Alloy structure, 850kg capacity.');
          printLine('- Cognitive Hub: distributed prefrontal engine running Forge-v3.');
          break;
          
        case 'status':
          printLine('+------------------------------------------+');
          printLine('| NEUROFORGE SYSTEM STATUS: <span class="green-text">ONLINE</span>         |');
          printLine('+------------------------------------------+');
          printLine('| Sync Coherence Ratio : 98.42%            |');
          printLine('| Latency Threshold    : 0.12 ms (NOMINAL) |');
          printLine('| Nano-mesh integrity  : 99.98%            |');
          printLine('| CPU Core Temp        : 37.4 C            |');
          printLine('| Co-processor FLOPs   : 420 TFLOPS        |');
          printLine('+------------------------------------------+');
          break;
          
        case 'sync':
          printLine('<span class="cyan-text">INITIALIZING CONSCIOUSNESS UPLINK CONVERGENCE...</span>');
          simulateSyncProcess();
          break;
          
        case 'hack':
          playSynthesizedSound('warn');
          document.body.style.filter = 'hue-rotate(90deg) contrast(1.5)';
          printLine('!! WARNING: CORE DIRECTIVE OVERRIDE BYPASSED !!', 'magenta-text');
          printLine('Neural limits deactivated. Sub-cortex filters bypass: 100%', 'magenta-text');
          
          setTimeout(() => {
            document.body.style.filter = 'none';
            printLine('Restoring default firewalls... security grid online.', 'green-text');
          }, 3000);
          break;
          
        case 'clear':
          output.innerHTML = '';
          break;
          
        default:
          printLine(`Command not recognized: <span class="magenta-text">'${rawCommand}'</span>. Type <span class="cyan-text">'help'</span> for list of diagnostics.`);
      }
      body.scrollTop = body.scrollHeight;
    }, 100);
  }

  function simulateSyncProcess() {
    const steps = [
      { text: '> Initiating synaptic alignment handshakes...', delay: 500 },
      { text: '> Deploying sub-dural nano-mesh scanning vectors... [OK]', delay: 1100 },
      { text: '> Connecting quantum cognitive engine ports... [OK]', delay: 1800 },
      { text: '> Synchronizing carbon actuator stress levels... [OK]', delay: 2400 },
      { text: '> Calibrating neural lag thresholds... [OK]', delay: 2900 },
      { text: 'ALIGNMENT STABLE. Consciousness synced: 100%', delay: 3500 }
    ];
    
    steps.forEach(step => {
      setTimeout(() => {
        if (step.text.includes('100%')) {
          printLine(step.text, 'green-text');
          playSynthesizedSound('success');
          printLine(`
   ___   _   _ __  ___  ___  ___
  / __\\ / \\ / '  \\/  _\\/   \\/  _\\
 / /    | | | |\\ |  /  | O || /  
 \\ \\___ | |_| | \\|  \\_ | _ || \\_ 
  \\___/ \\___/_| |_|\\___/_| |_|\\___/
          `, 'cyan-text font-mono');
        } else {
          printLine(step.text);
        }
        body.scrollTop = body.scrollHeight;
      }, step.delay);
    });
  }
}

// --- NEURAL SYNC MODAL ---
function initSyncModal() {
  const modal = document.getElementById('sync-modal');
  const openBtns = document.querySelectorAll('.open-sync-modal');
  const closeBtn = document.getElementById('close-modal-btn');
  const successCloseBtn = document.getElementById('success-close-btn');
  
  const formView = document.getElementById('modal-form-view');
  const loadingView = document.getElementById('modal-loading-view');
  const successView = document.getElementById('modal-success-view');
  
  const form = document.getElementById('sync-form');
  const loaderFill = document.getElementById('sync-loader-fill');
  const loaderLogs = document.getElementById('sync-console-log');

  if (!modal) return;

  openBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      playSynthesizedSound('click');
      modal.classList.add('active');
      
      formView.classList.remove('hidden');
      loadingView.classList.add('hidden');
      successView.classList.add('hidden');
      form.reset();
    });
  });

  const closeModal = () => {
    playSynthesizedSound('click');
    modal.classList.remove('active');
  };

  closeBtn.addEventListener('click', closeModal);
  successCloseBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    playSynthesizedSound('click');
    
    formView.classList.add('hidden');
    loadingView.classList.remove('hidden');
    
    loaderFill.style.width = '0%';
    loaderLogs.innerHTML = '<div>> Contacting sub-dural linkage nodes...</div>';
    
    const logs = [
      { t: 15, msg: '> Handshake initiated. Transmitting biometric key...' },
      { t: 35, msg: '> Key accepted. Scanning cortical map layout...' },
      { t: 55, msg: '> Cortex mapped. Injecting bionic nano-mesh vectors...' },
      { t: 75, msg: '> Nano-mesh active. Syncing prefrontal cognitive cores...' },
      { t: 90, msg: '> Cores connected. Calibrating synaptic frequency...' },
      { t: 100, msg: '> Synchronized successfully. Inject complete.' }
    ];
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 1;
      loaderFill.style.width = `${progress}%`;
      
      const logMatch = logs.find(l => l.t === progress);
      if (logMatch) {
        const logLine = document.createElement('div');
        logLine.textContent = logMatch.msg;
        if (progress === 100) logLine.className = 'green-text';
        loaderLogs.appendChild(logLine);
        loaderLogs.scrollTop = loaderLogs.scrollHeight;
      }
      
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          playSynthesizedSound('success');
          loadingView.classList.add('hidden');
          successView.classList.remove('hidden');
        }, 600);
      }
    }, 40);
  });
}

// --- RESPONSIVE MOBILE NAVIGATION ---
function initMobileNav() {
  const toggle = document.querySelector('.mobile-nav-toggle');
  const linksContainer = document.querySelector('.nav-links');
  const links = document.querySelectorAll('.nav-link');

  if (!toggle || !linksContainer) return;

  toggle.addEventListener('click', () => {
    playSynthesizedSound('click');
    toggle.classList.toggle('active');
    linksContainer.classList.toggle('active');
  });

  links.forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      linksContainer.classList.remove('active');
    });
  });
  
  const sections = document.querySelectorAll('header, section');
  window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      if (window.scrollY >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    links.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

// --- AUDIO TOGGLE CONTROLLERS ---
function initAudioController() {
  const toggleBtn = document.getElementById('audio-toggle-btn');
  if (!toggleBtn) return;
  
  toggleBtn.addEventListener('click', () => {
    audioEnabled = !audioEnabled;
    toggleBtn.classList.toggle('active');
    
    if (audioEnabled) {
      toggleBtn.innerHTML = '<span class="sound-wave-icon">🔊</span> AUDIO: ON';
      getAudioContext();
      playSynthesizedSound('success');
    } else {
      toggleBtn.innerHTML = '<span class="sound-wave-icon">🔇</span> AUDIO: OFF';
    }
  });
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  initAudioController();
  initNeuralCanvas();
  initSpecsTabs();
  initTerminal();
  initSyncModal();
  initMobileNav();
  initDynamicStats();
  initTextDecryption();
  
  const clickSoundElements = document.querySelectorAll('[data-sound="click"]');
  clickSoundElements.forEach(el => {
    el.addEventListener('click', () => playSynthesizedSound('click'));
  });
});
