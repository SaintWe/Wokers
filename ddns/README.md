
# DDNS API

通过直接访问或 curl 等实现更新 DDNS，无需在本地进行复杂配置。 

1. 在 Workers 中创建一个新的 Worker，将文件内容粘贴进去保存
2. 进入上面创建的 Worker 管理页面 -> 设置，添加环境变量，名称为 **API_TOKEN**，值为你自己生成的一个字符串「大小写字母+数字」，建议复杂一点
3. 接下按你使用的服务进行设置

### 如果你使用腾讯云 (DNSPOD)

- 在 [DNSPod 密钥](https://console.dnspod.cn/account/token/token)，创建一个密钥，记录下 ID 和 Token
- 在 Worker 的环境变量中设置以下
- **DNSPOD_ID** 为 上面的 ID
- **DNSPOD_TOKEN** 为 上面的 Token

### 如果你使用阿里云 (ALIYUN)

- 阿里云的密钥创建较为复杂，涉及 RAM 角色创建，您自行查找相关教程
- 在阿里云的密钥管理创建一个密钥，需给予 **云解析 DNS 的 full 授权**，记录下 Access Key ID 和 Access Key Secret
- 在 Worker 的环境变量中设置以下
- **ALIYUN_ID** 为 上面的 Access Key ID
- **ALIYUN_SECRET** 为 上面的 Access Key Secret

## URL 拼接

```
#  curl 命令组成
curl -G "https://你的域名/updatedns?token=你的API_TOKEN" --data-urlencode "provider=服务提供商" --data-urlencode "domain=你的根域名" --data-urlencode "type=解析类型" --data-urlencode "host=主机记录" --data-urlencode "value=记录值"

# 其中 provider 传参，为服务提供商，目前仅 ALIYUN、DNSPOD 两个可选，需全大写
# 其中 value    传参，用于指定解析值，可不填，会默认使用你的出口 IP 作为值，可在本地查询后拼接进入，具体看示例
# 示例中的 https://api-ipv4.ip.sb/ip 等地址为本机 IP 获取接口，如不能使用可自行更换其他

# 示例：在本地查询本机 IP 然后指定为解析值，解析 IPv4
curl -G "https://ip.abc.workers.dev/updatedns?token=cd0a499974a141ba824b7efc0df6762e" --data-urlencode "provider=DNSPOD" --data-urlencode "domain=you_domain.com" --data-urlencode "type=A" --data-urlencode "host=synology_ddns" --data-urlencode "value=$(curl https://api-ipv4.ip.sb/ip)"

# 示例：在本地查询本机 IP 然后指定为解析值，解析 IPv6
curl -G "https://ip.abc.workers.dev/updatedns?token=cd0a499974a141ba824b7efc0df6762e" --data-urlencode "provider=DNSPOD" --data-urlencode "domain=you_domain.com" --data-urlencode "type=AAAA" --data-urlencode "host=synology_ddns" --data-urlencode "value=$(curl https://api-ipv6.ip.sb/ip)"

# 示例：curl 使用 -4 参数指定使用本地网络 IPv4 的出口 IP，解析 IPv4
curl -4 -G "https://ip.abc.workers.dev/updatedns?token=cd0a499974a141ba824b7efc0df6762e" --data-urlencode "provider=DNSPOD" --data-urlencode "domain=you_domain.com" --data-urlencode "type=A" --data-urlencode "host=synology_ddns"

# 示例：curl 使用 -6 参数指定使用本地网络 IPv6 的出口 IP，解析 IPv6
# 注意：Cloudflare 的 IPv6 大部分被墙无法访问，该示例可能无法使用
curl -6 -G "https://ip.abc.workers.dev/updatedns?token=cd0a499974a141ba824b7efc0df6762e" --data-urlencode "provider=DNSPOD" --data-urlencode "domain=you_domain.com" --data-urlencode "type=AAAA" --data-urlencode "host=synology_ddns"

# 浏览器直接访问示例，请注意对传参值的部分进行 URL Encode
https://ip.abc.workers.dev/updatedns?token=cd0a499974a141ba824b7efc0df6762e&provider=DNSPOD&domain=you_domain.com&type=AAAA&host=synology_ddns
```

## 群晖

[推荐] 方案一：按上面方法得到 curl 命令，在 **控制面板 -> 任务计划** 中添加一个计划的任务 -> 用户定义的脚本，运行命令中填写该命令，配置好其他内容然后保存即可

---

方案二：使用群晖自带的 DDNS 解析，添加一个自定义服务商，Query URL 按下方示例替换你的信息和域名然后保存，之后选择新建的服务商，主机名称对应主机记录，用户名随意，密码密钥对应 API_TOKEN

> 该方案仅可 IPv4，因群晖的自定义服务商不支持 IPv6 解析

```
方案二示例：腾讯云 + IPv4
https://ip.abc.workers.dev/updatedns?user=__USERNAME__&token=__PASSWORD__&provider=DNSPOD&domain=you_domain.com&type=A&host=__HOSTNAME__&value=__MYIP__

# 请注意其中的根域名和服务提供商是需要填写的，解析类型只能 A 记录

方案二示例：阿里云 + IPv4
https://ip.abc.workers.dev/updatedns?user=__USERNAME__&token=__PASSWORD__&provider=ALIYUN&domain=you_domain.com&type=A&host=__HOSTNAME__&value=__MYIP__
```

## 感谢

感谢 [ip.sb](https://ip.sb) 提供的 IP 获取服务
