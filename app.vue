<script lang="ts" setup>
import { WebContainer } from '@webcontainer/api'
import { files } from './files'

const data = await $fetch('/api/hello')
const codeContent = ref('')
const ready = ref(false)

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
      ready.value = true
      iframeEl.src = url
    })
  }

  /**
   * @param {string} content
   */

  async function writeIndexJS(content: string) {
    await webcontainerInstance.fs.writeFile('/index.js', content)
  }

  const iframeEl = document.querySelector('iframe')!

  ;(async () => {
    codeContent.value = files['index.js'].file.contents
    watch(codeContent, (value) => {
      writeIndexJS(value)
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
  <NuxtLayout>
    <div class="p-4 font-bold cursor-pointer">
      My first Nuxt3 App! <span class="text-green-500">{{ data.data.message }}</span>
    </div>
    <div class="px-4 grid grid-cols-2 m-auto h-400px gap-4">
      <div class="editor border border-#eee border-1 rounded overflow-hidden">
        <MonacoEditor class="h-full" v-model="codeContent" lang="javascript" />
      </div>
      <div class="preview flex flex-col justify-center items-center border-#eee border-1 rounded overflow-auto">
        <span v-show="!ready" class="w-10 h-10 text-green-500 i-line-md:downloading-loop" />
        <iframe v-show="ready" src="loading.html" class="w-full h-full"></iframe>
      </div>
    </div>
  </NuxtLayout>
</template>
