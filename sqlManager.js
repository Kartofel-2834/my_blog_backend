class SqlManager {
  constructor(db) {
    this.db = db
    this.tables = {}
  }

  async createTable(name, schema){
    let schemaParsed = Object.keys(schema).map( key => `${ key } ${ schema[key] }`)
    schemaParsed = schemaParsed.join(', ')

    try {
      await this.db.promise().query(`CREATE TABLE IF NOT EXISTS ${ name }(${ schemaParsed })`)
    } catch (e) { throw err }
  }

  async insertIn(tableName, values){
    let schema = await this.tableSchema(tableName)
    schema = schema.map( e => e.Field )

    let insertData = {}

    for (let key of Object.keys(values)){
      if ( schema.indexOf(key) != -1 ){ insertData[key] = values[key] }
    }

    let dataKeys = Object.keys(insertData)
    let sqlKeys = dataKeys.join(", ")
    let questionSym = dataKeys.map( key => '?' ).join(", ")
    insertData = dataKeys.map( key => insertData[key] )

    let command = `INSERT INTO ${ tableName }(${ sqlKeys }) VALUES (${ questionSym })`

    try {
      return await this.db.promise().query(command, insertData)
    } catch (err) {
      throw err
    }
  }

  async simpleSelectFrom(tableName, expression){
    let expParsed = Object.keys(expression).map( key => `${ key }=?`)
    expParsed = expParsed.join(" AND ")

    let expValues = Object.keys(expression).map( key => expression[key] )
    let command = `SELECT * FROM ${ tableName } WHERE ${ expParsed }`

    try {
      let answer = await this.db.promise().query(command, expValues)
      return answer && answer.length ? answer[0] : null
    } catch (err) { throw err }
  }

  async tableSchema(tableName){
    try {
      let ans = await this.db.promise().query(`DESCRIBE ${ tableName }`)
      return ans[0]
    } catch (e) {
      return null
    }
  }
}

module.exports = SqlManager
