const fs = require('fs')
const path = require('path')


const COOKIEPATH = path.join(__dirname, '../config/cookie.sh')

!(async () => {
    const cookies = await readFileData(COOKIEPATH)
    const formatData = cookies.length && cookies.match(/(?<=Cookie\d{1,2}=\").*(?=")/g)
    formatData.length && console.log(formatData.join('&'))
})();

function readFileData(path) {
  return new Promise(resolve => {
    const data = fs.readFileSync(path, 'utf-8')
    resolve(data);
  })
}
