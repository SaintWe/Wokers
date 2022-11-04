# Zepp Life 自定义步数

在 Workers 中创建一个新的 Worker，将文件内容粘贴保存并修改账户配置

Workers 使用 UTC 时区，设置 Cron 触发器为 `5 16 * * *` 等于北京时间每天 0 点 5 分

## URL 拼接

```
#  curl 命令组成
curl -G "https://你的域名/?min_step=最小步数&max_step=最大步数" --data-urlencode "user=你的用户名" --data-urlencode "password=密码" 

# 其中   user   传参，为你的用户名，支持手机号和邮箱
# 其中 password 传参，为你的密码

# 示例：手机号
curl -G "https://api.abc.workers.dev/?min_step=16800&max_step=32800" --data-urlencode "user=13800000000" --data-urlencode "password=ABCDABCD12341234"

# 示例：邮箱
curl -G "https://api.abc.workers.dev/?min_step=16800&max_step=32800" --data-urlencode "user=qq@qq.com" --data-urlencode "password=ABCDABCD12341234"

# 浏览器直接访问示例，请注意对传参值的部分进行 URL Encode
https://api.abc.workers.dev/?min_step=16800&max_step=32800&user=13800000000&password=ABCDABCD12341234

https://api.abc.workers.dev/?min_step=16800&max_step=32800&user=qq%40qq.com&password=ABCDABCD12341234
```
