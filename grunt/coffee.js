module.exports = {
  compile: {
    options: {
      bare: true
    },
    files: [
      {
        expand: true,
        cwd: 'coffee/',
        src: ['**/*.coffee'],
        dest: './',
        ext: '.js'
      }
    ]
  }
};
