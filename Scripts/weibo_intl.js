// 脚本自定义优化于：https://raw.githubusercontent.com/ddgksf2013/Scripts/master/weibo_json.js

const modifyHandlers = {
    "php?a=user_center": modifyUserCenter,      // 用户中心
    "php?a=open_app": removeAdBanner,           // 帖子下方广告 banner
    "php?a=trends": removeTrendsCards,          // 趋势页卡片
    "php?a=get_coopen_ads": removeOpenAds       // 开屏广告
};

function getModifyHandler(url) {
    return Object.keys(modifyHandlers).find(key => url.includes(key)) ? modifyHandlers[Object.keys(modifyHandlers).find(key => url.includes(key))] : null;
}

function removeAdBanner(data) {
    if (data?.data) {
        delete data.data.close_ad_setting;
        delete data.data.vip_title_blog;
        delete data.data.vip_info;
    }
}

function modifyUserCenter(data) {
    if (data?.data?.cards) {
        data.data.cards = data.data.cards.filter(card => {
            card.items = card.items.filter(item => !["personal_vip", "ic_profile_wallpaper"].includes(item.type));
            return card.items.length > 0;
        });
    }
}

function removeTrendsCards(data) {
    if (data?.data) {
        data.data.order = ["discover","search_topic","native_content"];
        if (Array.isArray(data.data.discover)) data.data.discover.shift();
    }
}

function removeOpenAds(data) {
    if (data?.data) {
        data.data = { display_ad: 1 };
    }
}

let body = $response.body;
let url = $request.url;
let modifyHandler = getModifyHandler(url);

if (modifyHandler) {
    try {
        let data = JSON.parse(body.match(/\{.*\}/)?.[0] || "{}");
        modifyHandler(data);
        body = JSON.stringify(data);
    } catch (e) {
        console.log("JSON 解析错误:", e);
    }
}

$done({ body });
