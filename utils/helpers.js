const staticData = require("../static.js")

function regBodyFieldError(body){
  const fieldError = (text)=>{
    const forbiddenSymbols = /^[^\%/\\&\?\,\'\;:!-+!@#\$\^*)(]{0,20}$/

    return !text || !text.length || (text.length <= 1) || (text.length >= 20) || !forbiddenSymbols.test(text)
  }

  let ans = !body || fieldError(body.name) || fieldError(body.surname)
  ans = ans || fieldError(body.tagname)
  ans = ans || !body.password || !body.password.length
  ans = ans || (body.password.length <= 5) || (body.password.length >= 20)
  ans = ans || !(/[a-z]@[a-z]/.test(body.mail))

  return ans
}

async function sendMail(transporter, adress, text, html){
  let defaultText = 'This message was sent from Blogpost server'

  let result = await transporter.sendMail({
    from: `"Blogpost" <${ staticData.server_mail.user }>`,
    to: adress,
    subject: 'Message from Blogpost',
    text: text ? text : defaultText,
    html: html ? html : defaultText,
  })

  return result
}

function getRandom( limit ){
	return Math.floor(Math.random() * limit)
}

function randomToken(len){
  let ans = ''

  for (let i=0; i<len; i++){ ans += getRandom(10) }

  return ans
}

module.exports = { randomToken, getRandom, sendMail, regBodyFieldError }
