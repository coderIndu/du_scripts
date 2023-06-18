/*

cron "3 0 * * *" du_sign.js, tag: 领京豆签到
*/

const axios = require('axios');
const fs = require('fs');
const USER_AGENT = require('./USER_AGENTS'); // 随机user-agent

// 只是签到
const $ = new Env("领京豆、金融签到");

const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [], cookie = '', message;
const ljdUrl = "https://api.m.jd.com/client.action?functionId=signBeanAct&body=%7B%22fp%22%3A%22-1%22%2C%22shshshfp%22%3A%22-1%22%2C%22shshshfpa%22%3A%22-1%22%2C%22referUrl%22%3A%22-1%22%2C%22userAgent%22%3A%22-1%22%2C%22jda%22%3A%22-1%22%2C%22rnVersion%22%3A%223.9%22%7D&appid=ld&client=android&clientVersion=10.1.0&networkType=wifi&osVersion=10&uuid=9383634603332666-3666836316630313&openudid=9383634603332666-3666836316630313&eu=9383634603332666&fv=3666836316630313&jsonp=jsonp_1629337240937_47190"
// let jrSignUrl = fs.readFileSync('../config/du_jrSignUrl.list').toString().split('\n');
// let ddqSignUrl = fs.readFileSync('../config/du_ddqSign.list').toString().split('\n');
// let du_config = JSON.parse(fs.readFileSync('../config/du_config.json', 'utf-8')).data;

// jrSignUrl =  

if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item])
  })
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => { };
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jsonParse($.getdata('CookiesJD') || "[]").map(item => item.cookie)].filter(item => !!item);
}

!(async () => {
  $.message = ''; // 保存发送的消息
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=(.+?);/) && cookie.match(/pt_pin=(.+?);/)[1])
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      await TotalBean();

      console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
      let sendHead = `\n【京东账号${$.index}】${$.nickName || $.UserName}\n\t`;
      $.message += sendHead;
      //   console.log(du_config)
      await ljdSign();  // 领京豆
      // await jrSign(i);  // 金融
      // await msSign()
      //   await jlc_sign(cookie)
    }
  }
  //   发送消息结果
  await notify.sendNotify(`${$.name}`, `${$.message}`);
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '')
  })
  .finally(() => {
    $.done();
  })
// 领京豆签到
async function ljdSign() {
  try {
    let { data } = await ljd(cookie);
    let result = data?.dailyAward || data?.continuityAward;
    let { title, beanAward: { beanCount } } = result;
    console.log(title, beanCount)
    $.message += `${title}：${beanCount}豆\n`;
  } catch (error) {
    console.log(error);
  }
  // return str;
}

// 京东金融签到
async function jrSign(i) {
  if (du_config[i][`jd${i + 1}`].jrSign != "") {
    $.message += ` 金融双签：` + await double_sign(cookie, du_config[i][`jd${i + 1}`].jrSign);
  }
  let rewards = await get_rewards(cookie);
  $.message += `  双签结果：${rewards}`
}
// 秒杀,汽车签到
async function msSign() {
  $.message += `秒杀签到：` + await ms_sign(cookie);
  $.message += `汽车签到：` + await car(cookie);
  //   console.log()
}
// 双签
function double_sign(cookie, url) {
  return new Promise((resolve, reject) => {
    const options = {
      url: `${url}`,
      headers: {
        "accept": "*/*",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        "cookie": cookie,
        "referer": 'https://member.jr.jd.com',
        "User-Agent": `Mozilla/5.0 (Linux; U; Android 10; zh-cn; MI 8 Build/QKQ1.190828.002) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/79.0.3945.147 Mobile Safari/537.36 XiaoMi/MiuiBrowser/13.5.40`,
      }
    }
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${err}\n${$.name}: API查询请求失败 ‼️‼️`)
          $.logErr(err);
        } else {
          data = JSON.parse(data);
          let { resultData: { resBusiMsg } } = data;
          console.log(typeof data, resBusiMsg);
          // data = jsonpToJson(data)
          data = `${resBusiMsg}\n`;
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}

// 领取双签奖励
function get_rewards(cookie) {
  return new Promise((resolve, reject) => {
    const options = {
      url: `https://nu.jr.jd.com/gw/generic/jrm/h5/m/process?_=1629564324042&reqData=%7B%22actCode%22%3A%22F68B2C3E71%22%2C%22type%22%3A4%2C%22frontParam%22%3A%7B%22belong%22%3A%22jingdou%22%7D%2C%22riskDeviceParam%22%3A%22%7B%5C%22fp%5C%22%3A%5C%229b4add1639e1dc4436fc724b10d0c4c3%5C%22%2C%5C%22eid%5C%22%3A%5C%22XYDVF5U5JZMD5GVGHHK4UVCAPWJX4HCYP45MYTIT566WCY2HHITEHBGYBUVSESQ2ZP7YU73SLMNFAHDOBS3M7SEKQY%5C%22%2C%5C%22sdkToken%5C%22%3A%5C%22%5C%22%2C%5C%22sid%5C%22%3A%5C%22%5C%22%7D%22%7D`,
      headers: {
        "accept": "*/*",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        "cookie": cookie,
        "referer": 'https://m.jr.jd.com/integrate/signin/index.html?channel=qjdicon&sid=68f65edf03b6e283359b6fe96005bb7w&un_area=18_1501_1504_52593',
        "User-Agent": `Mozilla/5.0 (Linux; U; Android 10; zh-cn; MI 8 Build/QKQ1.190828.002) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/79.0.3945.147 Mobile Safari/537.36 XiaoMi/MiuiBrowser/13.5.40`,
      }
    }
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${err}\n${$.name}: API查询请求失败 ‼️‼️`)
          $.logErr(err);
        } else {
          console.log(data)
          let { resultData: { msg } } = JSON.parse(data);
          let { resultData: { data: { businessData } } } = JSON.parse(data);

          if (businessData != null) {
            let { resultData: { data: { businessData: { businessMsg } } } } = JSON.parse(data);
            data = `${businessMsg}\n`
          } else {
            data = `${businessData}\n`
          }
          // console.log(data)
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}

// 剑兰春签到
function jlc_sign(cookie) {
  return new Promise((resolve, reject) => {
    const options = {
      url: `https://lzkj-isv.isvjcloud.com/sign/wx/signUp&actId=43ff74456e164f33950279646f9a0632&pin=hJt6I2z0cf6Lqr%2FrFmsYt07oeVP9kq2pYSH90mYt4m3fwcJlClpxrfmVYaGKuquQkdK3rLBQpEQH9V4tdrrh0w%3D%3D`,
      headers: {
        "accept": "*/*",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        "cookie": cookie,
        "referer": 'https://lzkj-isv.isvjcloud.com/sign/signActivity2?activityId=43ff74456e164f33950279646f9a0632&venderId=1000072303&adsource=tg_xuanFuTuBiao&sid=060cb16f92da08fad9ceb1cbb7b6936w&un_area=18_1501_1504_52593',
        "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1")
      }
    }
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${err}\n${$.name}: API查询请求失败 ‼️‼️`)
          $.logErr(err);
        } else {
          console.log(data)
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}

// 秒杀券签到
function ms_sign(cookie) {
  return new Promise(async resolve => {
    const options = {
      "url": `https://api.m.jd.com/client.action?uuid=9383634603332666-3666836316630313&clientVersion=10.1.2&client=wh5&osVersion=&area=18_1501_1504_52593&networkType=wifi&functionId=signRedPackage&body=%7B%22random%22%3A%2260896636%22%2C%22log%22%3A%221630290936296~1QdQR9XAdnqMDFJY2J6czk5MQ%3D%3D.eFVRSkFwU1tLQ31VVAQ0ICAkPysgIlVMDXhPVFZZZVIcSA14HQEsKiUnEE5HGidWIxt5OyRDIhkiCQAidF4c.c5c82c4c~6%2C1~C755BD8DEF446FA7F184980EA517051F6BE012FE~1cmh509~C~SBtFXBYDbW8aEUdXXBMOYhRWAx4CDB1yBBV9BHMfAhcBAQQVQhAaEVcOHAABFXUCGngFcx0AGgkGAhpHERUTVQUUBwcacAMVeglkFUMeQhFuFRNWRlcUCAcfEUpCEw4bBwQFAwEAAQgEAAQCAwAHAQATGBtBV1IRCRtFRUBNQhAaEURcUBMOG1BUQkdHTURQFhUUQlJdEQNqCRgIBQMCHwUVBh0FFQNvGhFZUxMLBRUUUUURCRsEAQQLVAJVBQAPCQcHDgcFUwQEX1VQVlsEBgNQUVtXAhYVFFxGEQkbfVhaTE4SV0FeTwldFhUURhQJAg8CAQYABgsFBQEABx0WU10QDBEeFAgJAl0GAVRVUF8JB1UPBgMUHxFfQVMWAxRRYGpffUMFAGpyBm9bA2F3CGVpd1lMYg4EEx0WV0AQDBF0Vl5WWFwWe1hQHRsdE1pYQBAMEQsABgUHGxoQRVBBGwtqDAwHHgUKAGQdE0ZWFAhtEX5QEQAEGxoQV11XS15YUBsaEAcDERUTAAQXBxwEER8bCQgDDQUQGhEKCgkCAgoCBAYAAAoDBwIPGwEABQUBAgcHCAAEBQMACAITGBsHEGsfEVBeUBYDFFRQVVVfV0VAGxoQV1kRAxNEFhUUUV8RCRtGAhoIGAIUHxFaV25CGwwQDwoRFRNTUBsMEBQfEVRbEw5iBx4GHwNkHRNWVVlVFAkRCAcCBAsPAg4KBwAEAUoIRWh8fWdqdHtzaARUA1dXDFRSVQkHAVcGUQhSAwFYVwFSUAcBBgMEDgZUSEtNR09zSm1kZHF2VEF1Z3JdV3VgR1doRkJuegdVf2ZYWlB3WGxkdnNxZW53WlFoZ15hZ3ZrZ2AFdG92WgdrYVZjbXxgC2BkS3xQYHJsYHZeeWtoSUJVaGRne3VUa3xwXwlmYE5He2hZaHt8Z3hUckRaZnl2aH9gZFx9f2BobXtdc1RiZVZnd2IBY2QHV2JvZHBVf2BWbHV1SmdmQ2hscE5ce2h0XglHBwtDCwUKUBMYG1tBUREJGxNM~096d0go%22%2C%22sceneid%22%3A%22MShPageh5%22%2C%22ext%22%3A%7B%22platform%22%3A%221%22%2C%22eid%22%3A%22eidA534a8122das7SstskdshSSeeMQsrzoh6sErLbgzAsNhge7PhfmGgqVPtRH7ZE5RACnEwCs%2Baug6h0W%2B74o2mj33Y9DgUVGv01nTKHUv209rliiNY%22%2C%22referUrl%22%3A-1%2C%22userAgent%22%3A-1%7D%7D&appid=SecKill2020`,
      "headers": {
        "Accept": "application/json,text/plain, */*",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Cookie": `${cookie}`,
        "Referer": `https://h5.m.jd.com/babelDiy/Zeus/2KkgbGDmBLtDRXhf19xeEDdR3cqi/index.html?sid=3cf15da8eabdbe33f8c9a13bf4d2df2w&un_area=18_1501_1504_52593`,
        "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1")
      }
    }
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          console.log(data)
          let re = /(?<=\"title\":).*/
          data = data.replace('}}', '').split(',');
          data = data[data.length - 1].match(re)[0];

        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve(data);
      }
    })
  })
}
// car
function car(cookie) {
  return new Promise((resolve, reject) => {
    const options = {
      url: `https://car-member.jd.com/api/v1/user/exchange/bean/check?timestamp=1630427577583`,
      headers: {
        "accept": "*/*",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        "cookie": cookie,
        "referer": 'https://shop.m.jd.com/',
        "User-Agent": `Mozilla/5.0 (Linux; U; Android 10; zh-cn; MI 8 Build/QKQ1.190828.002) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/79.0.3945.147 Mobile Safari/537.36 XiaoMi/MiuiBrowser/13.5.40`,
      }
    }
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${err}\n${$.name}: API查询请求失败 ‼️‼️`)
          $.logErr(err);
        } else {
          data = JSON.parse(data).data.reason
          console.log(data)
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}
// 格式化cookie部分
function formatCookie(value) {
  let re = /pt_key.*?;pt_pin.*?;/
  let cookies = [];

  for (let i of value) {
    if (re.test(i)) {
      cookies.push(i.match(re)[0])
    }
  }
  return cookies;
}

// 领京豆签到部分
function ljd(cookie) {
  return new Promise((resolve, reject) => {
    const options = {
      url: `${ljdUrl}`,
      headers: {
        "accept": "accept",
        "accept-encoding": "gzip, deflate",
        "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        "cookie": cookie,
        "User-Agent": `Mozilla/5.0 (Linux; U; Android 10; zh-cn; MI 8 Build/QKQ1.190828.002) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/79.0.3945.147 Mobile Safari/537.36 XiaoMi/MiuiBrowser/13.5.40`,
      }
    }
    $.get(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`\n${$.name}: API查询请求失败 ‼️‼️`)
          $.logErr(err);
        } else {
          data = jsonpToJson(data)
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    })
  })
}



// jsonp转json格式
function jsonpToJson(datas) {
  let jsonData = null
  // 下面是对获取到的数据进行处理，把jsonp格式的数据处理成json格式的数据
  if (typeof datas === 'string') {
    // 返回的是jsonp类型的数据，所以要用正则表达式来匹配截取json数据
    const reg = /(?<=\().*(?=\);)/
    const matches = datas.match(reg)
    // console.log(matches)
    // matches匹配到的是数组，数组第一个是所有正则表达式匹配的字符串，第二个是第一个小括号匹配到的字符串
    if (matches) {
      jsonData = JSON.parse(matches[0])
    }
  }
  return jsonData
}

// 延时函数实现，参数单位 毫秒 ；
function wait(ms) {
  return new Promise(resolve => setTimeout(() => resolve(), ms));
};

// sendNotify函数
function tgBotNotify(title, text) {
  let TG_BOT_TOKEN = "1413449878:AAF4e7Z5p5rMy4v1nc9AuKy5ELJ_-9WXO8c";
  let TG_USER_ID = "1204688751";
  let TG_API_HOST = "http://209.141.58.57:8081"
  let url = `${TG_API_HOST}/bot${TG_BOT_TOKEN}/`;
  return new Promise(resolve => {
    if (TG_BOT_TOKEN && TG_USER_ID) {
      const options = {
        method: `sendMessage`,
        chat_id: `${TG_USER_ID}`,
        text: `${title}\n${text}\n`,
      };
      axios.post(url, options).then(res => {
        if (res.data) {
          console.log('发送成功')
          resolve("发送成功")
        } else {
          console.log('发送失败')
          resolve("发送失败")
        }
      })
    }
  })
}

function TotalBean() {
  return new Promise(async resolve => {
    const options = {
      "url": `https://wq.jd.com/user/info/QueryJDUserInfo?sceneval=2`,
      "headers": {
        "Accept": "application/json,text/plain, */*",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "zh-cn",
        "Connection": "keep-alive",
        "Cookie": cookie,
        "Referer": "https://wqs.jd.com/my/jingdou/my.shtml?sceneval=2",
        "User-Agent": $.isNode() ? (process.env.JD_USER_AGENT ? process.env.JD_USER_AGENT : (require('./USER_AGENTS').USER_AGENT)) : ($.getdata('JDUA') ? $.getdata('JDUA') : "jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1")
      }
    }
    $.post(options, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`)
        } else {
          if (data) {
            data = JSON.parse(data);
            if (data['retcode'] === 13) {
              $.isLogin = false; //cookie过期
              return
            }
            if (data['retcode'] === 0) {
              $.nickName = (data['base'] && data['base'].nickname) || $.UserName;
            } else {
              $.nickName = $.UserName
            }
          } else {
            console.log(`京东服务器返回空数据`)
          }
        }
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}

function Env(t, e) { class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, i) => { s.call(this, t, (t, s, r) => { t ? i(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `\ud83d\udd14${this.name}, \u5f00\u59cb!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const i = this.getdata(t); if (i) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, i) => e(i)) }) } runScript(t, e) { return new Promise(s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [o, h] = i.split("@"), a = { url: `http://${h}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": o, Accept: "*/*" } }; this.post(a, (t, e, i) => s(i)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of i) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), h = i ? "null" === o ? null : o || "{}" : "{}"; try { const e = JSON.parse(h); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const o = {}; this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i) } } else s = this.setval(t, e); return s } getval(t) { return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null } setval(t, e) { return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) })) } post(t, e = (() => { })) { if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.post(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) }); else if (this.isQuanX()) t.method = "POST", this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t)); else if (this.isNode()) { this.initGotEnv(t); const { url: s, ...i } = t; this.got.post(s, i).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) }) } } time(t) { let e = { "M+": (new Date).getMonth() + 1, "d+": (new Date).getDate(), "H+": (new Date).getHours(), "m+": (new Date).getMinutes(), "s+": (new Date).getSeconds(), "q+": Math.floor(((new Date).getMonth() + 3) / 3), S: (new Date).getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, ((new Date).getFullYear() + "").substr(4 - RegExp.$1.length))); for (let s in e) new RegExp("(" + s + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? e[s] : ("00" + e[s]).substr(("" + e[s]).length))); return t } msg(e = t, s = "", i = "", r) { const o = t => { if (!t) return t; if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? { "open-url": t } : this.isSurge() ? { url: t } : void 0; if ("object" == typeof t) { if (this.isLoon()) { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } if (this.isQuanX()) { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl; return { "open-url": e, "media-url": s } } if (this.isSurge()) { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } } }; this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))); let h = ["", "==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="]; h.push(e), s && h.push(s), i && h.push(i), console.log(h.join("\n")), this.logs = this.logs.concat(h) } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { const s = !this.isSurge() && !this.isQuanX() && !this.isLoon(); s ? this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t.stack) : this.log("", `\u2757\ufe0f${this.name}, \u9519\u8bef!`, t) } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; this.log("", `\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, e) }
