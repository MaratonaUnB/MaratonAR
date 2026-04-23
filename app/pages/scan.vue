<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

const isLoaded = ref(false)
const markerFound = ref(false)
const activeTargetIndex = ref<number | null>(null)
const lastTargetIndex = ref<number>(1)
const targetInView = ref(false)
let hideTimer: ReturnType<typeof setTimeout> | null = null

const bottonsData = [
  {
    id: 0,
    nome: 'Maratona de programação',
    fraseEspecial: 'Maratona de Programação UnB. Os programadores do futuro são forjados aqui!',
    imagem: '/botonMaratona.png'
  },
  {
    id: 1,
    nome: 'II Maratona do Cerrado',
    data: '25 de Abril, 2026',
    local: 'UnB - FCTE',
    fraseEspecial: 'Finisher da II Maratona do Cerrado! O Cerrado testou nossos limites. Nós mostramos que não temos limites!',
    imagem: '/logo.png'
  }
]

const currentTarget = computed(() => {
  if (activeTargetIndex.value === null) {
    return null
  }

  return bottonsData[activeTargetIndex.value] ?? null
})

const isScanning = computed(() => isLoaded.value && !markerFound.value)
const canOpenTerminal = computed(() => isScanning.value && !currentTarget.value && targetInView.value)

// Função de Teste para abrir a UI sem câmera
const simulateDetection = () => {
  if (!markerFound.value) {
    activeTargetIndex.value = 1
    markerFound.value = true
  } else {
    markerFound.value = false
    activeTargetIndex.value = null
  }
}

const goBack = () => navigateTo('/')

const openTerminal = () => {
  if (!targetInView.value) {
    return
  }
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  activeTargetIndex.value = lastTargetIndex.value
  markerFound.value = true
}

const closeTerminal = () => {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  markerFound.value = false
  activeTargetIndex.value = null
}

const cleanupAR = () => {
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null }
  document.querySelectorAll('video').forEach((video: HTMLVideoElement) => {
    const stream = video.srcObject as MediaStream | null
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      video.srcObject = null
    }
    video.remove()
  })
  document.querySelectorAll('canvas.a-canvas').forEach(c => c.remove())
}

onUnmounted(() => cleanupAR())

const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const script = document.createElement('script'); script.src = src
    script.onload = () => resolve(); script.onerror = () => reject(new Error(`Falha: ${src}`))
    document.head.appendChild(script)
  })
}

const sceneReady = ref(false)

onMounted(async () => {
  const safetyTimeout = setTimeout(() => { if (!isLoaded.value) isLoaded.value = true }, 12000)

  try {
    await loadScript('https://aframe.io/releases/1.3.0/aframe.min.js')
    await loadScript('https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js')

    const AFRAME = (window as any).AFRAME
    if (!AFRAME) return

    if (!AFRAME.components['target-watcher']) {
      AFRAME.registerComponent('target-watcher', {
        schema: { index: { type: 'number' } },
        init() {
          this.el.addEventListener('targetFound', () => {
            if (hideTimer) { clearTimeout(hideTimer); hideTimer = null }
            targetInView.value = true
            activeTargetIndex.value = this.data.index
            lastTargetIndex.value = this.data.index
            markerFound.value = true
          })
          this.el.addEventListener('targetLost', () => {
            targetInView.value = false
            // Aumentei para 5 segundos para o card não sumir tão fácil
            hideTimer = setTimeout(() => {
              markerFound.value = false
              activeTargetIndex.value = null
            }, 5000)
          })
        }
      })
    }

    if (!AFRAME.components['scene-ready']) {
      AFRAME.registerComponent('scene-ready', {
        init() {
          this.el.addEventListener('renderstart', () => {
            if (this.el.renderer) this.el.renderer.setClearAlpha(0)
            isLoaded.value = true
            clearTimeout(safetyTimeout)
          })
        }
      })
    }
    sceneReady.value = true
  } catch (err) { isLoaded.value = true }
})
</script>

<template>
  <div class="page-root">
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">

    <ClientOnly>
      <a-scene v-if="sceneReady"
        mindar-image="imageTargetSrc: /targets.mind; autoStart: true; uiLoading: no; uiError: no; uiScanning: no;"
        color-space="sRGB" renderer="colorManagement: true; physicallyCorrectLights: true; alpha: true;"
        vr-mode-ui="enabled: false" device-orientation-permission-ui="enabled: false" scene-ready>
        <a-assets>
          <img v-for="b in bottonsData" :key="b.id" :id="`img-${b.id}`" :src="b.imagem" crossorigin="anonymous">
        </a-assets>

        <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

        <a-entity v-for="i in [0, 1]" :key="i" :mindar-image-target="`targetIndex: ${i}`"
          :target-watcher="`index: ${i}`">
          <a-entity position="0 0.14 0.15"
            animation="property: rotation; to: 0 360 0; loop: true; dur: 5000; easing: linear">
            <a-circle radius="0.5" :src="`#img-${i}`" position="0 0 0.011"></a-circle>
            <a-circle radius="0.5" :src="`#img-${i}`" position="0 0 -0.011" rotation="0 180 0"></a-circle>
            <a-cylinder radius="0.5" height="0.02" color="#272822" open-ended="true" rotation="90 0 0"
              material="metalness: 0.9; roughness: 0.1"></a-cylinder>
            <a-cylinder radius="0.502" height="0.005" color="#A6E22E" open-ended="true" rotation="90 0 0"></a-cylinder>
          </a-entity>

          <a-ring position="0 0.14 0" radius-inner="0.65" radius-outer="0.68" color="#A6E22E"
            material="opacity: 0.2; transparent: true"></a-ring>
          <a-ring position="0 0.14 0" radius-inner="0.65" radius-outer="0.68" color="#A6E22E" theta-length="100"
            animation="property: rotation; from: 0 0 0; to: 0 0 360; loop: true; dur: 1500; easing: linear"></a-ring>
          <a-ring position="0 0.14 0" radius-inner="0.62" radius-outer="0.63" color="#F92672" opacity="0.4"></a-ring>
        </a-entity>
      </a-scene>
    </ClientOnly>

    <!-- Scanner Monokai -->
    <div v-if="isLoaded && !markerFound" class="scanner-container">
      <div class="scanner-line"></div>
      <div class="scanner-corners"></div>
    </div>

    <button class="btn-back" @click="goBack">← Voltar</button>
    <button v-if="canOpenTerminal" class="btn-open-terminal" @click="openTerminal">Abrir Terminal</button>

    <!--    <button class="btn-test" @click="simulateDetection">-->
    <!--      {{ markerFound ? 'FECHAR TESTE' : 'TESTAR UI' }}-->
    <!--    </button>-->

    <!-- Terminal Card Monokai -->
    <Transition name="slide-up">
      <div v-if="currentTarget" class="event-overlay">
        <div class="terminal-card">
          <div class="terminal-bar">
            <span class="dot red"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
            <span class="terminal-title">MaratonAR.sh</span>
          </div>
          <div class="terminal-body">
            <!--            <p class="line l1">-->
            <!--              <span class="prompt">$</span>-->
            <!--              <span class="cmd-run">./fetch_botton</span>-->
            <!--              <span class="param">&#45;&#45;id=</span><span class="num">{{ activeTargetIndex }}</span>-->
            <!--            </p>-->
            <p class="line l2 name-highlight">{{ currentTarget.nome }}</p>
            <p class="line l3 sep">─────────────────────────────</p>

            <p v-if="currentTarget.data" class="line l4">
              <span class="lbl">DATA:</span><span class="val">{{ currentTarget.data }}</span>
            </p>
            <p v-if="currentTarget.local" class="line l5">
              <span class="lbl">Local:</span><span class="val">{{ currentTarget.local }}</span>
            </p>
            <p v-if="currentTarget.fraseEspecial" class="line l7 frase-bloco">
              {{ currentTarget.fraseEspecial }} <span class="cursor">▮</span>
            </p>

            <!--            <p class="line l8 sep">─────────────────────────────</p>-->
            <!--            <p class="line l9 blink-line"><span class="cursor">▮</span></p>-->
          </div>
          <button class="close-btn" @click="closeTerminal">✕ FECHAR TERMINAL</button>
        </div>
      </div>
    </Transition>

    <div v-if="!isLoaded" class="loading">
      <div class="loader"></div>
    </div>
  </div>
</template>

<style scoped>
.page-root {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  background: #272822;
}

.scanner-container {
  position: fixed;
  inset: 0;
  z-index: 500;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.scanner-line {
  position: absolute;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, transparent, #A6E22E, transparent);
  box-shadow: 0 0 20px #A6E22E;
  animation: scan-move 3s ease-in-out infinite;
}

.scanner-corners {
  width: 70vw;
  height: 70vw;
  max-width: 400px;
  max-height: 400px;
  border: 2px solid rgba(166, 226, 46, 0.2);
  position: relative;
}

.scanner-corners::before,
.scanner-corners::after {
  content: '';
  position: absolute;
  width: 40px;
  height: 40px;
  border: 4px solid #A6E22E;
}

.scanner-corners::before {
  top: -2px;
  left: -2px;
  border-right: 0;
  border-bottom: 0;
}

.scanner-corners::after {
  bottom: -2px;
  right: -2px;
  border-left: 0;
  border-top: 0;
}

@keyframes scan-move {

  0%,
  100% {
    top: 15%;
    opacity: 0.3;
  }

  50% {
    top: 85%;
    opacity: 1;
  }
}

.btn-back {
  position: fixed;
  top: 24px;
  left: 24px;
  z-index: 1000;
  background: rgba(39, 40, 34, 0.8);
  border: 1px solid #49483E;
  color: #F8F8F2;
  padding: 10px 20px;
  border-radius: 99px;
  cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
}

.btn-test {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
  background: #F92672;
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  box-shadow: 0 4px 15px rgba(249, 38, 114, 0.3);
}

.btn-open-terminal {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 1000;
  background: rgba(39, 40, 34, 0.9);
  border: 1px solid #A6E22E;
  color: #A6E22E;
  padding: 10px 18px;
  border-radius: 99px;
  cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 1px;
}

.btn-open-terminal:hover {
  background: #A6E22E;
  color: #1a1a1a;
}

.event-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 40px;
  pointer-events: none;
}

.terminal-card {
  pointer-events: auto;
  width: 92%;
  max-width: 450px;
  background: #272822;
  border: 1px solid #49483E;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9);
  font-family: 'JetBrains Mono', monospace;
}

.terminal-bar {
  background: #1a1a1a;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #3E3D32;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot.red {
  background: #F92672;
}

.dot.yellow {
  background: #E6DB74;
}

.dot.green {
  background: #A6E22E;
}

.terminal-title {
  font-size: 11px;
  color: #75715E;
  margin-left: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.terminal-body {
  padding: 24px;
  color: #F8F8F2;
  font-size: 14px;
  line-height: 1.7;
}

.prompt {
  color: #F92672;
  margin-right: 8px;
}

.cmd-run {
  color: #A6E22E;
}

.param {
  color: #66D9EF;
}

.num {
  color: #AE81FF;
}

.name-highlight {
  color: #E6DB74;
  font-weight: bold;
  font-size: 1.3rem
}

.sep {
  opacity: 0.2;
  margin: 0px;
  color: #75715E;
}

.lbl {
  color: #FD971F;
  margin-right: 12px;
  font-weight: bold;
}

.val {
  color: #E6DB74;
}

.frase-bloco {
  margin-top: 18px;
  border-left: 3px solid #66D9EF;
  padding-left: 16px;
  font-style: italic;
  color: #F8F8F2;
}

.cursor {
  display: inline-block;
  width: 8px;
  height: 16px;
  background: #F8F8F2;
  animation: blink 1s step-end infinite;
  vertical-align: middle;
}

@keyframes blink {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0;
  }
}

.close-btn {
  width: 100%;
  background: #1a1a1a;
  border: none;
  border-top: 1px solid #3E3D32;
  color: #F92672;
  padding: 16px;
  cursor: pointer;
  font-family: 'JetBrains Mono', monospace;
  font-weight: bold;
  font-size: 12px;
  letter-spacing: 2px;
}

.close-btn:hover {
  background: #F92672;
  color: #fff;
}

.loading {
  position: fixed;
  inset: 0;
  background: #272822;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.loader {
  width: 32px;
  height: 32px;
  border: 2px solid #3E3D32;
  border-top-color: #A6E22E;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.slide-up-enter-active {
  transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
}

.slide-up-enter-from {
  transform: translateY(100%) scale(0.95);
  opacity: 0;
}
</style>
