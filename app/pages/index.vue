<template>
  <main class="home-page">
    <link href="https://fonts.googleapis.com/css2?family=VT323&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">

    <!-- Fundo com Gradiente Animado (Cores mais fortes para visibilidade) -->
    <div class="animated-bg"></div>
    <div class="vignette"></div>
    <div class="matrix-bg"></div>

    <section class="hero">
      <div class="glitch-wrapper">
        <h1 class="title" data-text="MaratonAR">Maraton<span>AR</span></h1>
      </div>

      <p class="subtitle">Realidade Aumentada para Maratonas de Programação</p>

      <div class="console-box">
        <div class="console-header">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="title-bar">terminal_access</span>
        </div>
        <div class="console-content">
          <p class="line">><span class="highlight"> [INFO]</span> Carregando AR...</p>
          <p class="line">><span class="highlight"> [STATUS]</span> AR carregada</p>
          <p class="line">> <span class="blink">_</span></p>
        </div>
      </div>

      <NuxtLink to="/scan" class="start-btn">
        <span class="btn-text">ESCANEAR BOTTON</span>
        <span class="btn-glitch"></span>
      </NuxtLink>
    </section>

    <footer class="footer">
      <p>MaratonAR - Maratona de Programação UnB @ 2026</p>
    </footer>
  </main>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  background-color: #050805;
  color: #00ff88;
  font-family: 'JetBrains Mono', monospace;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

/* Fundo com Gradiente Animado mais intenso */
.animated-bg {
  position: absolute;
  inset: 0;
  /* Cores mais vibrantes para o gradiente ser notado */
  background: linear-gradient(-45deg, #050805, #0d2b0d, #050f05, #00441b);
  background-size: 300% 300%;
  animation: gradient-flow 10s ease infinite;
  z-index: 0;
}

@keyframes gradient-flow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.matrix-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(rgba(0, 255, 136, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 136, 0.05) 1px, transparent 1px);
  background-size: 40px 40px;
  z-index: 1;
  opacity: 0.4;
}

.vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, transparent 30%, rgba(0,0,0,0.9) 100%);
  z-index: 2;
  pointer-events: none;
}

.hero {
  position: relative;
  z-index: 10;
  text-align: center;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
}

.title {
  font-family: 'VT323', monospace;
  font-size: clamp(4rem, 15vw, 8rem);
  margin: 0;
  line-height: 1;
  letter-spacing: 4px;
  color: #fff;
  text-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
}

.title span {
  color: #00ff88;
}

.subtitle {
  font-size: clamp(0.9rem, 3.5vw, 1.1rem);
  max-width: 500px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 3px;
}

.console-box {
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 255, 136, 0.2);
  width: 100%;
  max-width: 400px;
  border-radius: 4px;
  text-align: left;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

.console-header {
  background: #111;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  border-bottom: 1px solid rgba(0, 255, 136, 0.1);
}

.console-header .dot { width: 8px; height: 8px; border-radius: 50%; background: #333; }
.console-header .title-bar { font-size: 10px; color: #444; margin-left: 10px; }
.console-content { padding: 15px; font-size: 13px; color: #00ff88; }
.highlight { color: #fff; }

.start-btn {
  margin-top: 20px;
  background: transparent;
  border: 1px solid #00ff88;
  color: #00ff88;
  padding: 15px 40px;
  font-family: 'VT323', monospace;
  font-size: 1.8rem;
  text-decoration: none;
  position: relative;
  transition: all 0.3s;
  box-shadow: 0 0 15px rgba(0, 255, 136, 0.1);
}

.start-btn:hover {
  background: #00ff88;
  color: #000;
  transform: scale(1.05);
}

.footer {
  position: absolute;
  bottom: 30px;
  font-size: 10px;
  color: #444;
  letter-spacing: 1px;
  z-index: 10;
}

.blink { animation: blink 1s step-end infinite; }
@keyframes blink { 50% { opacity: 0; } }
</style>
