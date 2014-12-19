module.exports = {
  options: {
    globals: ['chai'],
    timeout: 3000,
    ignoreLeaks: false,
    ui: 'bdd',
    reporter: 'spec'
  },
  all: {
    src: ['test/**/*.js']
  }
};
