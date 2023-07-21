const { Document } = require('mongoose')

/**
 * @author @mamt4real <Mahadi Abuhuraira>
 * Class That handles Query processing for mongoose Models
 */
class QueryHandler {
  constructor(Model, queryString, defaultSort) {
    this.Model = Model
    this.queryString = queryString
    this.defaultSort = defaultSort || '-createdAt _id'
  }

  /**
   * Generate a filter object base on the request query
   * @returns {any} mongoose filter object
   */

  filter() {
    const excluded = ['page', 'sort', 'limit', 'fields']
    let queryParam = {}
    for (const field in this.queryString) {
      if (this.queryString[field] !== '' && !excluded.includes(field))
        queryParam[field] = this.queryString[field]
    }
    let queryStr = JSON.stringify(queryParam)
    queryParam = JSON.parse(
      queryStr.replace(/\b(gte|gt|lte|lt|ne)\b/g, (match) => `$${match}`)
    )

    //handle search for the following fields using regex
    ;['title', 'name', 'email'].forEach((field) => {
      if (queryParam[field])
        queryParam[field] = new RegExp('.*' + queryParam[field] + '.*', 'i')
    })
    return queryParam
  }

  /**
   * Generate a mongoose sort string
   * @returns {string} a sort string
   */
  sort() {
    if (this.queryString.sort) {
      let sortBy = this.queryString.sort
      if (sortBy instanceof Array) sortBy = sortBy.join(' ')
      else sortBy = sortBy.split(',').join(' ')
      return sortBy
    } else {
      //default sort
      return this.defaultSort
    }
  }

  /**
   * Generate list of fields to return in each object
   *
   * @returns {string} mongoose field selection
   */
  project() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ')
      return fields
    } else {
      return '-__v -createdAt -updatedAt -createdBy -updatedBy'
    }
  }

  /**
   * Generate a page and limit for paginating a query
   * Default Caps records to a maximum of 500
   * @returns {[number, number]} page and limit parameters
   */
  paginate() {
    if (this.queryString.page || this.queryString.limit) {
      const page = this.queryString.page - 1 > 0 ? this.queryString.page - 1 : 0
      let limit = this.queryString.limit * 1 || 10
      return [page, limit]
    }
    return [0, 500]
  }

  /**
   * Process and return the results
   * @returns {Promise<Document<any>[]>} Array of fetched documents
   */
  async process() {
    const query = this.filter()
    const fields = this.project()
    const sort = this.sort()
    const paginate = this.paginate()
    let results = []
    try {
      results = await this.Model.find(query)
        .select(fields)
        .skip(paginate[0] * paginate[1])
        .limit(paginate[1])
        .sort(sort)
    } catch (error) {
      console.log('Error Processing Query String >>>', error)
    } finally {
      return results
    }
  }
}

module.exports = QueryHandler
