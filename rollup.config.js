import terser from '@rollup/plugin-terser'

export default {
  input: 'src/Queue.js',
  output: [
    {
      file: 'dist/queue.js',
      format: 'es'
    },
    {
      file: 'dist/queue.min.js',
      format: 'es',
      plugins: [terser()]
    }
  ]
}
