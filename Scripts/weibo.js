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

// 筛选条件
const categoriesToRemove = ["hot_ad", "trend"];

// 过滤函数
function filterItems(items) {
    return items.filter(item => {
        return !(
            categoriesToRemove.includes(item.item_category) || 
            (item.data && item.data.mblogtypename === '广告')
        );
    });
}

if (url.includes("/profile/me")) {
    console.log('处理个人界面');
    obj.items = obj.items.slice(0, 2);
    if (obj.items.length > 0 && obj.items[0].header) {
        delete obj.items[0].header.vipIcon;
        delete obj.items[0].header.vipView;
    }
} else if (url.includes("comments/build_comments")) {
    console.log("处理评论区推广");
    if (obj.datas) {
        obj.datas = obj.datas.filter(item => !item.adType);
    }
} else if (url.includes("guest/statuses_extend") || url.includes("statuses/extend")) {
    console.log("处理详情页推广");
    delete obj.head_cards;
    delete obj.trend;
    delete obj.snapshot_share_customize_dic;
    delete obj.dynamic_share_items;
    delete obj.report_data;
} else if (url.includes("/search/finder")) {
    console.log("处理发现页面");
    const channels = obj.channelInfo?.channels || [];
    channels.forEach(channel => {
        if (channel.payload?.loadedInfo) {
            channel.payload.loadedInfo.searchBarContent = [];
            channel.payload.loadedInfo.headerBack?.channelStyleMap = {};
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
    console.log('处理搜索结果');
    obj.items = obj.items.filter(item => item.category !== "feed" && item.category !== "cell");
    obj.items.forEach(currentItem => {
        if (currentItem.items) {
            currentItem.items = filterItems(currentItem.items);
        }
    });
} else if (url.includes("/statuses/container_timeline_hot")) {
    console.log('处理首页推荐动态推广');
    if (obj.items) {
        obj.items = obj.items.filter(item => item.category === "feed");
        obj.items = filterItems(obj.items);
    }
}

$done({ body: JSON.stringify(obj) });