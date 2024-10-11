/*
> 应用名称：电影猎手
> 特别提醒：Library文件夹禁Write权限
> 脚本说明：去除首页轮播图广告、首页信息流广告、我的页面推广、缩短开屏广告倒计时
> 更新时间：2024-10-11

[rewrite_local]
^https?:\/\/[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+){1,3}(:\d+)?\/api\/v\d\/movie\/index_recommend url script-response-body https://raw.githubusercontent.com/neishe321/QuanX/main/Scripts/dyls.js
^https?:\/\/[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+){1,3}(:\d+)?\/api\/v\d\/advert\/config url reject-dict

[mitm]
hostname = app-v1.ecoliving168.com
*/

const url = $request.url;
let obj = JSON.parse($response.body);
if (url.includes("/movie/index_recommend")) {
    obj.data = obj?.data?.filter(item => item.layout !== "advert_self");

    obj.data?.forEach(item => {
        item.list = item.list?.filter(subItem => subItem.type !== 3);
    });
}
$done({ body: JSON.stringify(obj) });
