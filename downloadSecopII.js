/*
  Script para obtener el numConstancia, valor y otras variables
  de la paguina de SECOP II en los procesos de contratacion por
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

const requestSECOPII = (cps, callback) => instance({
  method: 'GET',
  url: 'https://community.secop.gov.co/Public/Tendering/ContractNoticeManagement/Index',
}).then(res => {
  const $ = cheerio.load(res.data)
  const HighContrastSwitchLink = $('#HighContrastSwitchLink')[0]
  if (!HighContrastSwitchLink) return 'no get mkey'
  return HighContrastSwitchLink.attribs.onclick.match(/mkey=([\d\w]*)/)[1]
}).then(mkey => instance({
  method: 'GET',
  url: 'https://community.secop.gov.co/Public/Tendering/ContractNoticeManagement/AdvancedSearchAjax',
  params: {
    perspective: 'All',
    initAction: 'Index',
    externalId: '',
    logicalId: '',
    fromMarketplace: '',
    authorityVat: '',
    allWords2Search: '',
    pageNumber: 0,
    startIndex: 1,
    endIndex: 5,
    currentPagingStyle: 0,
    displayAdvancedParams: true,
    orderParam: 'RequestOnlinePublishingDateDESC',
    searchExecuted: false,
    authorityName: 'MUNICIPIO DE BUCARAMANGA',
    reference: cps.SECOP,
    description: '',
    mainCategory: '',
    mainCategoryText: '',
    categorizationSystemCode: 'UNSPSC',
    country: 'CO',
    region: '',
    regulation: '',
    requestStatus: '',
    publishDateFrom: '',
    publishDateTo: '',
    tendersDeadlineFrom: '',
    tendersDeadlineTo: '',
    openDateFrom: '',
    openDateTo: '',
    mkey: mkey
    // _: 1575561139458
  }
})).then(res => {
  const $ = cheerio.load(res.data)
  const proceso = res.config.params.reference
  console.group('%s', proceso)

  if ($('body .VortalGridEmptyResult').length !== 0) {
    console.info(`Encontrados: 0`); console.groupEnd()
    return null
  }

  if ($('.VortalPaginatorMorePages').length !== 0) {
    console.log('Encontrados mas de 5 🤷‍♂️'); console.groupEnd()
    return null
  }

  const trs = $('.GridContainer tr')
  const data = []

  for (let i = 1; i < trs.length / 2; i++) {
    const row = trs[i]

    if (row.children[2].children[0].children[0].data !== proceso) continue
    if (!row.children[9].children[0]) continue

    data.push({
      entidad: row.children[1].children[0].children[0].data,
      objeto: row.children[3].children[0].children[0].data,
      precio_base: row.children[7].children[0].children[0].children[0].data,
      fecha_publicacion: row.children[5].children[0].children[0].children[0].children[0].data,
      noticeUID: row.children[9].children[0].attribs.onclick.match(/noticeUID='\s\+\s'([\d\w.]*)/)[1]
    })
  }
  console.info('Encontrados: %d', data.length); console.groupEnd()
  return data.length === 0 ? null : data
}).then(res => callback(null, res))
  .catch(err => console.err(err))

module.exports = (data) => { 
  console.info('............Descargando procesos de SECOP II..............')
  console.group()
  return new Promise((resolve, reject) => {
    async.mapLimit(data, 100 ,requestSECOPII, (err, results) => {
      console.groupEnd()
      if (err) console.error(err)
      console.info('Buscados %d', results.length)
      console.info('Encontrados %d\n', results.reduce((a, c) => c !== null ? a + 1 : a, 0))
      resolve(results.map((r, i) => ({ ...data[i], SECOPII: r })))
    })
  })
}
