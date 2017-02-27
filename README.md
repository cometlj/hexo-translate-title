## hexo-translate-title
使用Google翻译，百度翻译和有道翻译将Hexo中的汉字标题转成英文标题

## 安装与使用

### 安装
```bash
npm install hexo-translate-title --save
```
### 使用
配置hexo项目下的`_config.yml`

> translate_title:
>  	translate_way: google    #google | baidu | youdao
>  	youdao_api_key: XXX
>  	youdao_keyfrom: XXX

## TODO
1. google 获取TKK的时候，是参照[这篇文章](http://blog.csdn.net/life169/article/details/52153929)里面的JS计算方式(谢谢作者！)，但是更换为初次获取`http://translate.google.cn/`则会报错，不知道什么原因。

## 翻译效果评估
google翻译 > baidu翻译 > 有道翻译

## DEMO
[星星之光's Blog](https://cometlj.github.io)

## License
MIT
