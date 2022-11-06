/**
# DDNS API

通过直接访问或 curl 等实现更新 DDNS，无需在本地进行复杂配置。 

1. 在 Workers 中创建一个新的 Worker，将文件内容粘贴进去保存
2. 进入上面创建的 Worker 管理页面 -> 设置，添加环境变量，名称为 **API_TOKEN**，值为你自己生成的一个字符串「大小写字母+数字」，建议复杂一点
3. 接下按你使用的服务进行设置

### 如果你使用腾讯云 (DNSPOD)

服务提供商设置为：**DNSPOD**

- 在 [DNSPod 密钥](https://console.dnspod.cn/account/token/token)，创建一个密钥，记录下 ID 和 Token
- 在 Worker 的环境变量中设置以下
- **DNSPOD_ID** 为 上面的 ID
- **DNSPOD_TOKEN** 为 上面的 Token

### 如果你使用阿里云 (ALIYUN)

服务提供商设置为：**ALIYUN**

- 阿里云的密钥创建较为复杂，涉及 RAM 角色创建，您自行查找相关教程
- 在阿里云的密钥管理创建一个密钥，需给予 **云解析 DNS 的 full 授权**，记录下 Access Key ID 和 Access Key Secret
- 在 Worker 的环境变量中设置以下
- **ALIYUN_ID** 为 上面的 Access Key ID
- **ALIYUN_SECRET** 为 上面的 Access Key Secret

### 如果你使用 CloudFlare (CLOUDFLARE)

服务提供商设置为：**CLOUDFLARE**

- 在 <https://dash.cloudflare.com/profile/api-tokens>，创建一个 API 令牌（API Token）
- 选择 编辑区域 DNS（Edit zone DNS），权限选择 **编辑**，其他自行选择
- 记录下 Token
- 在 Worker 的环境变量中设置以下
- **CLOUDFLARE_TOKEN** 为 上面的 Token

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
 */

/**
 * @param {Request} request
 *
 * @returns {Promise<Response>}
 */
 async function handleRequest(request) {
    const { pathname, searchParams } = new URL(request.url);
    const IP = request.headers.get('cf-connecting-ip');
    if (pathname.startsWith('/updatedns')) {
        if (typeof API_TOKEN === 'undefined') {
            return new Response('API_TOKEN 未设置.');
        }
        if (searchParams.get('token') === null || searchParams.get('token') != API_TOKEN) {
            return new Response('token 验证失败.');
        }
        const HOST = searchParams.get('host');
        const TYPE = searchParams.get('type');
        const VALUE = searchParams.get('value') ?? IP;
        const DOMAIN = searchParams.get('domain');
        if (HOST === null || TYPE === null || DOMAIN === null || VALUE === '') {
            return new Response('host 或 type 或 domain 或 value 未填写完整.');
        }
        switch (searchParams.get('provider')) {
            case 'DNSPOD':
                if (typeof DNSPOD_ID === 'undefined' || typeof DNSPOD_TOKEN === 'undefined') {
                    return new Response('DNSPOD ID & TOKEN 未填写完整.');
                }
                var Action = new DnsPod(DNSPOD_ID, DNSPOD_TOKEN);
                break;
            case 'ALIYUN':
                if (typeof ALIYUN_ID === 'undefined' || typeof ALIYUN_SECRET === 'undefined') {
                    return new Response('ALIYUN ID & SECRET 未填写完整.');
                }
                var Action = new AliyunDNS(ALIYUN_ID, ALIYUN_SECRET);
                break;
            case 'CLOUDFLARE':
                if (typeof CLOUDFLARE_TOKEN === 'undefined') {
                    return new Response('CLOUDFLARE_TOKEN 未填写完整.');
                }
                var Action = new CloudFlareDNS(CLOUDFLARE_TOKEN);
                break;
            default:
                return new Response('provider 的值非法.');
        }
        return new Response(
            await Action.CheckUpdateRecord(
                DOMAIN, HOST, TYPE, VALUE
            )
        );
    }
    return new Response(
        IP
    );
}

class CloudFlareDNS {
    /**
     * API 地址
     *
     * @var {string}
     */
    #url = 'https://api.cloudflare.com/client/v4/';

    /**
     * 公共参数
     *
     * @var {object}
     */
    #public;

    /**
     * header
     *
     * @var {object}
     */
    #header = {
        UserAgent: 'Cloudflare Workers DDNS Client/1.0.0',
        'Content-Type': 'application/json',
    };

    /**
     * @param {string} Authorization 
     */
    constructor(Authorization) {
        this.#header.Authorization = 'Bearer ' + Authorization;
    }

    /**
     * 检查或更新解析记录
     * 
     * @param {string} domain    域名
     * @param {string} host      主机名
     * @param {string} type      解析类型
     * @param {string} value     记录值
     */
    async CheckUpdateRecord(domain, host, type, value) {
        this.#public = {
            domain: domain,
        };
        let getCFZoneId = await this.getCFZoneId();
        if (getCFZoneId.ok === false) {
            return getCFZoneId.msg;
        }
        const sub_domain = host + '.' + domain;
        let record = await this.SearchDomainRecords(
            sub_domain,
            type,
        );
        if (record.ok === false) {
            return record.msg;
        }
        if (record.data.content == value) {
            return '记录无需更新';
        }
        let result = await this.UpdateDomainRecord(
            record.data,
            value,
        );
        return result.ok ? '记录更新成功，值为：' + value : result.msg;
    }

    /**
     * 获取 Zone ID
     */
    async getCFZoneId() {
        return await fetch(
            this.#url + 'zones?status=active&name=' + this.#public.domain,
            {
                method: 'GET',
                headers: this.#header,
            }
        ).then(
            response => {
                if (response.ok === false) {
                    return Promise.reject('获取 ZoneId 失败，CLOUDFLARE_TOKEN 可能不正确');
                }
                return response.json();
            }
        ).then(
            response => {
                if (response.success === false) {
                    return Promise.reject('获取 ZoneId 失败，CLOUDFLARE_TOKEN 可能不正确');
                }
                if (response.result_info.total_count === 0 || response.result[0].name != this.#public.domain) {
                    return Promise.reject('获取 ZoneId 失败，未找到 ' + this.#public.domain + ' 或其还未生效');
                }
                this.#public.zone_id = response.result[0].id;
                return {
                    ok: true,
                    msg: 'success',
                };
            }
        ).catch(
            error => {
                return {
                    ok: false,
                    msg: error,
                };
            }
        );
    }

    /**
     * 获取主域名的所有解析记录列表
     * 
     * @param {string} name 
     * @param {string} type 
     */
    async SearchDomainRecords(name, type = 'A') {
        const queryParams = new URLSearchParams({
            name: name,
            type: type,
        });
        return await fetch(
            this.#url + 'zones/' + this.#public.zone_id + '/dns_records?' + queryParams.toString(),
            {
                method: 'GET',
                headers: this.#header,
            }
        ).then(
            response => {
                if (response.ok === false) {
                    return Promise.reject('获取解析记录失败，CLOUDFLARE_TOKEN 可能不正确');
                }
                return response.json();
            }
        ).then(
            response => {
                if (response.success === false) {
                    return Promise.reject('获取解析记录失败，CLOUDFLARE_TOKEN 可能不正确');
                }
                if (response.result_info.total_count === 0 || response.result[0].name != name) {
                    return Promise.reject('获取解析记录失败，未找到 ' + name + ' 的解析记录，请先手动添加');
                }
                return {
                    ok: true,
                    msg: 'success',
                    data: response.result[0],
                };
            }
        ).catch(
            error => {
                return {
                    ok: false,
                    msg: error,
                };
            }
        );
    }

    /**
     * 根据传入参数修改解析记录
     * 
     * @param {object} record
     * @param {string} content
     */
    async UpdateDomainRecord(record, content) {
        return await fetch(
            this.#url + 'zones/' + this.#public.zone_id + '/dns_records/' + record.id,
            {
                method: 'PUT',
                headers: this.#header,
                body: JSON.stringify({
                    name: record.name,
                    content: content,
                    type: record.type,
                    ttl: record.ttl,
                })
            }
        ).then(
            response => {
                if (response.ok === false) {
                    return Promise.reject('更新解析记录失败，CLOUDFLARE_TOKEN 可能不正确');
                }
                return response.text();
            }
        ).then(
            response => {
                if (response.success === false) {
                    return Promise.reject('更新解析记录失败，CLOUDFLARE_TOKEN 可能不正确');
                }
                return {
                    ok: true,
                    msg: 'success',
                };
            }
        ).catch(
            error => {
                return {
                    ok: false,
                    msg: error,
                };
            }
        );
    }
}

class DnsPod {
    /**
     * API 地址
     *
     * @var {string}
     */
    #url = 'https://dnsapi.cn/';

    /**
     * 公共参数
     *
     * @var {object}
     */
    #public;

    /**
     * header
     *
     * @var {object}
     */
    #header = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'UserAgent': 'Cloudflare Workers DDNS Client/1.0.0'
    };

    /**
     * @param {string} ID
     * @param {string} TOKEN
     */
    constructor(ID, TOKEN) {
        this.#public = {
            format: 'json',
            lang: 'cn',
            login_token: ID + ',' + TOKEN,
        };
    }

    /**
     * 检查或更新解析记录
     *
     * @param {string} domain       根域名
     * @param {string} sub_domain   主机记录
     * @param {string} record_type  记录类型
     * @param {string} value        记录值
     */
    async CheckUpdateRecord(domain, sub_domain, record_type, value) {
        let record = await this.SearchDomainRecords(
            domain,
            {
                sub_domain: sub_domain,
                record_type: record_type,
            }
        );
        if (record.ok === false) {
            return record.msg;
        }
        if (record.data.value == value) {
            return '记录无需更新';
        }
        let result = await this.UpdateDomainRecord(
            domain,
            record.data.id,
            record.data.name,
            record.data.type,
            value,
            {
                record_line_id: record.data.line_id
            }
        );
        return result.ok ? '记录更新成功，值为：' + value : result.msg;
    }

    /**
     * 获取主域名的所有解析记录列表
     *
     * @param {string} domain    根域名
     * @param {object} params    其他参数：https://docs.dnspod.cn/api/5f562ae4e75cf42d25bf689e/
     */
    async SearchDomainRecords(domain, params = {}) {
        return await fetch(
            this.#url + 'Record.List',
            {
                method: 'POST',
                headers: this.#header,
                body: xWwwFormBody(
                    Object.assign(
                        params,
                        {
                            domain: domain,
                        },
                        this.#public
                    )
                ),
            }
        ).then(
            response => {
                if (response.ok === false) {
                    return Promise.reject('获取解析记录失败，遇到了一点问题，请检查 ID & TOKEN');
                }
                return response.json()
            }
        ).then(
            response => {
                if (response.status.code !== '1') {
                    return Promise.reject(response.status.message);
                }
                if (response.info.record_total === '0' || response.records[0].name != sub_domain || response.records[0].type != record_type) {
                    return Promise.reject('没有获取到对应的记录，请先手动添加');
                }
                return {
                    ok: true,
                    msg: 'success',
                    data: response.records[0],
                };
            }
        ).catch(
            error => {
                return {
                    ok: false,
                    msg: error,
                };
            }
        );
    }

    /**
     * 根据传入参数修改解析记录
     *
     * @param {string} domain       域名
     * @param {string} record_id    解析记录的ID
     * @param {string} sub_domain   主机记录
     * @param {string} record_type  解析记录类型
     * @param {string} value        记录值
     * @param {object} params       其他参数：https://docs.dnspod.cn/api/5f562a49e75cf42d25bf6872/
     */
    async UpdateDomainRecord(domain, record_id, sub_domain, record_type, value, params = { record_line_id: '0' }) {
        return await fetch(
            this.#url + 'Record.Modify',
            {
                method: 'POST',
                headers: this.#header,
                body: xWwwFormBody(
                    Object.assign(
                        params,
                        {
                            domain: domain,
                            record_id: record_id,
                            sub_domain: sub_domain,
                            record_type: record_type,
                            value: value,
                        },
                        this.#public
                    )
                ),
            }
        ).then(
            response => {
                if (response.ok === false) {
                    return Promise.reject('更新解析记录失败，遇到了一点问题，请检查 ID & TOKEN');
                }
                return response.json()
            }
        ).then(
            response => {
                if (response.status.code !== '1') {
                    return Promise.reject(response.status.message);
                }
                return {
                    ok: true,
                    msg: 'success',
                };
            }
        ).catch(
            error => {
                return {
                    ok: false,
                    msg: error,
                };
            }
        );
    }
}

class AliyunDNS {
    /**
     * 公共参数
     *
     * @var {object}
     */
    #public;

    /**
     * accessKeySecret
     *
     * @var {string}
     */
    #accessKeySecret;

    /**
     * API 地址
     *
     * @var {string}
     */
    #apiUrl;

    /**
     * @param {string} accessKeyId     您的 AccessKey ID
     * @param {string} accessKeySecret 您的 AccessKey Secret
     * @param {string} apiUrl          API 接口地址
     */
    constructor(accessKeyId, accessKeySecret, apiUrl = 'https://alidns.aliyuncs.com') {
        this.#accessKeySecret = accessKeySecret;
        this.#apiUrl = apiUrl;
        this.#public = {
            Format: 'JSON',
            Version: '2015-01-09',
            AccessKeyId: accessKeyId,
            SignatureMethod: 'HMAC-SHA1',
            SignatureVersion: '1.0',
        };
    }

    /**
     * 检查或更新解析记录
     *
     * @param {string} DomainName   根域名
     * @param {string} Rr           主机记录
     * @param {string} Type         记录类型
     * @param {string} Value        记录值
     */
    async CheckUpdateRecord(DomainName, Rr, Type, Value) {
        let record = await this.DescribeDomainRecords(
            DomainName,
            {
                RRKeyWord: Rr,
                Type: Type,
            }
        );
        if (record.ok === false) {
            return record.msg;
        }
        if (record.data.Value == Value) {
            return '记录无需更新';
        }
        let result = await this.UpdateDomainRecord(
            record.RecordId,
            record.RR,
            record.Type,
            Value
        );
        return result.ok ? '记录更新成功，值为：' + Value : result.msg;
    }

    /**
     * 获取主域名的所有解析记录列表，Action 和 DomainName 无需在 Params 中再次填写
     *
     * @param {string} DomainName    根域名
     * @param {object} Params        其他参数：https://help.aliyun.com/document_detail/29776.html
     */
    async DescribeDomainRecords(DomainName, Params) {
        return await fetch(
            await this.generateUrl(
                Object.assign(
                    Params,
                    {
                        Action: 'DescribeDomainRecords',
                        DomainName: DomainName,
                        Timestamp: this.getTimestamp(),
                        SignatureNonce: this.generateByMicrotime()
                    },
                    this.#public
                )
            ),
            {
                method: 'POST',
            }
        ).then(
            response => {
                if (response.ok === false) {
                    return Promise.reject('获取解析记录失败，遇到了一点问题，请检查 ALIYUN ID & SECRET');
                }
                return response.json();
            }
        ).then(
            response => {
                if (response.Message !== null) {
                    return Promise.reject(response.Message);
                }
                if (response.TotalCount === 0 || response.DomainRecords.Record[0].RR != Rr || response.DomainRecords.Record[0].Type != Type) {
                    return Promise.reject('没有获取到对应的记录，请先手动添加');
                }
                return {
                    ok: true,
                    msg: 'success',
                    data: response.DomainRecords.Record[0],
                };
            }
        ).catch(
            error => {
                return {
                    ok: false,
                    msg: error,
                };
            }
        );
    }

    /**
     * 根据传入参数修改解析记录，Action 和 DomainName 无需在 Params 中再次填写
     *
     * @param {string} RecordId  解析记录的ID
     * @param {string} RR        主机记录，如果要解析 @.exmaple.com，主机记录要填写 ”@”，而不是空。
     * @param {string} Type      解析记录类型，https://help.aliyun.com/document_detail/29805.html
     * @param {string} Value     记录值
     * @param {object} Params    其他参数：https://help.aliyun.com/document_detail/29774.html
     */
    async UpdateDomainRecord(RecordId, RR, Type, Value, Params = []) {
        return await fetch(
            await this.generateUrl(
                Object.assign(
                    Params,
                    {
                        Action: 'UpdateDomainRecord',
                        RecordId: RecordId,
                        RR: RR,
                        Type: Type,
                        Value: Value,
                        Timestamp: this.getTimestamp(),
                        SignatureNonce: this.generateByMicrotime()
                    },
                    this.#public
                )
            ),
            {
                method: 'POST',
            }
        ).then(
            response => {
                if (response.ok === false) {
                    return Promise.reject('获取解析记录失败，遇到了一点问题，请检查 ALIYUN ID & SECRET');
                }
                return response.json();
            }
        ).then(
            response => {
                if (response.Message !== null) {
                    return response.Message;
                }
                return {
                    ok: true,
                    msg: 'success',
                };
            }
        ).catch(
            error => {
                return {
                    ok: false,
                    msg: error,
                };
            }
        );
    }

    /**
     * 最终请求的 URL
     *
     * @param {object} request_params 操作参数
     *
     * @returns {string}
     */
    async generateUrl(request_params) {
        let params = request_params;
        let queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            queryParams.append(key, value)
        })
        queryParams.append('Signature', await this.getRPCSignature(request_params, 'POST'))
        return this.#apiUrl + '/?' + queryParams.toString();
    }

    /**
     * 唯一数，用于防止网络重放攻击
     *
     * @returns {string}
     */
    generateByMicrotime() {
        return Date.now().toString();
    }

    /**
     * 公共参数 Timestamp GMT 时间
     */
    getTimestamp() {
        return new Date().toISOString().replace(/\.\d{3}/g, '');
    }

    /**
     * 转换并计算签名值
     *
     * @param {object} signedParams  请求参数
     * @param {string} method        HTTP 方法，如: GET
     *
     * @returns {string}
     */
    async getRPCSignature(signedParams, method) {
        let strToSign = this.getRpcStrToSign(method, signedParams);
        return await this.encode(strToSign, this.#accessKeySecret + '&');
    }

    /**
     * 转换成 StringToSign
     *
     * @param {string} method    HTTP 方法，如: GET
     * @param {object} query     请求参数
     *
     * @returns {string}
     */
    getRpcStrToSign(method, query) {
        let str = '';
        let ksort = function (obj) {
            return Object.keys(obj)
                .sort().reduce((a, v) => {
                    a[v] = obj[v];
                    return a;
                }, {});
        }
        let fixedEncodeURIComponent = function (str) {
            return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
                return '%' + c.charCodeAt(0).toString(16);
            });
        }
        query = ksort(query);
        for (let key in query) {
            if (null !== key) {
                str += '&' + fixedEncodeURIComponent(key) + '=' + fixedEncodeURIComponent(query[key]);
            }
        }
        return method + '&' + fixedEncodeURIComponent('/') + '&' + fixedEncodeURIComponent(str.substr(1));
    }

    /**
     * 计算签名值
     *
     * @param {string} strToSign
     * @param {string} secret
     *
     * @returns {string}
     */
    async encode(str, secret) {
        let encoder = new TextEncoder();
        let key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-1' },
            false,
            ['sign'],
        );
        let mac = await crypto.subtle.sign(
            'HMAC',
            key,
            encoder.encode(str)
        );
        return btoa(String.fromCharCode(...new Uint8Array(mac)));
    }
}

/**
 * 转 x-www-form-urlencoded Body
 *
 * @param {object} data
 *
 * @returns {string}
 */
function xWwwFormBody(data) {
    let body = [];
    for (let key in data) {
        body.push(
            encodeURIComponent(key) + '=' + encodeURIComponent(data[key])
        );
    }
    return body.join('&');
}

/**
 * 初始化
 */
addEventListener('fetch', (event) => {
    event.respondWith(
        handleRequest(event.request).catch(
            (err) => new Response(err.stack, { status: 500 })
        )
    );
});
