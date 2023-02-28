export default defineEventHandler((event) => {
  return {
    errno: 0,
    data: {
      message: 'Hello World'
    }
  }
})