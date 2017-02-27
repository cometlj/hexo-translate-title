'use strict';


var hexo = hexo || {};
var config = hexo.config;
var util = require('./lib/util.js');

hexo.extend.filter.register('before_post_render', function(data){
  if (!config.translate_title || !config.url || data.layout !== 'post') {
    return data;
  }
  let translate_way = config.translate_title.translate_way;
  if(translate_way=='google')
  {
      util.google_translation(data,'zh-CN','en');
  }
  else if(translate_way=='youdao')
  {
      let youdao_api_key = config.translate_title.youdao_api_key;
      let youdao_keyfrom = config.translate_title.youdao_keyfrom;
      util.youdao_translation(data,youdao_api_key,youdao_keyfrom);
  }
  else if(translate_way=='baidu')
  {
      util.baidu_translation(data,'zh','en');
  }
  return data;
});
