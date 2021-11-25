/**
 * 获取企业微信的加入二维码
 * 
 * 经证实，该二维码可使用微信扫
 * 
 * 如何使用：
 * 
 * 1. 在 https://work.weixin.qq.com/wework_admin/frame#/apps/contactsApi 开启API接口同步
 * 2. 权限 只读或编辑 均可
 * 3. 获取 Secret 和 CorpID
 * 
 * 4. 在 Workers KV 创建一个命名空间，名称随意
 * 5. 创建一个 Worker，绑定上面创建的命名空间，变量名称填写为 WorkerKV
 * 6. 在该 Worker 添加环境变量 WECOM_CORPID 和 WECOM_CORPSECRET 对应你的信息
 * 7. 快速编辑将代码粘贴保存
 * 
 * 访问该 Worker 的域名，路径为 /get_wecom_img
 * 
 * 加载图片本身：xxx.worker.dev/get_wecom_img
 * 获取图片地址：xxx.worker.dev/get_wecom_img?type=url
 * 
 * @author SaintWe
 * @link   https://github.com/SaintWe/Wokers
 */

/**
 * @var WeCom_QR_Key QR 缓存键
 */
const WeCom_QR_Key = 'WeCom_QR';

/**
 * @var WeCom_Token_Key Token 缓存键
 */
const WeCom_Token_Key = 'WeCom_Token';

/**
 * @param {Request} request
 *
 * @returns {Promise<Response>}
 */
async function handleRequest(request) {
    const { pathname, searchParams } = new URL(request.url);
    if (pathname.startsWith('/get_wecom_img')) {
        if (typeof WECOM_CORPID === 'undefined' || typeof WECOM_CORPSECRET === 'undefined') {
            return new Response('WECOM_CORPID 和 WECOM_CORPSECRET 未设置.');
        }
        const WeCom_QR = await get_qr_url();
        if (WeCom_QR === false) {
            return new Response('出现错误.');
        }
        const TYPE = searchParams.get('type') ?? '';
        return TYPE != 'url' ? await fetch(WeCom_QR) : WeCom_QR;
    }
    return new Response('Hello World.');
}

/**
 * 获取 qr img url
 */
async function get_qr_url() {
    const WeCom_QR = await WorkerKV.get(WeCom_QR_Key);
    if (WeCom_QR !== null) {
        return WeCom_QR;
    }
    const WeCom_Token = await get_accesstoken();
    if (WeCom_Token === false) {
        return false;
    }
    return await fetch(
        'https://qyapi.weixin.qq.com/cgi-bin/corp/get_join_qrcode?access_token=' + WeCom_Token
    ).then(
        response => response.json()
    ).then(
        data => {
            if (data.errcode !== 0) {
                throw new Error('获取出错了');
            }
            WorkerKV.put(WeCom_QR_Key, data.join_qrcode, { expirationTtl: 86400 * 6 })
            return data.join_qrcode;
        }
    ).catch(
        () => {
            return false;
        }
    );
}

/**
 * 获取 accesstoken
 */
async function get_accesstoken() {
    const WeCom_Token = await WorkerKV.get(WeCom_Token_Key);
    if (WeCom_Token !== null) {
        return WeCom_Token;
    }
    return await fetch(
        'https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=' + WECOM_CORPID + '&corpsecret=' + WECOM_CORPSECRET
    ).then(
        response => response.json()
    ).then(
        data => {
            if (data.errcode !== 0) {
                throw new Error('获取出错了');
            }
            WorkerKV.put(WeCom_Token_Key, data.access_token, { expirationTtl: data.expires_in - 300 })
            return data.access_token;
        }
    ).catch(
        () => {
            return false;
        }
    );
}

addEventListener('fetch', (event) => {
    event.respondWith(
        handleRequest(event.request).catch(
            (err) => new Response(err.stack, { status: 500 })
        )
    );
});
