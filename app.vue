<script lang="ts" setup>
import type { Terminal as _Terminal } from 'xterm'
import { WebContainer } from '@webcontainer/api'
import { files } from './files'

import 'xterm/css/xterm.css'

const data = await $fetch('/api/hello')
const codeContent = ref('')
const ready = ref(false)

onMounted(async () => {
  const { Terminal } = await import('xterm')
  const { FitAddon } = await import('xterm-addon-fit')
  let webcontainerInstance: WebContainer

  async function installDependencies(terminal: _Terminal) {
    // Install dependencies
    const installProcess = await webcontainerInstance.spawn('npm', ['install'])
    installProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          terminal.write(data)
        },
      })
    )
    // Wait for install command to exit
    return installProcess.exit
  }

  async function startDevServer(terminal: _Terminal) {
    // Run `npm run start` to start the Express app
    const serverProcess = await webcontainerInstance.spawn('npm', ['run', 'start'])

    serverProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          terminal.write(data)
        },
      })
    )

    // Wait for `server-ready` event
    webcontainerInstance.on('server-ready', (port, url) => {
      ready.value = true
      iframeEl.src = url
    })
  }

  async function startShell(terminal: _Terminal) {
    const shellProcess = await webcontainerInstance.spawn('jsh', {
      terminal: {
        cols: terminal.cols,
        rows: terminal.rows,
      },
    })

    shellProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          terminal.write(data)
        },
      })
    )

    const input = shellProcess.input.getWriter()
    terminal.onData((data) => {
      input.write(data)
    })

    return shellProcess
  }

  /**
   * @param {string} content
   */

  async function writeIndexJS(content: string) {
    await webcontainerInstance.fs.writeFile('/index.js', content)
  }

  const iframeEl = document.querySelector('iframe')!
  const terminalEl = document.querySelector('.terminal')!

  ;(async () => {
    codeContent.value = files['index.js'].file.contents
    watch(codeContent, (value) => {
      writeIndexJS(value)
    })

    const fitAddon = new FitAddon()

    const terminal = new Terminal({
      convertEol: true,
    })

    terminal.loadAddon(fitAddon)
    terminal.open(terminalEl as HTMLElement)

    // Call only once
    webcontainerInstance = await WebContainer.boot()
    await webcontainerInstance.mount(files)

    // Wait for `server-ready` event
    webcontainerInstance.on('server-ready', (port, url) => {
      iframeEl.src = url
    })

    const shellProcess = await startShell(terminal)

    ready.value = true

    window.addEventListener('resize', () => {
      fitAddon.fit()
      shellProcess.resize({
        cols: terminal.cols,
        rows: terminal.rows,
      })
    })

    // const exitCode = await installDependencies(terminal)
    // if (exitCode !== 0) {
    //   throw new Error('Installation failed')
    // }

    // startDevServer(terminal)
  })()
})
</script>

<template>
  <div class="h-screen flex flex-col">
    <div class="p-4 font-bold cursor-pointer">
      My first Nuxt3 App! <span class="text-green-500">{{ data.data.message }}</span>
    </div>
    <div class="w-full h-280px px-4 grid grid-cols-2 m-auto gap-4">
      <div class="editor border border-#eee border-1 rounded overflow-hidden">
        <MonacoEditor
          class="h-full"
          v-model="codeContent"
          lang="javascript"
          :options="{
            automaticLayout: true,
          }"
        />
      </div>
      <div class="preview flex flex-col justify-center items-center border-#eee border-1 rounded overflow-auto">
        <span v-show="!ready" class="w-10 h-10 text-green-500 i-line-md:downloading-loop" />
        <iframe v-show="ready" src="loading.html" class="w-full h-full"></iframe>
      </div>
    </div>
    <div class="flex-1 px-4 pb-2">
      <div class="terminal bg-#000 px-4 py-2"></div>
    </div>
  </div>
</template>
