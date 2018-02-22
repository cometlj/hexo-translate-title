## hexo-translate-title
使用Google翻译，百度翻译和有道翻译将Hexo中的汉字标题转成英文标题，配置完成后直接翻译，无需手工修改标题内容

## 安装与使用

### 安装
```bash
npm install hexo-translate-title --save
```
### 使用

#### 1.配置hexo根项目下的`_config.yml`

```yml
translate_title:
  translate_way: google  # google,youdao,baidu_with_appid
  youdao_api_key: '' # Your youdao_api_key
  youdao_keyfrom: xxxx-blog # Your youdao_keyfrom
  is_need_proxy: false     # true | false
  proxy_url: http://localhost:50018 # Your proxy_url
  baidu_appid: '' # Your baidu_appid
  baidu_appkey: '' # Your baidu_appkey
```
**注意**：

> * 判断是否需要配置google本地代理，因为我在本地是开启时才能访问google翻译的，如果没有被墙，请将`_config.yml` 下的`is_need_proxy: true`改为false。如果设置为true,请设置本地代理地址
> * 目前google翻译，youdao翻译均可直接使用，百度翻译目前完成的为 **需要APP_ID的版本**，即需要在[百度翻译开放平台](http://api.fanyi.baidu.com/)，不需要APP_ID的版本目前正在努力研究，只差最后一步sign计算即可完成。
> * 如果担心百度翻译开发平台的APP_ID和APP_KEY有泄漏风险，建议在百度翻译开发平台-》管理控制台的服务器地址一栏，填写好服务器IP即可

#### 2.修改hexo根目录下的`_config.yml`

修改

> permalink: :year/:month:day/:translate_title.html

将`:title`修改为`:translate_title`即可，前面的路径也可按照自己的要求变更，例如 permalink: blog/:translate_title.html

## 改进之处
1. 使用了ES6的很多新特性，例如变量声明使用了const和let， 函数体使用async/await同步操作等
2. 原有百度翻译API发生变化，重写了百度翻译的翻译逻辑
3. 对于翻译的标题内容，去除标点符号，空格转换为横线连接，并剔除重复单词

## TODO

1. google 获取TKK的时候，是参照[这篇文章](http://blog.csdn.net/life169/article/details/52153929)里面的JS计算方式(谢谢作者！)，但是更换为初次获取`http://translate.google.cn/`TKK值，参与计算获取tk时会计算出错，原因待查中。
2. 百度翻译无APP_ID版本还未完成

## 翻译效果评估
google翻译 > baidu翻译 > 有道翻译

## DEMO
[星星之语's Blog](https://cometlj.github.io)

## License
MIT
