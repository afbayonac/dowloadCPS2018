const downloadSecopI = require('./downloadSecopI')
const downloadSecopII = require('./downloadSecopII')
const downloadArchivo = require('./downloadArchivo')
const fs = require('fs')

let data = require('./cps_el_atril.json')

// sort data
data = data
  .map(e => ({ ...e, fecha_inicio: new Date(e.fecha_inicio), fecha_terminacion: new Date(e.fecha_terminacion) }))
  .sort((a, b) => -b.fecha_inicio.getTime() + a.fecha_inicio.getTime())
  //.slice(0, 10)

const main = async () => {
  try {
    console.info('✨ Init Download ✨')
    
    // download data secop I
    console.group()
    data = await downloadSecopI(data)
    console.groupEnd()
    // dowload data secop II 
    console.group()
    data = await downloadSecopII(data)
    console.groupEnd()
    // dowload data Archivo
    console.group()
    data = await downloadArchivo(data)
    console.groupEnd()
  
    console.info('\n✨ End Download ✨')
    
    // write in disk
    fs.writeFile('./data.json', JSON.stringify(data, null, 2), (err) => { if (err) console.log(err) })
  } catch (e) {
    console.error(e)
  }
}

main()
.catch(e => console.error(e))