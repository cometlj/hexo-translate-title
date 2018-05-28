'use strict';

const front = require('hexo-front-matter');
const fs = require('hexo-fs');
// const request = require('request');
const rp = require('request-promise');
const qs = require('querystring');
const url = require('url');
const cheerio = require('cheerio');
const http = require('http');

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
let TKK = ((function () {
    var a = 561666268;
    var b = 1526272306;
    return 406398 + '.' + (a + b);
})());
//辅助函数：根据获取的TKK获取tk  ---2
let b = function (a, b) {
    for (var d = 0; d < b.length - 2; d += 3) {
        var c = b.charAt(d + 2),
            c = "a" <= c ? c.charCodeAt(0) - 87 : Number(c),
            c = "+" == b.charAt(d + 1) ? a >>> c : a << c;
        a = "+" == b.charAt(d) ? a + c & 4294967295 : a ^ c
    }
    return a;
}
//辅助函数：根据获取的TKK获取tk  ---3
let get_tk = function (a) {
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
let google_translation = async function (data, fromLanguage, toLanguage, is_need_proxy, proxy_url) {
    let tmpPost = front.parse(data.raw);
    let ori_translate_title = data.translate_title;//先保存原来的翻译标题
    data.translate_title = '';//初始化
    // console.log("原始data:"+postStr);
    let title = data.title;
    let encodedStr = encodeURI(title);
    let googleTransUrl = "https://translate.google.cn/translate_a/t?";
    googleTransUrl += "client=" + "t";
    googleTransUrl += "&sl=" + fromLanguage;// source   language
    googleTransUrl += "&tl=" + toLanguage;  // to       language
    googleTransUrl += "&hl=" + fromLanguage;
    googleTransUrl += "$dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&ie=UTF-8&oe=UTF-8&clearbtn=1&otf=1&pc=1&ssel=0&tsel=0&kc=2&v=1.0&source=is";
    googleTransUrl += "&tk=" + get_tk(title);
    googleTransUrl += "&q=" + encodedStr;
    let google_request_option_str = {
        method: 'GET',
        uri: googleTransUrl
    };
    if (is_need_proxy) {
        google_request_option_str = {
            method: 'GET',
            uri: googleTransUrl,
            proxy: proxy_url
        };
    }
    await rp(google_request_option_str).then(function (body) {
        if (body != null) {
            //去除标点符号，空格转换为横线连接
            let title_array = body.replace(/[\~|\`|\!|\@|\#|\$|\%|\^|\&|\*|\(|\)|\-|\_|\+|\=|\||\\|\[|\]|\{|\}|\;|\:|\"|\'|\,|\<|\.|\>|\/|\?]/g, "").replace(/\s/g, "-").split("-");
            let tmp_title_array = [];
            let final_title_str = '';
            //去除重复单词和空值，只保留一个
            for (var i = 0; i < title_array.length; i++) {
                let lowercase_title = title_array[i].toLowerCase();
                if (tmp_title_array.indexOf(lowercase_title) == -1 && lowercase_title!='') {
                    tmp_title_array.push(lowercase_title);
                }
            }
            final_title_str = tmp_title_array.join("-");
            // console.log(final_title_str);
            let temp_tanslate_title = final_title_str.replace(/\"/g, "").replace(/\"/g,"");
            data.translate_title = temp_tanslate_title;
            tmpPost.translate_title = temp_tanslate_title;
            if(ori_translate_title!=temp_tanslate_title){
                let postStr = front.stringify(tmpPost);
                postStr = '---\n' + postStr;
                fs.writeFileSync(data.full_source, postStr, 'utf-8');
                console.log("Google->Generate link %s for post [%s]", temp_tanslate_title, data.title);
            }else{
                data.translate_title = ori_translate_title;
            }
            return data;
        }
    }).catch(function (err) {
        console.error(err);
    });
};
//有道翻译
//样例：http://fanyi.youdao.com/openapi.do?keyfrom=evansliu-blog&key=230388660&type=data&doctype=<doctype>&version=1.1&q=要翻译的文本(需要urlencode)
let youdao_translation = async function (data, youdao_api_key, youdao_keyfrom) {
    let tmpPost = front.parse(data.raw);
    let ori_translate_title = data.translate_title;//先保存原来的翻译标题
    data.translate_title = '';//初始化
    let title = data.title;
    let encodedStr = encodeURI(title);
    let youdaoTransUrl = "http://fanyi.youdao.com/openapi.do?keyfrom=" + youdao_keyfrom;
    youdaoTransUrl += "&key=" + youdao_api_key;
    youdaoTransUrl += "&type=data&doctype=json&version=1.1&q=" + encodedStr;
    await rp(youdaoTransUrl).then(function (body) {
        if (body != null) {
            let json_str = JSON.parse(body);
            let temp_str = json_str.translation[0];
            // let title_array = temp_str.replace(/\s/g, "-").replace(/(.)\1+/gi, '$1').split("-");
            //去除标点符号，空格转换为横线连接
            let title_array = temp_str.replace(/[\~|\`|\!|\@|\#|\$|\%|\^|\&|\*|\(|\)|\-|\_|\+|\=|\||\\|\[|\]|\{|\}|\;|\:|\"|\'|\,|\<|\.|\>|\/|\?]/g, "").replace(/\s/g, "-").split("-");
            let tmp_title_array = [];
            let final_title_str = '';
            //去除重复单词和空值，只保留一个
            for (var i = 0; i < title_array.length; i++) {
                let lowercase_title = title_array[i].toLowerCase();
                if (tmp_title_array.indexOf(lowercase_title) == -1 && lowercase_title!='') {
                    tmp_title_array.push(lowercase_title);
                }
            }
            final_title_str = tmp_title_array.join("-");
            let temp_tanslate_title = final_title_str.replace(/\"/g, "").replace(/\"/g,"");
            data.translate_title = temp_tanslate_title;
            tmpPost.translate_title = temp_tanslate_title;
            if(ori_translate_title!=temp_tanslate_title){
                let postStr = front.stringify(tmpPost);
                postStr = '---\n' + postStr;
                fs.writeFileSync(data.full_source, postStr, 'utf-8');
                console.log("Youdao->Generate link %s for post [%s]", temp_tanslate_title, data.title);
            }else{
                data.translate_title = ori_translate_title;
            }
            return data;
        }
    }).catch(function (err) {
        console.error(err);
    });
};

//百度翻译-需要appid+appkey版，每月前200w字翻译免费，足够大家写博客使用
let baidu_translation_with_appid = async function (data,fromLanguage,toLanguage,appid,appkey){
    const lib_baidu_trans = require('./baidu_trans_md5.js');
    let salt = (new Date).getTime();
    let tmpPost = front.parse(data.raw);
    let ori_translate_title = data.translate_title;//先保存原来的翻译标题
    data.translate_title = '';//初始化
    let query_title = data.title;
    let encodedStr = encodeURI(query_title);
    // 多个query可以用\n连接  如 query='apple\norange\nbanana\npear'
    let str1 = appid + query_title + salt +appkey;
    let sign = lib_baidu_trans.baidu_trans_md5(str1);
    let baiduTransUrl = 'http://api.fanyi.baidu.com/api/trans/vip/translate';
    let json_data = {
        q: query_title,
        appid: appid,
        salt: salt,
        from: fromLanguage,
        to: toLanguage,
        sign: sign
    };
    let baiduTransOption = {
        method: 'GET',
        uri: baiduTransUrl,
        qs: json_data,
        json: true
    };
    await rp(baiduTransOption).then(function (body) {
        if (body != null) {
            let trans_title = body['trans_result'][0]['dst'];
            let trans_title_array = trans_title.toString().toLowerCase().split(" ");
            let final_title_str = trans_title_array.join("-");
            let temp_tanslate_title = final_title_str.replace(/\"/g, "").replace(/\"/g,"");
            data.translate_title = temp_tanslate_title;
            tmpPost.translate_title = temp_tanslate_title;
            if(ori_translate_title!=temp_tanslate_title){
                let postStr = front.stringify(tmpPost);
                postStr = '---\n' + postStr;
                fs.writeFileSync(data.full_source, postStr, 'utf-8');
                console.log("Baidu->Generate link %s for post [%s]", temp_tanslate_title, data.title);
            }else{
                data.translate_title = ori_translate_title;
            }
            return data;
        }
    }).catch(function (err) {
        console.error(err);
    });
}

//百度翻译-无需appid版本，已完成Cookie+token为固定值版本，Cookie动态获取尚不知如何获取
//接口地址：http://fanyi.baidu.com/v2transapi
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
let baidu_translation_no_appid = async function (data, fromLanguage, toLanguage) {
    var baidu_decode = require('./sign.js');
    let tmpPost = front.parse(data.raw);
    let ori_translate_title = data.translate_title;//先保存原来的翻译标题
    data.translate_title = '';//初始化，否则在生成html文件时，会调用之前的翻译内容，原因未知
    let title = data.title;
    let baiduTransUrl = "https://fanyi.baidu.com/v2transapi";
    let baiduFanyiUrl = "http://fanyi.baidu.com";
    let final_token = '';//初始化token
    let final_gtk = '';//初始化GTK值
    let final_baiduid = '';
    // let gtk_val = '320305.131321201';
    let final_sign = '';
    let cookie_max_age = 0;
    //首先get方式加载一次百度翻译页面，正则获取token值、gtk值和cookie中的BAIDUID
    var token_options = {
        uri: baiduFanyiUrl,
        resolveWithFullResponse: true,//header和body全部返回值
    };
    await rp(token_options).then(function (response) {
        if (response && response.statusCode == 200) {
            let $ = cheerio.load(response.body);
            let script_html = $('body>script').text();
            let token_array = script_html.match(/token: '([^\"]*)\',/);
            let token_str = token_array[0].split(",")[0];
            final_token = token_str.replace("token: '", "").replace("'", "");
            // console.log('final_token===>', final_token);
            let gtk_array = script_html.match(/window.gtk = '([^\"]*)\';/);
            let gtk_str = gtk_array[0].split(",")[0];
            final_gtk = gtk_str.replace("window.gtk = '","").replace("';","");
            // console.log('final_gtk==>',final_gtk);
            let temp_baiduid_str = response.headers['set-cookie'][1];
            let temp_baiduid_str2 = temp_baiduid_str.match(/BAIDUID=[^\s]*/);
            final_baiduid = temp_baiduid_str2[0].replace("BAIDUID=","");
            // console.log('final_baiduid===>',final_baiduid);
            let cookie_max_age_str = temp_baiduid_str.match(/max-age=[^\s]*/);
            cookie_max_age = cookie_max_age_str[0].replace("max-age=","").replace(";","");
            // console.log('cookie_max_age===>',cookie_max_age);
            final_sign = baidu_decode.get_baidu_hash(title, final_gtk);
            // console.log('final_sign===>',final_sign);
        }
    }).catch(function (err) {
        console.log('get token error==>', err);
    });
    //封装post数据
    let postData = {
        from: fromLanguage,
        to: toLanguage,
        query: title,
        transtype: 'realtime',
        simple_means_flag: 3,
        sign: final_sign,
        // token: final_token
        token:'6902b9e28a39a2f4ea72c65f0724a170'
    };
    let postHeaders = {
        'Cookie':'locale=zh; BAIDUID=092A5CA5950212EA685F7754D334A3F4:FG=1; REALTIME_TRANS_SWITCH=1; FANYI_WORD_SWITCH=1; HISTORY_SWITCH=1; SOUND_SPD_SWITCH=1; SOUND_PREFER_SWITCH=1; Hm_lvt_64ecd82404c51e03dc91cb9e8c025574=1526543144; Hm_lpvt_64ecd82404c51e03dc91cb9e8c025574=1526543145; from_lang_often=%5B%7B%22value%22%3A%22en%22%2C%22text%22%3A%22%u82F1%u8BED%22%7D%2C%7B%22value%22%3A%22zh%22%2C%22text%22%3A%22%u4E2D%u6587%22%7D%5D; to_lang_often=%5B%7B%22value%22%3A%22zh%22%2C%22text%22%3A%22%u4E2D%u6587%22%7D%2C%7B%22value%22%3A%22en%22%2C%22text%22%3A%22%u82F1%u8BED%22%7D%5D',
        'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.101 Safari/537.36 QQBrowser/4.3.4986.400',
    };
    let options = {
        method: 'POST',
        uri: baiduTransUrl,
        headers: postHeaders,
        form: postData,
        json:true
    };
    // console.log('options==>', options);
    // return false;
    await rp(options).then(function (response) {
        if (response&&response.trans_result.status==0) {
            let trans_title = response.trans_result.data[0].dst;
            let trans_title_array = trans_title.toString().toLowerCase().split(" ");
            let final_title_str = trans_title_array.join("-");
            let temp_tanslate_title = final_title_str.replace(/\"/g, "").replace(/\"/g,"");
            if(ori_translate_title!=temp_tanslate_title){
                data.translate_title = temp_tanslate_title;
                tmpPost.translate_title = temp_tanslate_title;
                let postStr = front.stringify(tmpPost);
                postStr = '---\n' + postStr;
                fs.writeFileSync(data.full_source, postStr, 'utf-8');
                console.log("Baidu->Generate link %s for post [%s]", temp_tanslate_title, data.title);
            }else{
                data.translate_title = ori_translate_title;
            }
            return data;
        }
    }).catch(function (err) {
        console.log('post error===>',err);
        // POST failed...
    });
    //错误代码：997，没有cookie； 998，cookie 过期；999，内部错误。
};

exports.google_translation = google_translation;
exports.youdao_translation = youdao_translation;
exports.baidu_translation_no_appid = baidu_translation_no_appid;
exports.baidu_translation_with_appid = baidu_translation_with_appid;