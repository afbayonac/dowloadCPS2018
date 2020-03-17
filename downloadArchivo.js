const puppeteer = require('puppeteer')
const async = require('async')
const cheerio = require('cheerio')

let browser
const toDate = (s) => {
  // da formato a las fechas entregadas por el atril
  return new Date(s.replace(/(\d{2})\/(\d{2})\/(\d{2})/,'$2/$1/$3'));
}

const requestArchivo = async (cps, callback) => {
  
  try {
    const page = await browser.newPage()
    await page.goto('http://contratos.bucaramanga.gov.co/')
    await page.evaluate((numeroContrato, objetoContrato) => {
      document.querySelector('#cph_contratos_txtNroContrato').value = numeroContrato
      document.querySelector('#cph_contratos_ddlVigFiscal').value = '2018'
    }, cps.numero_contrato, cps.objeto_contrato)  
    await page.click('#cph_contratos_btnFiltro')
    
    const inner_html = '<table>' + (await page.evaluate(() => document.querySelector('#dataTables-example').innerHTML)) + '</table>'
    const $ = cheerio.load(inner_html, { normalizeWhitespace: true })
    const trs = $('tbody tr')
    
    data = []
    for(let i = 0; i < trs.length; i++) {
      tr = trs[i]
      if (toDate(tr.children[13].children[0].data).getDate() !== cps.fecha_inicio.getDate() ) continue
      if (toDate(tr.children[15].children[0].data).getDate() !== cps.fecha_terminacion.getDate() ) continue
      
      const href = tr.children[19].children[0].attribs.href
      await page.goto(`http://contratos.bucaramanga.gov.co/${href}`)
      const inner_html = '<div>' + (await page.evaluate(() => document.querySelector('.panel-body').innerHTML)) + '</div>'
      const $ = cheerio.load(inner_html, { normalizeWhitespace: true })
      const inputs = $('.input-group')
      
      data.push({
        identificaicon: inputs[2].children[0].children[0].data,
        contratista: inputs[3].children[0].children[0].data,
        tipoDeContrato: inputs[4].children[0].children[0].data,
        estado: inputs[5].children[0].children[0].data,
        objeto: inputs[8].children[0].children[0].data,
        valor: inputs[9].children[0].children[0].data,
        duracion: inputs[10].children[0].children[0].data,
        oficinaGestora: inputs[11].children[0].children[0].data,
        supervisor: inputs[12].children[0].children[0].data,
        urlSECOP: inputs[13].children[0].children[0].data
      })
    
    }
    // await page.screenshot({ path: 'output.png', fullPage: true })
    await page.close()
  } catch (e) {
    console.error(e)
      
  }

  console.group('contrato numero %d ', cps.numero_contrato)
  console.info('Encontrados: %d', data.length); console.groupEnd() 
  return data.length === 0 ? null : data
}

module.exports = async (data) => {
  console.info('............Descargando procesos de Archivo de la alcaldia de bucaramanga..............')

  browser = await puppeteer.launch()
  console.group()
  return new Promise((resolve, reject) => {
    async.mapLimit(data, 1, requestArchivo, (err, results) => {
      console.groupEnd()
      browser.close()
      if (err) return console.log(err)
      console.info(`\nBuscados ${results.length}`)
      console.info(`Encontrados ${results.reduce((a, c) => c !== null ? a + 1 : a, 0)} \n`)
      resolve(results.map((r, i) => ({ ...data[i], archivo: r })))
      

      // fs.writeFile('./cps_el_atril_ssecopi_ssecopii_archivo.json', JSON.stringify(result, null, 2), (err) => { if (err) console.log(err) })
    })
  })
}
