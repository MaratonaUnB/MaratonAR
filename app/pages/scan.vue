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
  if (activeTargetIndex.value === null) return null
  return bottonsData[activeTargetIndex.value] ?? null
})

const isScanning = computed(() => isLoaded.value && !markerFound.value)
const canOpenTerminal = computed(() => isScanning.value && !currentTarget.value && targetInView.value)

const simulateDetection = () => {
  if (!markerFound.value) { activeTargetIndex.value = 1; markerFound.value = true }
  else { markerFound.value = false; activeTargetIndex.value = null }
}

const goBack = () => navigateTo('/')
const openTerminal = () => {
  if (!targetInView.value) return
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null }
  activeTargetIndex.value = lastTargetIndex.value; markerFound.value = true
}
const closeTerminal = () => {
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null }
  markerFound.value = false; activeTargetIndex.value = null
}

// Função de Download / Compartilhamento Melhorada
const downloadFile = async (fileName: string) => {
  try {
    const response = await fetch(`/${fileName}`)
    const blob = await response.blob()
    const file = new File([blob], fileName, { type: blob.type })

    // Tenta usar a API de compartilhamento nativa (Melhor para Galeria/Stories)
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'MaratonAR - Meus Stories',
      })
    } else {
      // Fallback para Download normal
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  } catch (err) {
    console.error('Erro ao processar arquivo:', err)
  }
}

const cleanupAR = () => {
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null }
  document.querySelectorAll('video').forEach((video: HTMLVideoElement) => {
    const stream = video.srcObject as MediaStream | null
    if (stream) { stream.getTracks().forEach(track => track.stop()); video.srcObject = null }
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
            targetInView.value = true; activeTargetIndex.value = this.data.index; lastTargetIndex.value = this.data.index; markerFound.value = true
          })
          this.el.addEventListener('targetLost', () => {
            targetInView.value = false; hideTimer = setTimeout(() => { markerFound.value = false; activeTargetIndex.value = null }, 8000)
          })
        }
      })
    }
    if (!AFRAME.components['scene-ready']) {
      AFRAME.registerComponent('scene-ready', {
        init() {
          this.el.addEventListener('renderstart', () => { if (this.el.renderer) this.el.renderer.setClearAlpha(0); isLoaded.value = true; clearTimeout(safetyTimeout) })
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
        <a-entity v-for="i in [0, 1]" :key="i" :mindar-image-target="`targetIndex: ${i}`" :target-watcher="`index: ${i}`">
          <a-entity position="0 0.14 0.15" animation="property: rotation; to: 0 360 0; loop: true; dur: 5000; easing: linear">
            <a-circle radius="0.5" :src="`#img-${i}`" position="0 0 0.011"></a-circle>
            <a-circle radius="0.5" :src="`#img-${i}`" position="0 0 -0.011" rotation="0 180 0"></a-circle>
            <a-cylinder radius="0.5" height="0.02" color="#272822" open-ended="true" rotation="90 0 0" material="metalness: 0.9; roughness: 0.1"></a-cylinder>
            <a-cylinder radius="0.502" height="0.005" color="#A6E22E" open-ended="true" rotation="90 0 0"></a-cylinder>
          </a-entity>
          <a-ring position="0 0.14 0" radius-inner="0.65" radius-outer="0.68" color="#A6E22E" material="opacity: 0.2; transparent: true"></a-ring>
          <a-ring position="0 0.14 0" radius-inner="0.65" radius-outer="0.68" color="#A6E22E" theta-length="100" animation="property: rotation; from: 0 0 0; to: 0 0 360; loop: true; dur: 1500; easing: linear"></a-ring>
          <a-ring position="0 0.14 0" radius-inner="0.62" radius-outer="0.63" color="#F92672" opacity="0.4"></a-ring>
        </a-entity>
      </a-scene>
    </ClientOnly>

    <div v-if="isLoaded && !markerFound" class="scanner-container">
      <div class="scanner-line"></div>
      <div class="scanner-corners"></div>
    </div>

    <button class="btn-back" @click="goBack">← Voltar</button>
    <button v-if="canOpenTerminal" class="btn-open-terminal" @click="openTerminal">Abrir Terminal</button>

    <Transition name="slide-up">
      <div v-if="currentTarget" class="event-overlay">
        <div class="terminal-card">
          <div class="terminal-bar" @click="closeTerminal" style="cursor: pointer">
            <span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>
            <span class="terminal-title">MaratonAR.sh</span>
            <span style="flex-grow: 1"></span>
            <span style="color: #F92672; font-size: 14px; margin-right: 5px;">✕</span>
          </div>
          <div class="terminal-body">
            <p class="line l2 name-highlight">{{ currentTarget.nome }}</p>
            <p class="line l3 sep">─────────────────────────────</p>
            <p v-if="currentTarget.data" class="line l4"><span class="lbl">DATA:</span><span class="val">{{ currentTarget.data }}</span></p>
            <p v-if="currentTarget.local" class="line l5"><span class="lbl">Local:</span><span class="val">{{ currentTarget.local }}</span></p>
            <p v-if="currentTarget.fraseEspecial" class="line l7 frase-bloco">{{ currentTarget.fraseEspecial }} <span class="cursor">▮</span></p>
          </div>
          <div class="action-footer">
            <button class="download-btn" @click="downloadFile('IIMaratonaCerrado.gif')">
              <svg viewBox="0 0 24 24" class="insta-icon"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              <span>DOWNLOAD GIF</span>
            </button>
            <button class="download-btn" @click="downloadFile('IIMaratonaCerrado.png')">
              <svg viewBox="0 0 24 24" class="insta-icon"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              <span>DOWNLOAD IMAGEM</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <div v-if="!isLoaded" class="loading"><div class="loader"></div></div>
  </div>
</template>

<style scoped>
.page-root { width: 100vw; height: 100vh; height: 100dvh; overflow: hidden; position: fixed; top: 0; left: 0; background: #272822; }
.scanner-container { position: fixed; inset: 0; z-index: 500; pointer-events: none; display: flex; align-items: center; justify-content: center; }
.scanner-line { position: absolute; width: 100%; height: 2px; background: linear-gradient(90deg, transparent, #A6E22E, transparent); box-shadow: 0 0 20px #A6E22E; animation: scan-move 3s ease-in-out infinite; }
.scanner-corners { width: 70vw; height: 70vw; max-width: 400px; max-height: 400px; border: 2px solid rgba(166, 226, 46, 0.2); position: relative; }
.scanner-corners::before, .scanner-corners::after { content: ''; position: absolute; width: 40px; height: 40px; border: 4px solid #A6E22E; }
.scanner-corners::before { top: -2px; left: -2px; border-right: 0; border-bottom: 0; }
.scanner-corners::after { bottom: -2px; right: -2px; border-left: 0; border-top: 0; }
@keyframes scan-move { 0%, 100% { top: 15%; opacity: 0.3; } 50% { top: 85%; opacity: 1; } }
.btn-back { position: fixed; top: 24px; left: 24px; z-index: 1000; background: rgba(39, 40, 34, 0.8); border: 1px solid #49483E; color: #F8F8F2; padding: 10px 20px; border-radius: 99px; cursor: pointer; font-family: 'JetBrains Mono', monospace; font-size: 13px; }
.btn-open-terminal { position: fixed; top: 24px; right: 24px; z-index: 1000; background: rgba(39, 40, 34, 0.9); border: 1px solid #A6E22E; color: #A6E22E; padding: 10px 18px; border-radius: 99px; cursor: pointer; font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: bold; }
.event-overlay { position: fixed; inset: 0; z-index: 999; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 40px; pointer-events: none; }
.terminal-card { pointer-events: auto; width: 92%; max-width: 450px; background: #272822; border: 1px solid #49483E; border-radius: 12px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.9); font-family: 'JetBrains Mono', monospace; }
.terminal-bar { background: #1a1a1a; padding: 12px 16px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #3E3D32; }
.dot { width: 12px; height: 12px; border-radius: 50%; }
.dot.red { background: #F92672; } .dot.yellow { background: #E6DB74; } .dot.green { background: #A6E22E; }
.terminal-title { font-size: 11px; color: #75715E; margin-left: 8px; text-transform: uppercase; letter-spacing: 1px; }
.terminal-body { padding: 24px; color: #F8F8F2; font-size: 14px; line-height: 1.7; }
.name-highlight { color: #E6DB74; font-weight: bold; font-size: 1.3rem; }
.sep { opacity: 0.2; margin: 12px 0; color: #75715E; }
.lbl { color: #FD971F; margin-right: 12px; font-weight: bold; }
.val { color: #E6DB74; }
.frase-bloco { margin-top: 18px; border-left: 3px solid #66D9EF; padding-left: 16px; font-style: italic; color: #F8F8F2; }
.action-footer { display: flex; background: #1a1a1a; border-top: 1px solid #3E3D32; gap: 1px; }
.download-btn { flex: 1; background: #1a1a1a; border: none; color: #F8F8F2; padding: 12px 4px; font-family: 'JetBrains Mono', monospace; font-size: 9px; font-weight: bold; cursor: pointer; display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 6px; transition: background 0.2s; letter-spacing: 0px; }
.download-btn:hover { background: #3E3D32; }
.download-btn:first-child { border-right: 1px solid #3E3D32; }
.insta-icon { width: 14px; height: 14px; fill: #F92672; }
.cursor { display: inline-block; width: 8px; height: 16px; background: #F8F8F2; animation: blink 1s step-end infinite; vertical-align: middle; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
.loading { position: fixed; inset: 0; background: #272822; display: flex; align-items: center; justify-content: center; z-index: 10000; }
.loader { width: 32px; height: 32px; border: 2px solid #3E3D32; border-top-color: #A6E22E; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.slide-up-enter-active { transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1); }
.slide-up-enter-from { transform: translateY(100%) scale(0.95); opacity: 0; }
</style>

<style>
/* Global fixes for full screen camera */
html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; overflow: hidden !important; background: #272822 !important; }
canvas.a-canvas { position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 1 !important; }
video { position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; object-fit: cover !important; z-index: 0 !important; }
</style>
