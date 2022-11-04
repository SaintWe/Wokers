/*
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
*/

/**
 * Cron 任务
 * 
 * @param {Event} event
 * 
 * @returns {Promise<void>}
 */
 async function triggerEvent(event) {
    console.log(new Date().toLocaleString('zh-CN'))

    const users = [
        // {
        //     user: '13800000000',
        //     password: 'ABCDABCD12341234',
        //     min_step: '16800',
        //     max_step: '32800',
        // },
        // {
        //     user: 'qq@qq.com',
        //     password: 'ABCDABCD12341234',
        //     min_step: '16800',
        //     max_step: '32800',
        // },
    ];

    for (let i in users) {
        await change_step(users[i].user, users[i].password, users[i].min_step, users[i].max_step);
    }
}

/**
 * HTTP 请求
 * 
 * @param {Request} request
 * 
 * @returns {Promise<Response>}
 */
async function handleRequest(request) {
    const { searchParams } = new URL(request.url);
    const user = searchParams.get('user');
    const password = searchParams.get('password');
    if (user === null || password === null) {
        return new Response('用户名或密码未填写');
    }
    const min_step = searchParams.get('min_step') ?? 16800;
    const max_step = searchParams.get('max_step') ?? 32800;
    return new Response(
        await change_step(user, password, min_step, max_step)
    );
}

/**
 * 修改步数
 *
 * @param {string} code
 * @param {string} type
 * @param {string} min_step
 * @param {string} max_step
 */
async function change_step(user, password, min_step, max_step) {
    let type = '';
    const email_valid = /^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/;
    const phone_valid = /^1[3456789]\d{9}$/;
    if (email_valid.test(user)) {
        type = 'email';
    } else {
        if (!phone_valid.test(user)) {
            return '用户名填写错误，手机号或邮箱格式不正确';
        }
        type = 'huami_phone';
    }
    const step = Math.floor(Math.random() * (Math.floor(max_step) - Math.ceil(min_step))) + Math.ceil(min_step);
    const code = await get_access(user, password, type);
    if (code.ok === false) {
        return code.data;
    }
    const user_info = await get_user_info(code.data, type);
    if (user_info.ok === false) {
        return user_info.data;
    }
    return await fetch(
        'https://api-mifit-cn.huami.com/v1/data/band_data.json?&t=' + Date.now(),
        {
            method: 'POST',
            headers: {
                apptoken: user_info.app_token,
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            },
            body: xWwwFormBody({
                userid: user_info.user_id,
                last_sync_data_time: 1597306380,
                device_type: 0,
                last_deviceid: 'DA932FFFFE8816E7',
                data_json: JSON.stringify([
                    {
                        data_hr: '//////9L////////////Vv///////////0v///////////9e/////0n/a///S////////////0b//////////1FK////////////R/////////////////9PTFFpaf9L////////////R////////////0j///////////9K////////////Ov///////////zf///86/zr/Ov88/zf/Pf///0v/S/8/////////////Sf///////////z3//////0r/Ov//////S/9L/zb/Sf9K/0v/Rf9H/zj/Sf9K/0//N////0D/Sf83/zr/Pf9M/0v/Ov9e////////////S////////////zv//z7/O/83/zv/N/83/zr/N/86/z//Nv83/zn/Xv84/zr/PP84/zj/N/9e/zr/N/89/03/P/89/z3/Q/9N/0v/Tv9C/0H/Of9D/zz/Of88/z//PP9A/zr/N/86/zz/Nv87/0D/Ov84/0v/O/84/zf/MP83/zH/Nv83/zf/N/84/zf/Of82/zf/OP83/zb/Mv81/zX/R/9L/0v/O/9I/0T/S/9A/zn/Pf89/zn/Nf9K/07/N/83/zn/Nv83/zv/O/9A/0H/Of8//zj/PP83/zj/S/87/zj/Nv84/zf/Of83/zf/Of83/zb/Nv9L/zj/Nv82/zb/N/85/zf/N/9J/zf/Nv83/zj/Nv84/0r/Sv83/zf/MP///zb/Mv82/zb/Of85/z7/Nv8//0r/S/85/0H/QP9B/0D/Nf89/zj/Ov83/zv/Nv8//0f/Sv9O/0ZeXv///////////1X///////////9B////////////TP///1b//////0////////////9N/////////v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+/v7+',
                        date: new Date(Date.now() + 28800000).format('yyyy-MM-dd'),
                        data: [
                            {
                                start: 0,
                                stop: 1439,
                                value: 'UA8AUBQAUAwAUBoAUAEAYCcAUBkAUB4AUBgAUCAAUAEAUBkAUAwAYAsAYB8AYB0AYBgAYCoAYBgAYB4AUCcAUBsAUB8AUBwAUBIAYBkAYB8AUBoAUBMAUCEAUCIAYBYAUBwAUCAAUBgAUCAAUBcAYBsAYCUAATIPYD0KECQAYDMAYB0AYAsAYCAAYDwAYCIAYB0AYBcAYCQAYB0AYBAAYCMAYAoAYCIAYCEAYCYAYBsAYBUAYAYAYCIAYCMAUB0AUCAAUBYAUCoAUBEAUC8AUB0AUBYAUDMAUDoAUBkAUC0AUBQAUBwAUA0AUBsAUAoAUCEAUBYAUAwAUB4AUAwAUCcAUCYAUCwKYDUAAUUlEC8IYEMAYEgAYDoAYBAAUAMAUBkAWgAAWgAAWgAAWgAAWgAAUAgAWgAAUBAAUAQAUA4AUA8AUAkAUAIAUAYAUAcAUAIAWgAAUAQAUAkAUAEAUBkAUCUAWgAAUAYAUBEAWgAAUBYAWgAAUAYAWgAAWgAAWgAAWgAAUBcAUAcAWgAAUBUAUAoAUAIAWgAAUAQAUAYAUCgAWgAAUAgAWgAAWgAAUAwAWwAAXCMAUBQAWwAAUAIAWgAAWgAAWgAAWgAAWgAAWgAAWgAAWgAAWREAWQIAUAMAWSEAUDoAUDIAUB8AUCEAUC4AXB4AUA4AWgAAUBIAUA8AUBAAUCUAUCIAUAMAUAEAUAsAUAMAUCwAUBYAWgAAWgAAWgAAWgAAWgAAWgAAUAYAWgAAWgAAWgAAUAYAWwAAWgAAUAYAXAQAUAMAUBsAUBcAUCAAWwAAWgAAWgAAWgAAWgAAUBgAUB4AWgAAUAcAUAwAWQIAWQkAUAEAUAIAWgAAUAoAWgAAUAYAUB0AWgAAWgAAUAkAWgAAWSwAUBIAWgAAUC4AWSYAWgAAUAYAUAoAUAkAUAIAUAcAWgAAUAEAUBEAUBgAUBcAWRYAUA0AWSgAUB4AUDQAUBoAXA4AUA8AUBwAUA8AUA4AUA4AWgAAUAIAUCMAWgAAUCwAUBgAUAYAUAAAUAAAUAAAUAAAUAAAUAAAUAAAUAAAUAAAWwAAUAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAeSEAeQ8AcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcBcAcAAAcAAAcCYOcBUAUAAAUAAAUAAAUAAAUAUAUAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcCgAeQAAcAAAcAAAcAAAcAAAcAAAcAYAcAAAcBgAeQAAcAAAcAAAegAAegAAcAAAcAcAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcCkAeQAAcAcAcAAAcAAAcAwAcAAAcAAAcAIAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcCIAeQAAcAAAcAAAcAAAcAAAcAAAeRwAeQAAWgAAUAAAUAAAUAAAUAAAUAAAcAAAcAAAcBoAeScAeQAAegAAcBkAeQAAUAAAUAAAUAAAUAAAUAAAUAAAcAAAcAAAcAAAcAAAcAAAcAAAegAAegAAcAAAcAAAcBgAeQAAcAAAcAAAcAAAcAAAcAAAcAkAegAAegAAcAcAcAAAcAcAcAAAcAAAcAAAcAAAcA8AeQAAcAAAcAAAeRQAcAwAUAAAUAAAUAAAUAAAUAAAUAAAcAAAcBEAcA0AcAAAWQsAUAAAUAAAUAAAUAAAUAAAcAAAcAoAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAYAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcBYAegAAcAAAcAAAegAAcAcAcAAAcAAAcAAAcAAAcAAAeRkAegAAegAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAEAcAAAcAAAcAAAcAUAcAQAcAAAcBIAeQAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcBsAcAAAcAAAcBcAeQAAUAAAUAAAUAAAUAAAUAAAUBQAcBYAUAAAUAAAUAoAWRYAWTQAWQAAUAAAUAAAUAAAcAAAcAAAcAAAcAAAcAAAcAMAcAAAcAQAcAAAcAAAcAAAcDMAeSIAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcAAAcBQAeQwAcAAAcAAAcAAAcAMAcAAAeSoAcA8AcDMAcAYAeQoAcAwAcFQAcEMAeVIAaTYAbBcNYAsAYBIAYAIAYAIAYBUAYCwAYBMAYDYAYCkAYDcAUCoAUCcAUAUAUBAAWgAAYBoAYBcAYCgAUAMAUAYAUBYAUA4AUBgAUAgAUAgAUAsAUAsAUA4AUAMAUAYAUAQAUBIAASsSUDAAUDAAUBAAYAYAUBAAUAUAUCAAUBoAUCAAUBAAUAoAYAIAUAQAUAgAUCcAUAsAUCIAUCUAUAoAUA4AUB8AUBkAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAAfgAA',
                                tz: 32,
                                did: 'DA932FFFFE8816E7',
                                src: 24
                            }
                        ],
                        summary: '{\"v\":6,\"slp\":{\"st\":1628296479,\"ed\":1628296479,\"dp\":0,\"lt\":0,\"wk\":0,\"usrSt\":-1440,\"usrEd\":-1440,\"wc\":0,\"is\":0,\"lb\":0,\"to\":0,\"dt\":0,\"rhr\":0,\"ss\":0},\"stp\":{\"ttl\":' + step + ',\"dis\":10627,\"cal\":510,\"wk\":41,\"rn\":50,\"runDist\":7654,\"runCal\":397,\"stage\":[{\"start\":327,\"stop\":341,\"mode\":1,\"dis\":481,\"cal\":13,\"step\":680},{\"start\":342,\"stop\":367,\"mode\":3,\"dis\":2295,\"cal\":95,\"step\":2874},{\"start\":368,\"stop\":377,\"mode\":4,\"dis\":1592,\"cal\":88,\"step\":1664},{\"start\":378,\"stop\":386,\"mode\":3,\"dis\":1072,\"cal\":51,\"step\":1245},{\"start\":387,\"stop\":393,\"mode\":4,\"dis\":1036,\"cal\":57,\"step\":1124},{\"start\":394,\"stop\":398,\"mode\":3,\"dis\":488,\"cal\":19,\"step\":607},{\"start\":399,\"stop\":414,\"mode\":4,\"dis\":2220,\"cal\":120,\"step\":2371},{\"start\":415,\"stop\":427,\"mode\":3,\"dis\":1268,\"cal\":59,\"step\":1489},{\"start\":428,\"stop\":433,\"mode\":1,\"dis\":152,\"cal\":4,\"step\":238},{\"start\":434,\"stop\":444,\"mode\":3,\"dis\":2295,\"cal\":95,\"step\":2874},{\"start\":445,\"stop\":455,\"mode\":4,\"dis\":1592,\"cal\":88,\"step\":1664},{\"start\":456,\"stop\":466,\"mode\":3,\"dis\":1072,\"cal\":51,\"step\":1245},{\"start\":467,\"stop\":477,\"mode\":4,\"dis\":1036,\"cal\":57,\"step\":1124},{\"start\":478,\"stop\":488,\"mode\":3,\"dis\":488,\"cal\":19,\"step\":607},{\"start\":489,\"stop\":499,\"mode\":4,\"dis\":2220,\"cal\":120,\"step\":2371},{\"start\":500,\"stop\":511,\"mode\":3,\"dis\":1268,\"cal\":59,\"step\":1489},{\"start\":512,\"stop\":522,\"mode\":1,\"dis\":152,\"cal\":4,\"step\":238}]},\"goal\":8000,\"tz\":\"28800\"}',
                        source: 24,
                        type: 0
                    }
                ])
            }),
        }
    ).then(
        (response) => {
            if (response.ok) {
                return response.json();
            } else {
                return Promise.reject('请求失败了');
            }
        }
    ).then(
        data => {
            return data.code === 1 && data.message === 'success'
                ? '修改成功，步数为：' + step
                : '修改失败';
        }
    ).catch(
        error => {
            return error;
        }
    );
}

/**
 * 获取 user_id 和 app_token
 *
 * @param {string} code
 * @param {string} type
 */
async function get_user_info(code, type) {
    return await fetch(
        'https://account.huami.com/v2/client/login',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2'
            },
            body: xWwwFormBody({
                app_name: 'com.xiaomi.hm.health',
                app_version: '4.6.0',
                code: code,
                country_code: 'CN',
                device_id: '2C8B4939-0CCD-4E94-8CBA-CB8EA6E613A1',
                device_model: 'phone',
                grant_type: 'access_token',
                third_name: type,
            }),
        }
    ).then(
        response => {
            if (response.ok) {
                return response.json();
            } else {
                return Promise.reject('登录失败了，遇到了未知错误');
            }
        }
    ).then(
        data => {
            return {
                ok: true,
                data: data,
                user_id: data.token_info.user_id,
                app_token: data.token_info.app_token,
            };
        }
    ).catch(
        error => {
            return {
                ok: false,
                data: error
            };
        }
    );
}

/**
 * 获取 access
 *
 * @param {string} user
 * @param {string} password
 * @param {string} type
 */
async function get_access(user, password, type) {
    const User = type === 'huami_phone' ? '+86' + user : user;
    return await fetch(
        'https://api-user.huami.com/registrations/' + User + '/tokens',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2'
            },
            body: xWwwFormBody({
                client_id: 'HuaMi',
                password: password,
                redirect_uri: 'https://s3-us-west-2.amazonaws.com/hm-registration/successsignin.html',
                token: 'access'
            })
        }
    ).then(
        response => {
            const url = new URL(response.url);
            if (url.searchParams.get('access') !== null) {
                return {
                    ok: true,
                    data: url.searchParams.get('access')
                };
            } else {
                return Promise.reject('登录失败了，账户或密码不正确');
            }
        }
    ).catch(
        error => {
            return {
                ok: false,
                data: error
            };
        }
    );
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

Date.prototype.format = function (fmt) {
    var o = {
        'M+': this.getMonth() + 1,                      //月份 
        'd+': this.getDate(),                           //日 
        'h+': this.getHours(),                          //小时 
        'm+': this.getMinutes(),                        //分 
        's+': this.getSeconds(),                        //秒 
        'q+': Math.floor((this.getMonth() + 3) / 3),    //季度 
        'S': this.getMilliseconds()                     //毫秒 
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
        if (new RegExp('(' + k + ')').test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
        }
    }
    return fmt;
}

addEventListener('fetch', (event) => {
    event.respondWith(
        handleRequest(event.request).catch(
            (err) => new Response(err.stack, { status: 500 })
        )
    );
});

addEventListener('scheduled', (event) => {
    event.waitUntil(triggerEvent(event));
});
