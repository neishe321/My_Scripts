let body = $response.body;
let data;

try {
    data = JSON.parse(body);
} catch (e) {
    console.log("JSON 解析错误:", e);
    data = {};
}

if ($request.url.indexOf("php?a=user_center") !== -1) {
    // 用户中心
    data?.data?.cards && (data.data.cards = data.data.cards.filter(card => {
        card.items = card.items.filter(item => !["personal_vip", "ic_profile_wallpaper"].includes(item.type));
        return card.items.length > 0;
    }));
} else if ($request.url.indexOf("php?a=open_app") !== -1) {
    // 帖子
    data?.data && (delete data.data.close_ad_setting, delete data.data.vip_title_blog, delete data.data.vip_info);
} else if ($request.url.indexOf("php?a=trends") !== -1) {
    // 趋势
    data?.data && (data.data.order = ["discover", "search_topic"], Array.isArray(data.data.discover) && data.data.discover.shift());
} else if ($request.url.indexOf("php?a=get_coopen_ads") !== -1) {
    // 开屏
    data?.data && (data.data = { display_ad: 1 });
} else if ($request.url.indexOf("php?a=icon_center") !== -1) {
    // 图标
    if (data?.data) {
        data.data.forEach(item => {
            item.card?.forEach(cardItem => {
                cardItem.status = 1;
                cardItem.forbidden = 0;
            });
        });
    }
}

$done({ body: JSON.stringify(data) });
