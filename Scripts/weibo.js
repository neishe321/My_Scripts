let body = $response.body;
let url = $request.url;
let obj;

try {
    obj = JSON.parse(body);
} catch (e) {
    console.error("JSON 解析错误:", e);
    $done({ body });
    return;
}

// 过滤数组
function filterItems(items) {
    return items.filter(item => {
        return !(
            (item.category === "feed" && item.item_category === "hot_ad") ||
            (item.category === "card")
        );
    });
}

if (url.includes("comments/build_comments")) {
    // 热门
    if (obj.datas) {
        console.log("去除帖子评论区推广");
        obj.datas = obj.datas.filter(item => !item.adType);
    }
} else if (url.includes("guest/statuses_extend")) {
    // 热门
    console.log("去除帖子牛皮癣推广");
    delete obj.head_cards;
    delete obj.trend;
    delete obj.snapshot_share_customize_dic;
    delete obj.dynamic_share_items;
    delete obj.report_data;
} else if (url.includes("/search/finder")) {
	// 发现
    console.log("处理发现页面");
    const channels = obj.channelInfo?.channels || [];
    channels.forEach(channel => {
        if (channel.payload?.loadedInfo) {
            channel.payload.loadedInfo.searchBarContent = [];
            if (channel.payload.loadedInfo.headerBack) {
                channel.payload.loadedInfo.headerBack.channelStyleMap = {};
            }
        }
        if (channel.payload?.items) {
            channel.payload.items = filterItems(channel.payload.items);
        }
    });
} else if (url.includes("/search/container_timeline") || url.includes("/search/container_discover")) {
    console.log("刷新发现页面");
    if (obj?.items) {
        obj.items = filterItems(obj.items);
    }
} else if (url.includes("/2/searchall?")) {
	 // 搜索
    console.log('优化搜索结果');
    obj.items = obj.items.filter(item => item.category !== "feed" && item.category !== "cell");
    obj.items.forEach(currentItem => {
        if (currentItem.items) {
            currentItem.items = currentItem.items.filter(subItem => subItem.category !== 'card' && subItem.category !== 'cell');
        }
    });
}

$done({ body: JSON.stringify(obj) });
