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
        const adFields = [
            "uve_feed_ad",    // 时间线广告
            "uve_hot_ad",     // 热门广告
            "search_hot",     // 热搜广告
            "feed_warning_tips", // feed广告提示
            "vip_info",       // VIP相关信息
            "vip_lead",       // VIP推广信息
            "vip_lite_index_recommand" // 轻享版推荐
        ];
        
        adFields.forEach(field => delete data.data[field]);
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
        data.data.order = ["discover", "search_topic"];
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
