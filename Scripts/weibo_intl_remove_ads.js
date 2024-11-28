let body = $response.body;
let data;

try {
    data = JSON.parse(body);
} catch (e) {
    console.log("JSON 解析错误:", e);
    data = {};
}

if (/php\?a=user_center/.test($request.url)) {
    // 用户中心
    if (data?.data?.cards) {
        data.data.cards = data.data.cards.filter(card => {
            card.items = card.items.filter(item => 
                !["personal_vip", "ic_profile_wallpaper"].includes(item.type)
            );
            return card.items.length > 0;
        });
    }
} else if (/php\?a=open_app/.test($request.url)) {
    // 帖子
    if (data?.data) {
        delete data.data.close_ad_setting;
        delete data.data.vip_title_blog;
        delete data.data.vip_info;
    }
} else if (/php\?a=trends/.test($request.url)) {
    // 趋势页
    if (data?.data) {
        data.data.order = ["discover", "search_topic"];
        if (Array.isArray(data.data.discover)) {
            data.data.discover.shift();
        }
    }
}else if (/php\?a=(get_searching_info|search_topic|get_coopen_ads)/.test($request.url)) {
    // 大家都在搜 & 搜索话题
    if (data?.data) {
        data.data = {};
    }
} else if (/php\?a=icon_center/.test($request.url)) {
    // 解锁图标
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
