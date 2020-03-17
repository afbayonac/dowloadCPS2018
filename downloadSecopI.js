/*
  Script para obtener el numConstancia, valor y otras variables
  de la paguina de SECOP I en los procesos de contratacion por
  prestancion de servicios en Bucaramanga 2018
*/
const fs = require('fs')
const https = require('https')
const axios = require('axios')
const async = require('async')
const cheerio = require('cheerio')

// instacia de axios para hacer peticiones
const instance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
})

/*
 @param cps -> object contrato por prestacion de servicios
 @param callbac -> func(err, result) 
*/

const requestSECOPI = (cps, callback) => instance({
  method: 'GET',
  url: 'https://www.contratos.gov.co/consultas/resultadosConsulta.do',
  params: {
    ctl00$ContentPlaceHolder1$hidIDProducto: -1,
    ctl00$ContentPlaceHolder1$hidIDProductoNoIngresado: -1,
    ctl00$ContentPlaceHolder1$hidIDRubro: -1,
    ctl00$ContentPlaceHolder1$hidIdEmpresaC: 0,
    ctl00$ContentPlaceHolder1$hidIdEmpresaVenta: -1,
    ctl00$ContentPlaceHolder1$hidIdOrgC: -1,
    ctl00$ContentPlaceHolder1$hidIdOrgV: -1,
    ctl00$ContentPlaceHolder1$hidNombreDemandante: -1,
    ctl00$ContentPlaceHolder1$hidNombreProducto: -1,
    ctl00$ContentPlaceHolder1$hidNombreProveedor: -1,
    ctl00$ContentPlaceHolder1$hidRangoMaximoFecha: '',
    ctl00$ContentPlaceHolder1$hidRedir: '',
    cuantia: 0,
    departamento: '',
    desdeFomulario: true,
    entidad: '',
    estado: '',
    fechaFinal: '',
    fechaInicial: '',
    findEntidad: '',
    municipio: 68001,
    numeroProceso: cps.SECOP,
    objeto: '',
    paginaObjetivo: 1,
    registrosXPagina: 50,
    tipoProceso: ''
  }
}).then(res => {
  const $ = cheerio.load(res.data)
  const resu = $('.resumenResultados')
  const process = res.config.params.numeroProceso
  const data = []

  
  console.group('%s', process)
  if (!resu[0]) {
    console.info('encontrados: %d', 0); console.groupEnd()
    return null
  }

  const number = Number(resu[0].children[0].data.trim().match(/^((-\d)|(\d))/)[0])
  const trs = $('tr')

  for (let i = 1; i <= number; i++) {
    const row = trs[i].children.filter(e => e.type === 'tag').map(e => e.children)
    if (row[1][1].children[0].data !== process) continue
    data.push({
      entidad: row[4][0].data,
      objeto: row[5][0].data,
      precio_base: row[7][0].data,
      numConstancia: row[1][1].attribs.href.match(/numConstancia=([\d-.\w]*)/)[1]
    })
  }

  console.info('encontrados: %d', data.length); console.groupEnd()
  return data.length === 0 ? null : data
}).then(res => callback(null, res))
  .catch(err => callback(err, null))

module.exports = (data) => {
  console.info('............Descargando procesos de SECOP I..............')
  console.group()
  
  return new Promise((resolve, reject) => { 
    async.map(data, requestSECOPI, (err, results) => {
      console.groupEnd()
      if (err) return console.error(err)
      console.info('\nBuscados %d', results.length)
      console.info('Encontrados %d\n', results.reduce((a, c) => c !== null ? a + 1 : a, 0))
      return resolve(results.map((r, i) => ({ ...data[i], SECOPI: r })))
    })
  })
}
