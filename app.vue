<script lang="ts" setup>
import { WebContainer } from '@webcontainer/api'
import { files } from './files'

const data = await $fetch('/api/hello')

onMounted(() => {
  let webcontainerInstance: WebContainer

  async function installDependencies() {
    // Install dependencies
    const installProcess = await webcontainerInstance.spawn('npm', ['install'])
    installProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          console.log(data)
        },
      })
    )
    // Wait for install command to exit
    return installProcess.exit
  }

  async function startDevServer() {
    // Run `npm run start` to start the Express app
    await webcontainerInstance.spawn('npm', ['run', 'start'])

    // Wait for `server-ready` event
    webcontainerInstance.on('server-ready', (port, url) => {
      iframeEl.src = url
    })
  }

  /**
   * @param {string} content
   */

  async function writeIndexJS(content: string) {
    await webcontainerInstance.fs.writeFile('/index.js', content)
  }

  document.querySelector('#webContainer')!.innerHTML = `
  <div class="container px-4">
    <div class="editor">
      <textarea>I am a textarea</textarea>
    </div>
    <div class="preview">
      <iframe src="loading.html"></iframe>
    </div>
  </div>
`
  const iframeEl = document.querySelector('iframe')!

  const textareaEl = document.querySelector('textarea')!

  ;(async () => {
    console.log('ok')
    textareaEl.value = files['index.js'].file.contents
    textareaEl.addEventListener('input', (e: any) => {
      writeIndexJS(e.currentTarget!.value)
    })

    // Call only once
    webcontainerInstance = await WebContainer.boot()
    await webcontainerInstance.mount(files)

    const exitCode = await installDependencies()
    if (exitCode !== 0) {
      throw new Error('Installation failed')
    }

    startDevServer()
  })()
})
</script>

<template>
  <div class="p-4 font-bold underline underline-current cursor-pointer">My first Nuxt3 App {{ data.data.message }}</div>
  <div id="webContainer"></div>
</template>

<style>
iframe,
textarea {
  border-radius: 3px;
}

iframe {
  height: 20rem;
  width: 100%;
  border: solid 2px #ccc;
}

textarea {
  width: 100%;
  height: 20rem;
  resize: none;
  background: black;
  color: white;
  padding: 0.5rem 1rem;
  font-size: 120%;
  margin-bottom: 10px;
}

.container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  height: 100%;
  width: 100%;
}
</style>
