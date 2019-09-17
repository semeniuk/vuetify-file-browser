// autoprefixer - https://github.com/postcss/autoprefixer
// cssnano      - https://github.com/hail2u/node-css-mqpacker

module.exports = {
  plugins: [
    require('autoprefixer'),
    require('cssnano')({
      preset: [
        'default', {
          discardComments: {
            removeAll: true
          }
        }
      ]
    })
  ]
}
