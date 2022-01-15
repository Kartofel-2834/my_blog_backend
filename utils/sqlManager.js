function parseInputDbValues(jsObj, joinSymbol){
  let keys = Object.keys(jsObj)

  let commandText = keys.map( key => `${ key }=?`)
  commandText = commandText.join( joinSymbol ? ` ${ joinSymbol } ` : ", " )

  let inputVals = keys.map( key => jsObj[key])

  return { command: commandText, values: inputVals }
}

class SqlManager {
  constructor(db) {
    this.db = db
    this.tables = {}
  }

  async createTable(name, schema){
    let schemaParsed = Object.keys(schema).map( key => `${ key } ${ schema[key] }`)
    schemaParsed = schemaParsed.join(', ')

    try {
      return await this.db.promise().query(`CREATE TABLE IF NOT EXISTS ${ name }(${ schemaParsed })`)
    } catch (err) {
      console.log(err)
      return null
    }
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
    let inputResult = null

    try {
      inputResult = await this.db.promise().query(command, insertData)
      inputResult = inputResult.length && inputResult.length > 0 ? inputResult[0] : null
    } catch(err) {
      console.log(err)
      return null
    }

    if ( !inputResult || !inputResult.insertId ){ return null }

    try {
      return await this.selectFrom(tableName, { id: inputResult.insertId })
    } catch(err) {
      console.log(err)
      return null
    }
  }

  async selectFrom(tableName, filterVal, boolExp, whatToSelect){
    let filter = filterVal ? parseInputDbValues(filterVal, boolExp ? boolExp : 'AND') : null
    let selector = whatToSelect ? whatToSelect : "*"
    let answer

    let command = `SELECT ${ selector } FROM ${ tableName }`
    command = filter && filter.command ? `${ command } WHERE ${ filter.command }` : command

    try {
      if ( filter && filter.values ){
        answer = await this.db.promise().query(command, filter.values)
      } else {
        answer = await this.db.promise().query(command)
      }

      return answer && answer.length ? answer[0] : null
    } catch (err) {
      console.log(err)
      return null
    }
  }

  async deleteFrom(tableName, filterVal, boolExp){
    let filter = filterVal ? parseInputDbValues(filterVal, boolExp ? boolExp : 'AND') : null
    let answer

    let command = `DELETE FROM ${ tableName }`
    command = filter && filter.command ? `${ command } WHERE ${ filter.command }` : command

    try {
      if ( filter && filter.values ){
        answer = await this.db.promise().query(command, filter.values)
      } else {
        answer = await this.db.promise().query(command)
      }

      return answer && answer.length ? answer[0] : null
    } catch (err) {
      console.log(err)
      return null
    }
  }

  async update(tableName, inputVal, filterVal, boolExp){
    let inputs = parseInputDbValues(inputVal)
    let filter = parseInputDbValues(filterVal, boolExp ? boolExp : 'AND')

    let command = `UPDATE ${ tableName } SET ${ inputs.command } WHERE ${ filter.command }`
    let values = inputs.values.concat( filter.values )

    try {
      let answer = await this.db.promise().query(command, values)
      return answer && answer.length ? answer[0] : null
    } catch (err) {
      console.log(err)
      return null
    }
  }

  async tableSchema(tableName){
    try {
      let ans = await this.db.promise().query(`DESCRIBE ${ tableName }`)
      return ans[0]
    } catch (err) {
      console.log(err)
      return null
    }
  }
}

module.exports = SqlManager
