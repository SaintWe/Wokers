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
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
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
        let records = await this.SearchDomainRecords(
            domain,
            {
                sub_domain: sub_domain,
                record_type: record_type,
            }
        );
        if (records.ok === false) {
            return '获取请求记录失败，遇到了一点问题，请检查 ID & TOKEN'
        }
        return records.json()
            .then(data => {
                if (data.status.code !== '1') {
                    return data.status.message;
                }
                if (data.info.record_total === '0') {
                    return '没有获取到对应的记录，请先手动添加';
                }
                let record = data.records[0];
                if (record.name != sub_domain || record.type != record_type) {
                    return '记录获取错误';
                }
                if (record.value == value) {
                    return '记录无需更新';
                }
                return this.UpdateDomainRecord(
                    domain,
                    record.id,
                    record.name,
                    record.type,
                    value,
                    {
                        record_line_id: record.line_id
                    }
                ).then(response => response.json())
                    .then(update_data => {
                        if (update_data.status.code !== '1') {
                            return update_data.status.message;
                        }
                        return '记录更新成功，值为：' + value;
                    });
        });
    }

    /**
     * 获取主域名的所有解析记录列表
     *
     * @param {string} domain    根域名
     * @param {object} params    其他参数：https://docs.dnspod.cn/api/5f562ae4e75cf42d25bf689e/
     */
    async SearchDomainRecords(domain, params = {}) {
        params = Object.assign(
            params,
            {
                domain: domain,
            },
            this.#public
        );
        return await fetch(
            this.#url + 'Record.List',
            {
                method: 'POST',
                headers: this.#header,
                body: xWwwFormBody(params),
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
        params = Object.assign(
            params,
            {
                domain: domain,
                record_id: record_id,
                sub_domain: sub_domain,
                record_type: record_type,
                value: value,
            },
            this.#public
        );
        return await fetch(
            this.#url + 'Record.Modify',
            {
                method: 'POST',
                headers: this.#header,
                body: xWwwFormBody(params),
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
        let records = await this.DescribeDomainRecords(
            DomainName,
            {
                RRKeyWord: Rr,
                Type: Type,
            }
        );
        if (records.ok === false) {
            return '获取请求记录失败，遇到了一点问题，请检查 ID & TOKEN'
        }
        return records.json()
            .then(data => {
                if (data.Message !== null) {
                    return data.Message;
                }
                if (data.TotalCount === 0) {
                    return '没有获取到对应的记录，请先手动添加';
                }
                let record = data.DomainRecords.Record[0];
                if (record.RR != Rr || record.Type != Type) {
                    return '记录获取错误';
                }
                if (record.Value == Value) {
                    return '记录无需更新';
                }
                return this.UpdateDomainRecord(
                    record.RecordId,
                    record.RR,
                    record.Type,
                    Value
                ).then(response => response.json())
                    .then(update_data => {
                        if (update_data.Message !== null) {
                            return data.Message;
                        }
                        return '记录更新成功，值为：' + Value;
                    });
        });
    }

    /**
     * 获取主域名的所有解析记录列表，Action 和 DomainName 无需在 Params 中再次填写
     *
     * @param {string} DomainName    根域名
     * @param {object} Params        其他参数：https://help.aliyun.com/document_detail/29776.html
     *
     * @returns {object}
     */
    async DescribeDomainRecords(DomainName, Params) {
        Params = Object.assign(
            Params,
            {
                Action: 'DescribeDomainRecords',
                DomainName: DomainName,
                Timestamp: this.getTimestamp(),
                SignatureNonce: this.generateByMicrotime()
            },
            this.#public
        );
        return await fetch(
            await this.generateUrl(Params),
            {
                method: 'POST',
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
     *
     * @returns {object}
     */
    async UpdateDomainRecord(RecordId, RR, Type, Value, Params = []) {
        Params = Object.assign(
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
        );
        return await fetch(
            await this.generateUrl(Params),
            {
                method: 'POST',
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
