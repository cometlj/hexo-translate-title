'use strict';

var front = require('hexo-front-matter');
var fs = require('hexo-fs');
var request = require('request');
var qs = require('querystring');
var url = require('url');

//辅助函数：首次获取google翻译页面的TTK -- 此方法有问题，待完善，暂时选用固定值方法
// let initial_google_get_ttk =((function(){
//   let final_tkk = null;
//   let initial_google_trans_url = "http://translate.google.cn";
//   request.get({
//                  'url':initial_google_trans_url
//                 ,'proxy':'http://localhost:8123'
//                 ,'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.75 Safari/537.36 QQBrowser/4.1.4132.400'
//               },function(error,response,body){
//                 if(error){
//                   console.log(error);
//                 }
//                 if(response && response.statusCode==200){
//                   var myRegexp = /TKK=eval.*var a\\x3d(.*);var b\\x3d(.*);return ([0-9]+)\+/g;
//                   var match = body.match(myRegexp);
//                   let tkk_param1 = RegExp.$3;
//                   let tkk_param2 = RegExp.$1+RegExp.$2;
//                   final_tkk = tkk_param1+"."+tkk_param2;
//                   console.log(final_tkk);
//                   return final_tkk;
//                 }
//             });
// })());
//辅助函数：固定值获取TKK  ---1
let TKK = ((function() {
  var a = 561666268;
  var b = 1526272306;
  return 406398 + '.' + (a + b);
})());
//辅助函数：根据获取的TKK获取tk  ---2
let b = function(a, b) {
  for (var d = 0; d < b.length - 2; d += 3) {
      var c = b.charAt(d + 2),
          c = "a" <= c ? c.charCodeAt(0) - 87 : Number(c),
          c = "+" == b.charAt(d + 1) ? a >>> c : a << c;
      a = "+" == b.charAt(d) ? a + c & 4294967295 : a ^ c
  }
  return a;
}
//辅助函数：根据获取的TKK获取tk  ---3
let get_tk = function(a) {
    for (var e = TKK.split("."), h = Number(e[0]) || 0, g = [], d = 0, f = 0; f < a.length; f++) {
        var c = a.charCodeAt(f);
        128 > c ? g[d++] = c : (2048 > c ? g[d++] = c >> 6 | 192 : (55296 == (c & 64512) && f + 1 < a.length && 56320 == (a.charCodeAt(f + 1) & 64512) ? (c = 65536 + ((c & 1023) << 10) + (a.charCodeAt(++f) & 1023), g[d++] = c >> 18 | 240, g[d++] = c >> 12 & 63 | 128) : g[d++] = c >> 12 | 224, g[d++] = c >> 6 & 63 | 128), g[d++] = c & 63 | 128)
    }
    a = h;
    for (d = 0; d < g.length; d++) a += g[d], a = b(a, "+-a^+6");
    a = b(a, "+-3^+b+-f");
    a ^= Number(e[1]) || 0;
    0 > a && (a = (a & 2147483647) + 2147483648);
    a %= 1E6;
    return a.toString() + "." + (a ^ h);
}
//样例 http://translate.google.cn/translate_a/t?client=t&sl=zh-CN&tl=en&hl=zh-CN&v=1.0&source=is&tk=244803.389825&q=%E5%A4%A9%E6%B0%94%E5%BE%88%E5%A5%BD
//Google翻译
let google_translation = function(data,fromLanguage,toLanguage,is_need_proxy,proxy_url){
  let tmpPost = front.parse(data.raw);
  // console.log("原始data:"+postStr);
  let title = data.title;
  let encodedStr = encodeURI(title);
  let googleTransUrl = "http://translate.google.cn/translate_a/t?";
  googleTransUrl  += "client=" + "t";
  googleTransUrl += "&sl=" + fromLanguage;// source   language
  googleTransUrl += "&tl=" + toLanguage;  // to       language
  googleTransUrl += "&hl=" + fromLanguage;
  googleTransUrl += "$dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&ie=UTF-8&oe=UTF-8&clearbtn=1&otf=1&pc=1&ssel=0&tsel=0&kc=2&v=1.0&source=is";
  googleTransUrl += "&tk="+get_tk(title);
  googleTransUrl += "&q=" + encodedStr;
  // console.log("google_translation_over====>"+googleTransUrl);
  let google_request_option_str = {
    url:googleTransUrl
  };
  if(is_need_proxy)
  {
    google_request_option_str = {
       url:googleTransUrl
      ,proxy:proxy_url
    };
  }
  request.get(google_request_option_str,function(error,response,body){
                if(error){
                  console.error(error);
                }
                if(response && response.statusCode==200){
                    request.get(google_request_option_str,function(error,response,body){
                      //去除重复，转换为横线连接
                      let title_array = body.replace(/\s/g,"-").replace(/(.)\1+/gi,'$1').split("-");
                      let tmp_title_array = [];
                      let final_title_str = '';
                      for(var i=0;i<title_array.length;i++)
                      {
                          tmp_title_array.push(title_array[i].toLowerCase());
                      }
                      final_title_str = tmp_title_array.join("-");
                      // console.log(final_title_str);
                      tmpPost.permalink = final_title_str.replace(/\"/g,"");
                      let postStr = front.stringify(tmpPost);
                      postStr = '---\n' + postStr;
                      fs.writeFileSync(data.full_source, postStr, 'utf-8');
                      //console.log("Generate link %s for post [%s]", final_title_str, data.title);
                    });
                }
            });
};
//有道翻译
//样例：http://fanyi.youdao.com/openapi.do?keyfrom=evansliu-blog&key=230388660&type=data&doctype=<doctype>&version=1.1&q=要翻译的文本(需要urlencode)
let youdao_translation = function(data,youdao_api_key,youdao_keyfrom){
  let tmpPost = front.parse(data.raw);
  let title = data.title;
  let encodedStr = encodeURI(title);
  let youdaoTransUrl = "http://fanyi.youdao.com/openapi.do?keyfrom="+youdao_keyfrom;
  youdaoTransUrl += "&key="+youdao_api_key;
  youdaoTransUrl += "&type=data&doctype=json&version=1.1&q="+encodedStr;
  // console.log(youdaoTransUrl);
  request.get({
               'url':youdaoTransUrl
              //,'proxy':'http://localhost:8123'
              ,'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.75 Safari/537.36 QQBrowser/4.1.4132.400'
            },function(error,response,body){
              if(error){
                console.log(error);
              }
              if(response && response.statusCode==200){
                  let json_str = JSON.parse(body);
                  let temp_str =json_str.translation[0];
                  let title_array = temp_str.replace(/\s/g,"-").replace(/(.)\1+/gi,'$1').split("-");
                  let tmp_title_array = [];
                  let final_title_str = '';
                  for(var i=0;i<title_array.length;i++)
                  {
                      tmp_title_array.push(title_array[i].toLowerCase());
                  }
                  final_title_str = tmp_title_array.join("-");
                  // console.log(final_title_str);
                  tmpPost.permalink = final_title_str;
                  let postStr = front.stringify(tmpPost);
                  postStr = '---\n' + postStr;
                  fs.writeFileSync(data.full_source, postStr, 'utf-8');
                  // console.log("Generate link %s for post [%s]", final_title_str, data.title);
              }
          });
};

//百度翻译
//样例：http://fanyi.baidu.com/v2transapi?from=zh&query=%E7%94%A8%E8%BD%A6%E8%B5%84%E8%AE%AF&to=en
/**
'auto' => '自动检测',
'ara' => '阿拉伯语',
'de' => '德语',
'ru' => '俄语',
'fra' => '法语',
'kor' => '韩语',
'nl' => '荷兰语',
'pt' => '葡萄牙语',
'jp' => '日语',
'th' => '泰语',
'wyw' => '文言文',
'spa' => '西班牙语',
'el' => '希腊语',
'it' => '意大利语',
'en' => '英语',
'yue' => '粤语',
'zh' => '中文'
**/
let baidu_translation = function(data,fromLanguage,toLanguage){
  let tmpPost = front.parse(data.raw);
  let title = data.title;
  let encodedStr = encodeURI(title);
  let baiduTransUrl = "http://fanyi.baidu.com/v2transapi?from="+fromLanguage+"&query="+encodedStr+"&to="+toLanguage;
  // console.log(baiduTransUrl);
  request.get({
               'url':baiduTransUrl
              //,'proxy':'http://localhost:8123'
              ,'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.75 Safari/537.36 QQBrowser/4.1.4132.400'
            },function(error,response,body){
              if(error){
                console.log(error);
              }
              if(response && response.statusCode==200){
                  let json_str = JSON.parse(body);
                  let title_array = json_str.trans_result.data[0].dst.replace(/\s/g,"-").replace(/(.)\1+/gi,'$1').split("-");
                  let tmp_title_array = [];
                  let final_title_str = '';
                  for(var i=0;i<title_array.length;i++)
                  {
                      tmp_title_array.push(title_array[i].toLowerCase());
                  }
                  final_title_str = tmp_title_array.join("-");
                  // console.log(final_title_str);
                  tmpPost.permalink = final_title_str;
                  let postStr = front.stringify(tmpPost);
                  postStr = '---\n' + postStr;
                  fs.writeFileSync(data.full_source, postStr, 'utf-8');
                  //console.log("Generate link %s for post [%s]", final_title_str, data.title);
              }
          });
};

exports.google_translation = google_translation;
exports.youdao_translation = youdao_translation;
exports.baidu_translation = baidu_translation;