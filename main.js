const downloadSecopI = require('./downloadSecopI')
const downloadSecopII = require('./downloadSecopII')
const downloadArchivo = require('./downloadArchivo')


let data = require('./cps_el_atril.json')

// sort data
data = data
  .map(e => ({ ...e, fecha_inicio: new Date(e.fecha_inicio), fecha_terminacion: new Date(e.fecha_terminacion) }))
  .sort((a, b) => -b.fecha_inicio.getTime() + a.fecha_inicio.getTime())


const main = async () => {
  console.info('✨ Init Download ✨')
  
  // download data secop I
  console.group()
  // data = await downloadSecopI(data)
  console.groupEnd()
  // dowload data secop II 
  console.group()
  // data = await downloadSecopII(data)
  console.groupEnd()
  // dowload data Archivo
  console.group()
  data = await downloadArchivo(data)
  console.groupEnd()

  console.info('\n✨ End Download ✨')
  
  // write in disk
  fs.writeFile('./data.json', JSON.stringify(result, null, 2), (err) => { if (err) console.log(err) })
}

main ()