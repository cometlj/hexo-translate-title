## hexo-translate-title
使用Google翻译，百度翻译和有道翻译将Hexo中的汉字标题转成英文标题

## 安装与使用

### 安装
```bash
npm install hexo-translate-title --save
```
### 使用
配置hexo项目下的`_config.yml`

```yml
translate_title:
  translate_way: google    #google | baidu | youdao
  youdao_api_key: XXX
  youdao_keyfrom: XXX
  is_need_proxy: true     #true | false
  proxy_url: http://localhost:8123
```
**注意**：判断是否需要配置google本地代理，因为我在本地是开启时才能访问google翻译的，如果没有被墙，请将`_config.yml` 下的`is_need_proxy: true`改为false。如果设置为true,请设置本地代理地址

## TODO

+ google 获取TKK的时候，是参照[这篇文章](http://blog.csdn.net/life169/article/details/52153929)里面的JS计算方式(谢谢作者！)，但是更换为初次获取`http://translate.google.cn/`TKK值，参与计算获取tk时会计算出错，原因待查中。
+ 有道翻译按照官网提供的API，调用时候出现如下报错，故目前可认为不可用，等待查明原因后修改

```bash
{ Error: connect ETIMEDOUT 123.58.182.241:80
    at Object.exports._errnoException (util.js:1022:11)
    at exports._exceptionWithHostPort (util.js:1045:20)
    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1087:14)
  code: 'ETIMEDOUT',
  errno: 'ETIMEDOUT',
  syscall: 'connect',
  address: '123.58.182.241',
  port: 80 }
```
`123.58.182.241` 是网易有道翻译的服务器，不知道为何会超时，有明白的朋友请告知，谢谢~

## 翻译效果评估
google翻译 > baidu翻译 > ~~有道翻译~~

## DEMO
[星星之语's Blog](https://cometlj.github.io)

## License
MIT
